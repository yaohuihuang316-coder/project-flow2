-- ========================================================-- ProjectFlow 数据库初始化 - Part 3: 视图和 RLS 策略-- 执行顺序: 第3个执行 (在 Part 2 之后)-- ========================================================
-- 第六部分：视图
-- ========================================================

-- 作业统计视图
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

-- 学生提交详情视图
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

-- ========================================================
-- 第七部分：RLS 安全策略（课堂功能）
-- ========================================================

-- 课堂会话表策略
ALTER TABLE app_class_sessions ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE app_attendance ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE app_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "教师可以管理自己的投票" ON app_polls;
CREATE POLICY "教师可以管理自己的投票"
    ON app_polls FOR ALL
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "学生可以查看进行中的投票" ON app_polls;
CREATE POLICY "学生可以查看进行中的投票"
    ON app_polls FOR SELECT
    USING (status = 'active');

-- 投票记录表策略
ALTER TABLE app_poll_votes ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE app_class_questions ENABLE ROW LEVEL SECURITY;

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


-- ========================================================
-- 第八部分：RLS 安全策略（作业管理）
-- ========================================================

ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_student_submissions ENABLE ROW LEVEL SECURITY;

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

-- ========================================================
-- 第九部分：RLS 安全策略（个人资料功能）
-- ========================================================

ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learning_activity_own" ON app_learning_activity;
CREATE POLICY "learning_activity_own" ON app_learning_activity 
    FOR ALL USING (user_id = auth.uid()::TEXT);

ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_public_read" ON app_achievements;
CREATE POLICY "achievements_public_read" ON app_achievements 
    FOR SELECT USING (true);

ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_own" ON app_user_achievements;
CREATE POLICY "user_achievements_own" ON app_user_achievements 
    FOR ALL USING (user_id = auth.uid()::TEXT);

ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_skills_own" ON app_user_skills;
CREATE POLICY "user_skills_own" ON app_user_skills 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- ========================================================
-- 第十部分：Realtime 订阅配置
-- ========================================================

-- 使用 DO 块检查 publication 是否存在
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_class_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE app_attendance;
    ALTER PUBLICATION supabase_realtime ADD TABLE app_polls;
    ALTER PUBLICATION supabase_realtime ADD TABLE app_poll_votes;
    ALTER PUBLICATION supabase_realtime ADD TABLE app_class_questions;
    ALTER PUBLICATION supabase_realtime ADD TABLE app_class_events;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
    WHEN duplicate_object THEN
        NULL;
END $$;

-- ========================================================
-- 第十一部分：默认徽章数据
-- ========================================================

INSERT INTO app_achievements (id, code, name, description, icon, category, unlock_type, unlock_threshold, rarity, is_hidden) VALUES
(gen_random_uuid(), 'pmp_master', 'PMP大师', '完成全部体系课程', 'Trophy', 'learning', 'courses_completed', 12, 'legendary', false),
(gen_random_uuid(), 'course_warrior', '课程达人', '完成5门课程', 'BookOpen', 'learning', 'courses_completed', 5, 'rare', false),
(gen_random_uuid(), 'simulation_expert', '模拟专家', '完成10个实战模拟场景', 'Target', 'learning', 'simulations_completed', 10, 'epic', false),
(gen_random_uuid(), 'scenario_starter', '初入茅庐', '完成第一个模拟场景', 'Play', 'learning', 'simulations_completed', 1, 'common', false),
(gen_random_uuid(), 'early_bird', '早起鸟', '连续7天在9点前学习', 'Sunrise', 'special', 'streak_days', 7, 'rare', false),
(gen_random_uuid(), 'streak_master', '连胜大师', '连续学习30天', 'Flame', 'special', 'streak_days', 30, 'epic', false),
(gen_random_uuid(), 'streak_warrior', '坚持者', '连续学习7天', 'Zap', 'special', 'streak_days', 7, 'common', false),
(gen_random_uuid(), 'all_rounder', '全能王', '六维能力均达到60分', 'Crown', 'skill', 'skill_score', 60, 'epic', false),
(gen_random_uuid(), 'perfect_score', '完美主义', '单个课程获得100%掌握度', 'Star', 'learning', 'special', 1, 'legendary', true),
(gen_random_uuid(), 'tool_expert', '工具专家', '使用10种不同的项目管理工具', 'Wrench', 'skill', 'tool_usage', 10, 'rare', false),
(gen_random_uuid(), 'fishbone_master', '根因分析师', '使用鱼骨图分析工具5次', 'GitBranch', 'skill', 'tool_usage', 5, 'common', false),
(gen_random_uuid(), 'community_active', '社区活跃者', '在社区发布10条内容', 'MessageSquare', 'social', 'community_posts', 10, 'common', false),
(gen_random_uuid(), 'helper', '热心助人的', '回复他人问题获得5个赞', 'Heart', 'social', 'special', 5, 'rare', false)
ON CONFLICT (code) DO NOTHING;

-- ========================================================

SELECT '✅ Part 3: 所有视图和 RLS 策略创建完成！' as status;
