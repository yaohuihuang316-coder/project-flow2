-- ==========================================
-- ProjectFlow 数据库函数
-- ==========================================

-- 兑换码兑换函数
CREATE OR REPLACE FUNCTION redeem_membership_code(
    p_code TEXT,
    p_user_id TEXT
)
RETURNS TABLE (
    tier TEXT,
    duration_days INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_code_record RECORD;
    v_new_tier TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 查询兑换码
    SELECT * INTO v_code_record
    FROM membership_codes
    WHERE code = UPPER(p_code)
    AND is_used = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '兑换码无效或已被使用';
    END IF;
    
    -- 检查是否过期
    IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
        RAISE EXCEPTION '兑换码已过期';
    END IF;
    
    -- 计算过期时间
    IF v_code_record.duration_days = 36500 THEN
        v_expires_at := NULL; -- 永久
    ELSE
        v_expires_at := NOW() + (v_code_record.duration_days || ' days')::INTERVAL;
    END IF;
    
    -- 更新用户会员等级
    UPDATE app_users
    SET 
        subscription_tier = v_code_record.tier,
        membership_expires_at = v_expires_at,
        is_lifetime_member = (v_code_record.duration_days = 36500)
    WHERE id = p_user_id;
    
    -- 标记兑换码为已使用
    UPDATE membership_codes
    SET 
        is_used = true,
        used_by = p_user_id,
        used_at = NOW()
    WHERE id = v_code_record.id;
    
    -- 插入订阅记录
    INSERT INTO membership_subscriptions (
        user_id,
        tier,
        payment_method,
        started_at,
        expires_at,
        is_active
    ) VALUES (
        p_user_id,
        v_code_record.tier,
        'code',
        NOW(),
        v_expires_at,
        true
    );
    
    -- 返回结果
    RETURN QUERY SELECT 
        v_code_record.tier,
        v_code_record.duration_days,
        v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- 获取用户未读公告数
CREATE OR REPLACE FUNCTION get_unread_announcement_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM app_announcements a
    WHERE a.is_active = true
    AND a.start_at <= NOW()
    AND (a.end_at IS NULL OR a.end_at >= NOW())
    AND (
        a.target_audience = 'all' 
        OR a.target_audience = (SELECT subscription_tier FROM app_users WHERE id = p_user_id)
    )
    AND NOT EXISTS (
        SELECT 1 FROM app_user_announcement_reads r
        WHERE r.announcement_id = a.id AND r.user_id = p_user_id
    );
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 标记公告为已读
CREATE OR REPLACE FUNCTION mark_announcement_read(
    p_user_id TEXT,
    p_announcement_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO app_user_announcement_reads (user_id, announcement_id, read_at)
    VALUES (p_user_id, p_announcement_id, NOW())
    ON CONFLICT (user_id, announcement_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 完成
-- ==========================================
