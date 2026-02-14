-- ==========================================
-- ProjectFlow 完整数据库脚本
-- 版本: v3.0
-- 日期: 2026-02-03
-- 包含: 所有表结构 + 数据
-- ==========================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 第一部分: 基础表结构
-- ==========================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'Student',
    status TEXT DEFAULT '正常',
    department TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_tier TEXT DEFAULT 'free',
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    ai_tier TEXT DEFAULT 'none',
    ai_daily_used INTEGER DEFAULT 0,
    ai_daily_reset_at TIMESTAMP WITH TIME ZONE,
    completed_courses_count INTEGER DEFAULT 0,
    membership_expires_at TIMESTAMP WITH TIME ZONE,
    is_lifetime_member BOOLEAN DEFAULT false
);

-- 2. 课程表
CREATE TABLE IF NOT EXISTS app_courses (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    image TEXT,
    status TEXT DEFAULT 'Published',
    duration TEXT,
    views INTEGER DEFAULT 0,
    chapters JSONB DEFAULT '[]'::jsonb,
    resources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rating DOUBLE PRECISION DEFAULT 4.5,
    last_update TIMESTAMP WITH TIME ZONE,
    kb_node_ids JSONB DEFAULT '[]'::jsonb,
    learning_path_order INTEGER,
    category_color TEXT
);

-- 3. 用户进度表
CREATE TABLE IF NOT EXISTS app_user_progress (
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Started',
    notes TEXT,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_chapters JSONB DEFAULT '[]'::jsonb,
    PRIMARY KEY (user_id, course_id)
);

-- 4. 社区帖子表
CREATE TABLE IF NOT EXISTS app_community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    role TEXT,
    content TEXT,
    tags JSONB,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_type TEXT DEFAULT 'discussion',
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false
);

-- 5. 评论表
CREATE TABLE IF NOT EXISTS app_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES app_community_posts(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 用户点赞表
CREATE TABLE IF NOT EXISTS app_user_likes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 7. 知识图谱节点表
CREATE TABLE IF NOT EXISTS app_kb_nodes (
    id SERIAL PRIMARY KEY,
    label VARCHAR NOT NULL UNIQUE,
    type VARCHAR NOT NULL,
    description TEXT,
    difficulty INTEGER DEFAULT 1,
    estimated_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    course_id TEXT REFERENCES app_courses(id),
    course_category TEXT,
    node_level INTEGER DEFAULT 1,
    prerequisites JSONB DEFAULT '[]'::jsonb
);

-- 8. 知识图谱边表
CREATE TABLE IF NOT EXISTS app_kb_edges (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    type VARCHAR NOT NULL,
    weight NUMERIC DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    relation_type TEXT DEFAULT 'related',
    strength INTEGER DEFAULT 1
);

-- ==========================================
-- 第二部分: 会员系统表
-- ==========================================

-- 9. 会员订阅记录表
CREATE TABLE IF NOT EXISTS membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    payment_method TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 会员兑换码表
CREATE TABLE IF NOT EXISTS membership_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL,
    duration_days INTEGER DEFAULT 30,
    is_used BOOLEAN DEFAULT false,
    used_by TEXT REFERENCES app_users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 第三部分: 新增功能表
-- ==========================================

-- 11. 公告表
CREATE TABLE IF NOT EXISTS app_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    priority INTEGER DEFAULT 0,
    target_audience TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. 用户公告已读记录
CREATE TABLE IF NOT EXISTS app_user_announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES app_announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- 13. 实战模拟场景表
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. 用户模拟进度表
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

-- 15. 用户关注表
CREATE TABLE IF NOT EXISTS app_user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    following_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 16. 话题表 (使用bigint自增ID，与现有数据库兼容)
CREATE TABLE IF NOT EXISTS app_topics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    follower_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. 帖子话题关联表
CREATE TABLE IF NOT EXISTS app_post_topics (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES app_community_posts(id) ON DELETE CASCADE,
    topic_id BIGINT REFERENCES app_topics(id) ON DELETE CASCADE,
    UNIQUE(post_id, topic_id)
);

-- 18. CPM项目保存表
CREATE TABLE IF NOT EXISTS app_cpm_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    tasks JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. AI使用记录表
CREATE TABLE IF NOT EXISTS app_ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. 用户知识掌握度表
CREATE TABLE IF NOT EXISTS app_user_kb_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id INTEGER REFERENCES app_kb_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    study_count INTEGER DEFAULT 0,
    UNIQUE(user_id, node_id)
);

-- 21. 系统配置表
CREATE TABLE IF NOT EXISTS app_system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Banner轮播图表
CREATE TABLE IF NOT EXISTS app_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT DEFAULT 'home',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. 操作日志表
CREATE TABLE IF NOT EXISTS app_admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT REFERENCES app_users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. 站内信表
CREATE TABLE IF NOT EXISTS app_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT REFERENCES app_users(id),
    recipient_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 25. 内容举报表
CREATE TABLE IF NOT EXISTS app_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT REFERENCES app_users(id),
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    handled_by TEXT REFERENCES app_users(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 第四部分: 索引优化
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_app_users_tier ON app_users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_app_courses_category ON app_courses(category);
CREATE INDEX IF NOT EXISTS idx_app_community_posts_user ON app_community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_app_community_posts_created ON app_community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_comments_post ON app_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_course ON app_kb_nodes(course_id);
CREATE INDEX IF NOT EXISTS idx_kb_edges_source ON app_kb_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON app_announcements(is_active, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_simulation_progress_user ON app_simulation_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON app_messages(recipient_id, is_read);

-- ==========================================
-- 第五部分: 触发器和函数
-- ==========================================

-- 自动更新完成课程数
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

DROP TRIGGER IF EXISTS trigger_update_completed_courses ON app_user_progress;
CREATE TRIGGER trigger_update_completed_courses
    AFTER INSERT OR UPDATE ON app_user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_completed_courses();

-- 自动升级会员等级
CREATE OR REPLACE FUNCTION check_and_upgrade_membership(p_user_id text)
RETURNS TABLE (old_tier text, new_tier text, upgraded boolean) AS $$
DECLARE
    v_completed_count int;
    v_current_tier text;
    v_upgraded boolean := false;
    v_old_tier text;
BEGIN
    SELECT completed_courses_count, LOWER(subscription_tier)
    INTO v_completed_count, v_current_tier
    FROM app_users 
    WHERE id = p_user_id;
    
    v_old_tier := v_current_tier;
    
    IF v_current_tier = 'free' AND v_completed_count >= 5 THEN
        UPDATE app_users SET subscription_tier = 'pro' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES (p_user_id, 'pro', 'course_completion', true, now(), jsonb_build_object('completed_courses', v_completed_count));
        v_current_tier := 'pro';
        v_upgraded := true;
    END IF;
    
    IF v_current_tier IN ('free', 'pro') AND v_completed_count >= 10 THEN
        UPDATE app_users SET subscription_tier = 'pro_plus' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (user_id, tier, payment_method, is_active, started_at, metadata)
        VALUES (p_user_id, 'pro_plus', 'course_completion', true, now(), jsonb_build_object('completed_courses', v_completed_count, 'upgraded_from', v_current_tier));
        v_current_tier := 'pro_plus';
        v_upgraded := true;
    END IF;
    
    RETURN QUERY SELECT v_old_tier, v_current_tier, v_upgraded;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 第六部分: RLS权限设置
-- ==========================================

ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_simulation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_messages ENABLE ROW LEVEL SECURITY;

-- 公告: 所有人可查看有效的
DROP POLICY IF EXISTS "Announcements public read" ON app_announcements;
CREATE POLICY "Announcements public read" ON app_announcements
    FOR SELECT USING (is_active = true AND (end_at IS NULL OR end_at > NOW()));

-- 模拟进度: 用户只能看自己的
DROP POLICY IF EXISTS "Users own progress" ON app_simulation_progress;
CREATE POLICY "Users own progress" ON app_simulation_progress
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::text);

-- 消息: 用户只能看自己的
DROP POLICY IF EXISTS "Users own messages" ON app_messages;
CREATE POLICY "Users own messages" ON app_messages
    FOR ALL USING (recipient_id = current_setting('app.current_user_id', true)::text);

-- ==========================================
-- 第七部分: 种子数据
-- ==========================================

-- 1. 课程数据
DO $$
DECLARE
    chapters_f1 jsonb := '[{"id": "ch-1-1", "title": "项目管理概述", "duration": "15:00", "type": "video"}, {"id": "ch-1-2", "title": "五大过程组", "duration": "20:00", "type": "video"}, {"id": "ch-1-3", "title": "十大知识领域", "duration": "25:00", "type": "video"}]';
    chapters_f2 jsonb := '[{"id": "ch-2-1", "title": "敏捷宣言解读", "duration": "15:00", "type": "video"}, {"id": "ch-2-2", "title": "Scrum框架", "duration": "30:00", "type": "video"}, {"id": "ch-2-3", "title": "看板方法", "duration": "20:00", "type": "video"}]';
    chapters_f3 jsonb := '[{"id": "ch-3-1", "title": "WBS基础", "duration": "20:00", "type": "video"}, {"id": "ch-3-2", "title": "分解技巧", "duration": "25:00", "type": "video"}, {"id": "ch-3-3", "title": "WBS实践", "duration": "30:00", "type": "video"}]';
    chapters_f4 jsonb := '[{"id": "ch-4-1", "title": "进度规划", "duration": "20:00", "type": "video"}, {"id": "ch-4-2", "title": "关键路径", "duration": "25:00", "type": "video"}, {"id": "ch-4-3", "title": "进度控制", "duration": "20:00", "type": "video"}]';
    chapters_f5 jsonb := '[{"id": "ch-5-1", "title": "风险识别", "duration": "15:00", "type": "video"}, {"id": "ch-5-2", "title": "风险评估", "duration": "20:00", "type": "video"}, {"id": "ch-5-3", "title": "风险应对", "duration": "20:00", "type": "video"}]';
    chapters_f6 jsonb := '[{"id": "ch-6-1", "title": "团队建设", "duration": "15:00", "type": "video"}, {"id": "ch-6-2", "title": "沟通技巧", "duration": "20:00", "type": "video"}, {"id": "ch-6-3", "title": "冲突解决", "duration": "20:00", "type": "video"}]';
    
    chapters_a1 jsonb := '[{"id": "ch-a1-1", "title": "PMP考试指南", "duration": "30:00", "type": "video"}, {"id": "ch-a1-2", "title": "敏捷专题", "duration": "45:00", "type": "video"}, {"id": "ch-a1-3", "title": "模拟考试", "duration": "60:00", "type": "quiz"}]';
    chapters_a2 jsonb := '[{"id": "ch-a2-1", "title": "EVM基础", "duration": "20:00", "type": "video"}, {"id": "ch-a2-2", "title": "指标分析", "duration": "25:00", "type": "video"}, {"id": "ch-a2-3", "title": "预测技术", "duration": "30:00", "type": "video"}]';
    chapters_a3 jsonb := '[{"id": "ch-a3-1", "title": "CPM算法", "duration": "25:00", "type": "video"}, {"id": "ch-a3-2", "title": "资源优化", "duration": "30:00", "type": "video"}, {"id": "ch-a3-3", "title": "关键链", "duration": "20:00", "type": "video"}]';
    chapters_a4 jsonb := '[{"id": "ch-a4-1", "title": "Scrum Master", "duration": "30:00", "type": "video"}, {"id": "ch-a4-2", "title": "敏捷教练", "duration": "35:00", "type": "video"}, {"id": "ch-a4-3", "title": "规模化敏捷", "duration": "40:00", "type": "video"}]';
    chapters_a5 jsonb := '[{"id": "ch-a5-1", "title": "需求分析", "duration": "25:00", "type": "video"}, {"id": "ch-a5-2", "title": "商业论证", "duration": "30:00", "type": "video"}, {"id": "ch-a5-3", "title": "价值交付", "duration": "25:00", "type": "video"}]';
    chapters_a6 jsonb := '[{"id": "ch-a6-1", "title": "项目集战略", "duration": "30:00", "type": "video"}, {"id": "ch-a6-2", "title": "治理框架", "duration": "35:00", "type": "video"}, {"id": "ch-a6-3", "title": "收益管理", "duration": "30:00", "type": "video"}]';
    
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

-- 2. 知识图谱节点
DO $$
BEGIN
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
    (10, '沟通管理', 'skill', '项目沟通规划与执行', 1, 2, 'c-f6', 'Foundation', 1, '[]'::jsonb),
    (11, '挣值管理', 'skill', 'EVM核心指标：PV, EV, AC, SPI, CPI, EAC', 3, 5, 'c-a2', 'Advanced', 2, '[8]'),
    (12, '关键路径法', 'tool', 'CPM计算、浮动时间、关键链', 3, 4, 'c-a3', 'Advanced', 2, '[8]'),
    (13, 'PMP认证', 'certification', '项目管理专业人士认证', 4, 10, 'c-a1', 'Advanced', 2, '[1,2,3]'),
    (14, 'Scrum Master', 'certification', 'Scrum敏捷教练认证', 3, 8, 'c-a4', 'Advanced', 2, '[5]'),
    (15, '商业分析', 'skill', '需求分析与商业价值评估', 3, 5, 'c-a5', 'Advanced', 2, '[3]'),
    (16, '项目集管理', 'skill', '多项目协调与战略对齐', 4, 6, 'c-a6', 'Advanced', 2, '[1]'),
    (17, '全生命周期', 'skill', '项目从启动到收尾的完整实践', 4, 8, 'c-i1', 'Implementation', 3, '[2,1]'),
    (18, 'DevOps实践', 'tool', '开发与运维一体化实践', 4, 6, 'c-i2', 'Implementation', 3, '[5]'),
    (19, '案例学习', 'concept', '经典项目管理案例分析', 3, 5, 'c-i3', 'Implementation', 3, '[1]'),
    (20, 'Jira工具', 'tool', 'Atlassian项目管理工具', 2, 3, 'c-i4', 'Implementation', 3, '[5,6]'),
    (21, '复盘改进', 'skill', '项目复盘与持续改进方法', 3, 4, 'c-i5', 'Implementation', 3, '[4]'),
    (22, '领导力', 'skill', '项目经理领导力发展', 4, 6, 'c-i6', 'Implementation', 3, '[10]')
    ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        course_id = EXCLUDED.course_id,
        course_category = EXCLUDED.course_category,
        node_level = EXCLUDED.node_level,
        prerequisites = EXCLUDED.prerequisites;
END $$;

-- 3. 知识图谱边
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
(10, 22, 'prerequisite', 'prerequisite', 2),
(1, 13, 'leads_to', 'leads_to', 3),
(2, 13, 'leads_to', 'leads_to', 2),
(3, 13, 'leads_to', 'leads_to', 2),
(5, 14, 'leads_to', 'leads_to', 3),
(5, 6, 'related', 'related', 1),
(11, 12, 'related', 'related', 1),
(9, 8, 'related', 'related', 1),
(10, 22, 'related', 'related', 2),
(19, 17, 'related', 'related', 2)
ON CONFLICT DO NOTHING;

-- 4. 测试用户数据（用于社区帖子）
-- 注意：role 列受约束限制，使用允许的枚举值
INSERT INTO app_users (id, email, name, role, status, subscription_tier, created_at) VALUES
('u-001', 'zhang@example.com', '张经理', 'Manager', '正常', 'pro', NOW() - INTERVAL '30 days'),
('u-002', 'li@example.com', '李敏捷', 'Student', '正常', 'free', NOW() - INTERVAL '25 days'),
('u-003', 'wang@example.com', '王总监', 'Manager', '正常', 'pro_plus', NOW() - INTERVAL '60 days'),
('u-004', 'chen@example.com', '陈Scrum', 'Manager', '正常', 'pro', NOW() - INTERVAL '20 days'),
('u-005', 'liu@example.com', '刘助理', 'Student', '正常', 'free', NOW() - INTERVAL '15 days'),
('u-006', 'zhao@example.com', '赵PM', 'Manager', '正常', 'pro', NOW() - INTERVAL '45 days'),
('u-007', 'qian@example.com', '钱教练', 'SuperAdmin', '正常', 'pro_plus', NOW() - INTERVAL '90 days'),
('u-008', 'sun@example.com', '孙助理', 'Student', '正常', 'free', NOW() - INTERVAL '10 days'),
('u-009', 'zhou@example.com', '周经理', 'Manager', '正常', 'pro', NOW() - INTERVAL '35 days'),
('u-010', 'wu@example.com', '吴敏捷', 'Manager', '正常', 'pro', NOW() - INTERVAL '40 days')
ON CONFLICT (id) DO NOTHING;

-- 6. 话题数据 (先添加缺失的列)
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;

INSERT INTO app_topics (name, description, icon, color, follower_count, post_count) VALUES
('PMP备考', 'PMP认证考试备考交流', '📚', '#3b82f6', 1200, 450),
('敏捷实践', 'Scrum、看板等敏捷方法实践', '🏃', '#22c55e', 980, 320),
('项目管理工具', 'Jira、MS Project等工具使用', '🛠️', '#f59e0b', 750, 280),
('职场感悟', '项目经理职业发展、软技能', '💼', '#8b5cf6', 650, 190),
('案例讨论', '经典项目案例分析', '📊', '#ef4444', 520, 150),
('求职招聘', 'PM岗位招聘信息', '💼', '#06b6d4', 480, 200)
ON CONFLICT (name) DO NOTHING;

-- 7. 社区帖子
INSERT INTO app_community_posts (user_id, user_name, user_avatar, role, content, tags, likes, comments, created_at) VALUES
('u-001', '张经理', 'https://i.pravatar.cc/150?u=001', 'Manager', '刚带领团队完成了一个大型ERP实施项目，分享一下 lessons learned：1. 需求变更必须书面确认 2. 预留20%缓冲时间 3. 干系人管理比技术更重要', '["#项目管理", "#经验分享"]', 45, 12, NOW() - INTERVAL '2 hours'),
('u-002', '李敏捷', 'https://i.pravatar.cc/150?u=002', 'Student', '求助：团队 velocity 持续下降，从30点降到18点，大家有什么诊断方法吗？', '["#敏捷实践", "#求助"]', 12, 8, NOW() - INTERVAL '5 hours'),
('u-003', '王总监', 'https://i.pravatar.cc/150?u=003', 'Director', '推荐一本好书《项目管理的艺术》，作者是Basecamp创始人，很多观点颠覆传统认知', '["#读书", "#PMP备考"]', 89, 23, NOW() - INTERVAL '1 day'),
('u-004', '陈Scrum', 'https://i.pravatar.cc/150?u=004', 'Manager', '我们团队尝试取消了每日站会，改为异步更新，两周后效率反而提升了。不是所有仪式都适合每个团队', '["#敏捷实践", "#团队协作"]', 156, 45, NOW() - INTERVAL '1 day'),
('u-005', '刘助理', 'https://i.pravatar.cc/150?u=005', 'Student', '终于通过PMP考试了！备考3个月，分享我的笔记给大家', '["#PMP备考", "#经验分享"]', 234, 67, NOW() - INTERVAL '2 days'),
('u-006', '赵PM', 'https://i.pravatar.cc/150?u=006', 'Manager', '遇到一个很难搞的客户，需求一周改三次，有什么好的应对策略吗？', '["#客户管理", "#求助"]', 34, 15, NOW() - INTERVAL '3 days'),
('u-007', '钱教练', 'https://i.pravatar.cc/150?u=007', 'Director', '敏捷转型不只是流程改变，更重要的是思维转变。推荐一个案例：Spotify的部落模型', '["#敏捷转型", "#案例分享"]', 178, 34, NOW() - INTERVAL '3 days'),
('u-008', '孙助理', 'https://i.pravatar.cc/150?u=008', 'Student', '新人PM求建议：如何在没有实权的情况下推动项目？', '["#职场", "#求助"]', 67, 28, NOW() - INTERVAL '4 days'),
('u-009', '周经理', 'https://i.pravatar.cc/150?u=009', 'Manager', '项目延期了两个月，今天终于上线了。复盘一下：最大的问题是对技术难点预估不足', '["#复盘", "#经验分享"]', 123, 19, NOW() - INTERVAL '4 days'),
('u-010', '吴敏捷', 'https://i.pravatar.cc/150?u=010', 'Manager', '关于估算的一个技巧：用历史数据做参考，比凭空估算准确得多', '["#估算", "#技巧"]', 89, 12, NOW() - INTERVAL '5 days');

-- 8. 公告数据
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
('系统维护通知', '系统将于今晚02:00-04:00进行例行维护，期间部分功能可能不可用', 'warning', 90, 'all', true, NOW(), NOW() + INTERVAL '1 day'),
('Pro Lab上线', '全新的Pro Lab高级实验室正式上线！包含蒙特卡洛模拟、FMEA分析等10个专业工具', 'success', 80, 'all', true, NOW(), NOW() + INTERVAL '7 days'),
('社区规范更新', '请大家文明交流，禁止发布广告和违规内容', 'info', 50, 'all', true, NOW(), NULL);

-- 9. 兑换码测试数据
INSERT INTO membership_codes (code, tier, duration_days, is_used, created_at) VALUES
('PF-PRO-TEST01', 'pro', 30, false, NOW()),
('PF-PRO-TEST02', 'pro', 90, false, NOW()),
('PF-PROPLUS-01', 'pro_plus', 30, false, NOW()),
('PF-LIFETIME-01', 'pro_plus', 36500, false, NOW());

-- 10. 系统配置默认值
INSERT INTO app_system_configs (key, value, description) VALUES
('site_name', '{"value": "ProjectFlow"}', '站点名称'),
('site_logo', '{"value": ""}', '站点Logo URL'),
('contact_email', '{"value": "support@projectflow.com"}', '客服邮箱'),
('max_login_attempts', '{"value": 5}', '最大登录失败次数'),
('password_min_length', '{"value": 8}', '密码最小长度'),
('session_timeout', '{"value": 7200}', 'Session超时时间(秒)')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- ==========================================
-- 脚本执行完成
-- ==========================================
