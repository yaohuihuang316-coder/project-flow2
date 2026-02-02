
-- ==========================================
-- ProjectFlow Membership System Database Setup
-- 会员制系统数据库脚本
-- ==========================================

-- 确保UUID扩展已启用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 扩展现有用户表
-- ==========================================

ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_courses_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_lifetime_member boolean DEFAULT false;

-- 添加约束确保会员等级有效
ALTER TABLE public.app_users 
DROP CONSTRAINT IF EXISTS valid_membership_tier;

ALTER TABLE public.app_users 
ADD CONSTRAINT valid_membership_tier 
CHECK (membership_tier IN ('free', 'pro', 'pro_plus'));

COMMENT ON COLUMN public.app_users.membership_tier IS '会员等级: free, pro, pro_plus';
COMMENT ON COLUMN public.app_users.completed_courses_count IS '已完成课程数量';

-- ==========================================
-- 2. 会员订阅记录表
-- ==========================================

CREATE TABLE IF NOT EXISTS public.membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    tier text NOT NULL CHECK (tier IN ('pro', 'pro_plus')),
    payment_method text NOT NULL CHECK (payment_method IN ('course_completion', 'payment', 'admin_grant')),
    amount decimal(10,2) DEFAULT 0, -- 付费金额（如果是付费升级）
    currency text DEFAULT 'CNY',
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    expires_at timestamp with time zone, -- NULL表示永久有效（课程解锁）
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb, -- 存储额外信息如订单号等
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.membership_subscriptions IS '会员订阅记录表';
COMMENT ON COLUMN public.membership_subscriptions.payment_method IS '解锁方式: course_completion课程完成, payment付费, admin_grant管理员授予';

-- RLS for membership_subscriptions
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.membership_subscriptions;
CREATE POLICY "Users can view own subscriptions" 
    ON public.membership_subscriptions FOR SELECT 
    USING (user_id = current_setting('app.current_user_id', true)::text);

DROP POLICY IF EXISTS "Public insert subscriptions" ON public.membership_subscriptions;
CREATE POLICY "Public insert subscriptions" 
    ON public.membership_subscriptions FOR ALL 
    USING (true);

-- ==========================================
-- 3. 用户课程统计视图
-- ==========================================

DROP VIEW IF EXISTS user_course_stats;

CREATE VIEW user_course_stats AS
SELECT 
    user_id,
    COUNT(*) as enrolled_courses,
    COUNT(*) FILTER (WHERE progress >= 100) as completed_courses,
    AVG(progress) as avg_progress
FROM public.app_user_progress
GROUP BY user_id;

COMMENT ON VIEW user_course_stats IS '用户课程完成统计视图';

-- ==========================================
-- 4. 自动更新完成课程数函数
-- ==========================================

CREATE OR REPLACE FUNCTION update_user_completed_courses()
RETURNS TRIGGER AS $$
DECLARE
    completed_count int;
BEGIN
    -- 计算该用户完成的课程数
    SELECT COUNT(*) INTO completed_count
    FROM public.app_user_progress 
    WHERE user_id = NEW.user_id AND progress >= 100;
    
    -- 更新用户表
    UPDATE public.app_users 
    SET completed_courses_count = completed_count
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：当课程进度更新时自动统计
DROP TRIGGER IF EXISTS trg_update_completed_courses ON public.app_user_progress;

CREATE TRIGGER trg_update_completed_courses
    AFTER INSERT OR UPDATE OF progress ON public.app_user_progress
    FOR EACH ROW
    WHEN (NEW.progress >= 100 OR OLD.progress >= 100)
    EXECUTE FUNCTION update_user_completed_courses();

COMMENT ON FUNCTION update_user_completed_courses() IS '自动更新用户完成课程数';

-- ==========================================
-- 5. 自动升级会员等级函数
-- ==========================================

CREATE OR REPLACE FUNCTION check_and_upgrade_membership(p_user_id text)
RETURNS TABLE (
    old_tier text,
    new_tier text,
    upgraded boolean
) AS $$
DECLARE
    v_completed_count int;
    v_current_tier text;
    v_upgraded boolean := false;
    v_old_tier text;
BEGIN
    -- 获取当前信息
    SELECT completed_courses_count, membership_tier 
    INTO v_completed_count, v_current_tier
    FROM public.app_users 
    WHERE id = p_user_id;
    
    v_old_tier := v_current_tier;
    
    -- 升级到 Pro (5门课)
    IF v_current_tier = 'free' AND v_completed_count >= 5 THEN
        UPDATE public.app_users 
        SET membership_tier = 'pro',
            membership_expires_at = NULL  -- 课程解锁永久有效
        WHERE id = p_user_id;
        
        INSERT INTO public.membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES 
            (p_user_id, 'pro', 'course_completion', true, now(), 
             jsonb_build_object('completed_courses', v_completed_count));
        
        v_current_tier := 'pro';
        v_upgraded := true;
    END IF;
    
    -- 升级到 Pro+ (10门课)
    IF v_current_tier IN ('free', 'pro') AND v_completed_count >= 10 THEN
        UPDATE public.app_users 
        SET membership_tier = 'pro_plus',
            membership_expires_at = NULL
        WHERE id = p_user_id;
        
        INSERT INTO public.membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES 
            (p_user_id, 'pro_plus', 'course_completion', true, now(),
             jsonb_build_object('completed_courses', v_completed_count, 'upgraded_from', v_current_tier));
        
        v_current_tier := 'pro_plus';
        v_upgraded := true;
    END IF;
    
    RETURN QUERY SELECT v_old_tier, v_current_tier, v_upgraded;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_upgrade_membership(text) IS '检查并自动升级会员等级';

-- ==========================================
-- 6. 触发器：课程完成时检查升级
-- ==========================================

CREATE OR REPLACE FUNCTION trigger_check_membership_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    result record;
BEGIN
    -- 只有当进度达到100%时才检查升级
    IF NEW.progress >= 100 AND (OLD.progress IS NULL OR OLD.progress < 100) THEN
        SELECT * INTO result FROM check_and_upgrade_membership(NEW.user_id);
        
        -- 可以在这里添加通知逻辑，如发送升级邮件等
        IF result.upgraded THEN
            RAISE NOTICE 'User % upgraded from % to %', NEW.user_id, result.old_tier, result.new_tier;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_membership_upgrade ON public.app_user_progress;

CREATE TRIGGER trg_check_membership_upgrade
    AFTER UPDATE OF progress ON public.app_user_progress
    FOR EACH ROW
    WHEN (NEW.progress >= 100)
    EXECUTE FUNCTION trigger_check_membership_upgrade();

-- ==========================================
-- 7. 获取用户完整信息函数（包含会员信息）
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_with_membership(p_user_id text)
RETURNS TABLE (
    id text,
    email text,
    name text,
    role text,
    avatar text,
    department text,
    xp int,
    streak int,
    membership_tier text,
    membership_expires_at timestamp with time zone,
    completed_courses_count int,
    is_lifetime_member boolean,
    enrolled_courses bigint,
    avg_progress numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.avatar,
        u.department,
        u.xp,
        u.streak,
        u.membership_tier,
        u.membership_expires_at,
        u.completed_courses_count,
        u.is_lifetime_member,
        COALESCE(s.enrolled_courses, 0) as enrolled_courses,
        COALESCE(s.avg_progress, 0) as avg_progress
    FROM public.app_users u
    LEFT JOIN user_course_stats s ON s.user_id = u.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_with_membership(text) IS '获取用户完整信息，包含会员和课程统计';

-- ==========================================
-- 8. 手动升级/降级函数（管理员用）
-- ==========================================

CREATE OR REPLACE FUNCTION admin_set_membership(
    p_user_id text,
    p_tier text,
    p_is_lifetime boolean DEFAULT false,
    p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    -- 验证tier有效性
    IF p_tier NOT IN ('free', 'pro', 'pro_plus') THEN
        RAISE EXCEPTION 'Invalid membership tier: %', p_tier;
    END IF;
    
    -- 更新用户会员信息
    UPDATE public.app_users 
    SET membership_tier = p_tier,
        is_lifetime_member = p_is_lifetime,
        membership_expires_at = p_expires_at
    WHERE id = p_user_id;
    
    -- 记录到订阅历史
    IF p_tier != 'free' THEN
        INSERT INTO public.membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at, expires_at, metadata)
        VALUES 
            (p_user_id, p_tier, 'admin_grant', true, now(), p_expires_at,
             jsonb_build_object('is_lifetime', p_is_lifetime, 'set_by', 'admin'));
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION admin_set_membership(text, text, boolean, timestamp with time zone) IS '管理员手动设置用户会员等级';

-- ==========================================
-- 9. 更新触发器函数（自动更新updated_at）
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为订阅表添加触发器
DROP TRIGGER IF EXISTS trg_update_subscriptions_updated_at ON public.membership_subscriptions;

CREATE TRIGGER trg_update_subscriptions_updated_at
    BEFORE UPDATE ON public.membership_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 10. 初始化现有用户数据
-- ==========================================

-- 统计现有用户的已完成课程数并更新
DO $$
BEGIN
    UPDATE public.app_users u
    SET completed_courses_count = (
        SELECT COUNT(*) 
        FROM public.app_user_progress p 
        WHERE p.user_id = u.id AND p.progress >= 100
    );
    
    RAISE NOTICE '已更新所有用户的完成课程数统计';
END $$;

-- ==========================================
-- 11. 创建索引优化查询
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON public.app_users(membership_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.membership_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.membership_subscriptions(is_active) WHERE is_active = true;

-- ==========================================
-- 完成提示
-- ==========================================

DO $$
DECLARE
    user_count int;
    sub_count int;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.app_users WHERE membership_tier != 'free';
    SELECT COUNT(*) INTO sub_count FROM public.membership_subscriptions;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '会员系统数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '当前会员用户数量: %', user_count;
    RAISE NOTICE '订阅记录数量: %', sub_count;
    RAISE NOTICE '';
    RAISE NOTICE '会员等级解锁条件:';
    RAISE NOTICE '  - Pro: 完成5门课程';
    RAISE NOTICE '  - Pro+: 完成10门课程';
    RAISE NOTICE '';
    RAISE NOTICE '可用函数:';
    RAISE NOTICE '  - check_and_upgrade_membership(user_id): 检查并升级会员';
    RAISE NOTICE '  - get_user_with_membership(user_id): 获取用户完整信息';
    RAISE NOTICE '  - admin_set_membership(user_id, tier, ...): 管理员设置会员';
    RAISE NOTICE '========================================';
END $$;
