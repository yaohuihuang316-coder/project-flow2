-- ==========================================
-- 插入示例课堂和考勤数据
-- ==========================================

DO $$
DECLARE
    teacher_id_val UUID;
    course1_id UUID;
    course2_id UUID;
    session1_id UUID;
    session2_id UUID;
    student1_id UUID;
    student2_id UUID;
    student3_id UUID;
BEGIN
    -- 获取教师ID
    SELECT id INTO teacher_id_val FROM app_users WHERE role = 'Teacher' LIMIT 1;
    IF teacher_id_val IS NULL THEN
        SELECT id INTO teacher_id_val FROM app_users WHERE role = 'SuperAdmin' LIMIT 1;
    END IF;

    -- 获取课程ID
    SELECT id INTO course1_id FROM app_courses WHERE title = 'PMP认证完整指南' LIMIT 1;
    SELECT id INTO course2_id FROM app_courses WHERE title = '敏捷项目管理实战' LIMIT 1;

    -- 插入课堂数据
    INSERT INTO app_class_sessions (course_id, teacher_id, title, description, scheduled_start, scheduled_end, status, location, max_students, checkin_code, created_at)
    VALUES (course1_id, teacher_id_val, '项目整合管理精讲', '深入讲解项目整合管理的核心概念和实践方法', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', 'scheduled', '线上直播', 50, 'PM101', NOW())
    RETURNING id INTO session1_id;

    INSERT INTO app_class_sessions (course_id, teacher_id, title, 'Scrum框架实战演练', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'scheduled', '线上直播', 30, 'AG202', NOW())
    VALUES (course2_id, teacher_id_val, 'Scrum框架实战演练', '通过实际案例学习Scrum框架的应用', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'scheduled', '线上直播', 30, 'AG202', NOW())
    RETURNING id INTO session2_id;

    -- 获取学生ID
    SELECT id INTO student1_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 0;
    SELECT id INTO student2_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 1;
    SELECT id INTO student3_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 2;

    -- 插入考勤数据（如果学生存在）
    IF student1_id IS NOT NULL THEN
        INSERT INTO app_attendance (session_id, student_id, status, checkin_time, created_at)
        VALUES (session1_id, student1_id, 'present', NOW(), NOW());
    END IF;

    IF student2_id IS NOT NULL THEN
        INSERT INTO app_attendance (session_id, student_id, status, checkin_time, created_at)
        VALUES (session1_id, student2_id, 'late', NOW() + INTERVAL '10 minutes', NOW());
    END IF;

    IF student3_id IS NOT NULL THEN
        INSERT INTO app_attendance (session_id, student_id, status, checkin_time, created_at)
        VALUES (session1_id, student3_id, 'absent', NULL, NOW());
    END IF;

END $$;

-- 验证课堂数据
SELECT s.id, s.title, c.title as course_title, s.scheduled_start, s.status, s.checkin_code 
FROM app_class_sessions s 
JOIN app_courses c ON s.course_id = c.id 
ORDER BY s.created_at DESC;

-- 验证考勤数据
SELECT a.id, s.title as session_title, p.name as student_name, a.status, a.checkin_time
FROM app_attendance a
JOIN app_class_sessions s ON a.session_id = s.id
JOIN app_users p ON a.student_id = p.id
ORDER BY a.created_at DESC;
