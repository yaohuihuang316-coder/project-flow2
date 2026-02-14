-- ==========================================
-- 清理旧表并重新创建个人资料功能表
-- ==========================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS app_user_achievements CASCADE;
DROP TABLE IF EXISTS app_user_skills CASCADE;
DROP TABLE IF EXISTS app_learning_activity CASCADE;
DROP TABLE IF EXISTS app_achievements CASCADE;

-- 2. 学习活动记录表（用于热力图）
CREATE TABLE IF NOT EXISTS app_learning_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('course', 'simulation', 'tool', 'login')),
    xp_earned INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date, activity_type)
);

CREATE INDEX IF NOT EXISTS idx_learning_activity_user ON app_learning_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activity_date ON app_learning_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_date ON app_learning_activity(user_id, activity_date);

-- 3. 徽章定义表
CREATE TABLE IF NOT EXISTS app_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('learning', 'skill', 'social', 'special')),
    unlock_type TEXT NOT NULL CHECK (unlock_type IN (
        'courses_completed', 'simulations_completed', 'streak_days', 
        'skill_score', 'tool_usage', 'community_posts', 'special'
    )),
    unlock_threshold INTEGER DEFAULT 1,
    unlock_condition JSONB DEFAULT '{}',
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户徽章记录表
CREATE TABLE IF NOT EXISTS app_user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES app_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON app_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_new ON app_user_achievements(user_id, is_new);

-- 5. 用户能力维度评分表
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    plan_score INTEGER DEFAULT 0 CHECK (plan_score >= 0 AND plan_score <= 100),
    exec_score INTEGER DEFAULT 0 CHECK (exec_score >= 0 AND exec_score <= 100),
    cost_score INTEGER DEFAULT 0 CHECK (cost_score >= 0 AND cost_score <= 100),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    agile_score INTEGER DEFAULT 0 CHECK (agile_score >= 0 AND agile_score <= 100),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON app_user_skills(user_id);

-- ==========================================
-- RLS 策略
-- ==========================================

ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_activity_own" ON app_learning_activity 
    FOR ALL USING (user_id = auth.uid()::TEXT);

ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_public_read" ON app_achievements 
    FOR SELECT USING (true);

ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_own" ON app_user_achievements 
    FOR ALL USING (user_id = auth.uid()::TEXT);

ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skills_own" ON app_user_skills 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 插入默认徽章数据
-- ==========================================

INSERT INTO app_achievements (id, code, name, description, icon, category, unlock_type, unlock_threshold, rarity, is_hidden) VALUES
-- 学习类徽章
(gen_random_uuid(), 'pmp_master', 'PMP大师', '完成全部体系课程', 'Trophy', 'learning', 'courses_completed', 12, 'legendary', false),
(gen_random_uuid(), 'course_warrior', '课程达人', '完成5门课程', 'BookOpen', 'learning', 'courses_completed', 5, 'rare', false),
(gen_random_uuid(), 'simulation_expert', '模拟专家', '完成10个实战模拟场景', 'Target', 'learning', 'simulations_completed', 10, 'epic', false),
(gen_random_uuid(), 'scenario_starter', '初入茅庐', '完成第一个模拟场景', 'Play', 'learning', 'simulations_completed', 1, 'common', false),

-- 连续学习类
(gen_random_uuid(), 'early_bird', '早起鸟', '连续7天在9点前学习', 'Sunrise', 'special', 'streak_days', 7, 'rare', false),
(gen_random_uuid(), 'streak_master', '连胜大师', '连续学习30天', 'Flame', 'special', 'streak_days', 30, 'epic', false),
(gen_random_uuid(), 'streak_warrior', '坚持者', '连续学习7天', 'Zap', 'special', 'streak_days', 7, 'common', false),

-- 全能类
(gen_random_uuid(), 'all_rounder', '全能王', '六维能力均达到60分', 'Crown', 'skill', 'skill_score', 60, 'epic', false),
(gen_random_uuid(), 'perfect_score', '完美主义', '单个课程获得100%掌握度', 'Star', 'learning', 'special', 1, 'legendary', true),

-- 工具使用类
(gen_random_uuid(), 'tool_expert', '工具专家', '使用10种不同的项目管理工具', 'Wrench', 'skill', 'tool_usage', 10, 'rare', false),
(gen_random_uuid(), 'fishbone_master', '根因分析师', '使用鱼骨图分析工具5次', 'GitBranch', 'skill', 'tool_usage', 5, 'common', false),

-- 社交类
(gen_random_uuid(), 'community_active', '社区活跃者', '在社区发布10条内容', 'MessageSquare', 'social', 'community_posts', 10, 'common', false),
(gen_random_uuid(), 'helper', '热心助人的', '回复他人问题获得5个赞', 'Heart', 'social', 'special', 5, 'rare', false)

ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 辅助函数
-- ==========================================

CREATE OR REPLACE FUNCTION record_learning_activity(
    p_user_id TEXT,
    p_activity_type TEXT,
    p_xp_earned INTEGER DEFAULT 0,
    p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
    VALUES (p_user_id, CURRENT_DATE, p_activity_type, p_xp_earned, p_details)
    ON CONFLICT (user_id, activity_date, activity_type) 
    DO UPDATE SET 
        xp_earned = app_learning_activity.xp_earned + EXCLUDED.xp_earned,
        details = app_learning_activity.details || EXCLUDED.details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '个人资料功能数据库表创建完成' as status;
