-- ==========================================
-- 严格版 RLS 策略
-- 每个用户只能看到自己的工具历史记录
-- ==========================================

-- 删除所有旧策略
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

-- ==========================================
-- 1. 蒙特卡洛模拟器
-- ==========================================
DROP POLICY IF EXISTS "view_own_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "insert_own_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "update_own_monte_carlo" ON lab_monte_carlo_simulations;
DROP POLICY IF EXISTS "delete_own_monte_carlo" ON lab_monte_carlo_simulations;

CREATE POLICY "view_own_monte_carlo" ON lab_monte_carlo_simulations FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_monte_carlo" ON lab_monte_carlo_simulations FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_monte_carlo" ON lab_monte_carlo_simulations FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_monte_carlo" ON lab_monte_carlo_simulations FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 2. 敏捷估算扑克
-- ==========================================
DROP POLICY IF EXISTS "view_own_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "insert_own_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "update_own_planning_poker" ON lab_planning_poker_sessions;
DROP POLICY IF EXISTS "delete_own_planning_poker" ON lab_planning_poker_sessions;

CREATE POLICY "view_own_planning_poker" ON lab_planning_poker_sessions FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_planning_poker" ON lab_planning_poker_sessions FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_planning_poker" ON lab_planning_poker_sessions FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_planning_poker" ON lab_planning_poker_sessions FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 3. Kanban流动指标
-- ==========================================
DROP POLICY IF EXISTS "view_own_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "insert_own_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "update_own_kanban" ON lab_kanban_flow_data;
DROP POLICY IF EXISTS "delete_own_kanban" ON lab_kanban_flow_data;

CREATE POLICY "view_own_kanban" ON lab_kanban_flow_data FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_kanban" ON lab_kanban_flow_data FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_kanban" ON lab_kanban_flow_data FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_kanban" ON lab_kanban_flow_data FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 4. 学习曲线模型
-- ==========================================
DROP POLICY IF EXISTS "view_own_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "insert_own_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "update_own_learning" ON lab_learning_curve_models;
DROP POLICY IF EXISTS "delete_own_learning" ON lab_learning_curve_models;

CREATE POLICY "view_own_learning" ON lab_learning_curve_models FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_learning" ON lab_learning_curve_models FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_learning" ON lab_learning_curve_models FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_learning" ON lab_learning_curve_models FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 5. 挣值趋势预测
-- ==========================================
DROP POLICY IF EXISTS "view_own_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "insert_own_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "update_own_evm" ON lab_evm_predictions;
DROP POLICY IF EXISTS "delete_own_evm" ON lab_evm_predictions;

CREATE POLICY "view_own_evm" ON lab_evm_predictions FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_evm" ON lab_evm_predictions FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_evm" ON lab_evm_predictions FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_evm" ON lab_evm_predictions FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 6. FMEA风险分析
-- ==========================================
DROP POLICY IF EXISTS "view_own_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "insert_own_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "update_own_fmea" ON lab_fmea_analyses;
DROP POLICY IF EXISTS "delete_own_fmea" ON lab_fmea_analyses;

CREATE POLICY "view_own_fmea" ON lab_fmea_analyses FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_fmea" ON lab_fmea_analyses FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_fmea" ON lab_fmea_analyses FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_fmea" ON lab_fmea_analyses FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 7. 关键链法调度
-- ==========================================
DROP POLICY IF EXISTS "view_own_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "insert_own_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "update_own_ccpm" ON lab_ccpm_schedules;
DROP POLICY IF EXISTS "delete_own_ccpm" ON lab_ccpm_schedules;

CREATE POLICY "view_own_ccpm" ON lab_ccpm_schedules FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_ccpm" ON lab_ccpm_schedules FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_ccpm" ON lab_ccpm_schedules FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_ccpm" ON lab_ccpm_schedules FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 8. 鱼骨图分析
-- ==========================================
DROP POLICY IF EXISTS "view_own_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "insert_own_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "update_own_fishbone" ON lab_fishbone_diagrams;
DROP POLICY IF EXISTS "delete_own_fishbone" ON lab_fishbone_diagrams;

CREATE POLICY "view_own_fishbone" ON lab_fishbone_diagrams FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_fishbone" ON lab_fishbone_diagrams FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_fishbone" ON lab_fishbone_diagrams FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_fishbone" ON lab_fishbone_diagrams FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 9. 质量成本模型
-- ==========================================
DROP POLICY IF EXISTS "view_own_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "insert_own_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "update_own_quality" ON lab_quality_cost_models;
DROP POLICY IF EXISTS "delete_own_quality" ON lab_quality_cost_models;

CREATE POLICY "view_own_quality" ON lab_quality_cost_models FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_quality" ON lab_quality_cost_models FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_quality" ON lab_quality_cost_models FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_quality" ON lab_quality_cost_models FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 10. 迭代速率跟踪
-- ==========================================
DROP POLICY IF EXISTS "view_own_velocity" ON lab_velocity_trackers;
DROP POLICY IF EXISTS "insert_own_velocity" ON lab_velocity_trackers;
DROP POLICY IF EXISTS "update_own_velocity" ON lab_velocity_trackers;
DROP POLICY IF EXISTS "delete_own_velocity" ON lab_velocity_trackers;

CREATE POLICY "view_own_velocity" ON lab_velocity_trackers FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_velocity" ON lab_velocity_trackers FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_velocity" ON lab_velocity_trackers FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "delete_own_velocity" ON lab_velocity_trackers FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 完成
-- ==========================================
SELECT '严格版RLS策略已启用 - 用户数据隔离完成' as status;
