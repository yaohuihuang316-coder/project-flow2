-- ==========================================
-- 实验室工具历史记录表 - 修复版
-- 确保所有表都有user_id列
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

-- 确保user_id列存在
ALTER TABLE lab_monte_carlo_simulations DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_monte_carlo_simulations ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_planning_poker_sessions DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_planning_poker_sessions ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_kanban_flow_data DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_kanban_flow_data ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_learning_curve_models DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_learning_curve_models ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_evm_predictions DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_evm_predictions ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_fmea_analyses DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_fmea_analyses ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_ccpm_schedules DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_ccpm_schedules ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_fishbone_diagrams DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_fishbone_diagrams ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_quality_cost_models DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_quality_cost_models ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

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

ALTER TABLE lab_velocity_trackers DROP COLUMN IF EXISTS user_id;
ALTER TABLE lab_velocity_trackers ADD COLUMN user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

-- ==========================================
-- RLS 策略
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

-- 删除所有旧策略
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'lab_monte_carlo_simulations', 'lab_planning_poker_sessions', 'lab_kanban_flow_data',
        'lab_learning_curve_models', 'lab_evm_predictions', 'lab_fmea_analyses',
        'lab_ccpm_schedules', 'lab_fishbone_diagrams', 'lab_quality_cost_models', 'lab_velocity_trackers'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS view_own_%s ON %s', t, t);
        EXECUTE format('DROP POLICY IF EXISTS insert_%s ON %s', t, t);
        EXECUTE format('DROP POLICY IF EXISTS update_own_%s ON %s', t, t);
    END LOOP;
END $$;

-- 创建新策略
CREATE POLICY view_own_lab_monte_carlo_simulations ON lab_monte_carlo_simulations FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_monte_carlo_simulations ON lab_monte_carlo_simulations FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_monte_carlo_simulations ON lab_monte_carlo_simulations FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_planning_poker_sessions ON lab_planning_poker_sessions FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_planning_poker_sessions ON lab_planning_poker_sessions FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_planning_poker_sessions ON lab_planning_poker_sessions FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_kanban_flow_data ON lab_kanban_flow_data FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_kanban_flow_data ON lab_kanban_flow_data FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_kanban_flow_data ON lab_kanban_flow_data FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_learning_curve_models ON lab_learning_curve_models FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_learning_curve_models ON lab_learning_curve_models FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_learning_curve_models ON lab_learning_curve_models FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_evm_predictions ON lab_evm_predictions FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_evm_predictions ON lab_evm_predictions FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_evm_predictions ON lab_evm_predictions FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_fmea_analyses ON lab_fmea_analyses FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_fmea_analyses ON lab_fmea_analyses FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_fmea_analyses ON lab_fmea_analyses FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_ccpm_schedules ON lab_ccpm_schedules FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_ccpm_schedules ON lab_ccpm_schedules FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_ccpm_schedules ON lab_ccpm_schedules FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_fishbone_diagrams ON lab_fishbone_diagrams FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_fishbone_diagrams ON lab_fishbone_diagrams FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_fishbone_diagrams ON lab_fishbone_diagrams FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_quality_cost_models ON lab_quality_cost_models FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_quality_cost_models ON lab_quality_cost_models FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_quality_cost_models ON lab_quality_cost_models FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

CREATE POLICY view_own_lab_velocity_trackers ON lab_velocity_trackers FOR SELECT USING (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY insert_lab_velocity_trackers ON lab_velocity_trackers FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid()::TEXT);
CREATE POLICY update_own_lab_velocity_trackers ON lab_velocity_trackers FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid()::TEXT);

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
