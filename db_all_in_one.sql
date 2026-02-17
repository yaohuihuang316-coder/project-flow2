-- ========================================================
-- ProjectFlow 完整数据库初始化脚本
-- 合并文件：
--   - db_interactions_tables.sql (Q&A、讨论区、通知)
--   - db_classroom_tables.sql (课堂功能)
--   - db_assignments.sql (作业管理)
--   - db_profile_features.sql (个人资料功能)
--   - db_announcements_seed_fixed.sql (公告数据)
-- ========================================================

-- ========================================================
-- 第一部分：学生互动功能 - Q&A、讨论区、通知
-- 来源: db_interactions_tables.sql
-- ========================================================

-- 1. Q&A问答表 (app_questions)
CREATE TABLE IF NOT EXISTS app_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_avatar TEXT,
    course_id TEXT REFERENCES app_courses(id) ON DELETE SET NULL,
    course_name VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered', 'resolved')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    tags TEXT[],
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_student_id ON app_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON app_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON app_questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON app_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_is_pinned ON app_questions(is_pinned);

ALTER TABLE app_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by everyone" ON app_questions;
CREATE POLICY "Questions are viewable by everyone" 
    ON app_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can create questions" ON app_questions;
CREATE POLICY "Students can create questions" 
    ON app_questions FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own questions" ON app_questions;
CREATE POLICY "Students can update own questions" 
    ON app_questions FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can delete own questions" ON app_questions;
CREATE POLICY "Students can delete own questions" 
    ON app_questions FOR DELETE USING (auth.uid() = student_id);

-- 2. Q&A回复表 (app_question_replies)
CREATE TABLE IF NOT EXISTS app_question_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES app_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_role VARCHAR(50) DEFAULT 'student' CHECK (author_role IN ('teacher', 'student', 'assistant')),
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_replies_question_id ON app_question_replies(question_id);
CREATE INDEX IF NOT EXISTS idx_question_replies_author_id ON app_question_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_question_replies_created_at ON app_question_replies(created_at);

ALTER TABLE app_question_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Replies are viewable by everyone" ON app_question_replies;
CREATE POLICY "Replies are viewable by everyone" 
    ON app_question_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create replies" ON app_question_replies;
CREATE POLICY "Authenticated users can create replies" 
    ON app_question_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own replies" ON app_question_replies;
CREATE POLICY "Users can update own replies" 
    ON app_question_replies FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own replies" ON app_question_replies;
CREATE POLICY "Users can delete own replies" 
    ON app_question_replies FOR DELETE USING (auth.uid() = author_id);

-- 3. 讨论区主题表 (app_discussions)
CREATE TABLE IF NOT EXISTS app_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    replies_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    tags TEXT[],
    last_reply_at TIMESTAMPTZ DEFAULT NOW(),
    last_reply_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON app_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON app_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON app_discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_last_reply_at ON app_discussions(last_reply_at DESC);

ALTER TABLE app_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON app_discussions;
CREATE POLICY "Discussions are viewable by everyone" 
    ON app_discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create discussions" ON app_discussions;
CREATE POLICY "Authenticated users can create discussions" 
    ON app_discussions FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own discussions" ON app_discussions;
CREATE POLICY "Users can update own discussions" 
    ON app_discussions FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own discussions" ON app_discussions;
CREATE POLICY "Users can delete own discussions" 
    ON app_discussions FOR DELETE USING (auth.uid() = author_id);

-- 4. 讨论区回复表 (app_discussion_replies)
CREATE TABLE IF NOT EXISTS app_discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES app_discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_role VARCHAR(50) DEFAULT 'student' CHECK (author_role IN ('teacher', 'student', 'assistant')),
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON app_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON app_discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_created_at ON app_discussion_replies(created_at);

ALTER TABLE app_discussion_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Discussion replies are viewable by everyone" ON app_discussion_replies;
CREATE POLICY "Discussion replies are viewable by everyone" 
    ON app_discussion_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create discussion replies" ON app_discussion_replies;
CREATE POLICY "Authenticated users can create discussion replies" 
    ON app_discussion_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own discussion replies" ON app_discussion_replies;
CREATE POLICY "Users can update own discussion replies" 
    ON app_discussion_replies FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own discussion replies" ON app_discussion_replies;
CREATE POLICY "Users can delete own discussion replies" 
    ON app_discussion_replies FOR DELETE USING (auth.uid() = author_id);

-- 5. 通知表 (app_notifications)
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('question', 'reply', 'mention', 'system', 'report')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON app_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON app_notifications(type);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON app_notifications;
CREATE POLICY "Users can view own notifications" 
    ON app_notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON app_notifications;
CREATE POLICY "System can create notifications" 
    ON app_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON app_notifications;
CREATE POLICY "Users can update own notifications" 
    ON app_notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON app_notifications;
CREATE POLICY "Users can delete own notifications" 
    ON app_notifications FOR DELETE USING (auth.uid() = user_id);

-- 6. 通知设置表 (app_notification_settings)
CREATE TABLE IF NOT EXISTS app_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    new_question BOOLEAN DEFAULT true,
    new_reply BOOLEAN DEFAULT true,
    mention BOOLEAN DEFAULT true,
    system BOOLEAN DEFAULT true,
    report BOOLEAN DEFAULT true,
    email_notification BOOLEAN DEFAULT true,
    push_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON app_notification_settings(user_id);

ALTER TABLE app_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification settings" ON app_notification_settings;
CREATE POLICY "Users can view own notification settings" 
    ON app_notification_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notification settings" ON app_notification_settings;
CREATE POLICY "Users can create own notification settings" 
    ON app_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification settings" ON app_notification_settings;
CREATE POLICY "Users can update own notification settings" 
    ON app_notification_settings FOR UPDATE USING (auth.uid() = user_id);


-- ========================================================
-- 第二部分：课堂功能
-- 来源: db_classroom_tables.sql
-- ========================================================

-- 1. 课堂会话表 (app_class_sessions)
CREATE TABLE IF NOT EXISTS app_class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    classroom VARCHAR(50),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    max_students INTEGER DEFAULT 50,
    recording_enabled BOOLEAN DEFAULT false,
    recording_started_at TIMESTAMP WITH TIME ZONE,
    recording_ended_at TIMESTAMP WITH TIME ZONE,
    recording_duration INTEGER,
    recording_url TEXT,
    recording_file_size BIGINT,
    recording_status VARCHAR(20) CHECK (recording_status IN ('recording', 'processing', 'ready', 'failed')),
    screen_share_enabled BOOLEAN DEFAULT false,
    screen_share_started_at TIMESTAMP WITH TIME ZONE,
    screen_share_ended_at TIMESTAMP WITH TIME ZONE,
    whiteboard_data JSONB DEFAULT '[]'::jsonb,
    attendance_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    poll_count INTEGER DEFAULT 0,
    engagement_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON app_class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_id ON app_class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON app_class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_scheduled_start ON app_class_sessions(scheduled_start);

-- 课堂会话触发器
CREATE OR REPLACE FUNCTION update_class_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_class_sessions_updated_at ON app_class_sessions;
CREATE TRIGGER trigger_class_sessions_updated_at
    BEFORE UPDATE ON app_class_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_class_sessions_updated_at();

-- 2. 学生签到表 (app_attendance)
CREATE TABLE IF NOT EXISTS app_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'excused')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON app_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON app_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON app_attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON app_attendance(check_in_time);

-- 3. 课堂投票表 (app_polls)
CREATE TABLE IF NOT EXISTS app_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    allow_multiple BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    winning_option_id UUID,
    results JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_session_id ON app_polls(session_id);
CREATE INDEX IF NOT EXISTS idx_polls_teacher_id ON app_polls(teacher_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON app_polls(status);

-- 4. 投票记录表 (app_poll_votes)
CREATE TABLE IF NOT EXISTS app_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES app_polls(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_options UUID[] NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON app_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_session_id ON app_poll_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_student_id ON app_poll_votes(student_id);

-- 5. 课堂提问表 (重命名为 app_class_questions 避免与 app_questions 冲突)
CREATE TABLE IF NOT EXISTS app_class_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed', 'archived')),
    upvotes INTEGER DEFAULT 0,
    upvoted_by UUID[] DEFAULT '{}',
    answer_content TEXT,
    answered_by UUID REFERENCES auth.users(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_questions_session_id ON app_class_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_class_questions_student_id ON app_class_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_class_questions_status ON app_class_questions(status);
CREATE INDEX IF NOT EXISTS idx_class_questions_created_at ON app_class_questions(created_at);

-- 6. 课堂回放学 (app_recordings)
CREATE TABLE IF NOT EXISTS app_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_format VARCHAR(10) DEFAULT 'mp4',
    duration INTEGER,
    thumbnail_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('recording', 'processing', 'ready', 'failed', 'deleted')),
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    allowed_students UUID[] DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON app_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_teacher_id ON app_recordings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON app_recordings(status);

-- 7. 课堂统计汇总表 (app_class_stats)
CREATE TABLE IF NOT EXISTS app_class_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_title VARCHAR(255) NOT NULL,
    class_date DATE NOT NULL,
    duration INTEGER,
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5, 2),
    question_count INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    poll_count INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    avg_votes_per_poll DECIMAL(5, 2),
    engagement_score INTEGER,
    details JSONB DEFAULT '{}'::jsonb,
    last_exported_at TIMESTAMP WITH TIME ZONE,
    export_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_class_stats_session_id ON app_class_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_course_id ON app_class_stats(course_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_teacher_id ON app_class_stats(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_class_date ON app_class_stats(class_date);

-- 8. 实时课堂事件表
CREATE TABLE IF NOT EXISTS app_class_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('check_in', 'check_out', 'question', 'vote', 'poll_start', 'poll_end', 'screen_share_start', 'screen_share_end', 'recording_start', 'recording_end')),
    payload JSONB DEFAULT '{}'::jsonb,
    triggered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_events_session_id ON app_class_events(session_id);
CREATE INDEX IF NOT EXISTS idx_class_events_event_type ON app_class_events(event_type);
CREATE INDEX IF NOT EXISTS idx_class_events_created_at ON app_class_events(created_at);


-- ========================================================
-- 第三部分：作业管理模块
-- 来源: db_assignments.sql
-- ========================================================

-- 1. 作业表 (app_assignments)
CREATE TABLE IF NOT EXISTS public.app_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100 CHECK (max_score > 0 AND max_score <= 200),
    attachments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'completed')),
    submitted_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.app_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.app_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.app_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.app_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.app_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_is_deleted ON public.app_assignments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_assignments_course_status ON public.app_assignments(course_id, status);

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

-- 2. 学生提交表 (app_student_submissions)
CREATE TABLE IF NOT EXISTS public.app_student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.app_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 200)),
    comment TEXT,
    graded_by UUID REFERENCES auth.users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_late BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.app_student_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.app_student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.app_student_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.app_student_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON public.app_student_submissions(graded_at);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status ON public.app_student_submissions(assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_student_assignment ON public.app_student_submissions(student_id, assignment_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_student_assignment 
ON public.app_student_submissions(assignment_id, student_id);

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


-- ========================================================
-- 第四部分：个人资料功能
-- 来源: db_profile_features.sql
-- ========================================================

-- 1. 学习活动记录表（用于热力图）
CREATE TABLE IF NOT EXISTS app_learning_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('course', 'simulation', 'tool', 'login')),
    xp_earned INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date, activity_type)
);

CREATE INDEX IF NOT EXISTS idx_learning_activity_user ON app_learning_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activity_date ON app_learning_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_date ON app_learning_activity(user_id, activity_date);

-- 2. 徽章定义表
CREATE TABLE IF NOT EXISTS app_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('learning', 'skill', 'social', 'special')),
    unlock_type TEXT NOT NULL CHECK (unlock_type IN (
        'courses_completed',
        'simulations_completed',
        'streak_days',
        'skill_score',
        'tool_usage',
        'community_posts',
        'special'
    )),
    unlock_threshold INTEGER DEFAULT 1,
    unlock_condition JSONB DEFAULT '{}',
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户徽章记录表
CREATE TABLE IF NOT EXISTS app_user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    achievement_id UUID NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, achievement_id)
);

-- 添加外键约束
ALTER TABLE app_user_achievements
    DROP CONSTRAINT IF EXISTS app_user_achievements_user_id_fkey;
ALTER TABLE app_user_achievements
    ADD CONSTRAINT app_user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE app_user_achievements
    DROP CONSTRAINT IF EXISTS app_user_achievements_achievement_id_fkey;
ALTER TABLE app_user_achievements
    ADD CONSTRAINT app_user_achievements_achievement_id_fkey 
    FOREIGN KEY (achievement_id) REFERENCES app_achievements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON app_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_new ON app_user_achievements(user_id, is_new);

-- 4. 用户能力维度评分表（用于雷达图）
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    plan_score INTEGER DEFAULT 0 CHECK (plan_score >= 0 AND plan_score <= 100),
    exec_score INTEGER DEFAULT 0 CHECK (exec_score >= 0 AND exec_score <= 100),
    cost_score INTEGER DEFAULT 0 CHECK (cost_score >= 0 AND cost_score <= 100),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    agile_score INTEGER DEFAULT 0 CHECK (agile_score >= 0 AND agile_score <= 100),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON app_user_skills(user_id);


-- ========================================================
-- 第五部分：触发器和辅助函数
-- ========================================================

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

-- 课堂功能函数：计算投票结果
CREATE OR REPLACE FUNCTION calculate_poll_results(poll_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_object_agg(selected_option::text, vote_count)
    INTO result
    FROM (
        SELECT unnest(selected_options) as selected_option, COUNT(*) as vote_count
        FROM app_poll_votes
        WHERE poll_id = poll_uuid
        GROUP BY unnest(selected_options)
    ) subquery;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 课堂功能函数：更新课堂统计
CREATE OR REPLACE FUNCTION update_class_stats(session_uuid UUID)
RETURNS VOID AS $$
DECLARE
    v_total INTEGER;
    v_present INTEGER;
    v_late INTEGER;
    v_absent INTEGER;
    v_questions INTEGER;
    v_answered INTEGER;
    v_polls INTEGER;
    v_votes INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'present'),
        COUNT(*) FILTER (WHERE status = 'late'),
        COUNT(*) FILTER (WHERE status = 'absent')
    INTO v_total, v_present, v_late, v_absent
    FROM app_attendance
    WHERE session_id = session_uuid;
    
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'answered')
    INTO v_questions, v_answered
    FROM app_class_questions
    WHERE session_id = session_uuid;
    
    SELECT COUNT(*), COALESCE(SUM(total_votes), 0)
    INTO v_polls, v_votes
    FROM app_polls
    WHERE session_id = session_uuid;
    
    INSERT INTO app_class_stats (
        session_id, course_id, teacher_id, class_title, class_date,
        total_students, present_count, late_count, absent_count, attendance_rate,
        question_count, answered_questions, poll_count, total_votes
    )
    SELECT 
        s.id, s.course_id, s.teacher_id, s.title, s.actual_start::date,
        v_total, v_present, v_late, v_absent, 
        CASE WHEN v_total > 0 THEN ROUND((v_present + v_late)::numeric / v_total * 100, 2) ELSE 0 END,
        v_questions, v_answered, v_polls, COALESCE(v_votes, 0)
    FROM app_class_sessions s
    WHERE s.id = session_uuid
    ON CONFLICT (session_id) DO UPDATE SET
        total_students = v_total,
        present_count = v_present,
        late_count = v_late,
        absent_count = v_absent,
        attendance_rate = CASE WHEN v_total > 0 THEN ROUND((v_present + v_late)::numeric / v_total * 100, 2) ELSE 0 END,
        question_count = v_questions,
        answered_questions = v_answered,
        poll_count = v_polls,
        total_votes = v_votes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 作业管理函数：批量批改
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

-- 作业管理函数：软删除作业
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

-- 作业管理函数：检查作业状态
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

-- 个人资料函数：记录学习活动
CREATE OR REPLACE FUNCTION record_learning_activity(
    p_user_id TEXT,
    p_activity_type TEXT,
    p_xp_earned INTEGER DEFAULT 0,
    p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
    VALUES (p_user_id, CURRENT_DATE, p_activity_type, p_xp_earned, p_details)
    ON CONFLICT (user_id, activity_date, activity_type) 
    DO UPDATE SET 
        xp_earned = app_learning_activity.xp_earned + EXCLUDED.xp_earned,
        details = app_learning_activity.details || EXCLUDED.details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 个人资料函数：检查并解锁徽章
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id TEXT)
RETURNS TABLE(achievement_id TEXT, is_new BOOLEAN) AS $$
DECLARE
    v_achievement RECORD;
    v_count INTEGER;
    v_should_unlock BOOLEAN;
BEGIN
    FOR v_achievement IN SELECT * FROM app_achievements LOOP
        IF EXISTS (
            SELECT 1 FROM app_user_achievements 
            WHERE user_id = p_user_id AND achievement_id = v_achievement.id
        ) THEN
            CONTINUE;
        END IF;
        
        v_should_unlock := FALSE;
        
        CASE v_achievement.unlock_type
            WHEN 'courses_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_course_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'simulations_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_simulation_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'streak_days' THEN
                SELECT COALESCE(MAX(consecutive_days), 0) INTO v_count
                FROM (
                    SELECT COUNT(*) AS consecutive_days
                    FROM (
                        SELECT activity_date, 
                               activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::INTEGER AS grp
                        FROM app_learning_activity
                        WHERE user_id = p_user_id
                    ) t
                    GROUP BY grp
                ) streaks;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'tool_usage' THEN
                SELECT COUNT(DISTINCT tool_id) INTO v_count
                FROM lab_tool_history
                WHERE user_id = p_user_id;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'skill_score' THEN
                SELECT COUNT(*) INTO v_count
                FROM app_user_skills
                WHERE user_id = p_user_id
                  AND plan_score >= v_achievement.unlock_threshold
                  AND exec_score >= v_achievement.unlock_threshold
                  AND cost_score >= v_achievement.unlock_threshold
                  AND risk_score >= v_achievement.unlock_threshold
                  AND lead_score >= v_achievement.unlock_threshold
                  AND agile_score >= v_achievement.unlock_threshold;
                v_should_unlock := v_count > 0;
        END CASE;
        
        IF v_should_unlock THEN
            INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new)
            VALUES (p_user_id, v_achievement.id, NOW(), TRUE);
            
            achievement_id := v_achievement.id;
            is_new := TRUE;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 个人资料函数：计算用户技能分数
CREATE OR REPLACE FUNCTION calculate_user_skills(p_user_id TEXT)
RETURNS VOID AS $$
DECLARE
    v_plan_score INTEGER := 0;
    v_exec_score INTEGER := 0;
    v_cost_score INTEGER := 0;
    v_risk_score INTEGER := 0;
    v_lead_score INTEGER := 0;
    v_agile_score INTEGER := 0;
BEGIN
    SELECT COALESCE(
        (SELECT AVG(score) * 10 
         FROM app_simulation_progress 
         WHERE user_id = p_user_id 
           AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Planning%')
        ), 0
    )::INTEGER INTO v_plan_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 10 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%burn%'), 0) +
        COALESCE((SELECT AVG(completion_rate) FROM app_course_progress WHERE user_id = p_user_id), 0) / 10,
        100
    )::INTEGER INTO v_exec_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 20 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%evm%'), 0),
        100
    )::INTEGER INTO v_cost_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%fishbone%'), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Risk%')
        ), 0),
        100
    )::INTEGER INTO v_risk_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 5 FROM community_posts WHERE user_id = p_user_id), 0) +
        COALESCE((SELECT MAX(streak) FROM app_users WHERE id = p_user_id), 0) * 3,
        100
    )::INTEGER INTO v_lead_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id IN ('kanban-flow', 'planning-poker')), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Agile%')
        ), 0),
        100
    )::INTEGER INTO v_agile_score;
    
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (p_user_id, v_plan_score, v_exec_score, v_cost_score, v_risk_score, v_lead_score, v_agile_score, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
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
        SELECT 1 FROM app_enrollments 
        WHERE course_id = app_class_sessions.course_id 
        AND student_id = auth.uid()
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
        AND e.student_id = auth.uid()
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
-- 第十二部分：公告示例数据
-- 来源: db_announcements_seed_fixed.sql
-- ========================================================

-- 先清空现有数据
DELETE FROM app_announcements;

-- 重置序列
ALTER SEQUENCE IF EXISTS app_announcements_id_seq RESTART WITH 1;

-- 插入示例公告数据
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at, created_at) VALUES
(
    '欢迎使用 ProjectFlow 项目管理学习平台！',
    '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：
• 学习专业的项目管理课程
• 使用强大的项目管理工具
• 参与社区讨论与经验分享
• 体验实战模拟场景

祝您学习愉快，技能精进！如有任何问题，请联系我们的客服团队。',
    'success',
    10,
    'all',
    true,
    '2026-01-01 00:00:00+00',
    '2026-03-01 00:00:00+00',
    '2026-01-01 00:00:00+00'
),
(
    '系统功能更新：全新仪表盘上线',
    '我们很高兴地宣布，全新的个人仪表盘功能已正式上线！

本次更新内容包括：
• 个性化学习进度展示
• 项目完成度可视化图表
• 快捷操作入口优化
• 学习数据深度分析

点击右上角头像进入「个人中心」即可体验全新功能。',
    'info',
    8,
    'all',
    true,
    '2026-01-08 00:00:00+00',
    '2026-01-22 00:00:00+00',
    '2026-01-08 00:00:00+00'
),
(
    'PMP 认证新课程已上线，快来学习吧！',
    '备受期待的《PMP 认证完整指南》课程现已正式上线！

课程亮点：
• 35小时专业PDU学时
• 覆盖全部考试知识领域
• 配套练习题库1000+
• 资深PMP讲师在线答疑

会员用户可免费学习全部内容，立即点击课程页面开始学习吧！',
    'success',
    9,
    'all',
    true,
    '2026-01-10 00:00:00+00',
    '2026-03-10 00:00:00+00',
    '2026-01-10 00:00:00+00'
),
(
    '敏捷项目管理实战课程更新通知',
    '《敏捷项目管理实战》课程已完成内容升级！

更新内容：
• 新增Scrum框架深度解析章节
• 增加5个真实企业案例
• 补充看板(Kanban)实战演练
• 新增DevOps与敏捷结合模块

已报名的学员可直接免费学习更新内容。',
    'info',
    7,
    'all',
    true,
    '2026-01-15 00:00:00+00',
    '2026-02-05 00:00:00+00',
    '2026-01-15 00:00:00+00'
),
(
    '教师专属：课程创作工具升级',
    '各位讲师，课程创作工作台已进行全面升级！

新功能包括：
• 富文本编辑器增强，支持更多格式
• 视频章节自动分割功能
• 作业批改批量处理
• 学员学习数据导出

登录讲师后台即可体验新功能，如有建议请随时反馈。',
    'info',
    6,
    'all',
    true,
    '2026-01-20 00:00:00+00',
    '2026-02-19 00:00:00+00',
    '2026-01-20 00:00:00+00'
),
(
    '【直播预告】项目管理大咖分享会 - 第3期',
    '直播主题：《从初级PM到项目总监的成长之路》

直播时间：本周六晚 20:00-21:30

分享嘉宾：李明 - 某互联网大厂项目总监，15年项目管理经验

内容大纲：
• 项目管理职业发展路径
• 关键能力跃升技巧
• 面试与晋升经验分享
• 互动答疑环节

点击预约直播，开播前将发送提醒通知！',
    'warning',
    9,
    'all',
    true,
    '2026-01-25 00:00:00+00',
    '2026-01-30 00:00:00+00',
    '2026-01-25 00:00:00+00'
),
(
    '「30天项目管理挑战赛」开始报名！',
    '想要快速提升项目管理实战能力？加入我们的30天挑战赛吧！

活动形式：
• 每日学习任务打卡
• 真实项目案例分析
• 团队协作模拟练习
• 导师点评与指导

活动时间：下月1日-30日
报名截止：本月28日

完成挑战可获得：
✓ 官方认证证书
✓ 精美周边礼品
✓ Pro会员体验月卡

名额有限，立即报名！',
    'success',
    8,
    'all',
    true,
    '2026-01-28 00:00:00+00',
    '2026-02-17 00:00:00+00',
    '2026-01-28 00:00:00+00'
);


-- ========================================================
-- 第十三部分：互动功能示例数据
-- 来源: db_interactions_tables.sql
-- ========================================================

-- 插入示例问题
INSERT INTO app_questions (id, student_id, student_name, student_avatar, course_name, title, content, status, priority, tags, likes, views, is_pinned, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '陈小明', 'https://i.pravatar.cc/150?u=4', '项目管理基础', 'WBS分解的最小单元应该到什么程度比较合适？', '老师，我在学习WBS分解时遇到一个困惑：工作分解结构的最小单元应该细化到什么程度？', 'unanswered', 'normal', ARRAY['WBS', '项目管理'], 3, 15, false, NOW() - INTERVAL '10 minutes'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '刘小红', 'https://i.pravatar.cc/150?u=5', '敏捷开发实践', 'Scrum和Kanban的主要区别是什么？', '老师您好，我对Scrum和Kanban的区别还有些模糊。两者都是敏捷方法论，在实际项目中应该如何选择？', 'answered', 'high', ARRAY['Scrum', 'Kanban', '敏捷'], 8, 42, true, NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', '赵小强', 'https://i.pravatar.cc/150?u=6', '风险管理专题', '定性风险分析和定量风险分析分别在什么阶段进行？', '老师，关于风险管理的两个分析阶段，我想确认一下：定性风险分析和定量风险分析是在项目的什么阶段进行的？', 'unanswered', 'urgent', ARRAY['风险管理', '风险分析'], 2, 12, false, NOW() - INTERVAL '1 hour');

-- 插入示例讨论
INSERT INTO app_discussions (id, author_id, author_name, author_avatar, title, content, replies_count, views, likes, is_pinned, is_locked, tags, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', '张老师', 'https://i.pravatar.cc/150?u=teacher', '【精华】项目管理实战经验分享', '这个帖子汇总了我多年项目管理的实战经验...', 45, 1280, 89, true, false, ARRAY['精华', '经验分享'], '2026-02-10'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', '陈小明', 'https://i.pravatar.cc/150?u=4', '敏捷转型中的常见问题和解决方案', '我们团队正在进行敏捷转型，遇到了一些困难...', 23, 456, 34, false, false, ARRAY['敏捷转型', '讨论'], '2026-02-12');

-- 插入示例通知
INSERT INTO app_notifications (id, user_id, type, title, content, is_read, related_id, created_at) VALUES
('n1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'question', '新的学生提问', '陈小明在《项目管理基础》课程中提出了一个新问题', false, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 minutes'),
('n2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'reply', '问题收到新回复', '你关注的问题"Scrum和Kanban的主要区别"收到了新回复', false, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 minutes'),
('n3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'mention', '有人@了你', '王小华在讨论中提到了你', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 hour');

-- ========================================================
-- 第十四部分：课堂功能示例数据
-- 来源: db_classroom_tables.sql
-- ========================================================

-- 插入示例课堂会话
INSERT INTO app_class_sessions (
    id, course_id, teacher_id, title, classroom, 
    scheduled_start, scheduled_end, status,
    max_students, created_at
) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'course-1', 'teacher-uuid-1', '项目管理基础 - 第1讲', 'A101', 
 '2026-02-10 09:00:00+00', '2026-02-10 09:45:00+00', 'completed',
 32, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'course-2', 'teacher-uuid-1', '敏捷开发实践 - 第1讲', 'B203', 
 '2026-02-12 14:00:00+00', '2026-02-12 14:45:00+00', 'completed',
 28, NOW())
ON CONFLICT DO NOTHING;

-- 插入示例投票
INSERT INTO app_polls (
    id, session_id, teacher_id, question, options, status, total_votes
) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'teacher-uuid-1', 
 '今天的课程难度如何？', '[{"id": "opt1", "text": "简单"}, {"id": "opt2", "text": "适中"}, {"id": "opt3", "text": "困难"}]'::jsonb, 'closed', 26),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'teacher-uuid-1', 
 '你更喜欢哪种教学方式？', '[{"id": "opt1", "text": "理论讲解"}, {"id": "opt2", "text": "案例分析"}, {"id": "opt3", "text": "互动讨论"}]'::jsonb, 'closed', 28)
ON CONFLICT DO NOTHING;

-- ========================================================
-- 第十五部分：表注释
-- ========================================================

COMMENT ON TABLE app_class_sessions IS '课堂会话表，记录每次上课的信息';
COMMENT ON TABLE app_attendance IS '学生签到表，记录学生的出勤情况';
COMMENT ON TABLE app_polls IS '课堂投票表，记录投票题目和选项';
COMMENT ON TABLE app_poll_votes IS '投票记录表，记录学生的投票选择';
COMMENT ON TABLE app_class_questions IS '学生课堂提问表，记录课堂实时提问和回答';
COMMENT ON TABLE app_recordings IS '课堂回播放，记录课程录像信息';
COMMENT ON TABLE app_class_stats IS '课堂统计汇总表，用于数据分析和报告导出';
COMMENT ON TABLE app_class_events IS '课堂事件表，用于实时推送更新';

-- ========================================================
-- 完成提示
-- ========================================================

SELECT '✅ 所有数据库表创建完成！' as status;
SELECT '📋 包含以下模块：' as info;
SELECT '   1. Q&A问答系统 (app_questions, app_question_replies)' as module;
SELECT '   2. 讨论区系统 (app_discussions, app_discussion_replies)' as module;
SELECT '   3. 通知系统 (app_notifications, app_notification_settings)' as module;
SELECT '   4. 课堂功能 (app_class_sessions, app_attendance, app_polls, app_poll_votes, app_class_questions, app_recordings, app_class_stats, app_class_events)' as module;
SELECT '   5. 作业管理 (app_assignments, app_student_submissions)' as module;
SELECT '   6. 个人资料功能 (app_learning_activity, app_achievements, app_user_achievements, app_user_skills)' as module;
SELECT '   7. 公告数据 (app_announcements)' as module;

