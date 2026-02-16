-- ============================================
-- 课程表结构脚本 - 教师端"我的课程"功能
-- ============================================

-- 创建课程表
CREATE TABLE IF NOT EXISTS app_courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    cover_image TEXT,
    student_count INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    completed_hours INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_assignments INTEGER DEFAULT 0,
    pending_assignments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON app_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON app_courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON app_courses(created_at DESC);

-- 启用 Row Level Security
ALTER TABLE app_courses ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：教师可以查看自己的课程
CREATE POLICY "教师可以查看自己的课程" ON app_courses
    FOR SELECT
    USING (teacher_id = auth.uid()::text);

-- 创建 RLS 策略：教师可以创建自己的课程
CREATE POLICY "教师可以创建课程" ON app_courses
    FOR INSERT
    WITH CHECK (teacher_id = auth.uid()::text);

-- 创建 RLS 策略：教师可以更新自己的课程
CREATE POLICY "教师可以更新自己的课程" ON app_courses
    FOR UPDATE
    USING (teacher_id = auth.uid()::text);

-- 创建 RLS 策略：教师可以删除自己的课程
CREATE POLICY "教师可以删除自己的课程" ON app_courses
    FOR DELETE
    USING (teacher_id = auth.uid()::text);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON app_courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON app_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 课程与学生关联表（用于学生选课）
-- ============================================

CREATE TABLE IF NOT EXISTS app_course_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    UNIQUE(course_id, student_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON app_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON app_course_enrollments(student_id);

-- 启用 RLS
ALTER TABLE app_course_enrollments ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "教师可以查看自己课程的学生" ON app_course_enrollments
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM app_courses 
        WHERE app_courses.id = app_course_enrollments.course_id 
        AND app_courses.teacher_id = auth.uid()::text
    ));

-- ============================================
-- 插入示例数据（可选）
-- ============================================

-- 注意：运行以下示例数据前，请确保有对应的教师用户存在
-- INSERT INTO app_courses (id, title, description, category, teacher_id, status, cover_image, student_count, total_hours, progress, completion_rate, rating, created_at)
-- VALUES 
--     ('course-demo-1', '项目管理基础', '系统学习项目管理的核心理念与实践方法', 'Foundation', 'teacher-uuid-1', 'active', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400', 32, 24, 75, 82, 4.8, '2026-01-15'),
--     ('course-demo-2', '敏捷开发实践', '深入理解敏捷开发方法论', 'Advanced', 'teacher-uuid-1', 'active', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', 28, 20, 60, 68, 4.9, '2026-01-20');

-- ============================================
-- 常用查询示例
-- ============================================

-- 获取教师的课程列表
-- SELECT * FROM app_courses WHERE teacher_id = 'your-teacher-id' ORDER BY created_at DESC;

-- 获取教师课程统计
-- SELECT 
--     COUNT(*) as total_courses,
--     COUNT(*) FILTER (WHERE status = 'active') as active_courses,
--     COUNT(*) FILTER (WHERE status = 'completed') as completed_courses,
--     COUNT(*) FILTER (WHERE status = 'draft') as draft_courses,
--     SUM(student_count) as total_students
-- FROM app_courses 
-- WHERE teacher_id = 'your-teacher-id';

-- 按状态筛选课程
-- SELECT * FROM app_courses WHERE teacher_id = 'your-teacher-id' AND status = 'active';
