-- ============================================================
-- 会员配置数据库表
-- 用于存储动态的会员等级配置，替代硬编码的 MEMBERSHIP_CONFIG
-- ============================================================

-- 会员计划表
CREATE TABLE IF NOT EXISTS app_membership_plans (
    id TEXT PRIMARY KEY, -- 'free', 'pro', 'pro_plus'
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    color TEXT NOT NULL,
    gradient TEXT NOT NULL,
    icon TEXT NOT NULL,
    required_courses INTEGER DEFAULT 0,
    price_monthly INTEGER,
    price_yearly INTEGER,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认会员配置
INSERT INTO app_membership_plans (id, name, badge, color, gradient, icon, required_courses, price_monthly, price_yearly, features, is_active)
VALUES 
    (
        'free', 
        '免费会员', 
        'FREE', 
        'bg-gray-100 text-gray-600', 
        'from-gray-400 to-gray-500', 
        'Star', 
        0, 
        0, 
        0,
        '[
            {"icon": "BookOpen", "text": "Foundation 基础课程"},
            {"icon": "BookOpen", "text": "Advanced 进阶课程"},
            {"icon": "Calculator", "text": "3个基础工具"},
            {"icon": "MessageSquare", "text": "社区发帖权限"},
            {"icon": "Bot", "text": "AI助手 5次/天"}
        ]'::jsonb,
        true
    ),
    (
        'pro', 
        '专业会员', 
        'PRO', 
        'bg-gradient-to-r from-blue-500 to-cyan-500 text-white', 
        'from-blue-500 to-cyan-500', 
        'Crown', 
        5, 
        99, 
        999,
        '[
            {"icon": "BookOpen", "text": "全部 18 门课程"},
            {"icon": "Calculator", "text": "全部 12 个基础工具"},
            {"icon": "Zap", "text": "5个高级工具"},
            {"icon": "Bot", "text": "AI助手 20次/天"},
            {"icon": "Target", "text": "完整版证书下载"},
            {"icon": "Users", "text": "精华帖标识"}
        ]'::jsonb,
        true
    ),
    (
        'pro_plus', 
        '高级会员', 
        'PRO+', 
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white', 
        'from-amber-500 to-orange-500', 
        'Crown', 
        10, 
        199, 
        1999,
        '[
            {"icon": "Star", "text": "全部 Pro 权益"},
            {"icon": "Calculator", "text": "5个专家级工具"},
            {"icon": "TrendingUp", "text": "实战模拟中心"},
            {"icon": "FileText", "text": "评分报告 PDF导出"},
            {"icon": "Bot", "text": "AI助手 50次/天"},
            {"icon": "Shield", "text": "专家认证标识"},
            {"icon": "Users", "text": "1对1专属客服"}
        ]'::jsonb,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_app_membership_plans_updated_at ON app_membership_plans;

CREATE TRIGGER update_app_membership_plans_updated_at
    BEFORE UPDATE ON app_membership_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加RLS策略（如果需要）
ALTER TABLE app_membership_plans ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read access" ON app_membership_plans
    FOR SELECT USING (true);

-- 只允许管理员修改
CREATE POLICY "Allow admin update" ON app_membership_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid()::TEXT 
            AND app_users.role IN ('SuperAdmin', 'Manager')
        )
    );

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_app_membership_plans_active ON app_membership_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_app_membership_plans_required_courses ON app_membership_plans(required_courses);
