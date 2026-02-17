-- ==========================================
-- 插入示例作业数据
-- ==========================================

DO $$
DECLARE
    teacher_id_val UUID;
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
BEGIN
    -- 获取教师ID
    SELECT id INTO teacher_id_val FROM app_users WHERE role = 'Teacher' LIMIT 1;
    IF teacher_id_val IS NULL THEN
        SELECT id INTO teacher_id_val FROM app_users WHERE role = 'SuperAdmin' LIMIT 1;
    END IF;

    -- 获取课程ID
    SELECT id INTO course1_id FROM app_courses WHERE title = 'PMP认证完整指南' LIMIT 1;
    SELECT id INTO course2_id FROM app_courses WHERE title = '敏捷项目管理实战' LIMIT 1;
    SELECT id INTO course3_id FROM app_courses WHERE title = '项目管理基础入门' LIMIT 1;

    -- 插入作业数据
    INSERT INTO app_assignments (title, description, course_id, teacher_id, deadline, total_score, created_at) VALUES
    ('项目章程编写练习', 
     '根据给定的项目背景资料，编写一份完整的项目章程文档。', 
     course1_id, teacher_id_val, NOW() + INTERVAL '7 days', 100, NOW()),
    
    ('WBS分解作业', 
     '选择一个你熟悉的项目，绘制其工作分解结构(WBS)，要求至少分解到第三层。', 
     course1_id, teacher_id_val, NOW() + INTERVAL '5 days', 100, NOW()),
    
    ('敏捷估算实践', 
     '使用故事点法对给定的用户故事进行估算，并解释你的估算思路。', 
     course2_id, teacher_id_val, NOW() + INTERVAL '3 days', 50, NOW()),
    
    ('Sprint规划模拟', 
     '根据提供的产品待办列表，制定一个为期两周的Sprint计划。', 
     course2_id, teacher_id_val, NOW() + INTERVAL '10 days', 80, NOW()),
    
    ('项目生命周期分析', 
     '比较预测型、迭代型和敏捷型项目生命周期的特点和适用场景。', 
     course3_id, teacher_id_val, NOW() + INTERVAL '14 days', 60, NOW()),
    
    ('干系人分析表', 
     '为你的项目识别关键干系人，并使用权力/利益矩阵进行分类。', 
     course3_id, teacher_id_val, NOW() + INTERVAL '7 days', 40, NOW());

END $$;

-- 验证插入
SELECT a.id, a.title, c.title as course_title, a.deadline, a.total_score 
FROM app_assignments a 
JOIN app_courses c ON a.course_id = c.id 
ORDER BY a.created_at DESC;
