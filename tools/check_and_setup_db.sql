-- =========================================================
-- ProjectFlow 数据库检查和设置脚本
-- 在 Supabase SQL Editor 中执行
-- =========================================================

-- 1. 检查现有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. 检查 auth.users 中的用户
SELECT id, email, created_at 
FROM auth.users 
LIMIT 10;

-- 3. 检查 app_users 表
SELECT * FROM app_users LIMIT 5;

-- 4. 检查 app_courses 表
SELECT * FROM app_courses LIMIT 5;

-- 5. 执行 Part 2 - 触发器和函数（如果表已存在）
-- 通用触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 互动表触发器
DROP TRIGGER IF EXISTS update_app_questions_updated_at ON app_questions;
CREATE TRIGGER update_app_questions_updated_at
    BEFORE UPDATE ON app_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_question_replies_updated_at ON app_question_replies;
CREATE TRIGGER update_app_question_replies_updated_at
    BEFORE UPDATE ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussions_updated_at ON app_discussions;
CREATE TRIGGER update_app_discussions_updated_at
    BEFORE UPDATE ON app_discussions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussion_replies_updated_at ON app_discussion_replies;
CREATE TRIGGER update_app_discussion_replies_updated_at
    BEFORE UPDATE ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_notification_settings_updated_at ON app_notification_settings;
CREATE TRIGGER update_app_notification_settings_updated_at
    BEFORE UPDATE ON app_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 作业表触发器
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.app_assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.app_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.app_student_submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 触发器：自动更新讨论最后回复信息
CREATE OR REPLACE FUNCTION update_discussion_last_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_discussions
    SET 
        replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_name
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_discussion_last_reply ON app_discussion_replies;
CREATE TRIGGER trigger_update_discussion_last_reply
    AFTER INSERT ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_discussion_last_reply();

-- 触发器：更新问题回复数和状态
CREATE OR REPLACE FUNCTION update_question_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_questions
    SET 
        status = CASE 
            WHEN status = 'unanswered' THEN 'answered'
            ELSE status
        END
    WHERE id = NEW.question_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_question_on_reply ON app_question_replies;
CREATE TRIGGER trigger_update_question_on_reply
    AFTER INSERT ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_question_on_reply();

-- 触发器：自动更新作业统计
CREATE OR REPLACE FUNCTION update_assignment_stats()
RETURNS TRIGGER AS $$
BEGIN
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

-- 触发器：自动标记迟交
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT deadline INTO assignment_deadline
    FROM public.app_assignments
    WHERE id = NEW.assignment_id;
    
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

-- 6. 创建视图
CREATE OR REPLACE VIEW public.v_assignment_stats AS
SELECT 
    a.id,
    a.title,
    a.course_id,
    c.title as course_name,
    a.teacher_id,
    a.deadline,
    a.status,
    a.max_score as total_score,
    a.submitted_count,
    a.total_count,
    COUNT(s.id) FILTER (WHERE s.status = 'graded') as graded_count,
    AVG(s.score) FILTER (WHERE s.status = 'graded') as average_score,
    MIN(s.score) FILTER (WHERE s.status = 'graded') as min_score,
    MAX(s.score) FILTER (WHERE s.status = 'graded') as max_score,
    a.created_at
FROM public.app_assignments a
LEFT JOIN public.app_student_submissions s ON s.assignment_id = a.id
LEFT JOIN app_courses c ON c.id = a.course_id
WHERE a.is_deleted = FALSE
GROUP BY a.id, c.title;

CREATE OR REPLACE VIEW public.v_student_submission_details AS
SELECT 
    s.id,
    s.assignment_id,
    a.title as assignment_title,
    s.student_id,
    p.name as student_name,
    p.avatar as student_avatar,
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
LEFT JOIN app_users p ON p.id = s.student_id::TEXT
LEFT JOIN app_users grader ON grader.id = s.graded_by::TEXT;

-- 7. 启用RLS
ALTER TABLE app_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_class_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;

-- 8. 创建RLS策略（简化版，允许所有认证用户访问）
-- 课堂会话表策略
DROP POLICY IF EXISTS "教师可以管理自己的课堂" ON app_class_sessions;
CREATE POLICY "教师可以管理自己的课堂"
    ON app_class_sessions FOR ALL
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "学生可以查看进行中的课堂" ON app_class_sessions;
CREATE POLICY "学生可以查看进行中的课堂"
    ON app_class_sessions FOR SELECT
    USING (status = 'ongoing' OR EXISTS (
        SELECT 1 FROM app_course_enrollments 
        WHERE course_id = app_class_sessions.course_id 
        AND student_id = auth.uid()::TEXT
    ));

-- 签到表策略
DROP POLICY IF EXISTS "教师可以查看课堂签到" ON app_attendance;
CREATE POLICY "教师可以查看课堂签到"
    ON app_attendance FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_class_sessions 
        WHERE id = app_attendance.session_id 
        AND teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "学生可以签到自己的课程" ON app_attendance;
CREATE POLICY "学生可以签到自己的课程"
    ON app_attendance FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- 投票表策略
DROP POLICY IF EXISTS "教师可以管理自己的投票" ON app_polls;
CREATE POLICY "教师可以管理自己的投票"
    ON app_polls FOR ALL
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "学生可以查看进行中的投票" ON app_polls;
CREATE POLICY "学生可以查看进行中的投票"
    ON app_polls FOR SELECT
    USING (status = 'active');

-- 投票记录表策略
DROP POLICY IF EXISTS "教师可以查看投票结果" ON app_poll_votes;
CREATE POLICY "教师可以查看投票结果"
    ON app_poll_votes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_polls 
        WHERE id = app_poll_votes.poll_id 
        AND teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "学生可以投票" ON app_poll_votes;
CREATE POLICY "学生可以投票"
    ON app_poll_votes FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- 课堂提问表策略
DROP POLICY IF EXISTS "教师可以管理课堂提问" ON app_class_questions;
CREATE POLICY "教师可以管理课堂提问"
    ON app_class_questions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_class_sessions 
        WHERE id = app_class_questions.session_id 
        AND teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "学生可以提问和查看自己的问题" ON app_class_questions;
CREATE POLICY "学生可以提问和查看自己的问题"
    ON app_class_questions FOR ALL
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM app_class_sessions 
        WHERE id = app_class_questions.session_id 
        AND teacher_id = auth.uid()
    ));

-- 作业管理策略
DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON public.app_assignments;
CREATE POLICY "Teachers can manage their own assignments"
ON public.app_assignments
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can view course assignments" ON public.app_assignments;
CREATE POLICY "Students can view course assignments"
ON public.app_assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_course_enrollments e
        WHERE e.course_id = app_assignments.course_id
        AND e.student_id = auth.uid()::TEXT
    )
);

DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.app_student_submissions;
CREATE POLICY "Students can manage their own submissions"
ON public.app_student_submissions
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view all submissions for their assignments" ON public.app_student_submissions;
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

-- 个人资料功能策略
DROP POLICY IF EXISTS "learning_activity_own" ON app_learning_activity;
CREATE POLICY "learning_activity_own" ON app_learning_activity 
    FOR ALL USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "achievements_public_read" ON app_achievements;
CREATE POLICY "achievements_public_read" ON app_achievements 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_achievements_own" ON app_user_achievements;
CREATE POLICY "user_achievements_own" ON app_user_achievements 
    FOR ALL USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "user_skills_own" ON app_user_skills;
CREATE POLICY "user_skills_own" ON app_user_skills 
    FOR ALL USING (user_id = auth.uid()::TEXT);

SELECT '数据库设置完成！' as status;
