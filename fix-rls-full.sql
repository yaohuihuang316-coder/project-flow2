-- ==========================================
-- 修复 RLS 策略完整脚本
-- 在 Supabase Dashboard SQL Editor 中执行
-- https://supabase.com/dashboard/project/ghhvdffsyvzkhbftifzy/sql/editor
-- ==========================================

-- 第一步：创建执行 SQL 的函数（如果不存在）
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 第二步：修复 app_assignments 表的 RLS
ALTER TABLE public.app_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_assignments;

CREATE POLICY "Allow authenticated read access" 
ON public.app_assignments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_assignments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 第三步：修复 app_class_sessions 表的 RLS
ALTER TABLE public.app_class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_class_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_class_sessions;

CREATE POLICY "Allow authenticated read access" 
ON public.app_class_sessions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_class_sessions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 第四步：修复 app_attendance 表的 RLS
ALTER TABLE public.app_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_attendance;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_attendance;

CREATE POLICY "Allow authenticated read access" 
ON public.app_attendance 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all operations for authenticated users" 
ON public.app_attendance 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 验证 RLS 状态
SELECT 
    tablename,
    rowsecurity as "RLS Enabled",
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = pg_tables.tablename AND schemaname = 'public') as "Policy Count"
FROM pg_tables 
WHERE tablename IN ('app_assignments', 'app_class_sessions', 'app_attendance')
AND schemaname = 'public';
