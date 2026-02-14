# 后台管理页面修复方案

## 现状分析

| 页面 | 当前状态 | 问题 | 修复优先级 |
|------|----------|------|------------|
| AdminDashboard | 部分数据 | 图表使用假数据 | 中 |
| AdminAnalytics | 未知 | 需要检查 | 中 |
| UserTable | 较完整 | 有CRUD功能 | 低 |
| AdminProgress | 较完整 | 主要是展示 | 低 |
| AdminContent | 部分功能 | labs/projects标签页管理功能弱 | 高 |
| AdminCommunity | 部分功能 | 缺少编辑功能 | 中 |
| AdminEvents | 功能缺失 | 只有删除，没有创建/编辑 | 高 |
| AdminSystem | 部分功能 | topics和edges管理不完整 | 高 |
| AdminAnnouncements | 已修复 | 功能完整 | 完成 |
| AdminMembership | 较完整 | 功能完整 | 完成 |
| AdminSimulation | 较完整 | 功能完整 | 完成 |
| AdminTools | 新建 | 功能完整 | 完成 |

---

## 详细修复方案

### 1. AdminEvents - 日程活动管理（高优先级）

**当前问题:**
- 只有删除功能
- 没有创建/编辑功能
- 依赖不存在的 `app_events` 表

**修复方案:**

#### A. 创建 app_events 表
```sql
CREATE TABLE IF NOT EXISTS app_events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'webinar', -- webinar, workshop, deadline, etc
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT, -- 线上/线下地址
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage events"
ON app_events FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() AND role IN ('SuperAdmin', 'Manager')
));

CREATE POLICY "Users can view public events"
ON app_events FOR SELECT
TO authenticated
USING (is_public = true);
```

#### B. 重写 AdminEvents.tsx
- 添加创建/编辑弹窗
- 完整CRUD功能
- 日历视图和列表视图

---

### 2. AdminSystem - 系统配置（高优先级）

**当前问题:**
- Announcements: 已移出到单独页面，此处重复
- Topics: 只有列表，没有完整CRUD
- Edges: 只有列表，没有管理功能

**修复方案:**

#### A. 简化页面结构
移除 announcements 标签（已在AdminAnnouncements管理）

#### B. 完善 Topics 管理
```sql
-- 确保 app_topics 表结构完整
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE app_topics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
```

#### C. 完善 Edges 管理
添加创建/编辑/删除知识图谱边的功能

---

### 3. AdminContent - 内容管理（高优先级）

**当前问题:**
- Courses: 有CourseBuilder，功能完整
- Labs: 只有列表，没有管理功能
- Projects: 只有列表，没有管理功能
- Graph: 有KnowledgeNodeBuilder

**修复方案:**

#### A. Labs 标签页
使用 AdminTools 作为 Labs 管理（已创建）

#### B. Projects 标签页
使用 AdminSimulation 作为 Projects 管理（已创建）

#### C. 移除重复标签或重定向
建议：
- 保留 Courses 和 Graph
- Labs 重定向到 AdminTools
- Projects 重定向到 AdminSimulation

---

### 4. AdminCommunity - 社区管理（中优先级）

**当前问题:**
- 有删除功能
- 缺少编辑功能

**修复方案:**
- 添加编辑帖子功能
- 添加置顶/取消置顶功能
- 添加审核功能

---

### 5. AdminDashboard - 仪表盘（中优先级）

**当前问题:**
- 部分数据真实
- 图表有假数据

**修复方案:**
- 连接真实统计数据
- 用户增长趋势
- 课程完成率
- 社区活跃度

---

### 6. AdminAnalytics - 数据分析（中优先级）

**需要检查当前状态**
如果功能缺失，需要：
- 用户行为分析
- 学习数据分析
- 课程热度分析

---

## 实施建议

由于页面较多，建议分阶段实施：

### 阶段1: 高优先级（2-3天）
1. AdminEvents - 完整重构
2. AdminSystem - 简化并完善Topics/Edges
3. AdminContent - 整合Labs和Projects到专门页面

### 阶段2: 中优先级（1-2天）
4. AdminCommunity - 添加编辑功能
5. AdminDashboard - 真实数据
6. AdminAnalytics - 检查并修复

### 阶段3: 优化（1天）
7. 统一UI风格
8. 添加加载状态
9. 错误处理优化

---

## 需要确认的问题

1. **Events 表是否需要？** 还是使用现有表？
   - 如果需要，请确认表结构
   - 如果不需要，AdminEvents页面是否删除？

2. **AdminContent 的 Labs/Projects 标签**
   - 是移除这两个标签（因为已有专门页面）？
   - 还是在当前页面嵌入管理功能？

3. **AdminSystem 的 Announcements**
   - 是否移除（因为已有AdminAnnouncements）？

4. **AdminAnalytics 是否需要？**
   - 当前是否有这个页面？
   - 功能需求是什么？

请确认以上问题，我开始实施修复。
