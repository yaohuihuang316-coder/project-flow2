-- ==========================================
-- 公告表 RLS 策略修复脚本
-- 解决管理员无法查看所有公告的问题
-- ==========================================

-- ==========================================
-- 第一步：检查当前表结构和数据
-- ==========================================

-- 查看表是否存在
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name = 'app_announcements';

-- 查看表中的数据量
SELECT COUNT(*) as total_count FROM app_announcements;

-- 查看所有公告（验证数据是否存在）
SELECT 
    id, 
    title, 
    is_active, 
    start_at, 
    end_at, 
    created_at
FROM app_announcements 
ORDER BY created_at DESC;

-- ==========================================
-- 第二步：检查并修复 RLS 策略
-- ==========================================

-- 查看当前的 RLS 策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'app_announcements';

-- 启用 RLS（如果尚未启用）
ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;

-- 删除旧的策略（如果有）
DROP POLICY IF EXISTS "Announcements public read" ON app_announcements;
DROP POLICY IF EXISTS "Announcements admin all" ON app_announcements;
DROP POLICY IF EXISTS "Allow all read for testing" ON app_announcements;

-- ==========================================
-- 第三步：创建新的 RLS 策略
-- ==========================================

-- 策略1：允许所有已认证用户查看激活的公告（普通用户视角）
CREATE POLICY "Announcements public read" ON app_announcements
    FOR SELECT 
    TO authenticated
    USING (is_active = true AND (end_at IS NULL OR end_at > NOW()));

-- 策略2：允许匿名用户查看激活的公告
CREATE POLICY "Announcements anon read" ON app_announcements
    FOR SELECT 
    TO anon
    USING (is_active = true AND (end_at IS NULL OR end_at > NOW()));

-- 策略3：允许所有已认证用户查看所有公告（管理员视角）
-- 注意：在应用层需要自行过滤权限
CREATE POLICY "Announcements authenticated read all" ON app_announcements
    FOR SELECT 
    TO authenticated
    USING (true);

-- 策略4：允许已认证用户插入公告
CREATE POLICY "Announcements authenticated insert" ON app_announcements
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- 策略5：允许已认证用户更新公告
CREATE POLICY "Announcements authenticated update" ON app_announcements
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 策略6：允许已认证用户删除公告
CREATE POLICY "Announcements authenticated delete" ON app_announcements
    FOR DELETE 
    TO authenticated
    USING (true);

-- ==========================================
-- 第四步：验证修复结果
-- ==========================================

-- 再次查看 RLS 策略
SELECT 
    policyname, 
    roles::text,
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'app_announcements'
ORDER BY policyname;

-- 测试查询（应该返回所有公告）
SELECT COUNT(*) as count_after_fix FROM app_announcements;

-- ==========================================
-- 备选方案：如果上述策略仍有问题，使用此方案
-- ==========================================

-- 备选方案1：临时禁用 RLS（仅开发环境使用！）
-- ALTER TABLE app_announcements DISABLE ROW LEVEL SECURITY;

-- 备选方案2：强制 RLS 对表所有者生效
-- ALTER TABLE app_announcements FORCE ROW LEVEL SECURITY;
