-- ==========================================
-- 后台管理修复脚本
-- 修复 AdminTools, AdminAnnouncements, AdminSimulation 的 RLS 策略问题
-- ==========================================

-- ==========================================
-- 1. 修复 app_announcements 表 RLS 策略
-- ==========================================

-- 先删除旧策略
DROP POLICY IF EXISTS "Admins can manage announcements" ON app_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON app_announcements;
DROP POLICY IF EXISTS "Announcements public read" ON app_announcements;

-- 创建策略：允许管理员管理
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
USING (is_active = true AND (end_at IS NULL OR end_at > NOW()));

-- ==========================================
-- 2. 修复 app_tools 表 RLS 策略
-- ==========================================

-- 确保表存在
CREATE TABLE IF NOT EXISTS app_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    required_tier TEXT DEFAULT 'pro',
    difficulty TEXT DEFAULT 'Medium',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- 启用 RLS
ALTER TABLE app_tools ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Admins can manage tools" ON app_tools;
DROP POLICY IF EXISTS "Users can view active tools" ON app_tools;

-- 创建策略：允许管理员管理
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
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
);

-- 创建策略：允许所有用户查看活跃工具
CREATE POLICY "Users can view active tools"
ON app_tools
FOR SELECT
TO authenticated
USING (is_active = true);

-- ==========================================
-- 3. 修复 app_simulation_scenarios 表 RLS 策略
-- ==========================================

-- 确保表结构正确
CREATE TABLE IF NOT EXISTS app_simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium',
    category TEXT,
    cover_image TEXT,
    stages JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    resources JSONB DEFAULT '{}',
    learning_objectives JSONB DEFAULT '[]',
    estimated_time INTEGER DEFAULT 15,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE app_simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Admins can manage scenarios" ON app_simulation_scenarios;
DROP POLICY IF EXISTS "Users can view published scenarios" ON app_simulation_scenarios;

-- 创建策略：允许管理员管理
CREATE POLICY "Admins can manage scenarios"
ON app_simulation_scenarios
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

-- 创建策略：允许所有用户查看已发布的场景
CREATE POLICY "Users can view published scenarios"
ON app_simulation_scenarios
FOR SELECT
TO authenticated
USING (is_published = true);

-- ==========================================
-- 4. 插入默认工具数据（如果表为空）
-- 与 ToolsLab.tsx 中的工具对应
-- ==========================================

INSERT INTO app_tools (name, description, category, icon, is_active, required_tier, difficulty)
SELECT * FROM (VALUES
    ('蒙特卡洛模拟器', '基于PERT分布的风险量化分析，10,000次模拟预测项目完成概率', 'risk', 'Calculator', true, 'pro', 'Medium'),
    ('敏捷估算扑克', '团队协作估算工具，同步出牌暴露差异，达成共识', 'agile', 'Users', true, 'pro', 'Easy'),
    ('Kanban流动指标', '可视化累积流图，计算Lead Time、Cycle Time和吞吐量', 'agile', 'Layers', true, 'pro', 'Medium'),
    ('学习曲线模型', '基于经验曲线效应预测生产效率提升，优化工期估算', 'resource', 'TrendingUp', true, 'pro', 'Hard'),
    ('挣值趋势预测', 'AI驱动的SPI/CPI趋势预测，智能分析项目健康状况', 'evm', 'BarChart3', true, 'pro', 'Hard'),
    ('迭代速率跟踪', '跟踪团队迭代速率，预测交付能力', 'agile', 'TrendingUp', true, 'pro', 'Medium'),
    ('FMEA风险分析', '失效模式与影响分析，识别潜在风险', 'risk', 'AlertTriangle', true, 'pro', 'Medium'),
    ('关键链法调度', 'CCPM高级调度，资源约束与项目缓冲管理', 'cpm', 'GitBranch', true, 'pro_plus', 'Hard'),
    ('鱼骨图分析', '结构化根因分析，人机料法环五维诊断', 'risk', 'GitBranch', true, 'pro_plus', 'Medium'),
    ('质量成本模型', 'COQ分析 - 预防、评估与失败成本优化', 'evm', 'BarChart3', true, 'pro_plus', 'Medium')
) AS v(name, description, category, icon, is_active, required_tier, difficulty)
WHERE NOT EXISTS (SELECT 1 FROM app_tools);

-- ==========================================
-- 脚本执行完成
-- ==========================================
SELECT '后台管理修复完成' as status;
