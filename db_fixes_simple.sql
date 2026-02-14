-- ==========================================
-- ProjectFlow 修复脚本 (简化版)
-- ==========================================

-- 1. 修复公告表RLS策略（保存失败问题）
-- ==========================================

-- 先删除旧策略
DROP POLICY IF EXISTS "Admins can manage announcements" ON app_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON app_announcements;

-- 创建新策略：允许管理员管理
CREATE POLICY "Admins can manage announcements"
ON app_announcements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
);

-- 创建策略：允许所有用户查看活跃公告
CREATE POLICY "Users can view active announcements"
ON app_announcements
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. 创建 app_tools 表（工具实验室管理）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    required_tier TEXT DEFAULT 'pro',
    difficulty TEXT DEFAULT 'Medium',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- RLS for app_tools
ALTER TABLE app_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage tools" ON app_tools;
DROP POLICY IF EXISTS "Users can view active tools" ON app_tools;

CREATE POLICY "Admins can manage tools"
ON app_tools
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::TEXT 
        AND role IN ('SuperAdmin', 'Manager')
    )
);

CREATE POLICY "Users can view active tools"
ON app_tools
FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. 创建用户徽章表
-- ==========================================
CREATE TABLE IF NOT EXISTS app_user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    badge_color TEXT,
    badge_bg TEXT,
    condition TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- RLS for badges
ALTER TABLE app_user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON app_user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON app_user_badges;

CREATE POLICY "Users can view own badges"
ON app_user_badges
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

CREATE POLICY "System can insert badges"
ON app_user_badges
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. 创建用户技能表（雷达图数据）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_en TEXT,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 150,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- RLS for skills
ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skills" ON app_user_skills;
CREATE POLICY "Users can view own skills"
ON app_user_skills
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

-- 5. 确保 app_activity_logs 表存在（用于热力图）
-- ==========================================
CREATE TABLE IF NOT EXISTS app_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for activity logs
ALTER TABLE app_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON app_activity_logs;
CREATE POLICY "Users can view own logs"
ON app_activity_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);

CREATE POLICY "System can insert logs"
ON app_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

SELECT '修复完成' as status;
