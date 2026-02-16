-- ========================================================
-- 学生互动功能数据库表结构
-- 包含: Q&A问答表、讨论区表、通知表
-- ========================================================

-- ========================================================
-- 1. Q&A问答表 (app_questions)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_avatar TEXT,
    course_id UUID REFERENCES app_courses(id) ON DELETE SET NULL,
    course_name VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unanswered' CHECK (status IN ('unanswered', 'answered', 'resolved')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    tags TEXT[], -- PostgreSQL数组类型存储标签
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON app_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON app_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON app_questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON app_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_is_pinned ON app_questions(is_pinned);

-- 启用行级安全
ALTER TABLE app_questions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Questions are viewable by everyone" 
    ON app_questions FOR SELECT USING (true);

CREATE POLICY "Students can create questions" 
    ON app_questions FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own questions" 
    ON app_questions FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own questions" 
    ON app_questions FOR DELETE USING (auth.uid() = student_id);

-- ========================================================
-- 2. Q&A回复表 (app_question_replies)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_question_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES app_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_role VARCHAR(50) DEFAULT 'student' CHECK (author_role IN ('teacher', 'student', 'assistant')),
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_question_replies_question_id ON app_question_replies(question_id);
CREATE INDEX IF NOT EXISTS idx_question_replies_author_id ON app_question_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_question_replies_created_at ON app_question_replies(created_at);

-- 启用行级安全
ALTER TABLE app_question_replies ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Replies are viewable by everyone" 
    ON app_question_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" 
    ON app_question_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own replies" 
    ON app_question_replies FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own replies" 
    ON app_question_replies FOR DELETE USING (auth.uid() = author_id);

-- ========================================================
-- 3. 讨论区主题表 (app_discussions)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    replies_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    tags TEXT[], -- PostgreSQL数组类型存储标签
    last_reply_at TIMESTAMPTZ DEFAULT NOW(),
    last_reply_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON app_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON app_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON app_discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_last_reply_at ON app_discussions(last_reply_at DESC);

-- 启用行级安全
ALTER TABLE app_discussions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Discussions are viewable by everyone" 
    ON app_discussions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" 
    ON app_discussions FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own discussions" 
    ON app_discussions FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own discussions" 
    ON app_discussions FOR DELETE USING (auth.uid() = author_id);

-- ========================================================
-- 4. 讨论区回复表 (app_discussion_replies)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES app_discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    author_role VARCHAR(50) DEFAULT 'student' CHECK (author_role IN ('teacher', 'student', 'assistant')),
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON app_discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id ON app_discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_created_at ON app_discussion_replies(created_at);

-- 启用行级安全
ALTER TABLE app_discussion_replies ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Discussion replies are viewable by everyone" 
    ON app_discussion_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussion replies" 
    ON app_discussion_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own discussion replies" 
    ON app_discussion_replies FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own discussion replies" 
    ON app_discussion_replies FOR DELETE USING (auth.uid() = author_id);

-- ========================================================
-- 5. 通知表 (app_notifications)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('question', 'reply', 'mention', 'system', 'report')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id UUID, -- 关联的问题或讨论ID
    related_type VARCHAR(50), -- 'question', 'discussion', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON app_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON app_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON app_notifications(type);

-- 启用行级安全
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own notifications" 
    ON app_notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
    ON app_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
    ON app_notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
    ON app_notifications FOR DELETE USING (auth.uid() = user_id);

-- ========================================================
-- 6. 通知设置表 (app_notification_settings)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    new_question BOOLEAN DEFAULT true,
    new_reply BOOLEAN DEFAULT true,
    mention BOOLEAN DEFAULT true,
    system BOOLEAN DEFAULT true,
    report BOOLEAN DEFAULT true,
    email_notification BOOLEAN DEFAULT true,
    push_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON app_notification_settings(user_id);

-- 启用行级安全
ALTER TABLE app_notification_settings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own notification settings" 
    ON app_notification_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification settings" 
    ON app_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" 
    ON app_notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- ========================================================
-- 7. 触发器函数 - 自动更新 updated_at
-- ========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建触发器
DROP TRIGGER IF EXISTS update_app_questions_updated_at ON app_questions;
CREATE TRIGGER update_app_questions_updated_at
    BEFORE UPDATE ON app_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_question_replies_updated_at ON app_question_replies;
CREATE TRIGGER update_app_question_replies_updated_at
    BEFORE UPDATE ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussions_updated_at ON app_discussions;
CREATE TRIGGER update_app_discussions_updated_at
    BEFORE UPDATE ON app_discussions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussion_replies_updated_at ON app_discussion_replies;
CREATE TRIGGER update_app_discussion_replies_updated_at
    BEFORE UPDATE ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_notification_settings_updated_at ON app_notification_settings;
CREATE TRIGGER update_app_notification_settings_updated_at
    BEFORE UPDATE ON app_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- 8. 触发器函数 - 更新讨论最后回复信息
-- ========================================================
CREATE OR REPLACE FUNCTION update_discussion_last_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_discussions
    SET 
        replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_name
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_discussion_last_reply ON app_discussion_replies;
CREATE TRIGGER trigger_update_discussion_last_reply
    AFTER INSERT ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_discussion_last_reply();

-- ========================================================
-- 9. 触发器函数 - 更新问题回复数和状态
-- ========================================================
CREATE OR REPLACE FUNCTION update_question_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_questions
    SET 
        status = CASE 
            WHEN status = 'unanswered' THEN 'answered'
            ELSE status
        END
    WHERE id = NEW.question_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_question_on_reply ON app_question_replies;
CREATE TRIGGER trigger_update_question_on_reply
    AFTER INSERT ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_question_on_reply();

-- ========================================================
-- 10. 示例数据插入 (可选)
-- ========================================================

-- 插入示例问题
INSERT INTO app_questions (id, student_id, student_name, student_avatar, course_name, title, content, status, priority, tags, likes, views, is_pinned, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '陈小明', 'https://i.pravatar.cc/150?u=4', '项目管理基础', 'WBS分解的最小单元应该到什么程度比较合适？', '老师，我在学习WBS分解时遇到一个困惑：工作分解结构的最小单元应该细化到什么程度？', 'unanswered', 'normal', ARRAY['WBS', '项目管理'], 3, 15, false, NOW() - INTERVAL '10 minutes'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '刘小红', 'https://i.pravatar.cc/150?u=5', '敏捷开发实践', 'Scrum和Kanban的主要区别是什么？', '老师您好，我对Scrum和Kanban的区别还有些模糊。两者都是敏捷方法论，在实际项目中应该如何选择？', 'answered', 'high', ARRAY['Scrum', 'Kanban', '敏捷'], 8, 42, true, NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', '赵小强', 'https://i.pravatar.cc/150?u=6', '风险管理专题', '定性风险分析和定量风险分析分别在什么阶段进行？', '老师，关于风险管理的两个分析阶段，我想确认一下：定性风险分析和定量风险分析是在项目的什么阶段进行的？', 'unanswered', 'urgent', ARRAY['风险管理', '风险分析'], 2, 12, false, NOW() - INTERVAL '1 hour');

-- 插入示例讨论
INSERT INTO app_discussions (id, author_id, author_name, author_avatar, title, content, replies_count, views, likes, is_pinned, is_locked, tags, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', '张老师', 'https://i.pravatar.cc/150?u=teacher', '【精华】项目管理实战经验分享', '这个帖子汇总了我多年项目管理的实战经验...', 45, 1280, 89, true, false, ARRAY['精华', '经验分享'], '2026-02-10'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', '陈小明', 'https://i.pravatar.cc/150?u=4', '敏捷转型中的常见问题和解决方案', '我们团队正在进行敏捷转型，遇到了一些困难...', 23, 456, 34, false, false, ARRAY['敏捷转型', '讨论'], '2026-02-12');

-- 插入示例通知
INSERT INTO app_notifications (id, user_id, type, title, content, is_read, related_id, created_at) VALUES
('n1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'question', '新的学生提问', '陈小明在《项目管理基础》课程中提出了一个新问题', false, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 minutes'),
('n2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'reply', '问题收到新回复', '你关注的问题"Scrum和Kanban的主要区别"收到了新回复', false, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 minutes'),
('n3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'mention', '有人@了你', '王小华在讨论中提到了你', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 hour');
