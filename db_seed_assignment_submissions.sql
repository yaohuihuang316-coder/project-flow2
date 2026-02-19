-- 插入作业提交数据，让作业管理页面看起来更真实
-- 运行此脚本前请确保已有教师和学生账号

-- ==========================================
-- 1. 首先检查现有作业
-- ==========================================

-- 查看现有作业
SELECT id, title, course_id, teacher_id, status, total_count, submitted_count 
FROM app_assignments 
LIMIT 5;

-- ==========================================
-- 2. 插入作业提交记录
-- ==========================================

-- 为每个作业插入一些学生提交记录
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
        WHEN RANDOM() < 0.3 THEN 'graded'
        ELSE 'submitted'
    END as status,
    CASE 
        WHEN RANDOM() < 0.3 THEN (70 + RANDOM() * 25)::int
        ELSE NULL
    END as score,
    CASE 
        WHEN RANDOM() < 0.3 THEN 
            CASE (RANDOM() * 3)::int
                WHEN 0 THEN '完成得很好，思路清晰，继续保持！'
                WHEN 1 THEN '内容完整，但可以在细节方面进一步完善。'
                ELSE '基本达到要求，建议多参考一些实际案例。'
            END
        ELSE NULL
    END as comment,
    CASE 
        WHEN RANDOM() < 0.3 THEN NOW() - INTERVAL '12 hours'
        ELSE NULL
    END as graded_at,
    CASE 
        WHEN RANDOM() < 0.3 THEN a.teacher_id
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

-- ==========================================
-- 3. 更新作业的提交数量和状态
-- ==========================================

-- 更新每个作业的提交数量
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

-- ==========================================
-- 4. 验证数据
-- ==========================================

-- 查看提交统计
SELECT 
    a.title,
    a.total_count,
    a.submitted_count,
    COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
    a.status
FROM app_assignments a
LEFT JOIN app_assignment_submissions s ON a.id = s.assignment_id
GROUP BY a.id, a.title, a.total_count, a.submitted_count, a.status
LIMIT 10;

-- 查看提交详情
SELECT 
    s.id,
    u.name as student_name,
    a.title as assignment_title,
    s.status,
    s.score,
    s.submitted_at
FROM app_assignment_submissions s
JOIN app_users u ON s.student_id = u.id
JOIN app_assignments a ON s.assignment_id = a.id
ORDER BY s.submitted_at DESC
LIMIT 10;
