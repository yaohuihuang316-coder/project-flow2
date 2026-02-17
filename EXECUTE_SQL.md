# 数据库SQL执行指南

## 快速执行

登录 Supabase Dashboard → SQL Editor → New query → 粘贴以下SQL → Run

### URL
```
https://ghhvdffsyvzkhbftifzy.supabase.co
```

---

## 执行以下SQL

```sql
-- ==========================================
-- 1. 检查现有表
-- ==========================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ==========================================
-- 2. 创建触发器函数
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 3. 创建触发器
-- ==========================================
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

-- 作业表触发器
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.app_assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.app_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.app_student_submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.app_student_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. 创建业务触发器
-- ==========================================
-- 更新讨论最后回复
CREATE OR REPLACE FUNCTION update_discussion_last_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_discussions
    SET replies_count = replies_count + 1,
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

-- 更新问题状态
CREATE OR REPLACE FUNCTION update_question_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_questions
    SET status = CASE WHEN status = 'unanswered' THEN 'answered' ELSE status END
    WHERE id = NEW.question_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_question_on_reply ON app_question_replies;
CREATE TRIGGER trigger_update_question_on_reply
    AFTER INSERT ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_question_on_reply();

-- ==========================================
-- 5. 创建视图
-- ==========================================
CREATE OR REPLACE VIEW public.v_assignment_stats AS
SELECT 
    a.id, a.title, a.course_id, c.title as course_name,
    a.teacher_id, a.deadline, a.status, a.max_score as total_score,
    a.submitted_count, a.total_count,
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

-- ==========================================
-- 6. 启用RLS
-- ==========================================
ALTER TABLE app_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_class_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_student_submissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. 创建RLS策略
-- ==========================================
-- 课堂会话
DROP POLICY IF EXISTS "教师可以管理自己的课堂" ON app_class_sessions;
CREATE POLICY "教师可以管理自己的课堂"
    ON app_class_sessions FOR ALL
    USING (teacher_id = auth.uid());

-- 签到
DROP POLICY IF EXISTS "学生可以签到自己的课程" ON app_attendance;
CREATE POLICY "学生可以签到自己的课程"
    ON app_attendance FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- 投票
DROP POLICY IF EXISTS "教师可以管理自己的投票" ON app_polls;
CREATE POLICY "教师可以管理自己的投票"
    ON app_polls FOR ALL
    USING (teacher_id = auth.uid());

-- 作业
DROP POLICY IF EXISTS "教师可以管理自己的作业" ON public.app_assignments;
CREATE POLICY "教师可以管理自己的作业"
    ON public.app_assignments FOR ALL
    USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "学生可以查看课程作业" ON public.app_assignments;
CREATE POLICY "学生可以查看课程作业"
    ON public.app_assignments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_course_enrollments e
        WHERE e.course_id = app_assignments.course_id
        AND e.student_id = auth.uid()::TEXT
    ));

-- 提交
DROP POLICY IF EXISTS "学生可以管理自己的提交" ON public.app_student_submissions;
CREATE POLICY "学生可以管理自己的提交"
    ON public.app_student_submissions FOR ALL
    USING (student_id = auth.uid());

SELECT '所有触发器、视图和RLS策略创建完成！' as status;
```

---

## 执行后验证

```sql
-- 检查触发器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 检查视图
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';

-- 检查RLS策略
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';
```
