-- ==========================================
-- 个人资料三大功能数据库支持
-- ==========================================

-- 1. 学习活动记录表（用于热力图）
CREATE TABLE IF NOT EXISTS app_learning_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('course', 'simulation', 'tool', 'login')),
    xp_earned INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}', -- 存储具体活动详情
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date, activity_type)
);

-- 学习活动索引
CREATE INDEX IF NOT EXISTS idx_learning_activity_user ON app_learning_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activity_date ON app_learning_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_learning_activity_user_date ON app_learning_activity(user_id, activity_date);

-- 2. 徽章定义表
CREATE TABLE IF NOT EXISTS app_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 徽章代码标识符，如: pmp_master, early_bird
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Lucide图标名称或emoji
    category TEXT NOT NULL CHECK (category IN ('learning', 'skill', 'social', 'special')),
    
    -- 解锁条件定义
    unlock_type TEXT NOT NULL CHECK (unlock_type IN (
        'courses_completed',      -- 完成课程数量
        'simulations_completed',  -- 完成模拟数量
        'streak_days',           -- 连续学习天数
        'skill_score',           -- 技能分数达标
        'tool_usage',            -- 工具使用次数
        'community_posts',       -- 社区发帖数
        'special'                -- 特殊条件
    )),
    unlock_threshold INTEGER DEFAULT 1, -- 阈值
    unlock_condition JSONB DEFAULT '{}', -- 额外条件参数
    
    -- 徽章稀有度
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    
    -- 是否隐藏（未解锁时不显示）
    is_hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 先删除可能存在的外键约束（如果表已存在）
ALTER TABLE IF EXISTS app_user_achievements 
    DROP CONSTRAINT IF EXISTS app_user_achievements_achievement_id_fkey;

-- 3. 用户徽章记录表
CREATE TABLE IF NOT EXISTS app_user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    achievement_id UUID NOT NULL, -- 与 app_achievements.id 类型匹配
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, achievement_id)
);

-- 添加外键约束（确保类型匹配）
ALTER TABLE app_user_achievements
    ADD CONSTRAINT app_user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE app_user_achievements
    ADD CONSTRAINT app_user_achievements_achievement_id_fkey 
    FOREIGN KEY (achievement_id) REFERENCES app_achievements(id) ON DELETE CASCADE;

-- 用户徽章索引
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON app_user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_new ON app_user_achievements(user_id, is_new);

-- 4. 用户能力维度评分表（用于雷达图）
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- 六维能力评分 (0-100)
    plan_score INTEGER DEFAULT 0 CHECK (plan_score >= 0 AND plan_score <= 100),
    exec_score INTEGER DEFAULT 0 CHECK (exec_score >= 0 AND exec_score <= 100),
    cost_score INTEGER DEFAULT 0 CHECK (cost_score >= 0 AND cost_score <= 100),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    agile_score INTEGER DEFAULT 0 CHECK (agile_score >= 0 AND agile_score <= 100),
    
    -- 计算时间
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON app_user_skills(user_id);

-- ==========================================
-- RLS 策略
-- ==========================================

-- 学习活动：用户只能看到自己的
ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_activity_own" ON app_learning_activity 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- 徽章定义：公开可读
ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_public_read" ON app_achievements 
    FOR SELECT USING (true);

-- 用户徽章：用户只能看到自己的
ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_own" ON app_user_achievements 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- 用户技能：用户只能看到自己的
ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skills_own" ON app_user_skills 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 插入默认徽章数据
-- ==========================================

INSERT INTO app_achievements (id, code, name, description, icon, category, unlock_type, unlock_threshold, rarity, is_hidden) VALUES
-- 学习类徽章
(gen_random_uuid(), 'pmp_master', 'PMP大师', '完成全部体系课程', 'Trophy', 'learning', 'courses_completed', 12, 'legendary', false),
(gen_random_uuid(), 'course_warrior', '课程达人', '完成5门课程', 'BookOpen', 'learning', 'courses_completed', 5, 'rare', false),
(gen_random_uuid(), 'simulation_expert', '模拟专家', '完成10个实战模拟场景', 'Target', 'learning', 'simulations_completed', 10, 'epic', false),
(gen_random_uuid(), 'scenario_starter', '初入茅庐', '完成第一个模拟场景', 'Play', 'learning', 'simulations_completed', 1, 'common', false),

-- 连续学习类
(gen_random_uuid(), 'early_bird', '早起鸟', '连续7天在9点前学习', 'Sunrise', 'special', 'streak_days', 7, 'rare', false),
(gen_random_uuid(), 'streak_master', '连胜大师', '连续学习30天', 'Flame', 'special', 'streak_days', 30, 'epic', false),
(gen_random_uuid(), 'streak_warrior', '坚持者', '连续学习7天', 'Zap', 'special', 'streak_days', 7, 'common', false),

-- 全能类
(gen_random_uuid(), 'all_rounder', '全能王', '六维能力均达到60分', 'Crown', 'skill', 'skill_score', 60, 'epic', false),
(gen_random_uuid(), 'perfect_score', '完美主义', '单个课程获得100%掌握度', 'Star', 'learning', 'special', 1, 'legendary', true),

-- 工具使用类
(gen_random_uuid(), 'tool_expert', '工具专家', '使用10种不同的项目管理工具', 'Wrench', 'skill', 'tool_usage', 10, 'rare', false),
(gen_random_uuid(), 'fishbone_master', '根因分析师', '使用鱼骨图分析工具5次', 'GitBranch', 'skill', 'tool_usage', 5, 'common', false),

-- 社交类
(gen_random_uuid(), 'community_active', '社区活跃者', '在社区发布10条内容', 'MessageSquare', 'social', 'community_posts', 10, 'common', false),
(gen_random_uuid(), 'helper', '热心助人的', '回复他人问题获得5个赞', 'Heart', 'social', 'special', 5, 'rare', false)

ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 辅助函数
-- ==========================================

-- 记录学习活动
CREATE OR REPLACE FUNCTION record_learning_activity(
    p_user_id TEXT,
    p_activity_type TEXT,
    p_xp_earned INTEGER DEFAULT 0,
    p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
    VALUES (p_user_id, CURRENT_DATE, p_activity_type, p_xp_earned, p_details)
    ON CONFLICT (user_id, activity_date, activity_type) 
    DO UPDATE SET 
        xp_earned = app_learning_activity.xp_earned + EXCLUDED.xp_earned,
        details = app_learning_activity.details || EXCLUDED.details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查并解锁徽章
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id TEXT)
RETURNS TABLE(achievement_id TEXT, is_new BOOLEAN) AS $$
DECLARE
    v_achievement RECORD;
    v_count INTEGER;
    v_should_unlock BOOLEAN;
BEGIN
    FOR v_achievement IN SELECT * FROM app_achievements LOOP
        -- 检查是否已解锁
        IF EXISTS (
            SELECT 1 FROM app_user_achievements 
            WHERE user_id = p_user_id AND achievement_id = v_achievement.id
        ) THEN
            CONTINUE;
        END IF;
        
        v_should_unlock := FALSE;
        
        -- 根据解锁类型检查条件
        CASE v_achievement.unlock_type
            WHEN 'courses_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_course_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'simulations_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_simulation_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'streak_days' THEN
                -- 查询连续学习天数
                SELECT COALESCE(MAX(consecutive_days), 0) INTO v_count
                FROM (
                    SELECT COUNT(*) AS consecutive_days
                    FROM (
                        SELECT activity_date, 
                               activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::INTEGER AS grp
                        FROM app_learning_activity
                        WHERE user_id = p_user_id
                    ) t
                    GROUP BY grp
                ) streaks;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'tool_usage' THEN
                -- 从工具使用记录表查询
                SELECT COUNT(DISTINCT tool_id) INTO v_count
                FROM lab_tool_history
                WHERE user_id = p_user_id;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'skill_score' THEN
                SELECT COUNT(*) INTO v_count
                FROM app_user_skills
                WHERE user_id = p_user_id
                  AND plan_score >= v_achievement.unlock_threshold
                  AND exec_score >= v_achievement.unlock_threshold
                  AND cost_score >= v_achievement.unlock_threshold
                  AND risk_score >= v_achievement.unlock_threshold
                  AND lead_score >= v_achievement.unlock_threshold
                  AND agile_score >= v_achievement.unlock_threshold;
                v_should_unlock := v_count > 0;
        END CASE;
        
        -- 解锁徽章
        IF v_should_unlock THEN
            INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new)
            VALUES (p_user_id, v_achievement.id, NOW(), TRUE);
            
            achievement_id := v_achievement.id;
            is_new := TRUE;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 计算用户技能分数
CREATE OR REPLACE FUNCTION calculate_user_skills(p_user_id TEXT)
RETURNS VOID AS $$
DECLARE
    v_plan_score INTEGER := 0;
    v_exec_score INTEGER := 0;
    v_cost_score INTEGER := 0;
    v_risk_score INTEGER := 0;
    v_lead_score INTEGER := 0;
    v_agile_score INTEGER := 0;
BEGIN
    -- Plan (规划能力): WBS工具、课程进度、规划类模拟
    SELECT COALESCE(
        (SELECT AVG(score) * 10 
         FROM app_simulation_progress 
         WHERE user_id = p_user_id 
           AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Planning%')
        ), 0
    )::INTEGER INTO v_plan_score;
    
    -- Exec (执行能力): 燃尽图工具使用、任务完成率
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 10 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%burn%'), 0) +
        COALESCE((SELECT AVG(completion_rate) FROM app_course_progress WHERE user_id = p_user_id), 0) / 10,
        100
    )::INTEGER INTO v_exec_score;
    
    -- Cost (成本能力): EVM工具使用
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 20 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%evm%'), 0),
        100
    )::INTEGER INTO v_cost_score;
    
    -- Risk (风险能力): 鱼骨图、风险模拟
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%fishbone%'), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Risk%')
        ), 0),
        100
    )::INTEGER INTO v_risk_score;
    
    -- Lead (领导力): 社区互动、学习连续天数
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 5 FROM community_posts WHERE user_id = p_user_id), 0) +
        COALESCE((SELECT MAX(streak) FROM app_users WHERE id = p_user_id), 0) * 3,
        100
    )::INTEGER INTO v_lead_score;
    
    -- Agile (敏捷能力): 看板、规划扑克、敏捷模拟
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id IN ('kanban-flow', 'planning-poker')), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Agile%')
        ), 0),
        100
    )::INTEGER INTO v_agile_score;
    
    -- 保存技能分数
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (p_user_id, v_plan_score, v_exec_score, v_cost_score, v_risk_score, v_lead_score, v_agile_score, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '个人资料功能数据库表创建完成' as status;
