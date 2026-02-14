-- ==========================================
-- 修复 RLS 策略以支持演示账号
-- ==========================================

-- 1. 修复学习活动表 RLS
DROP POLICY IF EXISTS "learning_activity_own" ON app_learning_activity;
CREATE POLICY "learning_activity_own" ON app_learning_activity 
    FOR ALL USING (user_id = auth.uid()::TEXT OR user_id LIKE 'test-%');

-- 2. 修复用户徽章表 RLS  
DROP POLICY IF EXISTS "user_achievements_own" ON app_user_achievements;
CREATE POLICY "user_achievements_own" ON app_user_achievements 
    FOR ALL USING (user_id = auth.uid()::TEXT OR user_id LIKE 'test-%');

-- 3. 修复用户技能表 RLS
DROP POLICY IF EXISTS "user_skills_own" ON app_user_skills;
CREATE POLICY "user_skills_own" ON app_user_skills 
    FOR ALL USING (user_id = auth.uid()::TEXT OR user_id LIKE 'test-%');

SELECT 'RLS 策略已修复' as status;

-- 验证数据可以访问
SELECT '验证数据' as check_type;

SELECT user_id, COUNT(*) as activity_count 
FROM app_learning_activity 
WHERE user_id LIKE 'test-%'
GROUP BY user_id;

SELECT user_id, plan_score, exec_score, agile_score
FROM app_user_skills 
WHERE user_id LIKE 'test-%';

SELECT ua.user_id, COUNT(*) as badge_count
FROM app_user_achievements ua
WHERE ua.user_id LIKE 'test-%'
GROUP BY ua.user_id;
