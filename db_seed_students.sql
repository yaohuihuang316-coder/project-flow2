-- ==========================================
-- 插入示例学生数据
-- ==========================================

-- 检查是否已存在学生账号，如果没有则插入
DO $$
BEGIN
    -- 插入示例学生账号（使用随机UUID）
    INSERT INTO app_users (id, email, name, role, is_active, created_at, avatar)
    VALUES 
    (gen_random_uuid(), 'student1@test.com', '张同学', 'Student', true, NOW(), 'https://i.pravatar.cc/150?u=student1'),
    (gen_random_uuid(), 'student2@test.com', '李同学', 'Student', true, NOW(), 'https://i.pravatar.cc/150?u=student2'),
    (gen_random_uuid(), 'student3@test.com', '王同学', 'Student', true, NOW(), 'https://i.pravatar.cc/150?u=student3'),
    (gen_random_uuid(), 'student4@test.com', '赵同学', 'Student', true, NOW(), 'https://i.pravatar.cc/150?u=student4'),
    (gen_random_uuid(), 'student5@test.com', '刘同学', 'Student', true, NOW(), 'https://i.pravatar.cc/150?u=student5')
    ON CONFLICT (email) DO NOTHING;

END $$;

-- 插入课程报名数据
DO $$
DECLARE
    student_rec RECORD;
    course_rec RECORD;
BEGIN
    -- 为每个学生报名2-3门课程
    FOR student_rec IN SELECT id FROM app_users WHERE role = 'Student' LIMIT 5
    LOOP
        FOR course_rec IN SELECT id FROM app_courses ORDER BY random() LIMIT (floor(random() * 2) + 2)::int
        LOOP
            INSERT INTO app_course_enrollments (student_id, course_id, enrolled_at, status)
            VALUES (student_rec.id, course_rec.id, NOW(), 'active')
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 插入作业提交数据
DO $$
DECLARE
    student_rec RECORD;
    assignment_rec RECORD;
BEGIN
    -- 为每个学生提交部分作业
    FOR student_rec IN SELECT id FROM app_users WHERE role = 'Student' LIMIT 5
    LOOP
        FOR assignment_rec IN SELECT id, total_score FROM app_assignments ORDER BY random() LIMIT 3
        LOOP
            INSERT INTO app_assignment_submissions (assignment_id, student_id, content, score, feedback, submitted_at)
            VALUES (
                assignment_rec.id, 
                student_rec.id, 
                '学生提交的作业内容...', 
                floor(random() * assignment_rec.total_score)::int,
                '批改反馈：完成度较好，继续加油！',
                NOW() - (random() * INTERVAL '7 days')
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 验证学生数据
SELECT id, name, email, role, created_at 
FROM app_users 
WHERE role = 'Student' 
ORDER BY created_at DESC 
LIMIT 10;

-- 验证报名数据
SELECT p.name as student_name, c.title as course_title, e.enrolled_at
FROM app_course_enrollments e
JOIN app_users p ON e.student_id = p.id
JOIN app_courses c ON e.course_id = c.id
WHERE p.role = 'Student'
ORDER BY e.enrolled_at DESC
LIMIT 10;

-- 验证作业提交数据
SELECT p.name as student_name, a.title as assignment_title, s.score, s.submitted_at
FROM app_assignment_submissions s
JOIN app_users p ON s.student_id = p.id
JOIN app_assignments a ON s.assignment_id = a.id
WHERE p.role = 'Student'
ORDER BY s.submitted_at DESC
LIMIT 10;
