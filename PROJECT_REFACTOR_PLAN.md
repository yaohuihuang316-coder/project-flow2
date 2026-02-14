# ProjectFlow 平台重构方案 v2.0

**制定日期**: 2026-02-03  
**状态**: 规划阶段（待实施）

---

## 📊 问题清单与解决方案

### 问题1: 登录账号角色管理
**现状:**
- 测试账号角色混乱
- Pro账号跳转管理员页面

**解决方案:**

```sql
-- 重置测试账号（执行此SQL）
UPDATE app_users SET 
    role = 'Student',
    subscription_tier = CASE email
        WHEN 'free@test.com' THEN 'free'
        WHEN 'pro@test.com' THEN 'pro'
        WHEN 'pp@test.com' THEN 'pro_plus'
        WHEN 'admin@test.com' THEN 'SuperAdmin'
    END,
    name = CASE email
        WHEN 'free@test.com' THEN 'Free用户'
        WHEN 'pro@test.com' THEN 'Pro用户'
        WHEN 'pp@test.com' THEN 'ProPlus用户'
        WHEN 'admin@test.com' THEN '管理员'
    END
WHERE email IN ('free@test.com', 'pro@test.com', 'pp@test.com', 'admin@test.com');

-- 确保只有admin是SuperAdmin
UPDATE app_users SET role = 'Student' WHERE email != 'admin@test.com';
UPDATE app_users SET role = 'SuperAdmin' WHERE email = 'admin@test.com';
```

**登录逻辑修复:**
```typescript
// App.tsx 登录处理
const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    // 只有SuperAdmin/Manager去后台，其他去Dashboard
    if (['SuperAdmin', 'Manager'].includes(user.role)) {
        setCurrentPage(Page.ADMIN_DASHBOARD);
    } else {
        setCurrentPage(Page.DASHBOARD);
    }
};
```

---

### 问题2: 三个账号测试数据准备

**需要创建的数据:**

```sql
-- ========== Free用户数据 ==========
-- 学习进度：2门进行中，1门完成
INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT 
    id,
    'c-f1',
    35,
    '["ch1"]',
    '项目管理基础学习笔记第一章',
    NOW() - INTERVAL '1 day'
FROM app_users WHERE email = 'free@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT 
    id,
    'c-f2',
    60,
    '["ch1","ch2"]',
    '进度管理学习心得',
    NOW() - INTERVAL '2 hours'
FROM app_users WHERE email = 'free@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT 
    id,
    'c-f3',
    100,
    '["ch1","ch2","ch3"]',
    '已完成范围管理课程',
    NOW() - INTERVAL '3 days'
FROM app_users WHERE email = 'free@test.com';

-- 更新streak和XP
UPDATE app_users SET 
    streak = 3,
    xp = 350,
    completed_courses_count = 1
WHERE email = 'free@test.com';

-- Activity logs（用于热力图）
INSERT INTO app_activity_logs (user_id, activity_type, description, points, created_at)
SELECT id, 'course_progress', '学习项目管理基础', 10, NOW() - INTERVAL '1 day'
FROM app_users WHERE email = 'free@test.com';

INSERT INTO app_activity_logs (user_id, activity_type, description, points, created_at)
SELECT id, 'course_completed', '完成范围管理课程', 50, NOW() - INTERVAL '3 days'
FROM app_users WHERE email = 'free@test.com';

-- ========== Pro用户数据 ==========
-- 8门课程进度（5进行中，3完成）
INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-f1', 100, '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '5 days'
FROM app_users WHERE email = 'pro@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-f2', 100, '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '4 days'
FROM app_users WHERE email = 'pro@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-f3', 100, '["ch1","ch2","ch3"]', '已完成', NOW() - INTERVAL '3 days'
FROM app_users WHERE email = 'pro@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-f4', 75, '["ch1","ch2"]', '关键路径学习中', NOW() - INTERVAL '1 day'
FROM app_users WHERE email = 'pro@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-a1', 45, '["ch1"]', '质量管理入门', NOW() - INTERVAL '12 hours'
FROM app_users WHERE email = 'pro@test.com';

INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, notes, last_accessed)
SELECT id, 'c-a2', 20, '["ch1"]', '敏捷管理开始', NOW() - INTERVAL '2 hours'
FROM app_users WHERE email = 'pro@test.com';

-- 工具使用记录
INSERT INTO app_cpm_projects (user_id, name, description, tasks, created_at)
SELECT id, '示例项目A', 'CPM练习项目', '[{"id":1,"name":"任务A"}]', NOW()
FROM app_users WHERE email = 'pro@test.com';

UPDATE app_users SET 
    streak = 15,
    xp = 1200,
    completed_courses_count = 3
WHERE email = 'pro@test.com';

-- 更多activity logs（用于热力图）
INSERT INTO app_activity_logs (user_id, activity_type, description, points, created_at)
SELECT id, 'tool_usage', '使用CPM工具', 20, d
FROM app_users CROSS JOIN (SELECT generate_series(1, 15) as i, NOW() - (i || ' days')::INTERVAL as d) days
WHERE email = 'pro@test.com';

-- ========== Pro+用户数据 ==========
-- 12门课程进度（4进行中，8完成）
INSERT INTO app_user_progress (user_id, course_id, progress, completed_chapters, last_accessed)
SELECT id, course_id, CASE 
    WHEN course_id IN ('c-f1','c-f2','c-f3','c-f4','c-f5','c-f6') THEN 100
    WHEN course_id IN ('c-a1','c-a2') THEN 100
    WHEN course_id IN ('c-i1') THEN 100
    ELSE 70
END, 
CASE 
    WHEN course_id LIKE 'c-f%' THEN '["ch1","ch2","ch3"]'
    ELSE '["ch1","ch2"]'
END,
NOW() - (random() * 5)::INTEGER || ' days'
FROM app_users, (VALUES ('c-f1'),('c-f2'),('c-f3'),('c-f4'),('c-f5'),('c-f6'),('c-a1'),('c-a2'),('c-a3'),('c-i1'),('c-i2')) AS courses(course_id)
WHERE email = 'pp@test.com';

-- 模拟场景完成记录
INSERT INTO app_simulation_progress (user_id, scenario_id, current_stage, score, max_score, status, completed_at)
SELECT u.id, s.id, 5, 85, 100, 'completed', NOW() - INTERVAL '2 days'
FROM app_users u, app_simulation_scenarios s
WHERE u.email = 'pp@test.com' AND s.title = '项目危机处理';

-- AI使用记录
INSERT INTO app_ai_usage (user_id, prompt, response, tokens_used, created_at)
SELECT id, '什么是关键路径？', '关键路径是项目中最长的任务序列...', 150, NOW() - INTERVAL '1 day'
FROM app_users WHERE email = 'pp@test.com';

UPDATE app_users SET 
    streak = 30,
    xp = 2800,
    completed_courses_count = 8
WHERE email = 'pp@test.com';
```

---

### 问题3: Profile页面重构（成就/贡献/能力）

**数据库表创建:**
```sql
-- 用户徽章表
CREATE TABLE IF NOT EXISTS app_user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    badge_color TEXT,
    badge_bg TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 用户能力值表（用于雷达图）
CREATE TABLE IF NOT EXISTS app_user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,  -- '规划', '执行', '预算', etc
    skill_en TEXT,             -- 'Plan', 'Exec', 'Cost'
    score INTEGER DEFAULT 0,   -- 0-150
    max_score INTEGER DEFAULT 150,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- 插入技能初始数据
INSERT INTO app_user_skills (user_id, skill_name, skill_en, score)
SELECT id, '规划', 'Plan', 145 FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, '执行', 'Exec', 125 FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, '预算', 'Cost', 135 FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, '风险', 'Risk', 148 FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, '领导力', 'Lead', 140 FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, '敏捷', 'Agile', 130 FROM app_users WHERE email = 'pp@test.com';

-- 插入徽章数据
INSERT INTO app_user_badges (user_id, badge_id, badge_name, badge_icon, badge_color, badge_bg)
SELECT id, 'pmp_master', 'PMP大师', 'Crown', 'text-yellow-600', 'bg-yellow-100'
FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, 'early_bird', '早起鸟', 'Zap', 'text-yellow-500', 'bg-yellow-50'
FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, 'all_rounder', '全能王', 'Trophy', 'text-purple-500', 'bg-purple-100'
FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, 'streak_master', '连胜大师', 'Flame', 'text-orange-500', 'bg-orange-100'
FROM app_users WHERE email = 'pp@test.com'
UNION ALL
SELECT id, 'bug_hunter', 'Bug猎手', 'Bug', 'text-green-500', 'bg-green-100'
FROM app_users WHERE email = 'pp@test.com';
```

**Profile.tsx重构要点:**
1. 热力图 → 使用 `app_activity_logs` 真实数据 ✅ 已有
2. 雷达图 → 从 `app_user_skills` 读取
3. 徽章 → 从 `app_user_badges` 读取
4. 证书 → 从 `app_user_progress` 读取已完成课程 ✅ 已有

---

### 问题4: 学习模块课程与后台对应

**现状分析:**
- 前台LearningHub显示 Foundation/Advanced/Implementation
- 后台需要能管理这些分类

**解决方案:**
```sql
-- 确保课程分类一致
UPDATE app_courses SET category = 'Foundation' WHERE category IN ('基础', 'Foundation', 'F');
UPDATE app_courses SET category = 'Advanced' WHERE category IN ('进阶', 'Advanced', 'A');
UPDATE app_courses SET category = 'Implementation' WHERE category IN ('实战', 'Implementation', 'I');

-- 检查分类分布
SELECT category, COUNT(*) FROM app_courses WHERE status = 'Published' GROUP BY category;
```

**AdminContent.tsx修改:**
- 确保courses标签页显示的课程分类正确
- 添加category字段编辑

---

### 问题5: ToolsLab返回键和UI优化

**修改内容:**
```typescript
// ToolsLab.tsx 每个工具详情页添加返回按钮
<header className="flex items-center gap-4 p-4 border-b">
    <button 
        onClick={() => setSelectedTool(null)}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
    >
        <ChevronLeft size={20} /> 返回工具列表
    </button>
    <h1>{tool.name}</h1>
</header>
```

**UI问题修复:**
1. 检查会员守卫显示
2. 优化工具卡片网格布局
3. 修复深色主题切换

---

### 问题6: 实战模块检查

**检查Simulation.tsx:**
- ✅ 已从 `app_simulation_scenarios` 读取
- ✅ 多阶段决策流程
- ✅ 进度保存到 `app_simulation_progress`

**如果存在问题:**
1. 检查表结构是否正确
2. 检查是否有测试场景数据
3. 验证用户角色权限

---

### 问题7: 后台核心算法管理

**创建 AdminTools.tsx:**
```typescript
// 管理实验室工具
// CRUD: CPM, PERT, Risk, Monte Carlo等工具配置
// 存储在 app_tools 表或 app_courses(category='lab')
```

**数据库表:**
```sql
CREATE TABLE IF NOT EXISTS app_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'cpm', 'pert', 'risk', etc
    icon TEXT,
    config JSONB, -- 工具配置参数
    is_active BOOLEAN DEFAULT true,
    required_tier TEXT DEFAULT 'pro', -- 'free', 'pro', 'pro_plus'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 问题8: 后台实战项目对应实战模拟

**方案A: 重命名（如果两者是同一个）**
```typescript
// AdminLayout.tsx
{ label: '实战项目', page: Page.ADMIN_SIMULATION, icon: Target }
// 而不是 '模拟场景'
```

**方案B: 分离（如果不同）**
- 保留 AdminSimulation 管理模拟场景
- 创建 AdminProjects 管理实战项目（不同的数据结构）

**建议:** 先确认"实战项目"和"模拟场景"是否是同一概念

---

### 问题9: 公告发布失败排查

**排查清单:**
```sql
-- 1. 检查RLS策略
SELECT * FROM pg_policies WHERE tablename = 'app_announcements';

-- 2. 检查表结构
\d app_announcements

-- 3. 检查是否有触发器限制
SELECT * FROM pg_trigger WHERE tgrelid = 'app_announcements'::regclass;
```

**常见修复:**
```sql
-- 确保管理员有写入权限
CREATE POLICY "Admins can manage announcements"
ON app_announcements
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' IN ('SuperAdmin', 'Manager'))
WITH CHECK (auth.jwt() ->> 'role' IN ('SuperAdmin', 'Manager'));
```

---

### 问题10: 后台仪表盘真实数据

**AdminDashboard.tsx需要查询:**
```typescript
// 1. 用户统计
const { data: userStats } = await supabase
    .from('app_users')
    .select('subscription_tier, count')
    .group('subscription_tier');

// 2. 今日新增
const { data: todayUsers } = await supabase
    .from('app_users')
    .select('count')
    .gte('created_at', new Date().toISOString().split('T')[0]);

// 3. 课程完成率
const { data: courseStats } = await supabase
    .from('app_user_progress')
    .select('progress')
    .eq('progress', 100);

// 4. 社区活跃度
const { data: todayPosts } = await supabase
    .from('app_community_posts')
    .select('count')
    .gte('created_at', new Date().toISOString().split('T')[0]);

// 5. 模拟完成情况
const { data: simStats } = await supabase
    .from('app_simulation_progress')
    .select('status, count')
    .group('status');
```

---

## 📅 实施顺序建议

### 阶段1: 基础修复（2小时）
1. 修复测试账号角色（问题1）
2. 插入三个账号测试数据（问题2）
3. 修复公告发布（问题9）

### 阶段2: 核心功能（3小时）
4. 重构Profile页面数据（问题3）
5. 修复课程分类对应（问题4）
6. 修复ToolsLab UI（问题5）

### 阶段3: 后台完善（3小时）
7. 检查实战模块（问题6）
8. 创建工具管理（问题7）
9. 确认实战项目/模拟场景（问题8）
10. 后台仪表盘真实数据（问题10）

---

## ✅ 验收标准

| 检查项 | 标准 |
|--------|------|
| 登录测试 | 三个账号分别显示不同数据 |
| Profile页 | 热力图/雷达图/徽章都有真实数据 |
| LearningHub | 课程分类与后台一致 |
| ToolsLab | 有返回按钮，UI正常 |
| Simulation | 可正常进入并完成模拟 |
| Admin后台 | 公告可发布，数据真实 |

---

**请先确认以下问题我再开始实施:**

1. **"实战项目"和"模拟场景"是同一个东西吗？** 如果不是，请描述区别
2. **核心算法工具** 是单独表还是存在app_courses？
3. **公告发布失败** 有具体错误信息吗？

确认后我将按阶段开始实施。
