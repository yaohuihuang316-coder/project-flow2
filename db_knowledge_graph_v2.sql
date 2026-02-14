-- ==========================================
-- 知识图谱 V2 数据库表结构
-- ==========================================

-- 知识节点表（增强版）
CREATE TABLE IF NOT EXISTS app_kb_nodes_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    type TEXT NOT NULL, -- 'concept', 'skill', 'certification'
    category TEXT NOT NULL, -- 'foundation', 'advanced', 'expert'
    description TEXT,
    difficulty INTEGER DEFAULT 1, -- 1-5
    estimated_hours INTEGER DEFAULT 2,
    x_position FLOAT,
    y_position FLOAT,
    symbol_size INTEGER DEFAULT 30,
    
    -- 学习相关
    course_id TEXT REFERENCES app_courses(id),
    resources JSONB DEFAULT '[]', -- [{"type": "video", "url": "...", "title": "..."}]
    
    -- 前置依赖（存储前置知识点的label数组）
    prerequisites JSONB DEFAULT '[]'::jsonb,
    
    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 知识连接表（V2版本，使用UUID）
CREATE TABLE IF NOT EXISTS app_kb_edges_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES app_kb_nodes_v2(id) ON DELETE CASCADE,
    target_id UUID REFERENCES app_kb_nodes_v2(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'prerequisite',
    strength FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户知识掌握度表
CREATE TABLE IF NOT EXISTS app_user_knowledge_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES app_kb_nodes_v2(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0, -- 0-100
    status TEXT DEFAULT 'locked', -- 'locked', 'unlocked', 'in_progress', 'completed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    study_time_minutes INTEGER DEFAULT 0,
    UNIQUE(user_id, node_id)
);

-- 学习路径推荐表
CREATE TABLE IF NOT EXISTS app_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES app_kb_nodes_v2(id) ON DELETE CASCADE,
    path_nodes UUID[] DEFAULT '{}', -- 推荐的学习顺序
    estimated_hours INTEGER,
    difficulty_score FLOAT, -- 路径难度评分
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_kb_nodes_category ON app_kb_nodes_v2(category);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_type ON app_kb_nodes_v2(type);
CREATE INDEX IF NOT EXISTS idx_kb_edges_source ON app_kb_edges_v2(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_edges_target ON app_kb_edges_v2(target_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_user ON app_user_knowledge_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_node ON app_user_knowledge_mastery(node_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON app_learning_paths(user_id);

-- RLS 策略
ALTER TABLE app_kb_nodes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_kb_edges_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_knowledge_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_learning_paths ENABLE ROW LEVEL SECURITY;

-- 知识节点公开可读
CREATE POLICY "kb_nodes_public_read" ON app_kb_nodes_v2 FOR SELECT USING (true);

-- 连接公开可读
CREATE POLICY "kb_edges_public_read" ON app_kb_edges_v2 FOR SELECT USING (true);

-- 用户只能看到自己的掌握度
CREATE POLICY "user_mastery_own" ON app_user_knowledge_mastery 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- 用户只能看到自己的学习路径
CREATE POLICY "learning_paths_own" ON app_learning_paths 
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- ==========================================
-- 插入示例知识节点数据
-- ==========================================

INSERT INTO app_kb_nodes_v2 (label, type, category, description, difficulty, estimated_hours, x_position, y_position, symbol_size, prerequisites)
VALUES 
    -- 基础层 (Foundation)
    ('项目管理概述', 'concept', 'foundation', '项目管理的基本概念、五大过程组、十大知识领域', 1, 3, 400, 200, 30, '{}'),
    ('五大过程组', 'concept', 'foundation', '启动、规划、执行、监控、收尾', 1, 2, 300, 250, 25, '["项目管理概述"]'),
    ('十大知识领域', 'concept', 'foundation', '整合、范围、进度、成本、质量、资源、沟通、风险、采购、干系人', 2, 4, 500, 250, 35, '["项目管理概述"]'),
    
    -- 进阶层 (Advanced)
    ('WBS工作分解', 'skill', 'advanced', '工作分解结构的创建方法和最佳实践', 2, 4, 250, 350, 30, '["五大过程组", "十大知识领域"]'),
    ('关键路径法', 'skill', 'advanced', 'CPM计算、浮动时间、关键链', 3, 5, 400, 400, 40, '["五大过程组"]'),
    ('挣值管理', 'skill', 'advanced', 'EVM核心指标：PV, EV, AC, SPI, CPI, EAC', 3, 5, 550, 350, 40, '["十大知识领域"]'),
    ('敏捷宣言', 'concept', 'advanced', '敏捷开发的四大价值观和十二原则', 1, 2, 650, 300, 25, '{}'),
    ('Scrum框架', 'skill', 'advanced', '敏捷开发最流行的框架', 2, 3, 700, 400, 35, '["敏捷宣言"]'),
    ('看板方法', 'skill', 'advanced', '可视化工作流程管理方法', 2, 3, 750, 350, 30, '["敏捷宣言"]'),
    
    -- 专家层 (Expert)
    ('PMP认证', 'certification', 'expert', '项目管理专业人士认证', 4, 10, 300, 500, 50, '["项目管理概述", "五大过程组", "十大知识领域"]'),
    ('Scrum Master', 'certification', 'expert', 'Scrum敏捷教练认证', 3, 8, 700, 500, 45, '["Scrum框架"]'),
    ('商业分析', 'skill', 'expert', '需求分析与商业价值评估', 3, 5, 500, 500, 40, '["十大知识领域"]'),
    ('项目集管理', 'skill', 'expert', '多项目协调与战略对齐', 4, 6, 500, 550, 45, '["项目集管理"]'),
    ('全生命周期', 'skill', 'expert', '项目从启动到收尾的完整实践', 4, 8, 400, 550, 45, '["五大过程组", "十大知识领域"]')
ON CONFLICT DO NOTHING;

-- 插入知识连接关系
INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    1.0
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '项目管理概述' AND t.label = '五大过程组'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    1.0
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '项目管理概述' AND t.label = '十大知识领域'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    0.8
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '五大过程组' AND t.label = 'WBS工作分解'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    0.8
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '五大过程组' AND t.label = '关键路径法'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    0.8
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '十大知识领域' AND t.label = '挣值管理'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    1.0
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '敏捷宣言' AND t.label = 'Scrum框架'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    0.8
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = '敏捷宣言' AND t.label = '看板方法'
ON CONFLICT DO NOTHING;

INSERT INTO app_kb_edges_v2 (source_id, target_id, relationship, strength)
SELECT 
    s.id as source_id,
    t.id as target_id,
    'prerequisite',
    1.0
FROM app_kb_nodes_v2 s, app_kb_nodes_v2 t
WHERE s.label = 'Scrum框架' AND t.label = 'Scrum Master'
ON CONFLICT DO NOTHING;

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_kb_nodes_updated_at ON app_kb_nodes_v2;
CREATE TRIGGER update_kb_nodes_updated_at
    BEFORE UPDATE ON app_kb_nodes_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON app_learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON app_learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT '知识图谱 V2 数据库表创建完成' as status;
