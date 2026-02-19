-- ==========================================
-- 创建作业提交表
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- ==========================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建作业提交表
CREATE TABLE IF NOT EXISTS app_assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES app_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    content TEXT,
    attachments TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    comment TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON app_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON app_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON app_assignment_submissions(status);

-- 启用 RLS
ALTER TABLE app_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- 允许认证用户读取
DROP POLICY IF EXISTS "Allow authenticated read" ON app_assignment_submissions;
CREATE POLICY "Allow authenticated read" ON app_assignment_submissions
    FOR SELECT TO authenticated USING (true);

-- 允许学生提交自己的作业
DROP POLICY IF EXISTS "Allow students to submit" ON app_assignment_submissions;
CREATE POLICY "Allow students to submit" ON app_assignment_submissions
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = student_id);

-- 允许教师批改
DROP POLICY IF EXISTS "Allow teachers to grade" ON app_assignment_submissions;
CREATE POLICY "Allow teachers to grade" ON app_assignment_submissions
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM app_assignments a 
            WHERE a.id = assignment_id 
            AND a.teacher_id = auth.uid()
        )
    );

-- ==========================================
-- 插入示例作业提交数据
-- ==========================================

-- 先检查现有数据
SELECT '现有作业数量:' as info, COUNT(*) as count FROM app_assignments;
SELECT '现有学生数量:' as info, COUNT(*) as count FROM app_users WHERE role = 'Student';

-- 插入提交数据（避免重复）
INSERT INTO app_assignment_submissions (
    assignment_id,
    student_id,
    content,
    attachments,
    submitted_at,
    status,
    score,
    comment,
    graded_at,
    graded_by
)
SELECT 
    a.id as assignment_id,
    s.id as student_id,
    CASE (ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY s.id) % 5)
        WHEN 0 THEN '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。附件中包含详细的文档。'
        WHEN 1 THEN '本次作业我深入研究了敏捷开发方法，并尝试将其应用到实际项目中。遇到了一些挑战，但通过团队协作解决了。'
        WHEN 2 THEN '作业已完成。我使用了甘特图来规划项目进度，并识别了关键路径。风险管理部分还需要进一步完善。'
        WHEN 3 THEN '通过这次作业，我对项目管理有了更深的理解。特别是在成本控制方面，学会了如何制定预算和监控支出。'
        ELSE '提交的作业包含完整的项目文档，包括需求分析、设计方案和实施计划。请老师批阅。'
    END as content,
    ARRAY['https://example.com/attachment1.pdf', 'https://example.com/attachment2.docx'] as attachments,
    NOW() - INTERVAL '1 day' * (RANDOM() * 5)::int as submitted_at,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'graded'
        ELSE 'submitted'
    END as status,
    CASE 
        WHEN RANDOM() < 0.4 THEN (70 + (RANDOM() * 25)::int)
        ELSE NULL
    END as score,
    CASE 
        WHEN RANDOM() < 0.4 THEN 
            CASE (RANDOM() * 3)::int
                WHEN 0 THEN '完成得很好，思路清晰，继续保持！'
                WHEN 1 THEN '内容完整，但可以在细节方面进一步完善。'
                ELSE '基本达到要求，建议多参考一些实际案例。'
            END
        ELSE NULL
    END as comment,
    CASE 
        WHEN RANDOM() < 0.4 THEN NOW() - INTERVAL '12 hours'
        ELSE NULL
    END as graded_at,
    CASE 
        WHEN RANDOM() < 0.4 THEN a.teacher_id
        ELSE NULL
    END as graded_by
FROM app_assignments a
CROSS JOIN (
    SELECT id 
    FROM app_users 
    WHERE role = 'Student' 
    LIMIT 10
) s
WHERE a.status IN ('pending', 'grading')
ON CONFLICT (assignment_id, student_id) DO NOTHING;

-- 更新作业统计
UPDATE app_assignments a
SET 
    submitted_count = (
        SELECT COUNT(*) 
        FROM app_assignment_submissions s 
        WHERE s.assignment_id = a.id
    ),
    status = CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM app_assignment_submissions s 
            WHERE s.assignment_id = a.id AND s.status = 'submitted'
        ) > 0 THEN 'grading'
        ELSE a.status
    END
WHERE a.status IN ('pending', 'grading');

-- 验证结果
SELECT 
    '插入后统计' as info,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_count
FROM app_assignment_submissions;

-- 查看作业统计
SELECT 
    a.title,
    a.total_count,
    a.submitted_count,
    COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
    a.status
FROM app_assignments a
LEFT JOIN app_assignment_submissions s ON a.id = s.assignment_id
GROUP BY a.id, a.title, a.total_count, a.submitted_count, a.status
ORDER BY a.created_at DESC
LIMIT 10;
