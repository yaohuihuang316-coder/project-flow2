-- 清理和优化 RLS 策略

-- 1. 删除重复或不必要的策略
DROP POLICY IF EXISTS "Allow authenticated read" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow teachers to grade" ON public.app_assignment_submissions;

-- 2. 保留以下策略：
-- - "Allow students to submit" (INSERT)
-- - "Allow students to view own submissions" (SELECT)  
-- - "Allow teachers to grade submissions" (UPDATE)
-- - "Allow teachers to view all submissions" (SELECT)

-- 3. 验证最终策略
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'app_assignment_submissions' 
ORDER BY cmd, policyname;
