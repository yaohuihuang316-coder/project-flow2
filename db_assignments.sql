-- ==========================================
-- 作业管理模块数据库表结构
-- 包含：作业表(app_assignments) 和 学生提交表(app_student_submissions)
-- ==========================================

-- ==========================================
-- 1. 作业表 (app_assignments)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.app_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 截止日期和时间
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 满分分数
    max_score INTEGER NOT NULL DEFAULT 100 CHECK (max_score > 0 AND max_score <= 200),
    
    -- 附件信息 (JSON数组存储)
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- 状态: pending(进行中), grading(待批改), completed(已结束)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'completed')),
    
    -- 统计信息
    submitted_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 软删除标记
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.app_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.app_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.app_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.app_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.app_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_is_deleted ON public.app_assignments(is_deleted);

-- 复合索引：用于按课程和状态查询
CREATE INDEX IF NOT EXISTS idx_assignments_course_status ON public.app_assignments(course_id, status);

-- 注释
COMMENT ON TABLE public.app_assignments IS '作业表：存储教师发布的作业信息';
COMMENT ON COLUMN public.app_assignments.id IS '作业唯一标识';
COMMENT ON COLUMN public.app_assignments.title IS '作业标题';
COMMENT ON COLUMN public.app_assignments.content IS '作业内容和要求';
COMMENT ON COLUMN public.app_assignments.course_id IS '关联课程ID';
COMMENT ON COLUMN public.app_assignments.teacher_id IS '发布教师ID';
COMMENT ON COLUMN public.app_assignments.deadline IS '截止日期时间';
COMMENT ON COLUMN public.app_assignments.max_score IS '满分分数';
COMMENT ON COLUMN public.app_assignments.attachments IS '作业附件，JSON格式存储文件名、大小、类型等';
COMMENT ON COLUMN public.app_assignments.status IS '作业状态：pending进行中, grading待批改, completed已结束';
COMMENT ON COLUMN public.app_assignments.submitted_count IS '已提交人数';
COMMENT ON COLUMN public.app_assignments.total_count IS '总人数';
COMMENT ON COLUMN public.app_assignments.is_deleted IS '软删除标记';

-- ==========================================
-- 2. 学生提交表 (app_student_submissions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.app_student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.app_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 提交内容
    content TEXT NOT NULL,
    
    -- 附件信息 (JSON数组存储)
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- 提交状态: submitted(已提交), graded(已批改), late(迟交)
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    
    -- 评分信息
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 200)),
    comment TEXT,
    graded_by UUID REFERENCES auth.users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 是否迟交标记
    is_late BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.app_student_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.app_student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.app_student_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.app_student_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON public.app_student_submissions(graded_at);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status ON public.app_student_submissions(assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_student_assignment ON public.app_student_submissions(student_id, assignment_id);

-- 唯一约束：一个学生只能提交一次作业
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_student_assignment 
ON public.app_student_submissions(assignment_id, student_id);

-- 注释
COMMENT ON TABLE public.app_student_submissions IS '学生作业提交表：存储学生的作业提交和批改信息';
COMMENT ON COLUMN public.app_student_submissions.id IS '提交唯一标识';
COMMENT ON COLUMN public.app_student_submissions.assignment_id IS '关联作业ID';
COMMENT ON COLUMN public.app_student_submissions.student_id IS '提交学生ID';
COMMENT ON COLUMN public.app_student_submissions.content IS '提交内容';
COMMENT ON COLUMN public.app_student_submissions.attachments IS '提交附件';
COMMENT ON COLUMN public.app_student_submissions.status IS '提交状态：submitted已提交, graded已批改, late迟交';
COMMENT ON COLUMN public.app_student_submissions.score IS '得分';
COMMENT ON COLUMN public.app_student_submissions.comment IS '教师评语';
COMMENT ON COLUMN public.app_student_submissions.graded_by IS '批改教师ID';
COMMENT ON COLUMN public.app_student_submissions.graded_at IS '批改时间';
COMMENT ON COLUMN public.app_student_submissions.is_late IS '是否迟交';

-- ==========================================
-- 3. 触发器：自动更新 updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 作业表触发器
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.app_assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.app_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 提交表触发器
DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.app_student_submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. 触发器：自动更新作业统计
-- ==========================================
CREATE OR REPLACE FUNCTION update_assignment_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新作业表的提交统计
    UPDATE public.app_assignments
    SET submitted_count = (
        SELECT COUNT(*) 
        FROM public.app_student_submissions 
        WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
    ),
    status = CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM public.app_student_submissions 
            WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
            AND status = 'graded'
        ) = total_count THEN 'completed'
        WHEN (
            SELECT COUNT(*) 
            FROM public.app_student_submissions 
            WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
        ) > 0 THEN 'grading'
        ELSE 'pending'
    END
    WHERE id = COALESCE(NEW.assignment_id, OLD.assignment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignment_stats_trigger ON public.app_student_submissions;
CREATE TRIGGER update_assignment_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_stats();

-- ==========================================
-- 5. 触发器：自动标记迟交
-- ==========================================
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 获取作业截止日期
    SELECT deadline INTO assignment_deadline
    FROM public.app_assignments
    WHERE id = NEW.assignment_id;
    
    -- 检查是否迟交
    IF NEW.submitted_at > assignment_deadline THEN
        NEW.is_late := TRUE;
        NEW.status := 'late';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS check_late_submission_trigger ON public.app_student_submissions;
CREATE TRIGGER check_late_submission_trigger
    BEFORE INSERT ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_late_submission();

-- ==========================================
-- 6. RLS (Row Level Security) 安全策略
-- ==========================================

-- 启用RLS
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_student_submissions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON public.app_assignments;
DROP POLICY IF EXISTS "Students can view course assignments" ON public.app_assignments;
DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.app_student_submissions;
DROP POLICY IF EXISTS "Teachers can view all submissions for their assignments" ON public.app_student_submissions;

-- 作业表策略

-- 教师可以管理自己的作业
CREATE POLICY "Teachers can manage their own assignments"
ON public.app_assignments
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 学生可以查看课程的作业
CREATE POLICY "Students can view course assignments"
ON public.app_assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = app_assignments.course_id
        AND e.student_id = auth.uid()
    )
);

-- 提交表策略

-- 学生可以管理自己的提交
CREATE POLICY "Students can manage their own submissions"
ON public.app_student_submissions
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 教师可以查看自己作业的所有提交
CREATE POLICY "Teachers can view all submissions for their assignments"
ON public.app_student_submissions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.app_assignments a
        WHERE a.id = app_student_submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- ==========================================
-- 7. 视图：作业统计视图
-- ==========================================
CREATE OR REPLACE VIEW public.v_assignment_stats AS
SELECT 
    a.id,
    a.title,
    a.course_id,
    c.title as course_name,
    a.teacher_id,
    a.deadline,
    a.status,
    a.max_score,
    a.submitted_count,
    a.total_count,
    COUNT(s.id) FILTER (WHERE s.status = 'graded') as graded_count,
    AVG(s.score) FILTER (WHERE s.status = 'graded') as average_score,
    MIN(s.score) FILTER (WHERE s.status = 'graded') as min_score,
    MAX(s.score) FILTER (WHERE s.status = 'graded') as max_score,
    a.created_at
FROM public.app_assignments a
LEFT JOIN public.app_student_submissions s ON s.assignment_id = a.id
LEFT JOIN public.courses c ON c.id = a.course_id
WHERE a.is_deleted = FALSE
GROUP BY a.id, c.title;

-- ==========================================
-- 8. 视图：学生提交详情视图
-- ==========================================
CREATE OR REPLACE VIEW public.v_student_submission_details AS
SELECT 
    s.id,
    s.assignment_id,
    a.title as assignment_title,
    s.student_id,
    p.name as student_name,
    p.avatar_url as student_avatar,
    s.content,
    s.attachments,
    s.status,
    s.score,
    s.comment,
    s.graded_by,
    grader.name as graded_by_name,
    s.graded_at,
    s.submitted_at,
    s.is_late,
    a.deadline,
    CASE 
        WHEN s.submitted_at > a.deadline THEN TRUE
        ELSE FALSE
    END as is_actually_late
FROM public.app_student_submissions s
JOIN public.app_assignments a ON a.id = s.assignment_id
LEFT JOIN public.profiles p ON p.id = s.student_id
LEFT JOIN public.profiles grader ON grader.id = s.graded_by;

-- ==========================================
-- 9. 示例数据（可选）
-- ==========================================

-- 插入示例作业（需要先存在课程和教师）
-- INSERT INTO public.app_assignments (title, content, course_id, teacher_id, deadline, max_score, attachments, total_count)
-- VALUES 
--     ('项目计划书撰写', '请根据所学知识，撰写一份完整的项目计划书...', 'course-uuid-1', 'teacher-uuid-1', '2026-02-16 23:59:00', 100, '[{"name": "模板.docx", "size": "256KB"}]'::jsonb, 32),
--     ('敏捷看板设计', '设计一个敏捷开发团队的看板...', 'course-uuid-2', 'teacher-uuid-1', '2026-02-18 23:59:00', 100, '[]'::jsonb, 28);

-- ==========================================
-- 10. 存储过程：批量批改
-- ==========================================
CREATE OR REPLACE FUNCTION batch_grade_submissions(
    p_submission_ids UUID[],
    p_score INTEGER,
    p_comment TEXT,
    p_teacher_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_submission_id UUID;
    v_assignment_id UUID;
BEGIN
    FOREACH v_submission_id IN ARRAY p_submission_ids
    LOOP
        UPDATE public.app_student_submissions
        SET score = p_score,
            comment = p_comment,
            status = 'graded',
            graded_by = p_teacher_id,
            graded_at = NOW()
        WHERE id = v_submission_id
        AND status != 'graded';
        
        IF FOUND THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ language 'plpgsql';

-- ==========================================
-- 11. 存储过程：软删除作业
-- ==========================================
CREATE OR REPLACE FUNCTION soft_delete_assignment(p_assignment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.app_assignments
    SET is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id = p_assignment_id;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- ==========================================
-- 12. 函数：检查作业状态
-- ==========================================
CREATE OR REPLACE FUNCTION check_assignment_status(p_assignment_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_total INTEGER;
    v_submitted INTEGER;
    v_graded INTEGER;
    v_status TEXT;
BEGIN
    SELECT total_count INTO v_total
    FROM public.app_assignments WHERE id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_submitted
    FROM public.app_student_submissions WHERE assignment_id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_graded
    FROM public.app_student_submissions 
    WHERE assignment_id = p_assignment_id AND status = 'graded';
    
    IF v_graded = v_submitted AND v_submitted > 0 THEN
        v_status := 'completed';
    ELSIF v_submitted > 0 THEN
        v_status := 'grading';
    ELSE
        v_status := 'pending';
    END IF;
    
    RETURN v_status;
END;
$$ language 'plpgsql';
