-- ==========================================
-- 修复教师作业和课堂考勤 RLS 权限
-- 在 Supabase Dashboard SQL Editor 中执行
-- https://supabase.com/dashboard/project/ghhvdffsyvzkhbftifzy/sql/editor
-- ==========================================

-- ==========================================
-- 第1步: 修复 app_assignments 表
-- ==========================================

-- 禁用并重新启用 RLS（刷新策略）
ALTER TABLE public.app_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_assignments;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.app_assignments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_assignments;

-- 为匿名用户创建读取策略（前端页面使用匿名密钥）
CREATE POLICY "Allow anonymous read" 
ON public.app_assignments 
FOR SELECT 
TO anon 
USING (true);

-- 为认证用户创建完整权限策略
CREATE POLICY "Allow authenticated full access" 
ON public.app_assignments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- 第2步: 修复 app_class_sessions 表
-- ==========================================

-- 禁用并重新启用 RLS
ALTER TABLE public.app_class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_class_sessions ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.app_class_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_class_sessions;

-- 为匿名用户创建读取策略
CREATE POLICY "Allow anonymous read" 
ON public.app_class_sessions 
FOR SELECT 
TO anon 
USING (true);

-- 为认证用户创建完整权限策略
CREATE POLICY "Allow authenticated full access" 
ON public.app_class_sessions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- 第3步: 修复 app_attendance 表
-- ==========================================

-- 禁用并重新启用 RLS
ALTER TABLE public.app_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_attendance ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_attendance;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_attendance;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.app_attendance;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_attendance;

-- 为匿名用户创建读取策略
CREATE POLICY "Allow anonymous read" 
ON public.app_attendance 
FOR SELECT 
TO anon 
USING (true);

-- 为认证用户创建完整权限策略
CREATE POLICY "Allow authenticated full access" 
ON public.app_attendance 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- 第4步: 验证修复结果
-- ==========================================

-- 检查策略是否创建成功
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('app_assignments', 'app_class_sessions', 'app_attendance')
AND schemaname = 'public'
ORDER BY tablename, policyname;
