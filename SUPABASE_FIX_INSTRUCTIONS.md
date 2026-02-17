# Supabase 公告数据修复步骤

## 步骤 1: 修复 RLS 策略

访问: https://supabase.com/dashboard/project/ghhvdffsyvzkhbftifzy/sql

执行以下 SQL:

```sql
-- 禁用 RLS
ALTER TABLE app_announcements DISABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Allow all operations" ON app_announcements;

-- 创建新策略 - 允许所有用户读写
CREATE POLICY "Allow all operations" ON app_announcements
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 重新启用 RLS
ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;
```

## 步骤 2: 插入公告数据

在同一 SQL 编辑器中继续执行:

```sql
-- 清空旧数据
TRUNCATE TABLE app_announcements RESTART IDENTITY;

-- 插入公告数据
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
-- 系统公告
('🎉 欢迎使用 ProjectFlow 项目管理学习平台！', 
 '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：\n• 学习专业的项目管理课程\n• 使用强大的项目管理工具\n• 参与社区讨论与经验分享\n• 体验实战模拟场景\n\n祝您学习愉快，技能精进！如有任何问题，请联系客服团队。', 
 'success', 10, 'all', true, NOW(), NOW() + INTERVAL '30 days'),

('📢 系统功能更新：全新仪表盘上线', 
 '我们很高兴地宣布，全新的个人仪表盘功能已正式上线！\n\n本次更新内容包括：\n• 个性化学习进度展示\n• 项目完成度可视化图表\n• 快捷操作入口优化\n• 学习数据深度分析\n\n点击右上角头像进入「个人中心」即可体验。', 
 'info', 8, 'all', true, NOW(), NOW() + INTERVAL '14 days'),

('🔔 重要通知：系统维护公告', 
 '尊敬的用户：\n\n我们将于本周日凌晨 2:00-4:00 进行系统维护升级，期间部分功能可能无法使用。\n\n维护内容：\n• 数据库性能优化\n• 安全补丁更新\n• 新功能预发布\n\n给您带来的不便，敬请谅解。', 
 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '3 days'),

-- 课程公告
('📚 PMP 认证新课程已上线，快来学习吧！', 
 '备受期待的《PMP 认证完整指南》课程现已正式上线！\n\n课程亮点：\n• 35小时专业PDU学时\n• 覆盖全部考试知识领域\n• 配套练习题库1000+\n• 资深PMP讲师在线答疑\n\n会员用户可免费学习全部内容！', 
 'success', 9, 'students', true, NOW(), NOW() + INTERVAL '60 days'),

('🚀 敏捷项目管理实战课程更新通知', 
 '《敏捷项目管理实战》课程已完成内容升级！\n\n更新内容：\n• 新增Scrum框架深度解析章节\n• 增加5个真实企业案例\n• 补充看板(Kanban)实战演练\n• 新增DevOps与敏捷结合模块\n\n已报名的学员可直接免费学习更新内容。', 
 'info', 7, 'students', true, NOW(), NOW() + INTERVAL '21 days'),

('👨‍🏫 教师专属：课程创作工具升级', 
 '各位讲师，课程创作工作台已进行全面升级！\n\n新功能包括：\n• 富文本编辑器增强，支持更多格式\n• 视频章节自动分割功能\n• 作业批改批量处理\n• 学员学习数据导出\n\n登录讲师后台即可体验新功能。', 
 'info', 6, 'teachers', true, NOW(), NOW() + INTERVAL '30 days'),

-- 活动公告
('🎬 【直播预告】项目管理大咖分享会 - 第3期', 
 '直播主题：《从初级PM到项目总监的成长之路》\n\n直播时间：本周六晚 20:00-21:30\n\n分享嘉宾：李明 - 某互联网大厂项目总监，15年项目管理经验\n\n内容大纲：\n• 项目管理职业发展路径\n• 关键能力跃升技巧\n• 面试与晋升经验分享\n• 互动答疑环节\n\n点击预约直播！', 
 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '5 days'),

('🏆 「30天项目管理挑战赛」开始报名！', 
 '想要快速提升项目管理实战能力？加入我们的30天挑战赛！\n\n活动形式：\n• 每日学习任务打卡\n• 真实项目案例分析\n• 团队协作模拟练习\n• 导师点评与指导\n\n活动时间：下月1日-30日\n报名截止：本月28日\n\n完成挑战可获得：\n✓ 官方认证证书\n✓ 精美周边礼品\n✓ Pro会员体验月卡\n\n名额有限，立即报名！', 
 'success', 8, 'students', true, NOW(), NOW() + INTERVAL '20 days'),

-- 会员专属
('💎 Pro会员专享：高级课程包已解锁', 
 '尊敬的 Pro 会员：\n\n您现在可以学习以下高级课程：\n• 项目管理办公室(PMO)建设\n• 项目组合管理(PfM)实战\n• 敏捷规模化(SAFe)框架\n• 项目风险管理高级技巧\n\n感谢您对 ProjectFlow 的支持！', 
 'success', 7, 'pro', true, NOW(), NOW() + INTERVAL '30 days');

-- 验证
SELECT COUNT(*) as total FROM app_announcements;
SELECT type, COUNT(*) as count FROM app_announcements GROUP BY type;
```

## 步骤 3: 验证

执行查询验证数据:
```sql
SELECT id, title, type, is_active FROM app_announcements ORDER BY priority DESC;
```
