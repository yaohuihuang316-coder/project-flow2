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
    ('test-pro-001', 'pro@test.com', 'Pro用户', 'Student', 'pro', 15, 1200, 3, '正常', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'pp@test.com', 'ProPlus用户', 'Student', 'pro_plus', 30, 2800, 8, '正常', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    subscription_tier = EXCLUDED.subscription_tier,
    name = EXCLUDED.name;

-- 2. Free用户学习进度
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-free-001', 'c-f1', 35, 'Started', '["ch1"]', '项目管理基础学习笔记第一章', NOW() - INTERVAL '1 day'),
    ('test-free-001', 'c-f2', 60, 'Started', '["ch1","ch2"]', '进度管理学习心得', NOW() - INTERVAL '2 hours'),
    ('test-free-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成范围管理课程', NOW() - INTERVAL '3 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters;

-- 3. Pro用户学习进度
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, last_accessed)
VALUES 
    ('test-pro-001', 'c-f1', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '5 days'),
    ('test-pro-001', 'c-f2', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '4 days'),
    ('test-pro-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '3 days'),
    ('test-pro-001', 'c-f4', 75, 'Started', '["ch1","ch2"]', NOW() - INTERVAL '1 day'),
    ('test-pro-001', 'c-a1', 45, 'Started', '["ch1"]', NOW() - INTERVAL '12 hours'),
    ('test-pro-001', 'c-a2', 20, 'Started', '["ch1"]', NOW() - INTERVAL '2 hours')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress;

-- 4. Pro+用户学习进度
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, last_accessed)
VALUES 
    ('test-pp-001', 'c-f1', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '25 days'),
    ('test-pp-001', 'c-f2', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '23 days'),
    ('test-pp-001', 'c-f4', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'c-f5', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '18 days'),
    ('test-pp-001', 'c-f6', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'c-a1', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'c-a2', 100, 'Completed', '["ch1","ch2","ch3"]', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'c-a3', 70, 'Started', '["ch1","ch2"]', NOW() - INTERVAL '2 days'),
    ('test-pp-001', 'c-a4', 55, 'Started', '["ch1","ch2"]', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress;

-- 5. 插入一些社区帖子（用于后台管理）
-- ==========================================
INSERT INTO app_community_posts (user_id, user_name, content, tags, likes, comments, created_at)
VALUES 
    ('test-free-001', 'Free用户', '刚完成了范围管理课程，WBS分解真的很重要！有同学一起交流吗？', '["学习心得"]', 5, 2, NOW() - INTERVAL '2 days'),
    ('test-pro-001', 'Pro用户', '用CPM工具做了一个项目分析，关键路径法帮大忙了！', '["工具使用"]', 12, 5, NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'ProPlus用户', '刚完成了项目危机处理模拟，85分！推荐大家体验实战模拟。', '["模拟"]', 28, 10, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- 6. 确保有公告数据
-- ==========================================
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at)
VALUES 
    ('系统维护通知', '今晚22:00-24:00进行系统维护，期间部分功能可能不可用。', 'info', 80, 'all', true, NOW()),
    ('新功能上线', '实战模拟中心正式上线，Pro+用户可体验沉浸式项目管理训练。', 'success', 90, 'pro_plus', true, NOW() - INTERVAL '1 day'),
    ('课程更新', '新增3门实战课程，涵盖敏捷管理和风险控制。', 'info', 70, 'all', true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- 7. 检查并显示结果
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
    '社区统计' as metric,
    (SELECT COUNT(*) FROM app_community_posts) as total_posts,
    (SELECT COUNT(*) FROM app_comments) as total_comments;

SELECT 
    '系统统计' as metric,
    (SELECT COUNT(*) FROM app_courses) as total_courses,
    (SELECT COUNT(*) FROM app_announcements) as total_announcements;
