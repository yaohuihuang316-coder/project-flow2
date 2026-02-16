-- ==========================================
-- Profile 页面扩展字段
-- 为 app_users 表添加个人资料相关字段
-- ==========================================

DO $$
BEGIN
    -- 添加个人简介字段
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT;
    
    -- 添加联系电话字段
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;
    
    -- 添加所在地区字段
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS location TEXT;
    
    -- 添加字段注释
    COMMENT ON COLUMN app_users.bio IS '个人简介';
    COMMENT ON COLUMN app_users.phone IS '联系电话';
    COMMENT ON COLUMN app_users.location IS '所在地区';
END $$;

-- 更新 RLS 策略 - 确保用户可以更新自己的扩展信息
DROP POLICY IF EXISTS "Users can update own profile extended" ON app_users;

CREATE POLICY "Users can update own profile extended" ON app_users
    FOR UPDATE USING (
        id = current_setting('app.current_user_id', true)::text
    ) WITH CHECK (
        id = current_setting('app.current_user_id', true)::text
    );

SELECT 'Profile 扩展字段添加完成' as status;
