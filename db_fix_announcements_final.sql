-- ==========================================
-- 公告表 RLS 修复 + 数据插入
-- ==========================================

-- 1. 先禁用 RLS（临时方案确保数据可读）
ALTER TABLE app_announcements DISABLE ROW LEVEL SECURITY;

-- 2. 清空现有数据（可选，如需保留请注释）
-- TRUNCATE TABLE app_announcements RESTART IDENTITY;

-- 3. 插入公告数据
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
-- 系统公告
('🎉 欢迎使用 ProjectFlow 项目管理学习平台！', 
 '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：
• 学习专业的项目管理课程
• 使用强大的项目管理工具
• 参与社区讨论与经验分享
• 体验实战模拟场景

祝您学习愉快，技能精进！如有任何问题，请联系客服团队。', 
 'success', 10, 'all', true, NOW(), NOW() + INTERVAL '30 days'),

('📢 系统功能更新：全新仪表盘上线', 
 '我们很高兴地宣布，全新的个人仪表盘功能已正式上线！

本次更新内容包括：
• 个性化学习进度展示
• 项目完成度可视化图表
• 快捷操作入口优化
• 学习数据深度分析

点击右上角头像进入「个人中心」即可体验。', 
 'info', 8, 'all', true, NOW(), NOW() + INTERVAL '14 days'),

('🔔 重要通知：系统维护公告', 
 '尊敬的用户：

我们将于本周日凌晨 2:00-4:00 进行系统维护升级，期间部分功能可能无法使用。

维护内容：
• 数据库性能优化
• 安全补丁更新
• 新功能预发布

给您带来的不便，敬请谅解。', 
 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '3 days'),

-- 课程公告
('📚 PMP 认证新课程已上线，快来学习吧！', 
 '备受期待的《PMP 认证完整指南》课程现已正式上线！

课程亮点：
• 35小时专业PDU学时
• 覆盖全部考试知识领域
• 配套练习题库1000+
• 资深PMP讲师在线答疑

会员用户可免费学习全部内容！', 
 'success', 9, 'students', true, NOW(), NOW() + INTERVAL '60 days'),

('🚀 敏捷项目管理实战课程更新通知', 
 '《敏捷项目管理实战》课程已完成内容升级！

更新内容：
• 新增Scrum框架深度解析章节
• 增加5个真实企业案例
• 补充看板(Kanban)实战演练
• 新增DevOps与敏捷结合模块

已报名的学员可直接免费学习更新内容。', 
 'info', 7, 'students', true, NOW(), NOW() + INTERVAL '21 days'),

('👨‍🏫 教师专属：课程创作工具升级', 
 '各位讲师，课程创作工作台已进行全面升级！

新功能包括：
• 富文本编辑器增强，支持更多格式
• 视频章节自动分割功能
• 作业批改批量处理
• 学员学习数据导出

登录讲师后台即可体验新功能。', 
 'info', 6, 'teachers', true, NOW(), NOW() + INTERVAL '30 days'),

-- 活动公告
('🎬 【直播预告】项目管理大咖分享会 - 第3期', 
 '直播主题：《从初级PM到项目总监的成长之路》

直播时间：本周六晚 20:00-21:30

分享嘉宾：李明 - 某互联网大厂项目总监，15年项目管理经验

内容大纲：
• 项目管理职业发展路径
• 关键能力跃升技巧
• 面试与晋升经验分享
• 互动答疑环节

点击预约直播！', 
 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '5 days'),

('🏆 「30天项目管理挑战赛」开始报名！', 
 '想要快速提升项目管理实战能力？加入我们的30天挑战赛！

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
 'success', 8, 'students', true, NOW(), NOW() + INTERVAL '20 days'),

-- 会员专属
('💎 Pro会员专享：高级课程包已解锁', 
 '尊敬的 Pro 会员：

您现在可以学习以下高级课程：
• 项目管理办公室(PMO)建设
• 项目组合管理(PfM)实战
• 敏捷规模化(SAFe)框架
• 项目风险管理高级技巧

感谢您对 ProjectFlow 的支持！', 
 'success', 7, 'pro', true, NOW(), NOW() + INTERVAL '30 days');

-- 4. 重新启用 RLS（如果需要）
-- ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;

-- 5. 验证数据
SELECT COUNT(*) as total_announcements FROM app_announcements;
SELECT type, COUNT(*) as count FROM app_announcements GROUP BY type;
