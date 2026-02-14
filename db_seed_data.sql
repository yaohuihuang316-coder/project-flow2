-- ==========================================
-- ProjectFlow 测试数据插入脚本
-- 为三个测试账号准备完整数据
-- ==========================================

-- 0. 先清理旧数据（可选）
-- DELETE FROM app_user_progress WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001');
-- DELETE FROM app_activity_logs WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001');
-- DELETE FROM app_user_badges WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001');
-- DELETE FROM app_user_skills WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001');

-- 1. 确保测试账号存在
-- ==========================================
INSERT INTO app_users (id, email, name, role, subscription_tier, streak, xp, completed_courses_count, created_at, status)
VALUES 
    ('test-free-001', 'free@test.com', 'Free用户', 'Student', 'free', 3, 350, 1, NOW() - INTERVAL '10 days', '正常'),
    ('test-pro-001', 'pro@test.com', 'Pro用户', 'Student', 'pro', 15, 1200, 3, NOW() - INTERVAL '20 days', '正常'),
    ('test-pp-001', 'pp@test.com', 'ProPlus用户', 'Student', 'pro_plus', 30, 2800, 8, NOW() - INTERVAL '30 days', '正常'),
    ('test-admin-001', 'admin@test.com', '管理员', 'SuperAdmin', 'pro_plus', 0, 0, 0, NOW(), '正常')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    subscription_tier = EXCLUDED.subscription_tier,
    streak = EXCLUDED.streak,
    xp = EXCLUDED.xp,
    completed_courses_count = EXCLUDED.completed_courses_count,
    name = EXCLUDED.name;

-- 2. Free用户数据（2门进行中，1门完成）
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-free-001', 'c-f1', 35, 'Started', '["ch1"]', '项目管理基础学习笔记：项目是为创造独特的产品、服务或成果而进行的临时性工作。', NOW() - INTERVAL '1 day'),
    ('test-free-001', 'c-f2', 60, 'Started', '["ch1","ch2"]', '进度管理学习心得：关键路径法帮助我理解了项目最短工期计算。', NOW() - INTERVAL '2 hours'),
    ('test-free-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成范围管理课程，理解了WBS分解的重要性。', NOW() - INTERVAL '3 days')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters,
    notes = EXCLUDED.notes,
    last_accessed = EXCLUDED.last_accessed;

-- Free用户活动日志（用于热力图）
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
SELECT 'test-free-001', 'course_progress', 10, '{"description":"学习项目管理基础"}', d
FROM generate_series(1, 10) AS i, LATERAL (SELECT NOW() - (i || ' days')::INTERVAL AS d) AS days
WHERE i <= 3;

INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    ('test-free-001', 'course_completed', 50, '{"description":"完成范围管理课程"}', NOW() - INTERVAL '3 days'),
    ('test-free-001', 'login', 5, '{"description":"每日登录"}', NOW() - INTERVAL '1 day');

-- 3. Pro用户数据（5门进行中，3门完成）
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    ('test-pro-001', 'c-f1', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成项目管理基础', NOW() - INTERVAL '5 days'),
    ('test-pro-001', 'c-f2', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成进度管理', NOW() - INTERVAL '4 days'),
    ('test-pro-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成范围管理', NOW() - INTERVAL '3 days'),
    ('test-pro-001', 'c-f4', 75, 'Started', '["ch1","ch2"]', '关键路径学习中，CPM工具很有用', NOW() - INTERVAL '1 day'),
    ('test-pro-001', 'c-a1', 45, 'Started', '["ch1"]', '质量管理入门，了解ISO标准', NOW() - INTERVAL '12 hours'),
    ('test-pro-001', 'c-a2', 20, 'Started', '["ch1"]', '敏捷管理开始，Scrum框架很有趣', NOW() - INTERVAL '2 hours'),
    ('test-pro-001', 'c-a3', 10, 'Started', '["ch1"]', '成本管理刚开始', NOW() - INTERVAL '1 hour')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters,
    notes = EXCLUDED.notes,
    last_accessed = EXCLUDED.last_accessed;

-- Pro用户活动日志（15天的连续记录）
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
SELECT 'test-pro-001', 'course_progress', 10 + (i % 5), '{"description":"持续学习课程"}', NOW() - (i || ' days')::INTERVAL
FROM generate_series(1, 15) AS i;

INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    ('test-pro-001', 'course_completed', 50, '{"description":"完成项目管理基础"}', NOW() - INTERVAL '5 days'),
    ('test-pro-001', 'course_completed', 50, '{"description":"完成进度管理"}', NOW() - INTERVAL '4 days'),
    ('test-pro-001', 'course_completed', 50, '{"description":"完成范围管理"}', NOW() - INTERVAL '3 days'),
    ('test-pro-001', 'tool_usage', 20, '{"description":"使用CPM工具"}', NOW() - INTERVAL '2 days'),
    ('test-pro-001', 'ai_chat', 5, '{"description":"AI助手提问"}', NOW() - INTERVAL '1 day');

-- 4. Pro+用户数据（8门完成，4门进行中）
-- ==========================================
INSERT INTO app_user_progress (user_id, course_id, progress, status, completed_chapters, notes, last_accessed)
VALUES 
    -- 已完成课程
    ('test-pp-001', 'c-f1', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '25 days'),
    ('test-pp-001', 'c-f2', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'c-f3', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '23 days'),
    ('test-pp-001', 'c-f4', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'c-f5', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '18 days'),
    ('test-pp-001', 'c-f6', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'c-a1', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'c-a2', 100, 'Completed', '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '10 days'),
    -- 进行中课程
    ('test-pp-001', 'c-a3', 70, 'Started', '["ch1","ch2"]', '成本管理深入学习', NOW() - INTERVAL '2 days'),
    ('test-pp-001', 'c-a4', 55, 'Started', '["ch1","ch2"]', '风险管理实践', NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'c-i1', 40, 'Started', '["ch1"]', '项目启动实战', NOW() - INTERVAL '12 hours'),
    ('test-pp-001', 'c-i2', 25, 'Started', '["ch1"]', '项目规划实战', NOW() - INTERVAL '3 hours')
ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress = EXCLUDED.progress,
    status = EXCLUDED.status,
    completed_chapters = EXCLUDED.completed_chapters,
    notes = EXCLUDED.notes,
    last_accessed = EXCLUDED.last_accessed;

-- Pro+用户活动日志（30天）
INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
SELECT 'test-pp-001', 'course_progress', 10 + (i % 10), '{"description":"持续学习课程"}', NOW() - (i || ' days')::INTERVAL
FROM generate_series(1, 30) AS i;

INSERT INTO app_activity_logs (user_id, action_type, points, meta, created_at)
VALUES 
    ('test-pp-001', 'course_completed', 50, '{"description":"完成项目管理基础"}', NOW() - INTERVAL '25 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成进度管理"}', NOW() - INTERVAL '24 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成范围管理"}', NOW() - INTERVAL '23 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成关键路径"}', NOW() - INTERVAL '20 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成沟通管理"}', NOW() - INTERVAL '18 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成干系人管理"}', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成质量管理"}', NOW() - INTERVAL '12 days'),
    ('test-pp-001', 'course_completed', 50, '{"description":"完成敏捷管理"}', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'simulation_completed', 100, '{"description":"完成项目危机处理模拟"}', NOW() - INTERVAL '5 days'),
    ('test-pp-001', 'tool_usage', 20, '{"description":"使用PERT工具"}', NOW() - INTERVAL '3 days'),
    ('test-pp-001', 'tool_usage', 20, '{"description":"使用风险管理矩阵"}', NOW() - INTERVAL '2 days'),
    ('test-pp-001', 'ai_chat', 10, '{"description":"AI助手深度使用"}', NOW() - INTERVAL '1 day');

-- 5. Pro+用户徽章
-- ==========================================
INSERT INTO app_user_badges (user_id, badge_id, badge_name, badge_icon, badge_color, badge_bg, condition, unlocked_at)
VALUES 
    ('test-pp-001', 'pmp_master', 'PMP大师', 'Crown', 'text-yellow-600', 'bg-yellow-100', '通过PMP模拟考试且分数>85', NOW() - INTERVAL '5 days'),
    ('test-pp-001', 'early_bird', '早起鸟', 'Zap', 'text-yellow-500', 'bg-yellow-50', '连续7天在早上8点前登录学习', NOW() - INTERVAL '10 days'),
    ('test-pp-001', 'all_rounder', '全能王', 'Trophy', 'text-purple-500', 'bg-purple-100', '完成所有基础课程章节', NOW() - INTERVAL '15 days'),
    ('test-pp-001', 'streak_master', '连胜大师', 'Flame', 'text-orange-500', 'bg-orange-100', '连续学习30天未中断', NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'bug_hunter', 'Bug猎手', 'Bug', 'text-green-500', 'bg-green-100', '在实战项目中修复10个以上Bug', NOW() - INTERVAL '8 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Pro用户徽章（部分）
INSERT INTO app_user_badges (user_id, badge_id, badge_name, badge_icon, badge_color, badge_bg, condition, unlocked_at)
VALUES 
    ('test-pro-001', 'early_bird', '早起鸟', 'Zap', 'text-yellow-500', 'bg-yellow-50', '连续7天在早上8点前登录学习', NOW() - INTERVAL '8 days'),
    ('test-pro-001', 'all_rounder', '全能王', 'Trophy', 'text-purple-500', 'bg-purple-100', '完成所有基础课程章节', NOW() - INTERVAL '3 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 6. Pro+用户技能值（雷达图数据）
-- ==========================================
INSERT INTO app_user_skills (user_id, skill_name, skill_en, score, max_score, updated_at)
VALUES 
    ('test-pp-001', '规划', 'Plan', 145, 150, NOW()),
    ('test-pp-001', '执行', 'Exec', 125, 150, NOW()),
    ('test-pp-001', '预算', 'Cost', 135, 150, NOW()),
    ('test-pp-001', '风险', 'Risk', 148, 150, NOW()),
    ('test-pp-001', '领导力', 'Lead', 140, 150, NOW()),
    ('test-pp-001', '敏捷', 'Agile', 130, 150, NOW())
ON CONFLICT (user_id, skill_name) DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = EXCLUDED.updated_at;

-- Pro用户技能值
INSERT INTO app_user_skills (user_id, skill_name, skill_en, score, max_score, updated_at)
VALUES 
    ('test-pro-001', '规划', 'Plan', 120, 150, NOW()),
    ('test-pro-001', '执行', 'Exec', 110, 150, NOW()),
    ('test-pro-001', '预算', 'Cost', 95, 150, NOW()),
    ('test-pro-001', '风险', 'Risk', 105, 150, NOW()),
    ('test-pro-001', '领导力', 'Lead', 100, 150, NOW()),
    ('test-pro-001', '敏捷', 'Agile', 115, 150, NOW())
ON CONFLICT (user_id, skill_name) DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = EXCLUDED.updated_at;

-- Free用户技能值
INSERT INTO app_user_skills (user_id, skill_name, skill_en, score, max_score, updated_at)
VALUES 
    ('test-free-001', '规划', 'Plan', 60, 150, NOW()),
    ('test-free-001', '执行', 'Exec', 55, 150, NOW()),
    ('test-free-001', '预算', 'Cost', 45, 150, NOW()),
    ('test-free-001', '风险', 'Risk', 50, 150, NOW()),
    ('test-free-001', '领导力', 'Lead', 40, 150, NOW()),
    ('test-free-001', '敏捷', 'Agile', 65, 150, NOW())
ON CONFLICT (user_id, skill_name) DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = EXCLUDED.updated_at;

-- 7. 模拟场景完成记录（Pro+用户）
-- ==========================================
INSERT INTO app_simulation_progress (user_id, scenario_id, current_stage, decisions_made, resources_state, score, max_score, status, completed_at, started_at)
SELECT 
    'test-pp-001',
    s.id,
    2,
    '[{"stage_id": "stage-1", "decision_id": "d2", "score": 20}]'::jsonb,
    '{"budget": 80, "time": 25, "morale": 85}'::jsonb,
    85,
    100,
    'completed',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
FROM app_simulation_scenarios s
WHERE s.is_published = true
LIMIT 1
ON CONFLICT (user_id, scenario_id) DO NOTHING;

-- 8. 社区帖子（三个用户都有）
-- ==========================================
INSERT INTO app_community_posts (user_id, user_name, user_avatar, role, content, tags, likes, comments, created_at)
VALUES 
    ('test-free-001', 'Free用户', '', 'Student', '刚完成了范围管理课程，WBS分解真的很重要！有同学一起交流吗？', '["学习心得", "范围管理"]', 5, 2, NOW() - INTERVAL '2 days'),
    ('test-pro-001', 'Pro用户', '', 'Student', '用CPM工具做了一个项目分析，关键路径法帮大忙了！推荐大家都试试工具实验室。', '["工具使用", "CPM"]', 12, 5, NOW() - INTERVAL '1 day'),
    ('test-pp-001', 'ProPlus用户', '', 'Student', '刚完成了项目危机处理模拟，85分！决策流程非常真实，推荐大家体验实战模拟中心。', '["模拟", "危机处理", "经验分享"]', 28, 10, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- 9. AI使用记录
-- ==========================================
INSERT INTO app_ai_usage (user_id, model, query, prompt_tokens, completion_tokens, created_at)
VALUES 
    ('test-free-001', 'gemini-flash', '什么是项目管理？', 10, 110, NOW() - INTERVAL '1 day'),
    ('test-pro-001', 'kimi-2.5', '关键路径怎么计算？', 15, 165, NOW() - INTERVAL '12 hours'),
    ('test-pp-001', 'kimi-2.5', '帮我分析这个风险', 12, 188, NOW() - INTERVAL '2 hours');

-- 10. 确保有模拟场景数据
-- ==========================================
INSERT INTO app_simulation_scenarios (title, description, difficulty, category, stages, learning_objectives, is_published, cover_image)
VALUES (
    '项目危机处理',
    '模拟项目中突发危机的应对决策，测试你的危机管理能力',
    'Hard',
    'Crisis Management',
    '[
        {
            "id": "stage-1",
            "title": "危机发现",
            "description": "项目关键路径延误3天，预算超支20%，客户要求提前交付。",
            "context": "你是一名项目经理，负责一个6个月期的软件开发项目。项目进行到第4个月，发现核心模块开发进度严重滞后。",
            "decisions": [
                {"id": "d1", "text": "立即增加人手加班赶工", "description": "投入更多资源，每天加班3小时", "impact": {"score": -10, "resources": {"budget": -15, "morale": -10}, "feedback": "Brooks法则：增加人手会进一步延误项目，新人需要时间熟悉项目。"}},
                {"id": "d2", "text": "快速跟进并行任务", "description": "将原本串行的任务改为并行执行", "impact": {"score": 20, "resources": {"budget": -5, "time": -3}, "feedback": "正确！快速跟进是进度压缩的标准技术，能在不增加太多成本的情况下缩短工期。", "is_optimal": true}},
                {"id": "d3", "text": "削减范围并与客户协商", "description": "优先交付核心功能，将非核心功能延后", "impact": {"score": 15, "resources": {"budget": 0, "morale": 5}, "feedback": "不错的策略，通过范围管理来平衡进度，但需要获得客户同意。"}}
            ]
        },
        {
            "id": "stage-2",
            "title": "团队冲突",
            "description": "开发团队和测试团队产生严重冲突，互相指责，团队士气低落。",
            "context": "由于进度压力，开发和测试团队之间的矛盾激化。开发人员认为测试过于苛刻，测试人员认为开发质量差。",
            "decisions": [
                {"id": "d4", "text": "一对一沟通调解", "description": "分别与两个团队负责人沟通，了解各自诉求", "impact": {"score": 15, "resources": {"morale": 10}, "feedback": "优秀的冲突解决方法！通过私下沟通了解真实问题，避免了公开对抗。", "is_optimal": true}},
                {"id": "d5", "text": "召开全体团队会议", "description": "召集所有相关人员，公开讨论问题", "impact": {"score": 5, "resources": {"morale": 0}, "feedback": "公开会议可能加剧冲突，建议在私下沟通后再考虑公开讨论。"}},
                {"id": "d6", "text": "更换问题团队成员", "description": "调离表现不佳的成员，引入新成员", "impact": {"score": -5, "resources": {"budget": -10, "morale": -5}, "feedback": "更换成员成本高且影响团队稳定，应该在尝试其他方法后再考虑。"}}
            ]
        }
    ]'::jsonb,
    '["危机管理", "冲突解决", "进度压缩", "团队管理"]'::jsonb,
    true,
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800'
);

-- ==========================================
-- 数据插入完成
-- ==========================================
SELECT '测试数据插入完成' as status;
