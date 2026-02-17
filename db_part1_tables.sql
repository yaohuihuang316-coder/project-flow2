-- ========================================================-- ProjectFlow 数据库初始化 - Part 1: 基础表结构-- 执行顺序: 第1个执行-- ========================================================-- ========================================================-- 第一部分：学生互动功能 - Q&A、讨论区、通知-- ========================================================-- 1. Q&A问答表 (app_questions)
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

-- ========================================================-- 第二部分：课堂功能表-- ========================================================-- 1. 课堂会话表 (app_class_sessions)
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

-- 5. 课堂提问表
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

-- ========================================================-- 第三部分：作业管理表-- ========================================================-- 1. 作业表 (app_assignments)
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

-- ========================================================-- 第四部分：个人资料功能表-- ========================================================-- 1. 学习活动记录表（用于热力图）
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

-- ========================================================-- 完成提示-- ========================================================SELECT '✅ Part 1: 所有基础表创建完成！' as status;

