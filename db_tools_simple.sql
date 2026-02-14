-- ==========================================
-- 实验室工具历史记录表 - 简化版
-- 逐个创建表
-- ==========================================

-- 先删除旧表（如果有问题的话）
-- DROP TABLE IF EXISTS lab_monte_carlo_simulations CASCADE;
-- DROP TABLE IF EXISTS lab_planning_poker_sessions CASCADE;
-- DROP TABLE IF EXISTS lab_kanban_flow_data CASCADE;
-- DROP TABLE IF EXISTS lab_learning_curve_models CASCADE;
-- DROP TABLE IF EXISTS lab_evm_predictions CASCADE;
-- DROP TABLE IF EXISTS lab_fmea_analyses CASCADE;
-- DROP TABLE IF EXISTS lab_ccpm_schedules CASCADE;
-- DROP TABLE IF EXISTS lab_fishbone_diagrams CASCADE;
-- DROP TABLE IF EXISTS lab_quality_cost_models CASCADE;
-- DROP TABLE IF EXISTS lab_velocity_trackers CASCADE;

-- 创建蒙特卡洛表
CREATE TABLE IF NOT EXISTS lab_monte_carlo_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    project_name TEXT,
    tasks JSONB DEFAULT '[]',
    results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建计划扑克表
CREATE TABLE IF NOT EXISTS lab_planning_poker_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    session_name TEXT,
    stories JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建Kanban表
CREATE TABLE IF NOT EXISTS lab_kanban_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    board_name TEXT,
    cards JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建学习曲线表
CREATE TABLE IF NOT EXISTS lab_learning_curve_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    model_name TEXT,
    data_points JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建EVM表
CREATE TABLE IF NOT EXISTS lab_evm_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    project_name TEXT,
    evm_data JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建FMEA表
CREATE TABLE IF NOT EXISTS lab_fmea_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    analysis_name TEXT,
    failure_modes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建CCPM表
CREATE TABLE IF NOT EXISTS lab_ccpm_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    project_name TEXT,
    tasks JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建鱼骨图表
CREATE TABLE IF NOT EXISTS lab_fishbone_diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    problem_statement TEXT,
    causes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建质量成本表
CREATE TABLE IF NOT EXISTS lab_quality_cost_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    model_name TEXT,
    coq_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建速率跟踪表
CREATE TABLE IF NOT EXISTS lab_velocity_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    tracker_name TEXT,
    velocity_data JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT '10个工具历史表创建完成' as status;
