-- 方案2修复版：基于用户ID的策略（处理类型不匹配问题）

-- 1. 先删除现有策略
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Teachers can view their course submissions" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.app_assignment_submissions;

-- 2. 启用 RLS
ALTER TABLE public.app_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- 3. 允许教师查看所有提交（简化版，通过角色判断）
-- 注意：这里假设教师角色可以通过其他方式识别，或者使用更简单的策略
CREATE POLICY "Allow teachers to view all submissions"
ON public.app_assignment_submissions
FOR SELECT
TO authenticated
USING (
  -- 检查当前用户是否是教师（通过 app_users 表）
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid()::text
    AND role IN ('Teacher', 'SuperAdmin')
  )
);

-- 4. 允许学生查看自己的提交（将 auth.uid() 转换为 text）
CREATE POLICY "Allow students to view own submissions"
ON public.app_assignment_submissions
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()::text
);

-- 5. 允许教师批改作业（UPDATE）
CREATE POLICY "Allow teachers to grade submissions"
ON public.app_assignment_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid()::text
    AND role IN ('Teacher', 'SuperAdmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = auth.uid()::text
    AND role IN ('Teacher', 'SuperAdmin')
  )
);

-- 6. 验证策略
SELECT * FROM pg_policies WHERE tablename = 'app_assignment_submissions';
