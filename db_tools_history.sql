-- ==========================================
-- 实验室工具历史记录表
-- 为所有工具的保存功能创建数据库表
-- ==========================================

-- ==========================================
-- 1. 蒙特卡洛模拟器历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_monte_carlo_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    project_name TEXT,
    tasks JSONB DEFAULT '[]',
    iterations INTEGER DEFAULT 10000,
    confidence_level INTEGER DEFAULT 80,
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. 敏捷估算扑克历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_planning_poker_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    session_name TEXT,
    participants JSONB DEFAULT '[]',
    stories JSONB DEFAULT '[]',
    final_estimates JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. Kanban流动指标历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_kanban_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    board_name TEXT,
    columns JSONB DEFAULT '[]',
    cards JSONB DEFAULT '[]',
    wip_limits JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. 学习曲线模型历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_learning_curve_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    model_name TEXT,
    learning_rate DECIMAL(5,2) DEFAULT 80,
    initial_time INTEGER,
    target_units INTEGER,
    data_points JSONB DEFAULT '[]',
    chart_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 挣值趋势预测历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_evm_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    project_name TEXT,
    evm_data JSONB DEFAULT '[]',
    predictions JSONB DEFAULT '[]',
    analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. FMEA风险分析历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_fmea_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    analysis_name TEXT,
    process_step TEXT,
    failure_modes JSONB DEFAULT '[]',
    risk_analysis JSONB DEFAULT '{}',
    rpn_threshold INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. 关键链法调度历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_ccpm_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    project_name TEXT,
    tasks JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',
    buffer_percentage INTEGER DEFAULT 50,
    critical_chain JSONB DEFAULT '[]',
    schedule_result JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. 鱼骨图分析历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_fishbone_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    problem_statement TEXT,
    categories JSONB DEFAULT '["人", "机", "料", "法", "环"]',
    causes JSONB DEFAULT '{}',
    ai_suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 9. 质量成本模型历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_quality_cost_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    model_name TEXT,
    prevention_cost DECIMAL(10,2),
    appraisal_cost DECIMAL(10,2),
    internal_failure_cost DECIMAL(10,2),
    external_failure_cost DECIMAL(10,2),
    coq_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. 迭代速率跟踪历史记录
-- ==========================================
CREATE TABLE IF NOT EXISTS lab_velocity_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    tracker_name TEXT,
    team_name TEXT,
    sprints JSONB DEFAULT '[]',
    velocity_data JSONB DEFAULT '[]',
    average_velocity DECIMAL(5,2),
    predictions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- RLS 策略 - 用户只能看到自己的历史记录
-- ==========================================

-- 为所有表启用RLS
ALTER TABLE lab_monte_carlo_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_planning_poker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_kanban_flow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_learning_curve_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_evm_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_fmea_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_ccpm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_fishbone_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_quality_cost_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_velocity_trackers ENABLE ROW LEVEL SECURITY;

-- lab_monte_carlo_simulations RLS
DROP POLICY IF EXISTS "view_own_lab_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "insert_lab_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "update_own_lab_monte_carlo" ON lab_monte_carlo_simulations;
CREATE POLICY "view_own_lab_monte_carlo" ON lab_monte_carlo_simulations FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_monte_carlo" ON lab_monte_carlo_simulations FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_monte_carlo" ON lab_monte_carlo_simulations FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_planning_poker_sessions RLS
DROP POLICY IF EXISTS "view_own_lab_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "insert_lab_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "update_own_lab_planning_poker" ON lab_planning_poker_sessions;
CREATE POLICY "view_own_lab_planning_poker" ON lab_planning_poker_sessions FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_planning_poker" ON lab_planning_poker_sessions FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_planning_poker" ON lab_planning_poker_sessions FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_kanban_flow_data RLS
DROP POLICY IF EXISTS "view_own_lab_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "insert_lab_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "update_own_lab_kanban" ON lab_kanban_flow_data;
CREATE POLICY "view_own_lab_kanban" ON lab_kanban_flow_data FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_kanban" ON lab_kanban_flow_data FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_kanban" ON lab_kanban_flow_data FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_learning_curve_models RLS
DROP POLICY IF EXISTS "view_own_lab_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "insert_lab_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "update_own_lab_learning" ON lab_learning_curve_models;
CREATE POLICY "view_own_lab_learning" ON lab_learning_curve_models FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_learning" ON lab_learning_curve_models FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_learning" ON lab_learning_curve_models FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_evm_predictions RLS
DROP POLICY IF EXISTS "view_own_lab_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "insert_lab_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "update_own_lab_evm" ON lab_evm_predictions;
CREATE POLICY "view_own_lab_evm" ON lab_evm_predictions FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_evm" ON lab_evm_predictions FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_evm" ON lab_evm_predictions FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_fmea_analyses RLS
DROP POLICY IF EXISTS "view_own_lab_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "insert_lab_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "update_own_lab_fmea" ON lab_fmea_analyses;
CREATE POLICY "view_own_lab_fmea" ON lab_fmea_analyses FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_fmea" ON lab_fmea_analyses FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_fmea" ON lab_fmea_analyses FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_ccpm_schedules RLS
DROP POLICY IF EXISTS "view_own_lab_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "insert_lab_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "update_own_lab_ccpm" ON lab_ccpm_schedules;
CREATE POLICY "view_own_lab_ccpm" ON lab_ccpm_schedules FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_ccpm" ON lab_ccpm_schedules FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_ccpm" ON lab_ccpm_schedules FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_fishbone_diagrams RLS
DROP POLICY IF EXISTS "view_own_lab_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "insert_lab_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "update_own_lab_fishbone" ON lab_fishbone_diagrams;
CREATE POLICY "view_own_lab_fishbone" ON lab_fishbone_diagrams FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_fishbone" ON lab_fishbone_diagrams FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_fishbone" ON lab_fishbone_diagrams FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_quality_cost_models RLS
DROP POLICY IF EXISTS "view_own_lab_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "insert_lab_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "update_own_lab_quality" ON lab_quality_cost_models;
CREATE POLICY "view_own_lab_quality" ON lab_quality_cost_models FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_quality" ON lab_quality_cost_models FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_quality" ON lab_quality_cost_models FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- lab_velocity_trackers RLS
DROP POLICY IF EXISTS "view_own_lab_velocity" ON lab_velocity_trackers;
DROP POLICY IF EXISTS "insert_lab_velocity" ON lab_velocity_trackers;
DROP POLICY IF EXISTS "update_own_lab_velocity" ON lab_velocity_trackers;
CREATE POLICY "view_own_lab_velocity" ON lab_velocity_trackers FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_lab_velocity" ON lab_velocity_trackers FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_lab_velocity" ON lab_velocity_trackers FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 索引优化
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_lab_monte_carlo_user ON lab_monte_carlo_simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_planning_poker_user ON lab_planning_poker_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_kanban_user ON lab_kanban_flow_data(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_learning_curve_user ON lab_learning_curve_models(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_evm_user ON lab_evm_predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_fmea_user ON lab_fmea_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_ccpm_user ON lab_ccpm_schedules(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_fishbone_user ON lab_fishbone_diagrams(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_quality_cost_user ON lab_quality_cost_models(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_velocity_user ON lab_velocity_trackers(user_id, created_at DESC);

-- ==========================================
-- 完成
-- ==========================================
SELECT '工具历史记录表创建完成' as status;
