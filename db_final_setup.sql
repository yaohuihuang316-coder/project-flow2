-- ==========================================
-- ProjectFlow 最终数据设置
-- 确保所有后台管理数据真实可管理
-- ==========================================

-- 1. 确保测试账号存在且有正确角色
-- ==========================================
INSERT INTO app_users (id, email, name, role, subscription_tier, streak, xp, completed_courses_count, status, created_at)
VALUES 
    ('test-admin-001', 'admin@test.com', '管理员', 'SuperAdmin', 'pro_plus', 0, 0, 0, '正常', NOW()),
    ('test-free-001', 'free@test.com', 'Free用户', 'Student', 'free', 3, 350, 1, '正常', NOW() - INTERVAL '10 days'),
    ('test-pro-001', 'pro@test.com', 'Pro用户', 'Student', 'pro', 15, 1200, 5, '正常', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'pp@test.com', 'ProPlus用户', 'Student', 'pro_plus', 30, 2800, 10, '正常', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    subscription_tier = EXCLUDED.subscription_tier,
    name = EXCLUDED.name,
    completed_courses_count = EXCLUDED.completed_courses_count;

-- 2. Free用户学习进度 (1门完成课程)
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-free-001', 'c-f1', 35, 'Started', '["ch-1-1"]', '项目管理基础学习笔记第一章', NOW() - INTERVAL '1 day'),
    ('test-free-001', 'c-f2', 60, 'Started', '["ch-2-1","ch-2-2"]', '进度管理学习心得', NOW() - INTERVAL '2 hours'),
    ('test-free-001', 'c-f3', 100, 'Completed', '["ch-3-1","ch-3-2","ch-3-3"]', '已完成范围管理课程', NOW() - INTERVAL '3 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters;

-- 3. Pro用户学习进度 (5门完成课程)
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-pro-001', 'c-f1', 100, 'Completed', '["ch-1-1","ch-1-2","ch-1-3"]', '项目管理基础扎实', NOW() - INTERVAL '15 days'),
    ('test-pro-001', 'c-f2', 100, 'Completed', '["ch-2-1","ch-2-2","ch-2-3"]', '敏捷开发掌握良好', NOW() - INTERVAL '12 days'),
    ('test-pro-001', 'c-f3', 100, 'Completed', '["ch-3-1","ch-3-2","ch-3-3"]', 'WBS分解技巧熟练', NOW() - INTERVAL '10 days'),
    ('test-pro-001', 'c-f4', 100, 'Completed', '["ch-4-1","ch-4-2","ch-4-3"]', '进度管理已完成', NOW() - INTERVAL '8 days'),
    ('test-pro-001', 'c-f5', 100, 'Completed', '["ch-5-1","ch-5-2","ch-5-3"]', '风险管理课程完成', NOW() - INTERVAL '5 days'),
    ('test-pro-001', 'c-f6', 75, 'Started', '["ch-6-1","ch-6-2"]', '团队协作学习中', NOW() - INTERVAL '1 day'),
    ('test-pro-001', 'c-a1', 45, 'Started', '["ch-a1-1"]', 'PMP备考中', NOW() - INTERVAL '12 hours')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters;

-- 4. Pro+用户学习进度 (10门完成课程)
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-pp-001', 'c-f1', 100, 'Completed', '["ch-1-1","ch-1-2","ch-1-3"]', '项目管理基础扎实', NOW() - INTERVAL '28 days'),
    ('test-pp-001', 'c-f2', 100, 'Completed', '["ch-2-1","ch-2-2","ch-2-3"]', '敏捷开发掌握良好', NOW() - INTERVAL '26 days'),
    ('test-pp-001', 'c-f3', 100, 'Completed', '["ch-3-1","ch-3-2","ch-3-3"]', 'WBS分解技巧熟练', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'c-f4', 100, 'Completed', '["ch-4-1","ch-4-2","ch-4-3"]', '进度管理已完成', NOW() - INTERVAL '22 days'),
    ('test-pp-001', 'c-f5', 100, 'Completed', '["ch-5-1","ch-5-2","ch-5-3"]', '风险管理课程完成', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'c-f6', 100, 'Completed', '["ch-6-1","ch-6-2","ch-6-3"]', '团队协作与沟通完成', NOW() - INTERVAL '18 days'),
    ('test-pp-001', 'c-a1', 100, 'Completed', '["ch-a1-1","ch-a1-2","ch-a1-3"]', 'PMP认证课程完成', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'c-a2', 100, 'Completed', '["ch-a2-1","ch-a2-2","ch-a2-3"]', '挣值管理掌握', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'c-a3', 100, 'Completed', '["ch-a3-1","ch-a3-2","ch-a3-3"]', '关键路径法精通', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'c-a4', 100, 'Completed', '["ch-a4-1","ch-a4-2","ch-a4-3"]', '敏捷教练课程完成', NOW() - INTERVAL '8 days'),
    ('test-pp-001', 'c-a5', 70, 'Started', '["ch-a5-1","ch-a5-2"]', '商业分析学习中', NOW() - INTERVAL '2 days'),
    ('test-pp-001', 'c-i1', 55, 'Started', '["ch-i1-1","ch-i1-2"]', '实战案例学习中', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters;

-- 5. Free用户活动日志 (少量，3天连续)
-- ==========================================
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    ('test-free-001', 'login', 1, '{"ip": "192.168.1.101"}', NOW() - INTERVAL '3 days'),
    ('test-free-001', 'start_course', 5, '{"course_id": "c-f1"}', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
    ('test-free-001', 'complete_chapter', 10, '{"course_id": "c-f3", "chapter": "ch-3-1"}', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'),
    ('test-free-001', 'login', 1, '{"ip": "192.168.1.101"}', NOW() - INTERVAL '2 days'),
    ('test-free-001', 'complete_chapter', 10, '{"course_id": "c-f3", "chapter": "ch-3-2"}', NOW() - INTERVAL '2 days' + INTERVAL '25 minutes'),
    ('test-free-001', 'login', 1, '{"ip": "192.168.1.101"}', NOW() - INTERVAL '1 day'),
    ('test-free-001', 'complete_course', 50, '{"course_id": "c-f3"}', NOW() - INTERVAL '1 day' + INTERVAL '40 minutes'),
    ('test-free-001', 'login', 1, '{"ip": "192.168.1.101"}', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- 6. Pro用户活动日志 (较多，15天连续)
-- ==========================================
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    -- 第15天到第8天
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '15 days'),
    ('test-pro-001', 'complete_chapter', 10, '{"course_id": "c-f1", "chapter": "ch-1-1"}', NOW() - INTERVAL '15 days' + INTERVAL '20 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '14 days'),
    ('test-pro-001', 'complete_chapter', 10, '{"course_id": "c-f1", "chapter": "ch-1-2"}', NOW() - INTERVAL '14 days' + INTERVAL '25 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '13 days'),
    ('test-pro-001', 'complete_course', 50, '{"course_id": "c-f1"}', NOW() - INTERVAL '13 days' + INTERVAL '30 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '12 days'),
    ('test-pro-001', 'complete_course', 50, '{"course_id": "c-f2"}', NOW() - INTERVAL '12 days' + INTERVAL '40 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '11 days'),
    ('test-pro-001', 'complete_course', 50, '{"course_id": "c-f3"}', NOW() - INTERVAL '11 days' + INTERVAL '35 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '10 days'),
    ('test-pro-001', 'complete_course', 50, '{"course_id": "c-f4"}', NOW() - INTERVAL '10 days' + INTERVAL '45 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '9 days'),
    ('test-pro-001', 'complete_course', 50, '{"course_id": "c-f5"}', NOW() - INTERVAL '9 days' + INTERVAL '30 minutes'),
    -- 第8天到第1天
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '8 days'),
    ('test-pro-001', 'start_course', 5, '{"course_id": "c-f6"}', NOW() - INTERVAL '8 days' + INTERVAL '10 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '7 days'),
    ('test-pro-001', 'complete_chapter', 10, '{"course_id": "c-f6", "chapter": "ch-6-1"}', NOW() - INTERVAL '7 days' + INTERVAL '20 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '6 days'),
    ('test-pro-001', 'complete_chapter', 10, '{"course_id": "c-f6", "chapter": "ch-6-2"}', NOW() - INTERVAL '6 days' + INTERVAL '25 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '5 days'),
    ('test-pro-001', 'post_comment', 3, '{"post_id": 1}', NOW() - INTERVAL '5 days' + INTERVAL '15 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '4 days'),
    ('test-pro-001', 'like_post', 2, '{"post_id": 2}', NOW() - INTERVAL '4 days' + INTERVAL '5 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '3 days'),
    ('test-pro-001', 'complete_chapter', 10, '{"course_id": "c-a1", "chapter": "ch-a1-1"}', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '2 days'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '1 day'),
    ('test-pro-001', 'start_course', 5, '{"course_id": "c-a1"}', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
    ('test-pro-001', 'login', 1, '{"ip": "192.168.1.102"}', NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- 7. Pro+用户活动日志 (大量，30天连续)
-- ==========================================
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    -- 第30天到第20天 (基础课程)
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '30 days'),
    ('test-pp-001', 'complete_chapter', 10, '{"course_id": "c-f1", "chapter": "ch-1-1"}', NOW() - INTERVAL '30 days' + INTERVAL '15 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '29 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f1"}', NOW() - INTERVAL '29 days' + INTERVAL '45 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '28 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f2"}', NOW() - INTERVAL '28 days' + INTERVAL '40 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '27 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f3"}', NOW() - INTERVAL '27 days' + INTERVAL '50 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '26 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f4"}', NOW() - INTERVAL '26 days' + INTERVAL '35 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '25 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f5"}', NOW() - INTERVAL '25 days' + INTERVAL '40 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-f6"}', NOW() - INTERVAL '24 days' + INTERVAL '45 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '23 days'),
    ('test-pp-001', 'post_comment', 3, '{"post_id": 1}', NOW() - INTERVAL '23 days' + INTERVAL '10 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '22 days'),
    ('test-pp-001', 'like_post', 2, '{"post_id": 2}', NOW() - INTERVAL '22 days' + INTERVAL '5 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '21 days'),
    ('test-pp-001', 'create_post', 10, '{"post_id": 3}', NOW() - INTERVAL '21 days' + INTERVAL '20 minutes'),
    -- 第20天到第10天 (进阶课程)
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-a1"}', NOW() - INTERVAL '20 days' + INTERVAL '60 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '19 days'),
    ('test-pp-001', 'complete_chapter', 10, '{"course_id": "c-a2", "chapter": "ch-a2-1"}', NOW() - INTERVAL '19 days' + INTERVAL '20 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '18 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-a2"}', NOW() - INTERVAL '18 days' + INTERVAL '40 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '17 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-a3"}', NOW() - INTERVAL '17 days' + INTERVAL '45 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '16 days'),
    ('test-pp-001', 'complete_course', 50, '{"course_id": "c-a4"}', NOW() - INTERVAL '16 days' + INTERVAL '50 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'use_ai', 5, '{"model": "gpt-4", "query_type": "explain"}', NOW() - INTERVAL '15 days' + INTERVAL '10 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '14 days'),
    ('test-pp-001', 'complete_task', 5, '{"task_id": "task-1"}', NOW() - INTERVAL '14 days' + INTERVAL '15 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '13 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '11 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '9 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '8 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '7 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '6 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '5 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '4 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '3 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '2 days'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'start_course', 5, '{"course_id": "c-a5"}', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
    ('test-pp-001', 'login', 1, '{"ip": "192.168.1.103"}', NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- 8. Pro用户徽章 (3个徽章)
-- ==========================================
INSERT INTO app_user_badges (user_id, badge_id, badge_name, badge_icon, badge_color, badge_bg, condition, unlocked_at)
VALUES 
    ('test-pro-001', 'first_course', '初学者', 'BookOpen', '#3b82f6', '#dbeafe', '完成第一门课程', NOW() - INTERVAL '13 days'),
    ('test-pro-001', 'five_courses', '进阶学者', 'Award', '#8b5cf6', '#ede9fe', '完成5门课程', NOW() - INTERVAL '9 days'),
    ('test-pro-001', 'streak_7', '坚持者', 'Flame', '#f59e0b', '#fef3c7', '连续学习7天', NOW() - INTERVAL '8 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 9. Pro+用户徽章 (6个徽章)
-- ==========================================
INSERT INTO app_user_badges (user_id, badge_id, badge_name, badge_icon, badge_color, badge_bg, condition, unlocked_at)
VALUES 
    ('test-pp-001', 'first_course', '初学者', 'BookOpen', '#3b82f6', '#dbeafe', '完成第一门课程', NOW() - INTERVAL '29 days'),
    ('test-pp-001', 'five_courses', '进阶学者', 'Award', '#8b5cf6', '#ede9fe', '完成5门课程', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'ten_courses', '大师', 'Trophy', '#ef4444', '#fee2e2', '完成10门课程', NOW() - INTERVAL '16 days'),
    ('test-pp-001', 'streak_7', '坚持者', 'Flame', '#f59e0b', '#fef3c7', '连续学习7天', NOW() - INTERVAL '23 days'),
    ('test-pp-001', 'streak_30', '学习达人', 'Star', '#10b981', '#d1fae5', '连续学习30天', NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'community_active', '社区达人', 'MessageCircle', '#06b6d4', '#cffafe', '发表3篇帖子', NOW() - INTERVAL '21 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 10. Pro+用户技能雷达图数据
-- ==========================================
INSERT INTO app_user_skills (user_id, skill_name, skill_en, score, max_score, updated_at)
VALUES 
    ('test-pp-001', '规划', 'Plan', 145, 150, NOW() - INTERVAL '2 days'),
    ('test-pp-001', '执行', 'Exec', 125, 150, NOW() - INTERVAL '2 days'),
    ('test-pp-001', '预算', 'Budget', 130, 150, NOW() - INTERVAL '2 days'),
    ('test-pp-001', '风险', 'Risk', 120, 150, NOW() - INTERVAL '2 days'),
    ('test-pp-001', '沟通', 'Comm', 135, 150, NOW() - INTERVAL '2 days'),
    ('test-pp-001', '领导', 'Lead', 115, 150, NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, skill_name) DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = EXCLUDED.updated_at;

-- 11. Pro+用户模拟尝试记录（需要先通过后台创建模拟场景）
-- ==========================================
-- 注：模拟场景数据需要通过 AdminSimulation 后台管理界面创建
-- 以下进度记录需要配合真实场景ID使用，暂时注释

-- -- Pro+用户模拟进度（示例，需要替换为真实场景UUID）
-- INSERT INTO app_simulation_progress (user_id, scenario_id, current_stage, decisions_made, resources_state, score, max_score, status, started_at, completed_at)
-- VALUES 
--     ('test-pp-001', '00000000-0000-0000-0000-000000000001', 5, '[{"stage": 1, "decision": "A"}]'::jsonb, '{"budget": 80}'::jsonb, 95, 100, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '30 minutes')
-- ON CONFLICT (user_id, scenario_id) DO UPDATE SET
--     score = EXCLUDED.score,
--     status = EXCLUDED.status,
--     completed_at = EXCLUDED.completed_at;

-- 12. Pro+用户AI使用记录
-- ==========================================
INSERT INTO app_ai_usage (user_id, model, prompt_tokens, completion_tokens, query, created_at)
VALUES 
    ('test-pp-001', 'gpt-4', 150, 280, '解释一下关键路径法的原理', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'gpt-4', 120, 220, '如何制定有效的风险管理计划？', NOW() - INTERVAL '14 days'),
    ('test-pp-001', 'gpt-4', 200, 350, '敏捷开发中如何处理需求变更？', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'gpt-4', 180, 300, 'WBS分解的最佳实践有哪些？', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'gpt-4', 160, 250, '项目进度延误时如何应对？', NOW() - INTERVAL '8 days'),
    ('test-pp-001', 'gpt-4', 140, 240, '挣值管理中的SPI和CPI指标如何解读？', NOW() - INTERVAL '5 days'),
    ('test-pp-001', 'gpt-4', 190, 320, 'Scrum Master的主要职责是什么？', NOW() - INTERVAL '3 days'),
    ('test-pp-001', 'gpt-4', 170, 280, '项目收尾阶段需要完成哪些工作？', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 13. 插入一些社区帖子（用于后台管理）
-- ==========================================
INSERT INTO app_community_posts (user_id, user_name, content, tags, likes, comments, created_at)
VALUES 
    ('test-free-001', 'Free用户', '刚完成了范围管理课程，WBS分解真的很重要！有同学一起交流吗？', '["学习心得"]', 5, 2, NOW() - INTERVAL '2 days'),
    ('test-pro-001', 'Pro用户', '用CPM工具做了一个项目分析，关键路径法帮大忙了！', '["工具使用"]', 12, 5, NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'ProPlus用户', '刚完成了项目危机处理模拟，95分！推荐大家体验实战模拟。', '["模拟"]', 28, 10, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- 14. 确保有公告数据
-- ==========================================
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at)
VALUES 
    ('系统维护通知', '今晚22:00-24:00进行系统维护，期间部分功能可能不可用。', 'info', 80, 'all', true, NOW()),
    ('新功能上线', '实战模拟中心正式上线，Pro+用户可体验沉浸式项目管理训练。', 'success', 90, 'pro_plus', true, NOW() - INTERVAL '1 day'),
    ('课程更新', '新增3门实战课程，涵盖敏捷管理和风险控制。', 'info', 70, 'all', true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- 15. 检查并显示结果
-- ==========================================
SELECT '数据设置完成' as status;
SELECT 
    '用户统计' as metric,
    (SELECT COUNT(*) FROM app_users) as total_users,
    (SELECT COUNT(*) FROM app_users WHERE subscription_tier = 'free') as free_users,
    (SELECT COUNT(*) FROM app_users WHERE subscription_tier = 'pro') as pro_users,
    (SELECT COUNT(*) FROM app_users WHERE subscription_tier = 'pro_plus') as pro_plus_users;

SELECT 
    '学习进度统计' as metric,
    (SELECT COUNT(*) FROM app_user_progress) as total_progress_records,
    (SELECT COUNT(*) FROM app_user_progress WHERE progress = 100) as completed,
    (SELECT COUNT(*) FROM app_user_progress WHERE progress > 0 AND progress < 100) as in_progress;

SELECT 
    '活动日志统计' as metric,
    (SELECT COUNT(*) FROM app_activity_logs WHERE user_id = 'test-free-001') as free_logs,
    (SELECT COUNT(*) FROM app_activity_logs WHERE user_id = 'test-pro-001') as pro_logs,
    (SELECT COUNT(*) FROM app_activity_logs WHERE user_id = 'test-pp-001') as pp_logs;

SELECT 
    '徽章统计' as metric,
    (SELECT COUNT(*) FROM app_user_badges WHERE user_id = 'test-pro-001') as pro_badges,
    (SELECT COUNT(*) FROM app_user_badges WHERE user_id = 'test-pp-001') as pp_badges;

SELECT 
    '技能与模拟统计' as metric,
    (SELECT COUNT(*) FROM app_user_skills WHERE user_id = 'test-pp-001') as pp_skills,
    (SELECT COUNT(*) FROM app_simulation_progress WHERE user_id = 'test-pp-001') as pp_simulations,
    (SELECT COUNT(*) FROM app_ai_usage WHERE user_id = 'test-pp-001') as pp_ai_usage;

SELECT 
    '社区统计' as metric,
    (SELECT COUNT(*) FROM app_community_posts) as total_posts,
    (SELECT COUNT(*) FROM app_comments) as total_comments;

SELECT 
    '系统统计' as metric,
    (SELECT COUNT(*) FROM app_courses) as total_courses,
    (SELECT COUNT(*) FROM app_announcements) as total_announcements;
