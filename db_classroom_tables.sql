-- ==========================================
-- 课堂功能数据库表结构
-- 支持: 课堂会话、投票、提问、签到、回放、统计
-- ==========================================

-- ==========================================
-- 1. 课堂会话表 (app_class_sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    classroom VARCHAR(50),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- 实际时长(秒)
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    max_students INTEGER DEFAULT 50,
    
    -- 录制相关
    recording_enabled BOOLEAN DEFAULT false,
    recording_started_at TIMESTAMP WITH TIME ZONE,
    recording_ended_at TIMESTAMP WITH TIME ZONE,
    recording_duration INTEGER, -- 录制时长(秒)
    recording_url TEXT,
    recording_file_size BIGINT,
    recording_status VARCHAR(20) CHECK (recording_status IN ('recording', 'processing', 'ready', 'failed')),
    
    -- 屏幕共享
    screen_share_enabled BOOLEAN DEFAULT false,
    screen_share_started_at TIMESTAMP WITH TIME ZONE,
    screen_share_ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 白板数据 (JSON格式存储笔触)
    whiteboard_data JSONB DEFAULT '[]'::jsonb,
    
    -- 统计汇总
    attendance_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    poll_count INTEGER DEFAULT 0,
    engagement_score INTEGER, -- 参与度评分 0-100
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON app_class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_id ON app_class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON app_class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_scheduled_start ON app_class_sessions(scheduled_start);

-- 更新时间触发器
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

-- ==========================================
-- 2. 学生签到表 (app_attendance)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 签到状态
    status VARCHAR(20) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'excused')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- 设备信息
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- 位置信息 (可选)
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    
    -- 备注
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 一个学生在一个课堂只能有一条签到记录
    UNIQUE(session_id, student_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON app_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON app_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON app_attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON app_attendance(check_in_time);

-- ==========================================
-- 3. 课堂投票表 (app_polls)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 投票内容
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"id": "opt1", "text": "选项1"}, ...]
    allow_multiple BOOLEAN DEFAULT false,
    
    -- 投票状态
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
    
    -- 时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 统计
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    
    -- 结果
    winning_option_id UUID,
    results JSONB DEFAULT '{}'::jsonb, -- {"opt1": 10, "opt2": 5, ...}
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_polls_session_id ON app_polls(session_id);
CREATE INDEX IF NOT EXISTS idx_polls_teacher_id ON app_polls(teacher_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON app_polls(status);

-- ==========================================
-- 4. 投票记录表 (app_poll_votes)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES app_polls(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 投票选项
    selected_options UUID[] NOT NULL, -- 选项ID数组
    
    -- 时间
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 每个学生在一个投票中只能投一次
    UNIQUE(poll_id, student_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON app_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_session_id ON app_poll_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_student_id ON app_poll_votes(student_id);

-- ==========================================
-- 5. 学生提问表 (app_questions)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 问题内容
    content TEXT NOT NULL,
    
    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed', 'archived')),
    
    -- 互动数据
    upvotes INTEGER DEFAULT 0,
    upvoted_by UUID[] DEFAULT '{}', -- 点赞的学生ID数组
    
    -- 回答信息
    answer_content TEXT,
    answered_by UUID REFERENCES auth.users(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON app_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON app_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON app_questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON app_questions(created_at);

-- ==========================================
-- 6. 课堂回放学 (app_recordings)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 文件信息
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_format VARCHAR(10) DEFAULT 'mp4',
    duration INTEGER, -- 时长(秒)
    
    -- 缩略图
    thumbnail_url TEXT,
    
    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('recording', 'processing', 'ready', 'failed', 'deleted')),
    
    -- 播放统计
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- 权限
    is_public BOOLEAN DEFAULT true,
    allowed_students UUID[] DEFAULT '{}', -- 允许查看的学生列表(空数组表示全部)
    
    -- 时间
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON app_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_teacher_id ON app_recordings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON app_recordings(status);

-- ==========================================
-- 7. 课堂统计汇总表 (app_class_stats)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_class_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 基本信息
    class_title VARCHAR(255) NOT NULL,
    class_date DATE NOT NULL,
    duration INTEGER, -- 时长(秒)
    
    -- 签到统计
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5, 2), -- 出勤率 0-100
    
    -- 互动统计
    question_count INTEGER DEFAULT 0,
    answered_questions INTEGER DEFAULT 0,
    poll_count INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    avg_votes_per_poll DECIMAL(5, 2),
    
    -- 参与度评分 (0-100)
    engagement_score INTEGER,
    
    -- 详细数据 (JSON格式)
    details JSONB DEFAULT '{}'::jsonb,
    
    -- 导出记录
    last_exported_at TIMESTAMP WITH TIME ZONE,
    export_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(session_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_class_stats_session_id ON app_class_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_course_id ON app_class_stats(course_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_teacher_id ON app_class_stats(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_stats_class_date ON app_class_stats(class_date);

-- ==========================================
-- 8. 实时课堂事件表 (用于实时更新)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_class_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app_class_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('check_in', 'check_out', 'question', 'vote', 'poll_start', 'poll_end', 'screen_share_start', 'screen_share_end', 'recording_start', 'recording_end')),
    
    -- 事件数据
    payload JSONB DEFAULT '{}'::jsonb,
    
    -- 触发者
    triggered_by UUID REFERENCES auth.users(id),
    
    -- 时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_class_events_session_id ON app_class_events(session_id);
CREATE INDEX IF NOT EXISTS idx_class_events_event_type ON app_class_events(event_type);
CREATE INDEX IF NOT EXISTS idx_class_events_created_at ON app_class_events(created_at);

-- ==========================================
-- 9. 启用实时功能 (Realtime)
-- ==========================================

-- 为关键表启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE app_class_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE app_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE app_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE app_poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE app_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE app_class_events;

-- ==========================================
-- 10. RLS 安全策略
-- ==========================================

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

-- 提问表策略
ALTER TABLE app_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "教师可以管理课堂提问" ON app_questions;
CREATE POLICY "教师可以管理课堂提问"
    ON app_questions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_class_sessions 
        WHERE id = app_questions.session_id 
        AND teacher_id = auth.uid()
    ));

DROP POLICY IF EXISTS "学生可以提问和查看自己的问题" ON app_questions;
CREATE POLICY "学生可以提问和查看自己的问题"
    ON app_questions FOR ALL
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM app_class_sessions 
        WHERE id = app_questions.session_id 
        AND teacher_id = auth.uid()
    ));

-- ==========================================
-- 11. 函数: 计算投票结果
-- ==========================================
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

-- ==========================================
-- 12. 函数: 更新课堂统计
-- ==========================================
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
    -- 签到统计
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'present'),
        COUNT(*) FILTER (WHERE status = 'late'),
        COUNT(*) FILTER (WHERE status = 'absent')
    INTO v_total, v_present, v_late, v_absent
    FROM app_attendance
    WHERE session_id = session_uuid;
    
    -- 提问统计
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'answered')
    INTO v_questions, v_answered
    FROM app_questions
    WHERE session_id = session_uuid;
    
    -- 投票统计
    SELECT COUNT(*), COALESCE(SUM(total_votes), 0)
    INTO v_polls, v_votes
    FROM app_polls
    WHERE session_id = session_uuid;
    
    -- 更新统计表
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

-- ==========================================
-- 13. 示例数据 (可选)
-- ==========================================

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
 '["简单", "适中", "困难"]'::jsonb, 'closed', 26),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'teacher-uuid-1', 
 '["理论讲解", "案例分析", "互动讨论"]'::jsonb, 'closed', 28)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE app_class_sessions IS '课堂会话表，记录每次上课的信息';
COMMENT ON TABLE app_attendance IS '学生签到表，记录学生的出勤情况';
COMMENT ON TABLE app_polls IS '课堂投票表，记录投票题目和选项';
COMMENT ON TABLE app_poll_votes IS '投票记录表，记录学生的投票选择';
COMMENT ON TABLE app_questions IS '学生提问表，记录课堂提问和回答';
COMMENT ON TABLE app_recordings IS '课堂回播放，记录课程录像信息';
COMMENT ON TABLE app_class_stats IS '课堂统计汇总表，用于数据分析和报告导出';
COMMENT ON TABLE app_class_events IS '课堂事件表，用于实时推送更新';
