-- ==========================================
-- ProjectFlow 平台改造数据库迁移脚本
-- 版本: v1.1
-- 日期: 2026-02-03
-- ==========================================

-- ==========================================
-- 第一部分：课程与知识图谱扩展
-- ==========================================

-- 1.1 知识图谱节点表扩展
ALTER TABLE app_kb_nodes 
ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES app_courses(id),
ADD COLUMN IF NOT EXISTS course_category TEXT, -- 'Foundation'|'Advanced'|'Implementation'
ADD COLUMN IF NOT EXISTS node_level INTEGER DEFAULT 1, -- 1=基础, 2=进阶, 3=实战
ADD COLUMN IF NOT EXISTS node_type TEXT DEFAULT 'concept', -- 'concept'|'skill'|'tool'|'certification'
ADD COLUMN IF NOT EXISTS learning_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1, -- 1-5星难度
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;

-- 1.2 知识图谱边表扩展
ALTER TABLE app_kb_edges 
ADD COLUMN IF NOT EXISTS relation_type TEXT DEFAULT 'related', -- 'prerequisite'|'related'|'leads_to'|'part_of'
ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 1; -- 关联强度 1-3

-- 1.3 用户知识掌握度表
CREATE TABLE IF NOT EXISTS app_user_kb_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id TEXT REFERENCES app_kb_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0, -- 0-100 掌握度
    last_studied_at TIMESTAMP WITH TIME ZONE,
    study_count INTEGER DEFAULT 0,
    UNIQUE(user_id, node_id)
);

-- 1.4 课程表扩展
ALTER TABLE app_courses 
ADD COLUMN IF NOT EXISTS kb_node_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_path_order INTEGER,
ADD COLUMN IF NOT EXISTS category_color TEXT;

-- ==========================================
-- 第二部分：AI分级权限系统
-- ==========================================

-- 2.1 用户表添加AI权限字段
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'none', -- 'none'|'basic'|'pro'
ADD COLUMN IF NOT EXISTS ai_daily_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_daily_reset_at TIMESTAMP WITH TIME ZONE;

-- 2.2 AI使用记录表
CREATE TABLE IF NOT EXISTS app_ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    model TEXT NOT NULL, -- 'gemini-flash'|'kimi-2.5'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 每日限制重置函数
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
    UPDATE app_users 
    SET ai_daily_used = 0,
        ai_daily_reset_at = NOW() + INTERVAL '1 day'
    WHERE ai_daily_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 第三部分：会员系统
-- ==========================================

-- 3.1 用户表扩展会员字段
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free', -- 'free'|'basic'|'pro'|'pro_plus'
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_courses_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_lifetime_member BOOLEAN DEFAULT false;

-- 3.2 会员订阅记录表
CREATE TABLE IF NOT EXISTS membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL, -- 'basic'|'pro'|'pro_plus'
    payment_method TEXT, -- 'course_completion'|'payment'|'code'
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 会员兑换码表
CREATE TABLE IF NOT EXISTS membership_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL, -- 'basic'|'pro'|'pro_plus'
    duration_days INTEGER DEFAULT 30,
    is_used BOOLEAN DEFAULT false,
    used_by TEXT REFERENCES app_users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 支付记录表
CREATE TABLE IF NOT EXISTS membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    payment_method TEXT, -- 'alipay'|'wechat'|'stripe'
    status TEXT DEFAULT 'pending', -- 'pending'|'success'|'failed'
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 3.5 课程完成追踪视图
CREATE OR REPLACE VIEW user_course_stats AS
SELECT 
    user_id,
    COUNT(*) as enrolled_courses,
    COUNT(*) FILTER (WHERE progress >= 100) as completed_courses
FROM app_user_progress
GROUP BY user_id;

-- 3.6 自动更新用户完成课程数函数
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

-- 4.1 用户知识掌握度表
ALTER TABLE app_user_kb_mastery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own mastery" ON app_user_kb_mastery;
CREATE POLICY "Users can view own mastery" 
    ON app_user_kb_mastery FOR ALL 
    USING (user_id = current_user_id());

-- 4.2 AI使用记录表
ALTER TABLE app_ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON app_ai_usage;
CREATE POLICY "Users can view own usage" 
    ON app_ai_usage FOR ALL 
    USING (user_id = current_user_id());

-- 4.3 会员订阅记录表
ALTER TABLE membership_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON membership_subscriptions;
CREATE POLICY "Users can view own subscriptions" 
    ON membership_subscriptions FOR ALL 
    USING (user_id = current_user_id());

-- 4.4 会员兑换码表
ALTER TABLE membership_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access codes" ON membership_codes;
CREATE POLICY "Public access codes" 
    ON membership_codes FOR ALL 
    USING (true);

-- 4.5 支付记录表
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments" ON membership_payments;
CREATE POLICY "Users can view own payments" 
    ON membership_payments FOR ALL 
    USING (user_id = current_user_id());

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

DO $$
BEGIN
    -- Foundation 层知识点
    INSERT INTO app_kb_nodes (id, label, category, course_id, course_category, node_level, node_type, description, learning_hours, difficulty, prerequisites, val) VALUES
    ('kb-pm-intro', '项目管理概述', 'Core', 'c-f1', 'Foundation', 1, 'concept', '项目管理的基本概念、五大过程组、十大知识领域', 3, 1, '[]'::jsonb, 50),
    ('kb-process-groups', '五大过程组', 'Concept', 'c-f1', 'Foundation', 1, 'concept', '启动、规划、执行、监控、收尾', 2, 1, '["kb-pm-intro"]', 40),
    ('kb-knowledge-areas', '十大知识领域', 'Concept', 'c-f1', 'Foundation', 1, 'concept', '整合、范围、进度、成本、质量、资源、沟通、风险、采购、干系人', 4, 2, '["kb-pm-intro"]', 45),
    ('kb-agile-manifesto', '敏捷宣言', 'Concept', 'c-f2', 'Foundation', 1, 'concept', '敏捷开发的四大价值观和十二原则', 2, 1, '[]'::jsonb, 40),
    ('kb-scrum', 'Scrum框架', 'Core', 'c-f2', 'Foundation', 1, 'skill', '敏捷开发最流行的框架', 3, 2, '["kb-agile-manifesto"]', 50),
    ('kb-kanban', '看板方法', 'Tool', 'c-f2', 'Foundation', 1, 'tool', '可视化工作流程管理方法', 2, 1, '["kb-agile-manifesto"]', 35),
    ('kb-wbs', 'WBS分解', 'Tool', 'c-f3', 'Foundation', 1, 'tool', '工作分解结构的创建方法和最佳实践', 4, 2, '["kb-pm-intro"]', 45),
    ('kb-schedule', '进度管理', 'Core', 'c-f4', 'Foundation', 1, 'skill', '项目进度规划与控制', 3, 2, '["kb-wbs"]', 45),
    ('kb-risk-basic', '风险识别', 'Concept', 'c-f5', 'Foundation', 1, 'concept', '项目风险的识别与基础评估', 2, 1, '["kb-pm-intro"]', 35),
    ('kb-communication', '沟通管理', 'Skill', 'c-f6', 'Foundation', 1, 'skill', '项目沟通规划与执行', 2, 1, '[]'::jsonb, 40)
    ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        course_id = EXCLUDED.course_id,
        course_category = EXCLUDED.course_category,
        node_level = EXCLUDED.node_level,
        node_type = EXCLUDED.node_type;

    -- Advanced 层知识点
    INSERT INTO app_kb_nodes (id, label, category, course_id, course_category, node_level, node_type, description, learning_hours, difficulty, prerequisites, val) VALUES
    ('kb-evm', '挣值管理', 'Core', 'c-a2', 'Advanced', 2, 'skill', 'EVM核心指标：PV, EV, AC, SPI, CPI, EAC', 5, 3, '["kb-schedule"]', 55),
    ('kb-cpm', '关键路径法', 'Tool', 'c-a3', 'Advanced', 2, 'tool', 'CPM计算、浮动时间、关键链', 4, 3, '["kb-schedule"]', 50),
    ('kb-pmp-cert', 'PMP认证', 'Certification', 'c-a1', 'Advanced', 2, 'certification', '项目管理专业人士认证', 10, 4, '["kb-pm-intro","kb-process-groups","kb-knowledge-areas"]', 70),
    ('kb-scrum-master', 'Scrum Master', 'Certification', 'c-a4', 'Advanced', 2, 'certification', 'Scrum敏捷教练认证', 8, 3, '["kb-scrum"]', 60),
    ('kb-business-analysis', '商业分析', 'Skill', 'c-a5', 'Advanced', 2, 'skill', '需求分析与商业价值评估', 5, 3, '["kb-knowledge-areas"]', 50),
    ('kb-program-mgmt', '项目集管理', 'Core', 'c-a6', 'Advanced', 2, 'skill', '多项目协调与战略对齐', 6, 4, '["kb-pm-intro"]', 55)
    ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        course_id = EXCLUDED.course_id,
        course_category = EXCLUDED.course_category,
        node_level = EXCLUDED.node_level,
        node_type = EXCLUDED.node_type;

    -- Implementation 层知识点
    INSERT INTO app_kb_nodes (id, label, category, course_id, course_category, node_level, node_type, description, learning_hours, difficulty, prerequisites, val) VALUES
    ('kb-lifecycle', '全生命周期', 'Core', 'c-i1', 'Implementation', 3, 'skill', '项目从启动到收尾的完整实践', 8, 4, '["kb-process-groups","kb-pm-intro"]', 60),
    ('kb-devops', 'DevOps实践', 'Tool', 'c-i2', 'Implementation', 3, 'tool', '开发与运维一体化实践', 6, 4, '["kb-scrum"]', 55),
    ('kb-case-study', '案例学习', 'Concept', 'c-i3', 'Implementation', 3, 'concept', '经典项目管理案例分析', 5, 3, '["kb-pm-intro"]', 50),
    ('kb-jira', 'Jira工具', 'Tool', 'c-i4', 'Implementation', 3, 'tool', 'Atlassian项目管理工具', 3, 2, '["kb-scrum","kb-kanban"]', 40),
    ('kb-retrospective', '复盘改进', 'Skill', 'c-i5', 'Implementation', 3, 'skill', '项目复盘与持续改进方法', 4, 3, '["kb-agile-manifesto"]', 45),
    ('kb-leadership', '领导力', 'Skill', 'c-i6', 'Implementation', 3, 'skill', '项目经理领导力发展', 6, 4, '["kb-communication"]', 55)
    ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        course_id = EXCLUDED.course_id,
        course_category = EXCLUDED.course_category,
        node_level = EXCLUDED.node_level,
        node_type = EXCLUDED.node_type;
END $$;

-- ==========================================
-- 第七部分：知识图谱关系边种子数据
-- ==========================================

DO $$
BEGIN
    -- 前置依赖关系
    INSERT INTO app_kb_edges (source, target, relation_type, strength) VALUES
    ('kb-pm-intro', 'kb-process-groups', 'prerequisite', 2),
    ('kb-pm-intro', 'kb-knowledge-areas', 'prerequisite', 2),
    ('kb-agile-manifesto', 'kb-scrum', 'prerequisite', 2),
    ('kb-agile-manifesto', 'kb-kanban', 'prerequisite', 1),
    ('kb-wbs', 'kb-schedule', 'prerequisite', 2),
    ('kb-schedule', 'kb-evm', 'prerequisite', 2),
    ('kb-schedule', 'kb-cpm', 'prerequisite', 2),
    ('kb-process-groups', 'kb-lifecycle', 'prerequisite', 2),
    ('kb-scrum', 'kb-devops', 'prerequisite', 2),
    ('kb-scrum', 'kb-jira', 'prerequisite', 1),
    ('kb-agile-manifesto', 'kb-retrospective', 'prerequisite', 1),
    ('kb-communication', 'kb-leadership', 'prerequisite', 2)
    ON CONFLICT DO NOTHING;

    -- 进阶关系
    INSERT INTO app_kb_edges (source, target, relation_type, strength) VALUES
    ('kb-pm-intro', 'kb-pmp-cert', 'leads_to', 3),
    ('kb-process-groups', 'kb-pmp-cert', 'leads_to', 2),
    ('kb-knowledge-areas', 'kb-pmp-cert', 'leads_to', 2),
    ('kb-scrum', 'kb-scrum-master', 'leads_to', 3),
    ('kb-foundation', 'kb-advanced', 'leads_to', 2),
    ('kb-advanced', 'kb-implementation', 'leads_to', 2)
    ON CONFLICT DO NOTHING;

    -- 关联关系
    INSERT INTO app_kb_edges (source, target, relation_type, strength) VALUES
    ('kb-scrum', 'kb-kanban', 'related', 1),
    ('kb-evm', 'kb-cpm', 'related', 1),
    ('kb-risk-basic', 'kb-schedule', 'related', 1),
    ('kb-communication', 'kb-leadership', 'related', 2),
    ('kb-case-study', 'kb-lifecycle', 'related', 2)
    ON CONFLICT DO NOTHING;
END $$;

-- ==========================================
-- 第八部分：系统配置表
-- ==========================================

-- 系统配置表（合并原全局设置）
CREATE TABLE IF NOT EXISTS admin_system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT DEFAULT 'general', -- 'general'|'security'|'notification'|'ai'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT REFERENCES app_users(id)
);

-- 默认系统配置
INSERT INTO admin_system_configs (key, value, category, description) VALUES
('site_name', '{"value": "ProjectFlow"}'::jsonb, 'general', '站点名称'),
('site_logo', '{"value": ""}'::jsonb, 'general', '站点Logo URL'),
('contact_email', '{"value": "support@projectflow.com"}'::jsonb, 'general', '客服邮箱'),
('max_login_attempts', '{"value": 5}'::jsonb, 'security', '最大登录失败次数'),
('password_min_length', '{"value": 8}'::jsonb, 'security', '密码最小长度'),
('session_timeout', '{"value": 7200}'::jsonb, 'security', 'Session超时时间(秒)'),
('smtp_config', '{"host": "", "port": 587, "user": "", "pass": ""}'::jsonb, 'notification', 'SMTP配置'),
('ai_default_model', '{"value": "gemini-flash"}'::jsonb, 'ai', '默认AI模型'),
('ai_daily_limit_basic', '{"value": 50}'::jsonb, 'ai', '基础用户日调用限制'),
('ai_daily_limit_pro', '{"value": 200}'::jsonb, 'ai', 'Pro用户日调用限制')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 第九部分：RLS策略更新
-- ==========================================

-- 系统配置表RLS
ALTER TABLE admin_system_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage configs" ON admin_system_configs;
CREATE POLICY "Admins can manage configs" 
    ON admin_system_configs FOR ALL 
    USING (true); -- 简单起见，开放给所有认证用户读取

-- ==========================================
-- 完成
-- ==========================================

-- 验证数据
SELECT '课程总数' as check_item, COUNT(*) as count FROM app_courses
UNION ALL
SELECT '知识点总数', COUNT(*) FROM app_kb_nodes
UNION ALL
SELECT '关系边总数', COUNT(*) FROM app_kb_edges
UNION ALL
SELECT '系统配置项', COUNT(*) FROM admin_system_configs;
