-- ==========================================
-- ProjectFlow 平台改造数据库迁移脚本 (修正版)
-- 版本: v1.2
-- 日期: 2026-02-03
-- 说明: 根据实际数据库结构调整，使用现有列
-- ==========================================

-- ==========================================
-- 第一部分：知识图谱扩展 (基于现有列)
-- ==========================================

-- app_kb_nodes 现有列: id, label, type, description, difficulty, estimated_hours, created_at
-- 添加课程关联字段
ALTER TABLE app_kb_nodes 
ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES app_courses(id),
ADD COLUMN IF NOT EXISTS course_category TEXT, -- 'Foundation'|'Advanced'|'Implementation'
ADD COLUMN IF NOT EXISTS node_level INTEGER DEFAULT 1, -- 1=基础, 2=进阶, 3=实战
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;

-- app_kb_edges 现有列: id, source_id, target_id, type, weight, description, created_at
-- 添加关系类型和强度
ALTER TABLE app_kb_edges 
ADD COLUMN IF NOT EXISTS relation_type TEXT DEFAULT 'related', -- 'prerequisite'|'related'|'leads_to'|'part_of'
ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 1; -- 关联强度 1-3

-- 用户知识掌握度表
CREATE TABLE IF NOT EXISTS app_user_kb_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id INTEGER REFERENCES app_kb_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0, -- 0-100 掌握度
    last_studied_at TIMESTAMP WITH TIME ZONE,
    study_count INTEGER DEFAULT 0,
    UNIQUE(user_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_user_kb_mastery_user_id ON app_user_kb_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kb_mastery_node_id ON app_user_kb_mastery(node_id);

-- 课程表扩展现有列
-- app_courses 现有: id, category, title, author, description, image, status, duration, views, chapters, resources, created_at, rating, last_update
ALTER TABLE app_courses 
ADD COLUMN IF NOT EXISTS kb_node_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_path_order INTEGER,
ADD COLUMN IF NOT EXISTS category_color TEXT;

-- ==========================================
-- 第二部分：AI使用追踪
-- ==========================================

-- app_users 现有 subscription_tier, 复用作为会员等级
-- 添加AI使用追踪字段
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'none', -- 'none'|'basic'|'pro'
ADD COLUMN IF NOT EXISTS ai_daily_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_daily_reset_at TIMESTAMP WITH TIME ZONE;

-- AI使用记录表
CREATE TABLE IF NOT EXISTS app_ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    model TEXT NOT NULL, -- 'gemini-flash'|'kimi-2.5'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 第三部分：会员系统 (使用现有 subscription_tier)
-- ==========================================

-- app_users 已有 subscription_tier ('Free'|'Pro'|'Pro+'), 添加完成课程统计
-- 更新现有 subscription_tier 值为小写格式
UPDATE app_users SET subscription_tier = 'free' WHERE subscription_tier = 'Free';
UPDATE app_users SET subscription_tier = 'pro' WHERE subscription_tier = 'Pro';
UPDATE app_users SET subscription_tier = 'pro_plus' WHERE subscription_tier = 'Pro+';

-- 添加新列
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS completed_courses_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_lifetime_member BOOLEAN DEFAULT false;

-- 会员订阅记录表
CREATE TABLE IF NOT EXISTS membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL, -- 'pro'|'pro_plus'
    payment_method TEXT, -- 'course_completion'|'payment'|'code'
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会员兑换码表
CREATE TABLE IF NOT EXISTS membership_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL, -- 'pro'|'pro_plus'
    duration_days INTEGER DEFAULT 30,
    is_used BOOLEAN DEFAULT false,
    used_by TEXT REFERENCES app_users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 课程完成追踪视图
CREATE OR REPLACE VIEW user_course_stats AS
SELECT 
    user_id,
    COUNT(*) as enrolled_courses,
    COUNT(*) FILTER (WHERE progress >= 100) as completed_courses
FROM app_user_progress
GROUP BY user_id;

-- 自动更新用户完成课程数函数
CREATE OR REPLACE FUNCTION update_user_completed_courses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_users 
    SET completed_courses_count = (
        SELECT COUNT(*) 
        FROM app_user_progress 
        WHERE user_id = NEW.user_id AND progress >= 100
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_completed_courses ON app_user_progress;
CREATE TRIGGER trigger_update_completed_courses
    AFTER INSERT OR UPDATE ON app_user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_completed_courses();

-- ==========================================
-- 第四部分：RLS权限设置
-- ==========================================

-- 用户知识掌握度表
ALTER TABLE app_user_kb_mastery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own mastery" ON app_user_kb_mastery;
CREATE POLICY "Users can view own mastery" 
    ON app_user_kb_mastery FOR ALL 
    USING (user_id = current_setting('app.current_user_id', true)::text);

-- AI使用记录表
ALTER TABLE app_ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON app_ai_usage;
CREATE POLICY "Users can view own usage" 
    ON app_ai_usage FOR ALL 
    USING (user_id = current_setting('app.current_user_id', true)::text);

-- 会员订阅记录表
ALTER TABLE membership_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON membership_subscriptions;
CREATE POLICY "Users can view own subscriptions" 
    ON membership_subscriptions FOR ALL 
    USING (user_id = current_setting('app.current_user_id', true)::text);

-- 会员兑换码表
ALTER TABLE membership_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access codes" ON membership_codes;
CREATE POLICY "Public access codes" 
    ON membership_codes FOR ALL 
    USING (true);

-- ==========================================
-- 第五部分：18门课程种子数据
-- ==========================================

DO $$
DECLARE
    -- Foundation 课程章节
    chapters_f1 jsonb := '[{"id": "ch-1-1", "title": "项目管理概述", "duration": "15:00", "type": "video"}, {"id": "ch-1-2", "title": "五大过程组", "duration": "20:00", "type": "video"}, {"id": "ch-1-3", "title": "十大知识领域", "duration": "25:00", "type": "video"}]';
    chapters_f2 jsonb := '[{"id": "ch-2-1", "title": "敏捷宣言解读", "duration": "15:00", "type": "video"}, {"id": "ch-2-2", "title": "Scrum框架", "duration": "30:00", "type": "video"}, {"id": "ch-2-3", "title": "看板方法", "duration": "20:00", "type": "video"}]';
    chapters_f3 jsonb := '[{"id": "ch-3-1", "title": "WBS基础", "duration": "20:00", "type": "video"}, {"id": "ch-3-2", "title": "分解技巧", "duration": "25:00", "type": "video"}, {"id": "ch-3-3", "title": "WBS实践", "duration": "30:00", "type": "video"}]';
    chapters_f4 jsonb := '[{"id": "ch-4-1", "title": "进度规划", "duration": "20:00", "type": "video"}, {"id": "ch-4-2", "title": "关键路径", "duration": "25:00", "type": "video"}, {"id": "ch-4-3", "title": "进度控制", "duration": "20:00", "type": "video"}]';
    chapters_f5 jsonb := '[{"id": "ch-5-1", "title": "风险识别", "duration": "15:00", "type": "video"}, {"id": "ch-5-2", "title": "风险评估", "duration": "20:00", "type": "video"}, {"id": "ch-5-3", "title": "风险应对", "duration": "20:00", "type": "video"}]';
    chapters_f6 jsonb := '[{"id": "ch-6-1", "title": "团队建设", "duration": "15:00", "type": "video"}, {"id": "ch-6-2", "title": "沟通技巧", "duration": "20:00", "type": "video"}, {"id": "ch-6-3", "title": "冲突解决", "duration": "20:00", "type": "video"}]';
    
    -- Advanced 课程章节
    chapters_a1 jsonb := '[{"id": "ch-a1-1", "title": "PMP考试指南", "duration": "30:00", "type": "video"}, {"id": "ch-a1-2", "title": "敏捷专题", "duration": "45:00", "type": "video"}, {"id": "ch-a1-3", "title": "模拟考试", "duration": "60:00", "type": "quiz"}]';
    chapters_a2 jsonb := '[{"id": "ch-a2-1", "title": "EVM基础", "duration": "20:00", "type": "video"}, {"id": "ch-a2-2", "title": "指标分析", "duration": "25:00", "type": "video"}, {"id": "ch-a2-3", "title": "预测技术", "duration": "30:00", "type": "video"}]';
    chapters_a3 jsonb := '[{"id": "ch-a3-1", "title": "CPM算法", "duration": "25:00", "type": "video"}, {"id": "ch-a3-2", "title": "资源优化", "duration": "30:00", "type": "video"}, {"id": "ch-a3-3", "title": "关键链", "duration": "20:00", "type": "video"}]';
    chapters_a4 jsonb := '[{"id": "ch-a4-1", "title": "Scrum Master", "duration": "30:00", "type": "video"}, {"id": "ch-a4-2", "title": "敏捷教练", "duration": "35:00", "type": "video"}, {"id": "ch-a4-3", "title": "规模化敏捷", "duration": "40:00", "type": "video"}]';
    chapters_a5 jsonb := '[{"id": "ch-a5-1", "title": "需求分析", "duration": "25:00", "type": "video"}, {"id": "ch-a5-2", "title": "商业论证", "duration": "30:00", "type": "video"}, {"id": "ch-a5-3", "title": "价值交付", "duration": "25:00", "type": "video"}]';
    chapters_a6 jsonb := '[{"id": "ch-a6-1", "title": "项目集战略", "duration": "30:00", "type": "video"}, {"id": "ch-a6-2", "title": "治理框架", "duration": "35:00", "type": "video"}, {"id": "ch-a6-3", "title": "收益管理", "duration": "30:00", "type": "video"}]';
    
    -- Implementation 课程章节
    chapters_i1 jsonb := '[{"id": "ch-i1-1", "title": "启动阶段", "duration": "30:00", "type": "video"}, {"id": "ch-i1-2", "title": "规划阶段", "duration": "45:00", "type": "video"}, {"id": "ch-i1-3", "title": "执行监控", "duration": "40:00", "type": "video"}, {"id": "ch-i1-4", "title": "收尾阶段", "duration": "25:00", "type": "video"}]';
    chapters_i2 jsonb := '[{"id": "ch-i2-1", "title": "CI/CD", "duration": "35:00", "type": "video"}, {"id": "ch-i2-2", "title": "容器化", "duration": "40:00", "type": "video"}, {"id": "ch-i2-3", "title": "监控告警", "duration": "30:00", "type": "video"}]';
    chapters_i3 jsonb := '[{"id": "ch-i3-1", "title": "成功案例", "duration": "45:00", "type": "video"}, {"id": "ch-i3-2", "title": "失败案例", "duration": "45:00", "type": "video"}, {"id": "ch-i3-3", "title": "经验教训", "duration": "30:00", "type": "video"}]';
    chapters_i4 jsonb := '[{"id": "ch-i4-1", "title": "Jira实战", "duration": "30:00", "type": "video"}, {"id": "ch-i4-2", "title": "MS Project", "duration": "35:00", "type": "video"}, {"id": "ch-i4-3", "title": "Confluence", "duration": "25:00", "type": "video"}]';
    chapters_i5 jsonb := '[{"id": "ch-i5-1", "title": "复盘方法", "duration": "25:00", "type": "video"}, {"id": "ch-i5-2", "title": "持续改进", "duration": "30:00", "type": "video"}, {"id": "ch-i5-3", "title": "知识管理", "duration": "25:00", "type": "video"}]';
    chapters_i6 jsonb := '[{"id": "ch-i6-1", "title": "领导力", "duration": "35:00", "type": "video"}, {"id": "ch-i6-2", "title": "影响力", "duration": "30:00", "type": "video"}, {"id": "ch-i6-3", "title": "情商管理", "duration": "30:00", "type": "video"}]';
BEGIN
    -- Foundation 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-f1', '项目管理概述', 'Dr. Zhang', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', '3h 30m', chapters_f1, 1200, 1, '#3b82f6'),
    ('c-f2', '敏捷开发基础', 'Alex Agile', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800', '2h 45m', chapters_f2, 980, 2, '#3b82f6'),
    ('c-f3', 'WBS工作分解结构', 'Mike Wang', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800', '3h 15m', chapters_f3, 850, 3, '#3b82f6'),
    ('c-f4', '项目进度管理', 'Sarah Li', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800', '3h 00m', chapters_f4, 920, 4, '#3b82f6'),
    ('c-f5', '风险管理入门', 'Tom Chen', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', '2h 20m', chapters_f5, 780, 5, '#3b82f6'),
    ('c-f6', '团队协作与沟通', 'Lisa Wu', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', '2h 30m', chapters_f6, 890, 6, '#3b82f6')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;

    -- Advanced 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-a1', 'PMP认证冲刺', 'Dr. Emily', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '5h 45m', chapters_a1, 2100, 7, '#8b5cf6'),
    ('c-a2', '挣值管理EVM', 'Prof. Liu', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', '3h 15m', chapters_a2, 1350, 8, '#8b5cf6'),
    ('c-a3', 'CPM关键路径法', 'Dr. Wang', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800', '3h 15m', chapters_a3, 1180, 9, '#8b5cf6'),
    ('c-a4', '敏捷Scrum实战', 'Coach Mike', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800', '4h 30m', chapters_a4, 1650, 10, '#8b5cf6'),
    ('c-a5', '商业分析PBA', 'Sarah BA', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', '3h 15m', chapters_a5, 920, 11, '#8b5cf6'),
    ('c-a6', '项目集管理', 'Director Chen', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1553877615-29246752c5d7?w=800', '4h 00m', chapters_a6, 780, 12, '#8b5cf6')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;

    -- Implementation 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-i1', '项目全生命周期实战', 'Senior PM Zhang', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800', '5h 30m', chapters_i1, 1450, 13, '#f97316'),
    ('c-i2', 'DevOps体系实战', 'DevOps Li', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1667372393119-c8f473882e8e?w=800', '4h 30m', chapters_i2, 1180, 14, '#f97316'),
    ('c-i3', '经典案例剖析', 'Case Study Team', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', '4h 00m', chapters_i3, 1650, 15, '#f97316'),
    ('c-i4', '项目管理工具链', 'Tool Expert Wang', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800', '3h 30m', chapters_i4, 1320, 16, '#f97316'),
    ('c-i5', '复盘与持续改进', 'Improvement Coach', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', '3h 00m', chapters_i5, 980, 17, '#f97316'),
    ('c-i6', '领导力与软技能', 'Leadership Expert', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', '3h 30m', chapters_i6, 1150, 18, '#f97316')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;
END $$;

-- ==========================================
-- 第六部分：知识图谱节点种子数据
-- ==========================================

-- 先清空现有数据（避免唯一约束冲突）
TRUNCATE TABLE app_kb_edges, app_kb_nodes RESTART IDENTITY CASCADE;

DO $$
BEGIN
    -- Foundation 层知识点
    INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_id, course_category, node_level, prerequisites) VALUES
    (1, '项目管理概述', 'concept', '项目管理的基本概念、五大过程组、十大知识领域', 1, 3, 'c-f1', 'Foundation', 1, '[]'::jsonb),
    (2, '五大过程组', 'concept', '启动、规划、执行、监控、收尾', 1, 2, 'c-f1', 'Foundation', 1, '[1]'),
    (3, '十大知识领域', 'concept', '整合、范围、进度、成本、质量、资源、沟通、风险、采购、干系人', 2, 4, 'c-f1', 'Foundation', 1, '[1]'),
    (4, '敏捷宣言', 'concept', '敏捷开发的四大价值观和十二原则', 1, 2, 'c-f2', 'Foundation', 1, '[]'::jsonb),
    (5, 'Scrum框架', 'skill', '敏捷开发最流行的框架', 2, 3, 'c-f2', 'Foundation', 1, '[4]'),
    (6, '看板方法', 'tool', '可视化工作流程管理方法', 1, 2, 'c-f2', 'Foundation', 1, '[4]'),
    (7, 'WBS分解', 'tool', '工作分解结构的创建方法和最佳实践', 2, 4, 'c-f3', 'Foundation', 1, '[1]'),
    (8, '进度管理', 'skill', '项目进度规划与控制', 2, 3, 'c-f4', 'Foundation', 1, '[7]'),
    (9, '风险识别', 'concept', '项目风险的识别与基础评估', 1, 2, 'c-f5', 'Foundation', 1, '[1]'),
    (10, '沟通管理', 'skill', '项目沟通规划与执行', 1, 2, 'c-f6', 'Foundation', 1, '[]'::jsonb);

    -- Advanced 层知识点
    INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_id, course_category, node_level, prerequisites) VALUES
    (11, '挣值管理', 'skill', 'EVM核心指标：PV, EV, AC, SPI, CPI, EAC', 3, 5, 'c-a2', 'Advanced', 2, '[8]'),
    (12, '关键路径法', 'tool', 'CPM计算、浮动时间、关键链', 3, 4, 'c-a3', 'Advanced', 2, '[8]'),
    (13, 'PMP认证', 'certification', '项目管理专业人士认证', 4, 10, 'c-a1', 'Advanced', 2, '[1,2,3]'),
    (14, 'Scrum Master', 'certification', 'Scrum敏捷教练认证', 3, 8, 'c-a4', 'Advanced', 2, '[5]'),
    (15, '商业分析', 'skill', '需求分析与商业价值评估', 3, 5, 'c-a5', 'Advanced', 2, '[3]'),
    (16, '项目集管理', 'skill', '多项目协调与战略对齐', 4, 6, 'c-a6', 'Advanced', 2, '[1]');

    -- Implementation 层知识点
    INSERT INTO app_kb_nodes (id, label, type, description, difficulty, estimated_hours, course_id, course_category, node_level, prerequisites) VALUES
    (17, '全生命周期', 'skill', '项目从启动到收尾的完整实践', 4, 8, 'c-i1', 'Implementation', 3, '[2,1]'),
    (18, 'DevOps实践', 'tool', '开发与运维一体化实践', 4, 6, 'c-i2', 'Implementation', 3, '[5]'),
    (19, '案例学习', 'concept', '经典项目管理案例分析', 3, 5, 'c-i3', 'Implementation', 3, '[1]'),
    (20, 'Jira工具', 'tool', 'Atlassian项目管理工具', 2, 3, 'c-i4', 'Implementation', 3, '[5,6]'),
    (21, '复盘改进', 'skill', '项目复盘与持续改进方法', 3, 4, 'c-i5', 'Implementation', 3, '[4]'),
    (22, '领导力', 'skill', '项目经理领导力发展', 4, 6, 'c-i6', 'Implementation', 3, '[10]');
END $$;

-- ==========================================
-- 第七部分：知识图谱关系边种子数据
-- ==========================================

DO $$
BEGIN
    -- 前置依赖关系
    INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength) VALUES
    (1, 2, 'prerequisite', 'prerequisite', 2),
    (1, 3, 'prerequisite', 'prerequisite', 2),
    (4, 5, 'prerequisite', 'prerequisite', 2),
    (4, 6, 'prerequisite', 'prerequisite', 1),
    (7, 8, 'prerequisite', 'prerequisite', 2),
    (8, 11, 'prerequisite', 'prerequisite', 2),
    (8, 12, 'prerequisite', 'prerequisite', 2),
    (2, 17, 'prerequisite', 'prerequisite', 2),
    (5, 18, 'prerequisite', 'prerequisite', 2),
    (5, 20, 'prerequisite', 'prerequisite', 1),
    (4, 21, 'prerequisite', 'prerequisite', 1),
    (10, 22, 'prerequisite', 'prerequisite', 2)
    ON CONFLICT DO NOTHING;

    -- 进阶关系
    INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength) VALUES
    (1, 13, 'leads_to', 'leads_to', 3),
    (2, 13, 'leads_to', 'leads_to', 2),
    (3, 13, 'leads_to', 'leads_to', 2),
    (5, 14, 'leads_to', 'leads_to', 3)
    ON CONFLICT DO NOTHING;

    -- 关联关系
    INSERT INTO app_kb_edges (source_id, target_id, type, relation_type, strength) VALUES
    (5, 6, 'related', 'related', 1),
    (11, 12, 'related', 'related', 1),
    (9, 8, 'related', 'related', 1),
    (10, 22, 'related', 'related', 2),
    (19, 17, 'related', 'related', 2)
    ON CONFLICT DO NOTHING;
END $$;

-- ==========================================
-- 第八部分：自动升级会员函数
-- ==========================================

-- 检查并自动升级会员等级 (使用小写格式与代码一致)
CREATE OR REPLACE FUNCTION check_and_upgrade_membership(p_user_id text)
RETURNS TABLE (
    old_tier text,
    new_tier text,
    upgraded boolean
) AS $$
DECLARE
    v_completed_count int;
    v_current_tier text;
    v_upgraded boolean := false;
    v_old_tier text;
BEGIN
    -- 获取当前信息 (统一转换为小写)
    SELECT completed_courses_count, LOWER(subscription_tier)
    INTO v_completed_count, v_current_tier
    FROM app_users 
    WHERE id = p_user_id;
    
    v_old_tier := v_current_tier;
    
    -- 升级到 pro (5门课)
    IF v_current_tier = 'free' AND v_completed_count >= 5 THEN
        UPDATE app_users 
        SET subscription_tier = 'pro'
        WHERE id = p_user_id;
        
        INSERT INTO membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES 
            (p_user_id, 'pro', 'course_completion', true, now(), 
             jsonb_build_object('completed_courses', v_completed_count));
        
        v_current_tier := 'pro';
        v_upgraded := true;
    END IF;
    
    -- 升级到 pro_plus (10门课)
    IF v_current_tier IN ('free', 'pro') AND v_completed_count >= 10 THEN
        UPDATE app_users 
        SET subscription_tier = 'pro_plus'
        WHERE id = p_user_id;
        
        INSERT INTO membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES 
            (p_user_id, 'pro_plus', 'course_completion', true, now(),
             jsonb_build_object('completed_courses', v_completed_count, 'upgraded_from', v_current_tier));
        
        v_current_tier := 'pro_plus';
        v_upgraded := true;
    END IF;
    
    RETURN QUERY SELECT v_old_tier, v_current_tier, v_upgraded;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_upgrade_membership(text) IS '检查并自动升级会员等级 (基于 subscription_tier, 小写格式)';

-- ==========================================
-- 完成
-- ==========================================
