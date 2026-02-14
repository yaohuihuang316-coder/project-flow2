-- ==========================================
-- 修复 app_simulation_scenarios 表结构
-- 添加缺失的 estimated_time 和 completion_count 列
-- ==========================================

-- 添加 estimated_time 列（如果不存在）
ALTER TABLE app_simulation_scenarios 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 15;

-- 添加 completion_count 列（如果不存在）
ALTER TABLE app_simulation_scenarios 
ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- 更新现有记录的默认值
UPDATE app_simulation_scenarios 
SET estimated_time = 15 
WHERE estimated_time IS NULL;

UPDATE app_simulation_scenarios 
SET completion_count = 0 
WHERE completion_count IS NULL;

SELECT 'app_simulation_scenarios 表结构修复完成' as status;
