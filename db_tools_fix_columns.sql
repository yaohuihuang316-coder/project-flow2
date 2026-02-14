-- ==========================================
-- 修复工具表 - 确保所有表都有user_id列
-- ==========================================

-- 检查并添加user_id列到所有表
DO $$
BEGIN
    -- 1. 蒙特卡洛表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_monte_carlo_simulations' AND column_name = 'user_id') THEN
        ALTER TABLE lab_monte_carlo_simulations ADD COLUMN user_id TEXT;
    END IF;

    -- 2. 计划扑克表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_planning_poker_sessions' AND column_name = 'user_id') THEN
        ALTER TABLE lab_planning_poker_sessions ADD COLUMN user_id TEXT;
    END IF;

    -- 3. Kanban表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_kanban_flow_data' AND column_name = 'user_id') THEN
        ALTER TABLE lab_kanban_flow_data ADD COLUMN user_id TEXT;
    END IF;

    -- 4. 学习曲线表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_learning_curve_models' AND column_name = 'user_id') THEN
        ALTER TABLE lab_learning_curve_models ADD COLUMN user_id TEXT;
    END IF;

    -- 5. EVM表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_evm_predictions' AND column_name = 'user_id') THEN
        ALTER TABLE lab_evm_predictions ADD COLUMN user_id TEXT;
    END IF;

    -- 6. FMEA表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_fmea_analyses' AND column_name = 'user_id') THEN
        ALTER TABLE lab_fmea_analyses ADD COLUMN user_id TEXT;
    END IF;

    -- 7. CCPM表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_ccpm_schedules' AND column_name = 'user_id') THEN
        ALTER TABLE lab_ccpm_schedules ADD COLUMN user_id TEXT;
    END IF;

    -- 8. 鱼骨图表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_fishbone_diagrams' AND column_name = 'user_id') THEN
        ALTER TABLE lab_fishbone_diagrams ADD COLUMN user_id TEXT;
    END IF;

    -- 9. 质量成本表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_quality_cost_models' AND column_name = 'user_id') THEN
        ALTER TABLE lab_quality_cost_models ADD COLUMN user_id TEXT;
    END IF;

    -- 10. 速率跟踪表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lab_velocity_trackers' AND column_name = 'user_id') THEN
        ALTER TABLE lab_velocity_trackers ADD COLUMN user_id TEXT;
    END IF;
END $$;

SELECT 'user_id列检查和添加完成' as status;
