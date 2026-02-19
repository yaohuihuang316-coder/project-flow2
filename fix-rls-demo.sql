-- 临时方案：允许所有访问（演示用）
-- 注意：生产环境应该使用更严格的策略

-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "Allow authenticated read" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow students to submit" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow students to view own submissions" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow teachers to grade" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow teachers to grade submissions" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow teachers to view all submissions" ON public.app_assignment_submissions;

-- 2. 创建允许所有访问的策略（演示用）
CREATE POLICY "Allow all access for demo"
ON public.app_assignment_submissions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. 验证
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'app_assignment_submissions';
