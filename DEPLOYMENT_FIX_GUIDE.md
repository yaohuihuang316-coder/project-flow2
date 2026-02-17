# 部署修复指南

## 🔥 问题总结

1. **教师管理页面** - 已增强为完整的数据管理（课程/作业/课堂/学生）
2. **公告数据读取** - 需要修复 RLS 策略并插入数据
3. **Vercel 部署** - Token 过期，需要手动部署

## 🚀 立即执行步骤

### 步骤 1: 构建测试

```bash
cd e:\毕业\project-flow2
npm run build
```

### 步骤 2: 手动部署到 Vercel

由于 Token 过期，请使用以下方式之一：

**方式 A - GitHub 自动部署:**
1. 提交代码到 GitHub
2. Vercel 会自动从 GitHub 拉取并部署

**方式 B - Vercel CLI:**
```bash
# 重新登录 Vercel
npx vercel login

# 部署
npx vercel --prod
```

### 步骤 3: 修复公告数据

登录 Supabase Dashboard → SQL Editor，按顺序执行：

**3.1 执行 RLS 修复:**
```sql
-- 启用 RLS
ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Announcements public read" ON app_announcements;
DROP POLICY IF EXISTS "Announcements admin all" ON app_announcements;
DROP POLICY IF EXISTS "Allow all read for testing" ON app_announcements;

-- 创建新策略：所有认证用户可读写
CREATE POLICY "Announcements authenticated read all" ON app_announcements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Announcements authenticated insert" ON app_announcements
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Announcements authenticated update" ON app_announcements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Announcements authenticated delete" ON app_announcements
    FOR DELETE TO authenticated USING (true);
```

**3.2 插入示例数据:**
```sql
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
('欢迎使用 ProjectFlow 项目管理学习平台！', 
 '亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：\n• 学习专业的项目管理课程\n• 使用强大的项目管理工具\n• 参与社区讨论与经验分享\n\n祝您学习愉快！', 
 'success', 10, 'all', true, NOW(), NOW() + INTERVAL '30 days'),

('系统功能更新：全新仪表盘上线', 
 '全新的个人仪表盘功能已上线！\n• 个性化学习进度展示\n• 项目完成度可视化\n• 学习数据深度分析', 
 'info', 8, 'all', true, NOW(), NOW() + INTERVAL '14 days'),

('PMP 认证新课程已上线！', 
 '《PMP 认证完整指南》课程已上线！\n• 35小时PDU学时\n• 覆盖全部考试领域\n• 配套1000+练习题', 
 'success', 9, 'students', true, NOW(), NOW() + INTERVAL '60 days'),

('【直播预告】项目管理大咖分享会', 
 '直播主题：《从初级PM到项目总监的成长之路》\n时间：本周六晚 20:00\n嘉宾：李明 - 互联网大厂项目总监', 
 'warning', 9, 'all', true, NOW(), NOW() + INTERVAL '5 days');
```

### 步骤 4: 验证修复

1. **登录管理员后台** → 左侧「用户管理」
2. **点击教师行的「数据」按钮** → 查看课程/作业/课堂
3. **进入「公告管理」** → 应显示 4 条公告

## 📁 新增文件

| 文件 | 说明 |
|------|------|
| `pages/admin/AdminTeacherDetail.tsx` | 教师数据详情弹窗 |
| `pages/admin/AdminTeachers.tsx` | 已更新，使用新详情组件 |

## 🔧 代码改动

**AdminTeachers 表格操作列:**
- 原「详情」按钮 → 改为「数据」按钮
- 点击后显示完整教师数据管理面板

**AdminTeacherDetail 功能:**
- 📚 课程列表（状态/学生数）
- 📝 作业列表（提交率/截止日）
- ⏱️ 课堂记录（状态/时间）
- 👥 学生统计

## ✅ 验证清单

- [ ] `npm run build` 成功
- [ ] 代码推送到 GitHub
- [ ] Vercel 部署成功
- [ ] Supabase RLS 策略已修复
- [ ] 公告数据已插入
- [ ] 管理员后台「用户管理」显示教师列表
- [ ] 点击「数据」显示教师详情
- [ ] 「公告管理」显示公告列表

## 🆘 如果仍有问题

1. **公告不显示:** 检查 Supabase RLS 策略，临时禁用测试: `ALTER TABLE app_announcements DISABLE ROW LEVEL SECURITY;`
2. **教师数据为空:** 确认 `app_courses`, `app_assignments`, `app_class_sessions` 表有数据
3. **部署失败:** 检查 Vercel Build Logs，确认 `dist` 目录生成成功
