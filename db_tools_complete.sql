
-- ==========================================
-- ProjectFlow Lab Tools - Complete Database Setup
-- 10个工具完整数据库脚本
-- 包含: 表结构、RLS策略、触发器
-- ==========================================

-- 确保UUID扩展已启用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 第一批工具 (P1) - 核心分析工具
-- ==========================================

-- 1. 蒙特卡洛模拟器表
CREATE TABLE IF NOT EXISTS public.lab_monte_carlo_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    project_name text NOT NULL DEFAULT '未命名项目',
    tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
    simulation_results jsonb DEFAULT '{}'::jsonb,
    iterations int DEFAULT 10000,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. 敏捷估算扑克表
CREATE TABLE IF NOT EXISTS public.lab_planning_poker_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name text NOT NULL DEFAULT '估算会议',
    stories jsonb NOT NULL DEFAULT '[]'::jsonb,
    current_story_index int DEFAULT 0,
    estimates jsonb DEFAULT '{}'::jsonb,
    is_revealed boolean DEFAULT false,
    created_by text REFERENCES public.app_users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Kanban流动指标表
CREATE TABLE IF NOT EXISTS public.lab_kanban_flow_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    board_name text NOT NULL DEFAULT 'Kanban看板',
    daily_snapshots jsonb DEFAULT '[]'::jsonb,
    completed_items jsonb DEFAULT '[]'::jsonb,
    wip_limit int DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 第二批工具 (P2) - 决策支持工具
-- ==========================================

-- 4. 学习曲线模型表
CREATE TABLE IF NOT EXISTS public.lab_learning_curve_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    model_name text NOT NULL DEFAULT '学习曲线分析',
    first_unit_time numeric NOT NULL DEFAULT 100,
    learning_rate numeric NOT NULL DEFAULT 0.8,
    total_units int NOT NULL DEFAULT 100,
    predictions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. 挣值趋势预测表
CREATE TABLE IF NOT EXISTS public.lab_evm_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    project_name text NOT NULL DEFAULT 'EVM分析项目',
    historical_data jsonb NOT NULL DEFAULT '[]'::jsonb,
    predictions jsonb DEFAULT '{}'::jsonb,
    ai_analysis text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 6. 迭代速率跟踪表
CREATE TABLE IF NOT EXISTS public.lab_velocity_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    team_name text NOT NULL DEFAULT '开发团队',
    sprints jsonb NOT NULL DEFAULT '[]'::jsonb,
    average_velocity numeric DEFAULT 0,
    trend jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 7. FMEA分析表
CREATE TABLE IF NOT EXISTS public.lab_fmea_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    analysis_name text NOT NULL DEFAULT 'FMEA分析',
    failure_modes jsonb NOT NULL DEFAULT '[]'::jsonb,
    high_risk_items int DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 第三批工具 (P3) - 高级分析工具
-- ==========================================

-- 8. 关键链法(CCPM)调度表
CREATE TABLE IF NOT EXISTS public.lab_ccpm_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    project_name text NOT NULL DEFAULT 'CCPM项目',
    tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
    resource_constraints jsonb DEFAULT '[]'::jsonb,
    critical_chain jsonb DEFAULT '[]'::jsonb,
    project_buffer numeric DEFAULT 0,
    feeding_buffers jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 9. 鱼骨图根因分析表
CREATE TABLE IF NOT EXISTS public.lab_fishbone_diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    problem_statement text NOT NULL DEFAULT '问题描述',
    categories jsonb NOT NULL DEFAULT '["人", "机", "料", "法", "环"]'::jsonb,
    causes jsonb NOT NULL DEFAULT '{}'::jsonb,
    ai_suggestions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 10. 质量成本模型表
CREATE TABLE IF NOT EXISTS public.lab_quality_cost_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    model_name text NOT NULL DEFAULT '质量成本分析',
    prevention_cost numeric DEFAULT 0,
    appraisal_cost numeric DEFAULT 0,
    internal_failure_cost numeric DEFAULT 0,
    external_failure_cost numeric DEFAULT 0,
    total_sales numeric DEFAULT 1000000,
    coq_percentage numeric DEFAULT 0,
    breakdown jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- Row Level Security (RLS) - 所有表
-- ==========================================

-- P1 表 RLS
ALTER TABLE public.lab_monte_carlo_simulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Monte Carlo" ON public.lab_monte_carlo_simulations;
CREATE POLICY "Public Access Monte Carlo" ON public.lab_monte_carlo_simulations FOR ALL USING (true);

ALTER TABLE public.lab_planning_poker_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Planning Poker" ON public.lab_planning_poker_sessions;
CREATE POLICY "Public Access Planning Poker" ON public.lab_planning_poker_sessions FOR ALL USING (true);

ALTER TABLE public.lab_kanban_flow_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Kanban Flow" ON public.lab_kanban_flow_data;
CREATE POLICY "Public Access Kanban Flow" ON public.lab_kanban_flow_data FOR ALL USING (true);

-- P2 表 RLS
ALTER TABLE public.lab_learning_curve_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Learning Curve" ON public.lab_learning_curve_models;
CREATE POLICY "Public Access Learning Curve" ON public.lab_learning_curve_models FOR ALL USING (true);

ALTER TABLE public.lab_evm_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access EVM" ON public.lab_evm_predictions;
CREATE POLICY "Public Access EVM" ON public.lab_evm_predictions FOR ALL USING (true);

ALTER TABLE public.lab_velocity_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Velocity" ON public.lab_velocity_trackers;
CREATE POLICY "Public Access Velocity" ON public.lab_velocity_trackers FOR ALL USING (true);

ALTER TABLE public.lab_fmea_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access FMEA" ON public.lab_fmea_analyses;
CREATE POLICY "Public Access FMEA" ON public.lab_fmea_analyses FOR ALL USING (true);

-- P3 表 RLS
ALTER TABLE public.lab_ccpm_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access CCPM" ON public.lab_ccpm_schedules;
CREATE POLICY "Public Access CCPM" ON public.lab_ccpm_schedules FOR ALL USING (true);

ALTER TABLE public.lab_fishbone_diagrams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Fishbone" ON public.lab_fishbone_diagrams;
CREATE POLICY "Public Access Fishbone" ON public.lab_fishbone_diagrams FOR ALL USING (true);

ALTER TABLE public.lab_quality_cost_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Quality Cost" ON public.lab_quality_cost_models;
CREATE POLICY "Public Access Quality Cost" ON public.lab_quality_cost_models FOR ALL USING (true);

-- ==========================================
-- 自动更新 updated_at 触发器函数
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- P1 表触发器
DROP TRIGGER IF EXISTS update_lab_monte_carlo_updated_at ON public.lab_monte_carlo_simulations;
CREATE TRIGGER update_lab_monte_carlo_updated_at
    BEFORE UPDATE ON public.lab_monte_carlo_simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_planning_poker_updated_at ON public.lab_planning_poker_sessions;
CREATE TRIGGER update_lab_planning_poker_updated_at
    BEFORE UPDATE ON public.lab_planning_poker_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_kanban_flow_updated_at ON public.lab_kanban_flow_data;
CREATE TRIGGER update_lab_kanban_flow_updated_at
    BEFORE UPDATE ON public.lab_kanban_flow_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- P2 表触发器
DROP TRIGGER IF EXISTS update_lab_learning_curve_updated_at ON public.lab_learning_curve_models;
CREATE TRIGGER update_lab_learning_curve_updated_at
    BEFORE UPDATE ON public.lab_learning_curve_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_evm_updated_at ON public.lab_evm_predictions;
CREATE TRIGGER update_lab_evm_updated_at
    BEFORE UPDATE ON public.lab_evm_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_velocity_updated_at ON public.lab_velocity_trackers;
CREATE TRIGGER update_lab_velocity_updated_at
    BEFORE UPDATE ON public.lab_velocity_trackers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_fmea_updated_at ON public.lab_fmea_analyses;
CREATE TRIGGER update_lab_fmea_updated_at
    BEFORE UPDATE ON public.lab_fmea_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- P3 表触发器
DROP TRIGGER IF EXISTS update_lab_ccpm_updated_at ON public.lab_ccpm_schedules;
CREATE TRIGGER update_lab_ccpm_updated_at
    BEFORE UPDATE ON public.lab_ccpm_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_fishbone_updated_at ON public.lab_fishbone_diagrams;
CREATE TRIGGER update_lab_fishbone_updated_at
    BEFORE UPDATE ON public.lab_fishbone_diagrams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_quality_cost_updated_at ON public.lab_quality_cost_models;
CREATE TRIGGER update_lab_quality_cost_updated_at
    BEFORE UPDATE ON public.lab_quality_cost_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 脚本执行完成提示
-- ==========================================

-- 验证表是否创建成功
DO $$
DECLARE
    table_count int;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'lab_%';
    
    RAISE NOTICE 'ProjectFlow Lab Tools 数据库初始化完成！';
    RAISE NOTICE '共创建 % 个工具数据表', table_count;
END $$;
