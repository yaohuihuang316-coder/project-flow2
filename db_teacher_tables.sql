-- ==========================================
-- ProjectFlow 教师端数据库表结构
-- 包含：课程管理、学生跟踪、教学分析相关表
-- ==========================================

-- 1. 教师课程关联表
CREATE TABLE IF NOT EXISTS app_teacher_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'primary',            -- primary(主讲)/assistant(助教)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, course_id)
);

-- 2. 学生课程注册表（详细记录）
CREATE TABLE IF NOT EXISTS app_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by TEXT REFERENCES app_users(id), -- 注册操作人（教师/管理员）
    status TEXT DEFAULT 'active',           -- active/paused/completed/dropped
    last_accessed_at TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    final_score INTEGER,                    -- 最终成绩
    UNIQUE(student_id, course_id)
);

-- 3. 学习活动详细记录表（用于教师分析）
CREATE TABLE IF NOT EXISTS app_learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    chapter_id TEXT,                        -- 章节ID
    activity_type TEXT NOT NULL,            -- video_start/video_complete/quiz_start/quiz_complete/etc
    activity_data JSONB DEFAULT '{}',       -- 活动详情
    duration_seconds INTEGER,               -- 活动持续时间（秒）
    score INTEGER,                          -- 如果是测验，记录分数
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 教师通知表
CREATE TABLE IF NOT EXISTS app_teacher_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',         -- low/normal/high/urgent
    target_audience TEXT DEFAULT 'all',     -- all/enrolled/active/at_risk
    scheduled_at TIMESTAMPTZ,               -- 定时发送
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 学生通知已读记录
CREATE TABLE IF NOT EXISTS app_announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES app_teacher_announcements(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, student_id)
);

-- 6. 教师备课笔记表
CREATE TABLE IF NOT EXISTS app_teacher_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    chapter_id TEXT,
    note_type TEXT DEFAULT 'teaching',      -- teaching/observation/to_improve
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT true,        -- 是否仅自己可见
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 学生风险预警表
CREATE TABLE IF NOT EXISTS app_student_risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    risk_type TEXT NOT NULL,                -- low_progress/low_activity/quiz_failure/inactivity
    risk_level TEXT DEFAULT 'medium',       -- low/medium/high
    description TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 教学统计日汇总表（性能优化）
CREATE TABLE IF NOT EXISTS app_teaching_stats_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    stats_date DATE NOT NULL,
    
    -- 学生相关
    total_students INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    new_enrollments INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    dropouts INTEGER DEFAULT 0,
    
    -- 学习相关
    total_study_hours DECIMAL(10,2) DEFAULT 0,
    avg_progress DECIMAL(5,2) DEFAULT 0,
    avg_completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- 活动相关
    video_views INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    quiz_avg_score DECIMAL(5,2) DEFAULT 0,
    
    -- 风险相关
    at_risk_students INTEGER DEFAULT 0,
    
    UNIQUE(teacher_id, course_id, stats_date)
);

-- 9. 课程反馈表
CREATE TABLE IF NOT EXISTS app_course_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    teacher_response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 索引优化
-- ==========================================

-- 教师课程查询
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON app_teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON app_teacher_courses(course_id);

-- 学生注册查询
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON app_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON app_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON app_course_enrollments(status);

-- 学习活动查询（按时间范围查询常用）
CREATE INDEX IF NOT EXISTS idx_learning_activities_student ON app_learning_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_course ON app_learning_activities(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_created ON app_learning_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON app_learning_activities(activity_type);

-- 通知查询
CREATE INDEX IF NOT EXISTS idx_teacher_announcements_teacher ON app_teacher_announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_announcements_course ON app_teacher_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_teacher_announcements_scheduled ON app_teacher_announcements(scheduled_at);

-- 风险预警查询
CREATE INDEX IF NOT EXISTS idx_risk_alerts_teacher ON app_student_risk_alerts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student ON app_student_risk_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unresolved ON app_student_risk_alerts(teacher_id, is_resolved);

-- 统计表查询
CREATE INDEX IF NOT EXISTS idx_teaching_stats_teacher ON app_teaching_stats_daily(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_stats_date ON app_teaching_stats_daily(stats_date);

-- ==========================================
-- RLS 权限策略
-- ==========================================

ALTER TABLE app_teacher_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_teacher_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_student_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_teaching_stats_daily ENABLE ROW LEVEL SECURITY;

-- 教师只能看到自己的课程关联
CREATE POLICY "Teachers see own courses" ON app_teacher_courses
    FOR ALL USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- 教师可以查看自己课程的学生注册
CREATE POLICY "Teachers see course enrollments" ON app_course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_teacher_courses 
            WHERE course_id = app_course_enrollments.course_id 
            AND teacher_id = current_setting('app.current_user_id', true)::text
        )
    );

-- 教师可以查看自己课程的学习活动
CREATE POLICY "Teachers see course activities" ON app_learning_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_teacher_courses 
            WHERE course_id = app_learning_activities.course_id 
            AND teacher_id = current_setting('app.current_user_id', true)::text
        )
    );

-- 教师只能管理自己的通知
CREATE POLICY "Teachers manage own announcements" ON app_teacher_announcements
    FOR ALL USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- 教师只能管理自己的笔记
CREATE POLICY "Teachers manage own notes" ON app_teacher_notes
    FOR ALL USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- 教师只能管理自己创建的风险预警
CREATE POLICY "Teachers manage own alerts" ON app_student_risk_alerts
    FOR ALL USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- 教师只能查看自己的统计数据
CREATE POLICY "Teachers see own stats" ON app_teaching_stats_daily
    FOR SELECT USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- ==========================================
-- 触发器和函数
-- ==========================================

-- 自动统计日汇总函数
CREATE OR REPLACE FUNCTION update_teaching_stats_daily()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_id TEXT;
    v_stats_date DATE := CURRENT_DATE;
BEGIN
    -- 获取课程的教师ID（主讲教师）
    SELECT teacher_id INTO v_teacher_id
    FROM app_teacher_courses
    WHERE course_id = NEW.course_id AND role = 'primary'
    LIMIT 1;
    
    IF v_teacher_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- 插入或更新统计记录
    INSERT INTO app_teaching_stats_daily (
        teacher_id, course_id, stats_date,
        total_students, active_students, total_study_hours
    )
    SELECT 
        v_teacher_id,
        NEW.course_id,
        v_stats_date,
        COUNT(*),
        COUNT(*) FILTER (WHERE last_accessed_at > NOW() - INTERVAL '7 days'),
        COALESCE(SUM(EXTRACT(EPOCH FROM (NEW.created_at - OLD.created_at))/3600), 0)
    FROM app_course_enrollments
    WHERE course_id = NEW.course_id
    ON CONFLICT (teacher_id, course_id, stats_date)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        active_students = EXCLUDED.active_students,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 学习活动触发器
DROP TRIGGER IF EXISTS trigger_update_teaching_stats ON app_learning_activities;
CREATE TRIGGER trigger_update_teaching_stats
    AFTER INSERT ON app_learning_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_teaching_stats_daily();

-- 自动创建风险预警函数（当学生7天无活动时）
CREATE OR REPLACE FUNCTION check_student_inactivity()
RETURNS void AS $$
BEGIN
    INSERT INTO app_student_risk_alerts (student_id, course_id, teacher_id, risk_type, risk_level, description)
    SELECT 
        e.student_id,
        e.course_id,
        tc.teacher_id,
        'inactivity',
        'medium',
        '学生超过7天未访问课程'
    FROM app_course_enrollments e
    JOIN app_teacher_courses tc ON e.course_id = tc.course_id AND tc.role = 'primary'
    WHERE e.status = 'active'
    AND (e.last_accessed_at IS NULL OR e.last_accessed_at < NOW() - INTERVAL '7 days')
    AND NOT EXISTS (
        SELECT 1 FROM app_student_risk_alerts 
        WHERE student_id = e.student_id 
        AND course_id = e.course_id 
        AND risk_type = 'inactivity'
        AND is_resolved = false
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE app_teacher_courses IS '教师与课程的关联关系';
COMMENT ON TABLE app_course_enrollments IS '学生课程注册详细信息';
COMMENT ON TABLE app_learning_activities IS '学生学习活动详细记录';
COMMENT ON TABLE app_teacher_announcements IS '教师发布的课程通知';
COMMENT ON TABLE app_teacher_notes IS '教师备课笔记';
COMMENT ON TABLE app_student_risk_alerts IS '学生风险预警记录';
COMMENT ON TABLE app_teaching_stats_daily IS '教学统计日汇总（性能优化表）';
COMMENT ON TABLE app_course_feedback IS '课程反馈评价';
