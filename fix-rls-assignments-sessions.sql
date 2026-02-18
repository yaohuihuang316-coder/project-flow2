-- ==========================================
-- 修复 app_assignments 和 app_class_sessions 表的 RLS 策略
-- 允许已认证用户读取数据
-- ==========================================

-- 先禁用再启用 RLS 来刷新策略
ALTER TABLE public.app_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_attendance DISABLE ROW LEVEL SECURITY;

-- 重新启用 RLS
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_attendance ENABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果有）
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_assignments;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_attendance;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_attendance;

-- 创建允许已认证用户读取的策略
CREATE POLICY "Allow authenticated read access" 
ON public.app_assignments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated read access" 
ON public.app_class_sessions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated read access" 
ON public.app_attendance 
FOR SELECT 
TO authenticated 
USING (true);

-- 创建允许已认证用户进行所有操作的策略（INSERT, UPDATE, DELETE）
CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_assignments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_class_sessions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_attendance 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('app_assignments', 'app_class_sessions', 'app_attendance')
AND schemaname = 'public';
