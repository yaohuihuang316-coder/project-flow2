-- ==========================================
-- 实战模拟模块数据库修复脚本
-- 确保 RLS 策略和表结构正确
-- ==========================================

-- 1. 确保表存在且有正确的结构
-- 模拟场景表
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
    is_published BOOLEAN DEFAULT false,
    completion_count INTEGER DEFAULT 0,
    estimated_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户模拟进度表
CREATE TABLE IF NOT EXISTS app_simulation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES app_simulation_scenarios(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 0,
    decisions_made JSONB DEFAULT '[]',
    resources_state JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, scenario_id)
);

-- 2. 启用 RLS
ALTER TABLE app_simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_simulation_progress ENABLE ROW LEVEL SECURITY;

-- 3. 删除现有策略（避免重复创建错误）
DROP POLICY IF EXISTS "Public Access Simulation Scenarios" ON app_simulation_scenarios;
DROP POLICY IF EXISTS "Public Access Simulation Progress" ON app_simulation_progress;

-- 4. 创建开放访问策略（开发环境）
-- 场景表：所有人可读，已发布场景
CREATE POLICY "Public Access Simulation Scenarios" 
ON app_simulation_scenarios FOR ALL 
USING (true);

-- 进度表：所有人可读写（实际应用中应该限制为只能访问自己的数据）
CREATE POLICY "Public Access Simulation Progress" 
ON app_simulation_progress FOR ALL 
USING (true);

-- 5. 添加示例场景数据（如果没有数据）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_simulation_scenarios LIMIT 1) THEN
        INSERT INTO app_simulation_scenarios (
            title, 
            description, 
            difficulty, 
            category, 
            stages, 
            learning_objectives,
            estimated_time,
            is_published
        ) VALUES (
            '关键路径危机处理',
            '项目即将上线，关键路径上的任务出现延误，你需要做出正确的决策来保证项目按时交付。',
            'Medium',
            'CPM',
            '[
                {
                    "id": "stage-1",
                    "title": "延误分析",
                    "description": "核心开发任务预计延误3天，你该怎么办？",
                    "context": "项目计划在下周三上线，但核心模块的开发进度比预期慢了3天。团队已经加班一周，士气低落。",
                    "decisions": [
                        {
                            "id": "dec-1a",
                            "text": "增加更多开发人员",
                            "description": "从其他项目组调配2名资深开发",
                            "impact": {"score": 10, "resources": {"budget": -20, "morale": 5}, "feedback": "增加人手可以加快进度，但需要时间熟悉代码，且增加了沟通成本。"},
                            "is_optimal": false
                        },
                        {
                            "id": "dec-1b",
                            "text": "压缩后续测试时间",
                            "description": "将测试周期从5天压缩到2天",
                            "impact": {"score": -10, "resources": {"quality": -15, "time": 3}, "feedback": "压缩测试时间风险很大，可能导致上线后出现严重问题。"},
                            "is_optimal": false
                        },
                        {
                            "id": "dec-1c",
                            "text": "使用快速跟进策略",
                            "description": "让测试团队提前介入，边开发边测试",
                            "impact": {"score": 20, "resources": {"budget": -5, "quality": 5}, "feedback": "优秀的选择！快速跟进可以在不牺牲质量的前提下节省时间。"},
                            "is_optimal": true
                        }
                    ],
                    "resources": {"budget": 100, "time": 10, "morale": 60, "quality": 80}
                },
                {
                    "id": "stage-2",
                    "title": "资源重新分配",
                    "description": "测试团队反馈需要更多时间进行集成测试",
                    "context": "测试团队发现几个模块之间的集成存在问题，建议增加2天测试时间。",
                    "decisions": [
                        {
                            "id": "dec-2a",
                            "text": "推迟上线日期",
                            "description": "延期2天上线，确保质量",
                            "impact": {"score": 15, "resources": {"time": -2, "morale": 10}, "feedback": "勇于面对现实，保证质量的同时也能让团队喘口气。"},
                            "is_optimal": true
                        },
                        {
                            "id": "dec-2b",
                            "text": "减少测试范围",
                            "description": "只测试核心功能，边缘功能上线后再修复",
                            "impact": {"score": -15, "resources": {"quality": -20}, "feedback": "过于冒险！可能导致严重的线上事故。"},
                            "is_optimal": false
                        }
                    ]
                }
            ]'::jsonb,
            '["理解关键路径管理", "掌握进度压缩技术", "学会风险权衡决策"]'::jsonb,
            15,
            true
        );
        
        INSERT INTO app_simulation_scenarios (
            title, 
            description, 
            difficulty, 
            category, 
            stages, 
            learning_objectives,
            estimated_time,
            is_published
        ) VALUES (
            '敏捷冲刺规划',
            '作为Scrum Master，你需要在团队能力和业务需求之间找到平衡。',
            'Easy',
            'Agile',
            '[
                {
                    "id": "stage-1",
                    "title": "需求优先级",
                    "description": "产品负责人希望在本次冲刺中加入一个新需求，但团队容量已经饱和。",
                    "context": "当前冲刺已经规划完毕，产品负责人临时提出一个\"紧急\"需求，要求必须在本迭代完成。",
                    "decisions": [
                        {
                            "id": "dec-1a",
                            "text": "接受需求并加班完成",
                            "description": "让团队加班赶工",
                            "impact": {"score": -5, "resources": {"morale": -15}, "feedback": "频繁加班会损害团队士气，不可持续。"},
                            "is_optimal": false
                        },
                        {
                            "id": "dec-1b",
                            "text": "推迟到下个冲刺",
                            "description": "与产品负责人协商，将这个需求安排到下个迭代",
                            "impact": {"score": 15, "resources": {"morale": 5}, "feedback": "正确！保护团队承诺，维护迭代节奏。"},
                            "is_optimal": true
                        }
                    ],
                    "resources": {"morale": 80, "quality": 90}
                }
            ]'::jsonb,
            '["掌握敏捷原则", "学会保护团队", "理解迭代节奏的重要性"]'::jsonb,
            10,
            true
        );
    END IF;
END $$;

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_app_simulation_scenarios_updated_at ON app_simulation_scenarios;
CREATE TRIGGER update_app_simulation_scenarios_updated_at
    BEFORE UPDATE ON app_simulation_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 添加完成次数更新函数（当用户完成模拟时调用）
CREATE OR REPLACE FUNCTION increment_scenario_completion(scenario_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE app_simulation_scenarios 
    SET completion_count = completion_count + 1 
    WHERE id = scenario_uuid;
END;
$$ LANGUAGE plpgsql;
