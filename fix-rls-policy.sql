-- 修复 app_assignment_submissions 表的 RLS 策略
-- 允许认证用户读取所有提交数据

-- 1. 启用 RLS（如果还没启用）
ALTER TABLE public.app_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- 2. 删除现有的限制性策略
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.app_assignment_submissions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.app_assignment_submissions;

-- 3. 创建新的策略：允许所有认证用户读取
CREATE POLICY "Allow authenticated read access" 
ON public.app_assignment_submissions 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. 创建新的策略：允许所有认证用户插入
CREATE POLICY "Allow authenticated insert" 
ON public.app_assignment_submissions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. 创建新的策略：允许所有认证用户更新
CREATE POLICY "Allow authenticated update" 
ON public.app_assignment_submissions 
FOR UPDATE 
TO authenticated 
USING (true);

-- 6. 验证策略是否创建成功
SELECT * FROM pg_policies WHERE tablename = 'app_assignment_submissions';
