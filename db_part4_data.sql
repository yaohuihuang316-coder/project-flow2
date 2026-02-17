-- ========================================================-- ProjectFlow 数据库初始化 - Part 4: 种子数据-- 执行顺序: 第4个执行 (在 Part 3 之后)-- ========================================================
-- 第十二部分：公告示例数据
-- 来源: db_announcements_seed_fixed.sql
-- ========================================================

-- 先清空现有数据
DELETE FROM app_announcements;

-- 重置序列
ALTER SEQUENCE IF EXISTS app_announcements_id_seq RESTART WITH 1;

-- 插入示例公告数据
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at, created_at) VALUES
(
    '欢迎使用 ProjectFlow 项目管理学习平台！',
    '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：
• 学习专业的项目管理课程
• 使用强大的项目管理工具
• 参与社区讨论与经验分享
• 体验实战模拟场景

祝您学习愉快，技能精进！如有任何问题，请联系我们的客服团队。',
    'success',
    10,
    'all',
    true,
    '2026-01-01 00:00:00+00',
    '2026-03-01 00:00:00+00',
    '2026-01-01 00:00:00+00'
),
(
    '系统功能更新：全新仪表盘上线',
    '我们很高兴地宣布，全新的个人仪表盘功能已正式上线！

本次更新内容包括：
• 个性化学习进度展示
• 项目完成度可视化图表
• 快捷操作入口优化
• 学习数据深度分析

点击右上角头像进入「个人中心」即可体验全新功能。',
    'info',
    8,
    'all',
    true,
    '2026-01-08 00:00:00+00',
    '2026-01-22 00:00:00+00',
    '2026-01-08 00:00:00+00'
),
(
    'PMP 认证新课程已上线，快来学习吧！',
    '备受期待的《PMP 认证完整指南》课程现已正式上线！

课程亮点：
• 35小时专业PDU学时
• 覆盖全部考试知识领域
• 配套练习题库1000+
• 资深PMP讲师在线答疑

会员用户可免费学习全部内容，立即点击课程页面开始学习吧！',
    'success',
    9,
    'all',
    true,
    '2026-01-10 00:00:00+00',
    '2026-03-10 00:00:00+00',
    '2026-01-10 00:00:00+00'
),
(
    '敏捷项目管理实战课程更新通知',
    '《敏捷项目管理实战》课程已完成内容升级！

更新内容：
• 新增Scrum框架深度解析章节
• 增加5个真实企业案例
• 补充看板(Kanban)实战演练
• 新增DevOps与敏捷结合模块

已报名的学员可直接免费学习更新内容。',
    'info',
    7,
    'all',
    true,
    '2026-01-15 00:00:00+00',
    '2026-02-05 00:00:00+00',
    '2026-01-15 00:00:00+00'
),
(
    '教师专属：课程创作工具升级',
    '各位讲师，课程创作工作台已进行全面升级！

新功能包括：
• 富文本编辑器增强，支持更多格式
• 视频章节自动分割功能
• 作业批改批量处理
• 学员学习数据导出

登录讲师后台即可体验新功能，如有建议请随时反馈。',
    'info',
    6,
    'all',
    true,
    '2026-01-20 00:00:00+00',
    '2026-02-19 00:00:00+00',
    '2026-01-20 00:00:00+00'
),
(
    '【直播预告】项目管理大咖分享会 - 第3期',
    '直播主题：《从初级PM到项目总监的成长之路》

直播时间：本周六晚 20:00-21:30

分享嘉宾：李明 - 某互联网大厂项目总监，15年项目管理经验

内容大纲：
• 项目管理职业发展路径
• 关键能力跃升技巧
• 面试与晋升经验分享
• 互动答疑环节

点击预约直播，开播前将发送提醒通知！',
    'warning',
    9,
    'all',
    true,
    '2026-01-25 00:00:00+00',
    '2026-01-30 00:00:00+00',
    '2026-01-25 00:00:00+00'
),
(
    '「30天项目管理挑战赛」开始报名！',
    '想要快速提升项目管理实战能力？加入我们的30天挑战赛吧！

活动形式：
• 每日学习任务打卡
• 真实项目案例分析
• 团队协作模拟练习
• 导师点评与指导

活动时间：下月1日-30日
报名截止：本月28日

完成挑战可获得：
✓ 官方认证证书
✓ 精美周边礼品
✓ Pro会员体验月卡

名额有限，立即报名！',
    'success',
    8,
    'all',
    true,
    '2026-01-28 00:00:00+00',
    '2026-02-17 00:00:00+00',
    '2026-01-28 00:00:00+00'
);


-- ========================================================
-- 第十三部分：互动功能示例数据
-- 来源: db_interactions_tables.sql
-- ========================================================

-- 插入示例问题（仅在用户存在时插入）
INSERT INTO app_questions (id, student_id, student_name, student_avatar, course_name, title, content, status, priority, tags, likes, views, is_pinned, created_at)
SELECT 
    '11111111-1111-1111-1111-111111111111', 
    '00000000-0000-0000-0000-000000000001', 
    '陈小明', 
    'https://i.pravatar.cc/150?u=4', 
    '项目管理基础', 
    'WBS分解的最小单元应该到什么程度比较合适？', 
    '老师，我在学习WBS分解时遇到一个困惑：工作分解结构的最小单元应该细化到什么程度？', 
    'unanswered', 
    'normal', 
    ARRAY['WBS', '项目管理'], 
    3, 
    15, 
    false, 
    NOW() - INTERVAL '10 minutes'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001');

INSERT INTO app_questions (id, student_id, student_name, student_avatar, course_name, title, content, status, priority, tags, likes, views, is_pinned, created_at)
SELECT 
    '22222222-2222-2222-2222-222222222222', 
    '00000000-0000-0000-0000-000000000002', 
    '刘小红', 
    'https://i.pravatar.cc/150?u=5', 
    '敏捷开发实践', 
    'Scrum和Kanban的主要区别是什么？', 
    '老师您好，我对Scrum和Kanban的区别还有些模糊。两者都是敏捷方法论，在实际项目中应该如何选择？', 
    'answered', 
    'high', 
    ARRAY['Scrum', 'Kanban', '敏捷'], 
    8, 
    42, 
    true, 
    NOW() - INTERVAL '30 minutes'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002');

INSERT INTO app_questions (id, student_id, student_name, student_avatar, course_name, title, content, status, priority, tags, likes, views, is_pinned, created_at)
SELECT 
    '33333333-3333-3333-3333-333333333333', 
    '00000000-0000-0000-0000-000000000003', 
    '赵小强', 
    'https://i.pravatar.cc/150?u=6', 
    '风险管理专题', 
    '定性风险分析和定量风险分析分别在什么阶段进行？', 
    '老师，关于风险管理的两个分析阶段，我想确认一下：定性风险分析和定量风险分析是在项目的什么阶段进行的？', 
    'unanswered', 
    'urgent', 
    ARRAY['风险管理', '风险分析'], 
    2, 
    12, 
    false, 
    NOW() - INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003');

-- 插入示例讨论（仅在用户存在时插入）
INSERT INTO app_discussions (id, author_id, author_name, author_avatar, title, content, replies_count, views, likes, is_pinned, is_locked, tags, created_at)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
    '00000000-0000-0000-0000-000000000000', 
    '张老师', 
    'https://i.pravatar.cc/150?u=teacher', 
    '【精华】项目管理实战经验分享', 
    '这个帖子汇总了我多年项目管理的实战经验...', 
    45, 
    1280, 
    89, 
    true, 
    false, 
    ARRAY['精华', '经验分享'], 
    '2026-02-10'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

INSERT INTO app_discussions (id, author_id, author_name, author_avatar, title, content, replies_count, views, likes, is_pinned, is_locked, tags, created_at)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
    '00000000-0000-0000-0000-000000000001', 
    '陈小明', 
    'https://i.pravatar.cc/150?u=4', 
    '敏捷转型中的常见问题和解决方案', 
    '我们团队正在进行敏捷转型，遇到了一些困难...', 
    23, 
    456, 
    34, 
    false, 
    false, 
    ARRAY['敏捷转型', '讨论'], 
    '2026-02-12'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001');

-- 插入示例通知（仅在用户存在时插入）
INSERT INTO app_notifications (id, user_id, type, title, content, is_read, related_id, created_at)
SELECT 
    'n1111111-1111-1111-1111-111111111111', 
    '00000000-0000-0000-0000-000000000000', 
    'question', 
    '新的学生提问', 
    '陈小明在《项目管理基础》课程中提出了一个新问题', 
    false, 
    '11111111-1111-1111-1111-111111111111', 
    NOW() - INTERVAL '10 minutes'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

INSERT INTO app_notifications (id, user_id, type, title, content, is_read, related_id, created_at)
SELECT 
    'n2222222-2222-2222-2222-222222222222', 
    '00000000-0000-0000-0000-000000000000', 
    'reply', 
    '问题收到新回复', 
    '你关注的问题"Scrum和Kanban的主要区别"收到了新回复', 
    false, 
    '22222222-2222-2222-2222-222222222222', 
    NOW() - INTERVAL '20 minutes'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

INSERT INTO app_notifications (id, user_id, type, title, content, is_read, related_id, created_at)
SELECT 
    'n3333333-3333-3333-3333-333333333333', 
    '00000000-0000-0000-0000-000000000000', 
    'mention', 
    '有人@了你', 
    '王小华在讨论中提到了你', 
    true, 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
    NOW() - INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

-- ========================================================
-- 第十四部分：课堂功能示例数据
-- 来源: db_classroom_tables.sql
-- ========================================================

-- 插入示例课堂会话（仅在课程和教师存在时插入）
INSERT INTO app_class_sessions (
    id, course_id, teacher_id, title, classroom, 
    scheduled_start, scheduled_end, status,
    max_students, created_at
)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 
    'course-1', 
    '00000000-0000-0000-0000-000000000000', 
    '项目管理基础 - 第1讲', 
    'A101', 
    '2026-02-10 09:00:00+00', 
    '2026-02-10 09:45:00+00', 
    'completed',
    32, 
    NOW()
WHERE EXISTS (SELECT 1 FROM app_courses WHERE id = 'course-1')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

INSERT INTO app_class_sessions (
    id, course_id, teacher_id, title, classroom, 
    scheduled_start, scheduled_end, status,
    max_students, created_at
)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 
    'course-2', 
    '00000000-0000-0000-0000-000000000000', 
    '敏捷开发实践 - 第1讲', 
    'B203', 
    '2026-02-12 14:00:00+00', 
    '2026-02-12 14:45:00+00', 
    'completed',
    28, 
    NOW()
WHERE EXISTS (SELECT 1 FROM app_courses WHERE id = 'course-2')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

-- 插入示例投票（仅在会话和教师存在时插入）
INSERT INTO app_polls (
    id, session_id, teacher_id, question, options, status, total_votes
)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 
    '00000000-0000-0000-0000-000000000000', 
    '今天的课程难度如何？', 
    '[{"id": "opt1", "text": "简单"}, {"id": "opt2", "text": "适中"}, {"id": "opt3", "text": "困难"}]'::jsonb, 
    'closed', 
    26
WHERE EXISTS (SELECT 1 FROM app_class_sessions WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

INSERT INTO app_polls (
    id, session_id, teacher_id, question, options, status, total_votes
)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 
    '00000000-0000-0000-0000-000000000000', 
    '你更喜欢哪种教学方式？', 
    '[{"id": "opt1", "text": "理论讲解"}, {"id": "opt2", "text": "案例分析"}, {"id": "opt3", "text": "互动讨论"}]'::jsonb, 
    'closed', 
    28
WHERE EXISTS (SELECT 1 FROM app_class_sessions WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

-- ========================================================
-- 第十五部分：表注释
-- ========================================================

COMMENT ON TABLE app_class_sessions IS '课堂会话表，记录每次上课的信息';
COMMENT ON TABLE app_attendance IS '学生签到表，记录学生的出勤情况';
COMMENT ON TABLE app_polls IS '课堂投票表，记录投票题目和选项';
COMMENT ON TABLE app_poll_votes IS '投票记录表，记录学生的投票选择';
COMMENT ON TABLE app_class_questions IS '学生课堂提问表，记录课堂实时提问和回答';
COMMENT ON TABLE app_recordings IS '课堂回播放，记录课程录像信息';
COMMENT ON TABLE app_class_stats IS '课堂统计汇总表，用于数据分析和报告导出';
COMMENT ON TABLE app_class_events IS '课堂事件表，用于实时推送更新';

-- ========================================================
-- 完成提示
-- ========================================================

SELECT '✅ 所有数据库表创建完成！' as status;
SELECT '📋 包含以下模块：' as info;
SELECT '   1. Q&A问答系统 (app_questions, app_question_replies)' as module;
SELECT '   2. 讨论区系统 (app_discussions, app_discussion_replies)' as module;
SELECT '   3. 通知系统 (app_notifications, app_notification_settings)' as module;
SELECT '   4. 课堂功能 (app_class_sessions, app_attendance, app_polls, app_poll_votes, app_class_questions, app_recordings, app_class_stats, app_class_events)' as module;
SELECT '   5. 作业管理 (app_assignments, app_student_submissions)' as module;
SELECT '   6. 个人资料功能 (app_learning_activity, app_achievements, app_user_achievements, app_user_skills)' as module;
SELECT '   7. 公告数据 (app_announcements)' as module;


SELECT '✅ Part 4: 所有种子数据插入完成！' as status;
