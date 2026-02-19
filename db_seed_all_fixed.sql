-- ==========================================
-- 全站数据初始化脚本 (UUID版本)
-- ==========================================

-- ==========================================
-- 第一部分：修复公告 RLS
-- ==========================================
ALTER TABLE IF EXISTS app_announcements DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON app_announcements;
CREATE POLICY "Allow all operations" ON app_announcements FOR ALL TO public USING (true) WITH CHECK (true);
ALTER TABLE IF EXISTS app_announcements ENABLE ROW LEVEL SECURITY;

TRUNCATE TABLE app_announcements RESTART IDENTITY;

INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
('🎉 欢迎使用 ProjectFlow 项目管理学习平台！', '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：\n• 学习专业的项目管理课程\n• 使用强大的项目管理工具\n• 参与社区讨论与经验分享\n• 体验实战模拟场景\n\n祝您学习愉快，技能精进！', 'success', 10, 'all', true, NOW(), NOW() + INTERVAL '30 days'),
('📢 系统功能更新：全新仪表盘上线', '我们很高兴地宣布，全新的个人仪表盘功能已正式上线！\n\n本次更新内容包括：\n• 个性化学习进度展示\n• 项目完成度可视化图表\n• 快捷操作入口优化\n• 学习数据深度分析', 'info', 8, 'all', true, NOW(), NOW() + INTERVAL '14 days'),
('🔔 重要通知：系统维护公告', '尊敬的用户：\n\n我们将于本周日凌晨 2:00-4:00 进行系统维护升级，期间部分功能可能无法使用。\n\n维护内容：\n• 数据库性能优化\n• 安全补丁更新\n• 新功能预发布', 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '3 days'),
('📚 PMP 认证新课程已上线，快来学习吧！', '备受期待的《PMP 认证完整指南》课程现已正式上线！\n\n课程亮点：\n• 35小时专业PDU学时\n• 覆盖全部考试知识领域\n• 配套练习题库1000+\n• 资深PMP讲师在线答疑', 'success', 9, 'students', true, NOW(), NOW() + INTERVAL '60 days'),
('🚀 敏捷项目管理实战课程更新通知', '《敏捷项目管理实战》课程已完成内容升级！\n\n更新内容：\n• 新增Scrum框架深度解析章节\n• 增加5个真实企业案例\n• 补充看板(Kanban)实战演练', 'info', 7, 'students', true, NOW(), NOW() + INTERVAL '21 days'),
('👨‍🏫 教师专属：课程创作工具升级', '各位讲师，课程创作工作台已进行全面升级！\n\n新功能包括：\n• 富文本编辑器增强\n• 视频章节自动分割\n• 作业批改批量处理', 'info', 6, 'teachers', true, NOW(), NOW() + INTERVAL '30 days'),
('🎬 【直播预告】项目管理大咖分享会', '直播主题：《从初级PM到项目总监的成长之路》\n\n直播时间：本周六晚 20:00-21:30\n\n分享嘉宾：李明 - 互联网大厂项目总监，15年项目管理经验', 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '5 days'),
('🏆 「30天项目管理挑战赛」开始报名！', '想要快速提升项目管理实战能力？加入我们的30天挑战赛！\n\n活动形式：\n• 每日学习任务打卡\n• 真实项目案例分析\n• 团队协作模拟练习\n• 导师点评与指导', 'success', 8, 'students', true, NOW(), NOW() + INTERVAL '20 days'),
('💎 Pro会员专享：高级课程包已解锁', '尊敬的 Pro 会员：\n\n您现在可以学习以下高级课程：\n• 项目管理办公室(PMO)建设\n• 项目组合管理(PfM)实战\n• 敏捷规模化(SAFe)框架', 'success', 7, 'pro', true, NOW(), NOW() + INTERVAL '30 days');

-- ==========================================
-- 第二部分：插入示例教师到 app_users
-- ==========================================
-- 注意：id 使用 gen_random_uuid() 生成
INSERT INTO app_users (id, email, name, role, status, is_active, created_at, avatar)
VALUES 
(gen_random_uuid(), 'teacher1@test.com', '张老师', 'Teacher', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=teacher1'),
(gen_random_uuid(), 'teacher2@test.com', '李老师', 'Teacher', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=teacher2')
ON CONFLICT (email) DO UPDATE SET role = 'Teacher';

-- ==========================================
-- 第三部分：插入课程数据
-- ==========================================
DO $$
DECLARE
    teacher_id_val UUID;
BEGIN
    -- 获取第一个教师ID
    SELECT id INTO teacher_id_val FROM app_users WHERE role = 'Teacher' LIMIT 1;
    
    -- 如果没有教师，使用第一个 Manager 或 SuperAdmin
    IF teacher_id_val IS NULL THEN
        SELECT id INTO teacher_id_val FROM app_users WHERE role IN ('Manager', 'SuperAdmin') LIMIT 1;
    END IF;

    -- 如果没有找到任何用户，创建一个新的 UUID
    IF teacher_id_val IS NULL THEN
        teacher_id_val := gen_random_uuid();
        INSERT INTO app_users (id, email, name, role, status, is_active, created_at)
        VALUES (teacher_id_val, 'demo_teacher@test.com', '演示教师', 'Teacher', '正常', true, NOW());
    END IF;

    INSERT INTO app_courses (title, description, status, price, teacher_id, category, level, created_at) VALUES
    ('PMP认证完整指南', '本课程涵盖PMP认证考试的所有知识领域，包括项目整合管理、范围管理、进度管理、成本管理、质量管理、资源管理、沟通管理、风险管理、采购管理和相关方管理。', 'published', 299, teacher_id_val, '认证考试', '高级', NOW()),
    ('敏捷项目管理实战', '深入学习Scrum框架、Kanban方法、精益思想以及DevOps与敏捷的结合。通过真实企业案例，掌握敏捷转型的关键技巧。', 'published', 199, teacher_id_val, '敏捷开发', '中级', NOW()),
    ('项目管理基础入门', '为零基础学员设计的项目管理入门课程，涵盖项目管理五大过程组和十大知识领域的基础概念。', 'published', 99, teacher_id_val, '基础知识', '初级', NOW()),
    ('项目风险管理高级技巧', '深入学习项目风险识别、评估、应对和监控的高级方法，掌握定性和定量风险分析技术。', 'draft', 399, teacher_id_val, '风险管理', '高级', NOW()),
    ('项目管理办公室(PMO)建设', '了解如何建立和运营项目管理办公室，学习PMO的组织架构、职能设计和最佳实践。', 'published', 349, teacher_id_val, '组织管理', '高级', NOW()),
    ('项目组合管理(PfM)实战', '学习如何管理多个项目和项目组合，掌握项目选择、优先级排序和资源优化配置的方法。', 'published', 299, teacher_id_val, '组合管理', '高级', NOW());
END $$;

-- ==========================================
-- 第四部分：插入作业数据
-- ==========================================
DO $$
DECLARE
    teacher_id_val UUID;
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
BEGIN
    SELECT id INTO teacher_id_val FROM app_users WHERE role IN ('Teacher', 'Manager', 'SuperAdmin') LIMIT 1;

    SELECT id INTO course1_id FROM app_courses WHERE title = 'PMP认证完整指南' LIMIT 1;
    SELECT id INTO course2_id FROM app_courses WHERE title = '敏捷项目管理实战' LIMIT 1;
    SELECT id INTO course3_id FROM app_courses WHERE title = '项目管理基础入门' LIMIT 1;

    INSERT INTO app_assignments (title, description, course_id, teacher_id, deadline, total_score, created_at) VALUES
    ('项目章程编写练习', '根据给定的项目背景资料，编写一份完整的项目章程文档。', course1_id, teacher_id_val, NOW() + INTERVAL '7 days', 100, NOW()),
    ('WBS分解作业', '选择一个你熟悉的项目，绘制其工作分解结构(WBS)，要求至少分解到第三层。', course1_id, teacher_id_val, NOW() + INTERVAL '5 days', 100, NOW()),
    ('敏捷估算实践', '使用故事点法对给定的用户故事进行估算，并解释你的估算思路。', course2_id, teacher_id_val, NOW() + INTERVAL '3 days', 50, NOW()),
    ('Sprint规划模拟', '根据提供的产品待办列表，制定一个为期两周的Sprint计划。', course2_id, teacher_id_val, NOW() + INTERVAL '10 days', 80, NOW()),
    ('项目生命周期分析', '比较预测型、迭代型和敏捷型项目生命周期的特点和适用场景。', course3_id, teacher_id_val, NOW() + INTERVAL '14 days', 60, NOW()),
    ('干系人分析表', '为你的项目识别关键干系人，并使用权力/利益矩阵进行分类。', course3_id, teacher_id_val, NOW() + INTERVAL '7 days', 40, NOW());
END $$;

-- ==========================================
-- 第五部分：插入学生数据
-- ==========================================
INSERT INTO app_users (id, email, name, role, status, is_active, created_at, avatar)
VALUES 
(gen_random_uuid(), 'student1@test.com', '张同学', 'Student', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=student1'),
(gen_random_uuid(), 'student2@test.com', '李同学', 'Student', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=student2'),
(gen_random_uuid(), 'student3@test.com', '王同学', 'Student', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=student3'),
(gen_random_uuid(), 'student4@test.com', '赵同学', 'Student', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=student4'),
(gen_random_uuid(), 'student5@test.com', '刘同学', 'Student', '正常', true, NOW(), 'https://i.pravatar.cc/150?u=student5')
ON CONFLICT (email) DO NOTHING;

-- 课程报名
DO $$
DECLARE
    student_rec RECORD;
    course_rec RECORD;
BEGIN
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

-- 作业提交
DO $$
DECLARE
    student_rec RECORD;
    assignment_rec RECORD;
BEGIN
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

-- ==========================================
-- 第六部分：插入课堂和考勤数据
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
    SELECT id INTO teacher_id_val FROM app_users WHERE role IN ('Teacher', 'Manager', 'SuperAdmin') LIMIT 1;

    SELECT id INTO course1_id FROM app_courses WHERE title = 'PMP认证完整指南' LIMIT 1;
    SELECT id INTO course2_id FROM app_courses WHERE title = '敏捷项目管理实战' LIMIT 1;

    INSERT INTO app_class_sessions (course_id, teacher_id, title, description, scheduled_start, scheduled_end, status, location, max_students, checkin_code, created_at)
    VALUES (course1_id, teacher_id_val, '项目整合管理精讲', '深入讲解项目整合管理的核心概念和实践方法', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', 'scheduled', '线上直播', 50, 'PM101', NOW())
    RETURNING id INTO session1_id;

    INSERT INTO app_class_sessions (course_id, teacher_id, title, description, scheduled_start, scheduled_end, status, location, max_students, checkin_code, created_at)
    VALUES (course2_id, teacher_id_val, 'Scrum框架实战演练', '通过实际案例学习Scrum框架的应用', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours', 'scheduled', '线上直播', 30, 'AG202', NOW())
    RETURNING id INTO session2_id;

    SELECT id INTO student1_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 0;
    SELECT id INTO student2_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 1;
    SELECT id INTO student3_id FROM app_users WHERE role = 'Student' LIMIT 1 OFFSET 2;

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

-- ==========================================
-- 验证数据
-- ==========================================
SELECT '公告' as type, COUNT(*) as count FROM app_announcements
UNION ALL SELECT '课程', COUNT(*) FROM app_courses
UNION ALL SELECT '作业', COUNT(*) FROM app_assignments
UNION ALL SELECT '学生', COUNT(*) FROM app_users WHERE role = 'Student'
UNION ALL SELECT '教师', COUNT(*) FROM app_users WHERE role = 'Teacher'
UNION ALL SELECT '课堂', COUNT(*) FROM app_class_sessions
UNION ALL SELECT '考勤', COUNT(*) FROM app_attendance;
