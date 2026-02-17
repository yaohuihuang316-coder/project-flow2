-- 修复公告表 RLS 问题
-- 先禁用 RLS
ALTER TABLE app_announcements DISABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Announcements public read" ON app_announcements;
DROP POLICY IF EXISTS "Announcements admin all" ON app_announcements;
DROP POLICY IF EXISTS "Allow all read for testing" ON app_announcements;
DROP POLICY IF EXISTS "Announcements authenticated read all" ON app_announcements;
DROP POLICY IF EXISTS "Announcements authenticated insert" ON app_announcements;
DROP POLICY IF EXISTS "Announcements authenticated update" ON app_announcements;
DROP POLICY IF EXISTS "Announcements authenticated delete" ON app_announcements;
DROP POLICY IF EXISTS "Announcements anon read" ON app_announcements;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all operations" ON app_announcements
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 启用 RLS
ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;

-- 验证
SELECT * FROM pg_policies WHERE tablename = 'app_announcements';
