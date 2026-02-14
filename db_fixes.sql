-- ==========================================
-- ProjectFlow 紧急修复脚本
-- ==========================================

-- 1. 修复公告表RLS策略（保存失败问题）
-- ==========================================

-- 先删除旧策略
DROP POLICY IF EXISTS "Admins can manage announcements" ON app_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON app_announcements;

-- 创建新策略：允许管理员管理
CREATE POLICY "Admins can manage announcements"
ON app_announcements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
);

-- 创建策略：允许所有用户查看活跃公告
CREATE POLICY "Users can view active announcements"
ON app_announcements
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. 创建 app_tools 表（工具实验室管理）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL, -- 'cpm', 'pert', 'risk', 'monte_carlo', etc
    icon TEXT,
    config JSONB DEFAULT '{}', -- 工具配置参数
    is_active BOOLEAN DEFAULT true,
    required_tier TEXT DEFAULT 'pro', -- 'free', 'pro', 'pro_plus'
    difficulty TEXT DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for app_tools
ALTER TABLE app_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage tools" ON app_tools;
DROP POLICY IF EXISTS "Users can view active tools" ON app_tools;

CREATE POLICY "Admins can manage tools"
ON app_tools
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
);

CREATE POLICY "Users can view active tools"
ON app_tools
FOR SELECT
TO authenticated
USING (is_active = true);

-- 确保唯一约束存在（如果表已存在）
ALTER TABLE app_tools DROP CONSTRAINT IF EXISTS app_tools_name_key;
ALTER TABLE app_tools ADD CONSTRAINT app_tools_name_key UNIQUE (name);

-- 插入默认工具数据
INSERT INTO app_tools (name, description, category, icon, required_tier, difficulty) VALUES
('CPM关键路径', '关键路径法分析工具，计算项目最短工期', 'cpm', 'GitBranch', 'pro', 'Medium'),
('PERT分析', '计划评审技术，三点估算工期', 'pert', 'Calculator', 'pro', 'Medium'),
('风险管理矩阵', '风险概率与影响评估', 'risk', 'AlertTriangle', 'pro', 'Easy'),
('蒙特卡洛模拟', '概率分布模拟项目风险', 'monte_carlo', 'BarChart3', 'pro_plus', 'Hard'),
('挣值管理', 'EVM成本与进度绩效分析', 'evm', 'TrendingUp', 'pro', 'Medium'),
('WBS分解', '工作分解结构创建工具', 'wbs', 'Layers', 'free', 'Easy'),
('资源平衡', '资源约束下的进度优化', 'resource', 'Users', 'pro', 'Hard'),
('敏捷看板', 'Scrum看板与燃尽图', 'kanban', 'Layout', 'free', 'Easy')
ON CONFLICT (name) DO NOTHING;

-- 3. 创建用户徽章表
-- ==========================================
CREATE TABLE IF NOT EXISTS app_user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    badge_color TEXT,
    badge_bg TEXT,
    condition TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- RLS for badges
ALTER TABLE app_user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON app_user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON app_user_badges;

CREATE POLICY "Users can view own badges"
ON app_user_badges
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

CREATE POLICY "System can insert badges"
ON app_user_badges
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. 创建用户技能表（雷达图数据）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_en TEXT,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 150,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- RLS for skills
ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skills" ON app_user_skills;
CREATE POLICY "Users can view own skills"
ON app_user_skills
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

-- 5. 确保 app_activity_logs 表存在（用于热力图）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for activity logs
ALTER TABLE app_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON app_activity_logs;
CREATE POLICY "Users can view own logs"
ON app_activity_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

CREATE POLICY "System can insert logs"
ON app_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. 修复测试账号角色和数据
-- ==========================================

-- 确保测试账号存在并设置正确角色
INSERT INTO app_users (id, email, name, role, subscription_tier, streak, xp, completed_courses_count, created_at)
VALUES 
    ('test-admin-001', 'admin@test.com', '管理员', 'SuperAdmin', 'pro_plus', 0, 0, 0, NOW()),
    ('test-free-001', 'free@test.com', 'Free用户', 'Student', 'free', 3, 350, 1, NOW()),
    ('test-pro-001', 'pro@test.com', 'Pro用户', 'Student', 'pro', 15, 1200, 3, NOW()),
    ('test-pp-001', 'pp@test.com', 'ProPlus用户', 'Student', 'pro_plus', 30, 2800, 8, NOW())
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    subscription_tier = EXCLUDED.subscription_tier,
    streak = EXCLUDED.streak,
    xp = EXCLUDED.xp,
    completed_courses_count = EXCLUDED.completed_courses_count;

-- 7. 为Pro+用户添加模拟场景完成记录
-- ==========================================
-- 先检查是否已有记录
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM app_simulation_progress 
        WHERE user_id = 'test-pp-001' 
        LIMIT 1
    ) THEN
        INSERT INTO app_simulation_progress (user_id, scenario_id, current_stage, score, max_score, status, completed_at)
        SELECT 
            'test-pp-001',
            id,
            5,
            85,
            100,
            'completed',
            NOW() - INTERVAL '2 days'
        FROM app_simulation_scenarios 
        WHERE is_published = true
        LIMIT 1;
    END IF;
END $$;

-- 8. 添加模拟场景测试数据（如果没有）
-- ==========================================
-- 先确保表结构正确
ALTER TABLE app_simulation_scenarios DROP CONSTRAINT IF EXISTS app_simulation_scenarios_pkey;
ALTER TABLE app_simulation_scenarios ADD PRIMARY KEY (id);

-- 插入数据
INSERT INTO app_simulation_scenarios (id, title, description, difficulty, category, stages, learning_objectives, is_published, estimated_time)
VALUES (
    'sim-001',
    '项目危机处理',
    '模拟项目中突发危机的应对决策',
    'Hard',
    'Crisis',
    '[
        {
            "id": "stage-1",
            "title": "危机发现",
            "description": "项目关键路径延误3天，预算超支20%",
            "decisions": [
                {"id": "d1", "text": "立即增加人手", "impact": {"score": -10, "feedback": "Brooks法则：增加人手会延误项目"}},
                {"id": "d2", "text": "快速跟进并行任务", "impact": {"score": 20, "feedback": "正确！快速跟进是标准进度压缩技术"}, "is_optimal": true},
                {"id": "d3", "text": "削减范围", "impact": {"score": 5, "feedback": "可行但需客户同意"}}
            ]
        },
        {
            "id": "stage-2",
            "title": "资源协调",
            "description": "团队成员冲突，士气低落",
            "decisions": [
                {"id": "d4", "text": "一对一沟通", "impact": {"score": 15, "feedback": "良好的冲突解决方法"}, "is_optimal": true},
                {"id": "d5", "text": "召开团队会议", "impact": {"score": 5, "feedback": "可能加剧冲突"}},
                {"id": "d6", "text": "更换团队成员", "impact": {"score": -5, "feedback": "成本高且影响团队稳定"}}
            ]
        }
    ]'::jsonb,
    '["危机管理", "冲突解决", "进度压缩"]'::jsonb,
    true,
    15
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 修复完成
-- ==========================================
