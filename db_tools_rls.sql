-- ==========================================
-- 为工具历史表添加 RLS 策略
-- 在表创建完成后执行
-- ==========================================

-- 启用RLS
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

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "allow_all_lab_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "allow_all_lab_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "allow_all_lab_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "allow_all_lab_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "allow_all_lab_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "allow_all_lab_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "allow_all_lab_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "allow_all_lab_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "allow_all_lab_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "allow_all_lab_velocity" ON lab_velocity_trackers;

-- 创建允许所有操作的策略（简化版）
CREATE POLICY "allow_all_lab_monte_carlo" ON lab_monte_carlo_simulations FOR ALL USING (true);
CREATE POLICY "allow_all_lab_planning_poker" ON lab_planning_poker_sessions FOR ALL USING (true);
CREATE POLICY "allow_all_lab_kanban" ON lab_kanban_flow_data FOR ALL USING (true);
CREATE POLICY "allow_all_lab_learning" ON lab_learning_curve_models FOR ALL USING (true);
CREATE POLICY "allow_all_lab_evm" ON lab_evm_predictions FOR ALL USING (true);
CREATE POLICY "allow_all_lab_fmea" ON lab_fmea_analyses FOR ALL USING (true);
CREATE POLICY "allow_all_lab_ccpm" ON lab_ccpm_schedules FOR ALL USING (true);
CREATE POLICY "allow_all_lab_fishbone" ON lab_fishbone_diagrams FOR ALL USING (true);
CREATE POLICY "allow_all_lab_quality" ON lab_quality_cost_models FOR ALL USING (true);
CREATE POLICY "allow_all_lab_velocity" ON lab_velocity_trackers FOR ALL USING (true);

SELECT 'RLS策略添加完成' as status;
