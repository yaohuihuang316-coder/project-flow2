
-- ==========================================
-- ProjectFlow Lab Tools Database Setup (v1)
-- 新增工具表: 蒙特卡洛模拟器, 敏捷估算扑克, Kanban流动指标
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
-- Row Level Security (RLS)
-- ==========================================

ALTER TABLE public.lab_monte_carlo_simulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Monte Carlo" ON public.lab_monte_carlo_simulations;
CREATE POLICY "Public Access Monte Carlo" ON public.lab_monte_carlo_simulations FOR ALL USING (true);

ALTER TABLE public.lab_planning_poker_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Planning Poker" ON public.lab_planning_poker_sessions;
CREATE POLICY "Public Access Planning Poker" ON public.lab_planning_poker_sessions FOR ALL USING (true);

ALTER TABLE public.lab_kanban_flow_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Kanban Flow" ON public.lab_kanban_flow_data;
CREATE POLICY "Public Access Kanban Flow" ON public.lab_kanban_flow_data FOR ALL USING (true);

-- ==========================================
-- 自动更新 updated_at 的触发器
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

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
