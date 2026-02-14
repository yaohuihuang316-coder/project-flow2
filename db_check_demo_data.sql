-- 检查演示数据是否存在
SELECT '检查表数据' as check_type;

-- 1. 检查学习活动
SELECT '学习活动' as table_name, COUNT(*) as count, user_id
FROM app_learning_activity 
WHERE user_id LIKE 'test-%'
GROUP BY user_id;

-- 2. 检查技能评分
SELECT '技能评分' as table_name, user_id, 
       plan_score, exec_score, cost_score, risk_score, lead_score, agile_score
FROM app_user_skills 
WHERE user_id LIKE 'test-%';

-- 3. 检查用户徽章（关联查询获取徽章名称）
SELECT '用户徽章' as table_name, 
       ua.user_id,
       COUNT(*) as badge_count,
       string_agg(a.name, ', ') as badges
FROM app_user_achievements ua
JOIN app_achievements a ON ua.achievement_id = a.id
WHERE ua.user_id LIKE 'test-%'
GROUP BY ua.user_id;

-- 4. 检查当前登录用户能看到的徽章
SELECT '当前用户徽章' as table_name, 
       ua.user_id,
       a.code,
       a.name,
       ua.unlocked_at,
       ua.progress
FROM app_user_achievements ua
JOIN app_achievements a ON ua.achievement_id = a.id
WHERE ua.user_id LIKE 'test-%';

-- 5. 测试 RLS 策略（模拟 auth.uid()）
-- 注意：这将返回空结果因为 auth.uid() 是 null，但可以帮助我们检查策略
SELECT 'RLS 策略检查' as check_type,
       (SELECT COUNT(*) FROM app_user_achievements WHERE user_id = 'test-pp-001') as raw_count,
       (SELECT COUNT(*) FROM app_achievements) as total_achievements;
