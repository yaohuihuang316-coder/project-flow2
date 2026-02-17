-- ==========================================
-- 插入示例课程数据
-- ==========================================

-- 先获取一个教师ID（假设已有教师账号）
DO $$
DECLARE
    teacher_id_val UUID;
BEGIN
    -- 获取第一个教师ID
    SELECT id INTO teacher_id_val FROM app_users WHERE role = 'Teacher' LIMIT 1;
    
    -- 如果没有教师，使用第一个管理员
    IF teacher_id_val IS NULL THEN
        SELECT id INTO teacher_id_val FROM app_users WHERE role = 'SuperAdmin' LIMIT 1;
    END IF;

    -- 插入课程数据
    INSERT INTO app_courses (title, description, status, price, teacher_id, category, level, created_at) VALUES
    ('PMP认证完整指南', 
     '本课程涵盖PMP认证考试的所有知识领域，包括项目整合管理、范围管理、进度管理、成本管理、质量管理、资源管理、沟通管理、风险管理、采购管理和相关方管理。', 
     'published', 299, teacher_id_val, '认证考试', '高级', NOW()),
    
    ('敏捷项目管理实战', 
     '深入学习Scrum框架、Kanban方法、精益思想以及DevOps与敏捷的结合。通过真实企业案例，掌握敏捷转型的关键技巧。', 
     'published', 199, teacher_id_val, '敏捷开发', '中级', NOW()),
    
    ('项目管理基础入门', 
     '为零基础学员设计的项目管理入门课程，涵盖项目管理五大过程组和十大知识领域的基础概念。', 
     'published', 99, teacher_id_val, '基础知识', '初级', NOW()),
    
    ('项目风险管理高级技巧', 
     '深入学习项目风险识别、评估、应对和监控的高级方法，掌握定性和定量风险分析技术。', 
     'draft', 399, teacher_id_val, '风险管理', '高级', NOW()),
    
    ('项目管理办公室(PMO)建设', 
     '了解如何建立和运营项目管理办公室，学习PMO的组织架构、职能设计和最佳实践。', 
     'published', 349, teacher_id_val, '组织管理', '高级', NOW()),
    
    ('项目组合管理(PfM)实战', 
     '学习如何管理多个项目和项目组合，掌握项目选择、优先级排序和资源优化配置的方法。', 
     'published', 299, teacher_id_val, '组合管理', '高级', NOW());

END $$;

-- 验证插入
SELECT id, title, status, price, category FROM app_courses ORDER BY created_at DESC;
