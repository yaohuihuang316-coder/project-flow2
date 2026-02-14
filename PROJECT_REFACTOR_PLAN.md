# ProjectFlow 平台重构方案 v2.0

**制定日期**: 2026-02-03  
**状态**: 规划阶段（待实施）

---

## 目录
1. [后端管理功能完善方案](#1-后端管理功能完善方案)
2. [公告系统真实功能方案](#2-公告系统真实功能方案)
3. [实战模拟重构方案](#3-实战模拟重构方案)
4. [社区功能优化方案](#4-社区功能优化方案)
5. [CPM关键路径重构方案](#5-cpm关键路径重构方案)

---

## 1. 后端管理功能完善方案

### 1.1 当前问题分析

根据数据库表结构和现有后台代码分析，当前后台存在以下问题：

| 菜单项 | 当前状态 | 问题描述 |
|--------|----------|----------|
| 体系课程 | ✅ 部分可用 | 有 CourseBuilder 但缺少课程审核流程 |
| 核心算法 | ⚠️ 占位符 | 仅显示占位页面，无实际功能 |
| 实战项目 | ⚠️ 占位符 | 仅显示占位页面，无实际功能 |
| 知识图谱 | ✅ 可用 | KnowledgeNodeBuilder 功能完整 |
| 用户管理 | ✅ 可用 | UserTable 基础功能完整 |
| 学习进度 | ⚠️ Mock数据 | 使用假数据，未连接真实学习记录 |
| 日程活动 | ⚠️ 占位符 | 仅有UI框架，无真实数据 |
| 内容审核 | ⚠️ 部分可用 | 社区内容审核功能未完善 |
| 全站公告 | ❌ Mock数据 | 纯前端状态，无数据库支持 |
| 会员管理 | ✅ 可用 | 基础功能已连接数据库 |
| 系统配置 | ⚠️ 本地状态 | 配置仅保存在前端状态 |

### 1.2 数据库表结构确认

基于 `db_setup.sql` 和 `db_renovation.sql`，确认以下表已存在或需要创建：

**已存在的表：**
- `app_users` - 用户基础信息
- `app_courses` - 课程数据
- `app_community_posts` - 社区帖子
- `app_kb_nodes` / `app_kb_edges` - 知识图谱
- `membership_subscriptions` - 会员订阅
- `membership_codes` - 兑换码

**需要新增的表：**
- `app_announcements` - 全站公告
- `app_user_follows` - 用户关注关系
- `app_simulation_scenarios` - 实战模拟场景
- `app_simulation_progress` - 用户模拟进度
- `app_system_configs` - 系统配置

### 1.3 后端菜单重构方案

```
后台管理系统重构
├── 📊 概览 (Overview)
│   ├── 仪表盘 ✅ (保持现有，连接真实统计)
│   └── 数据统计 ✅ (保持现有)
│
├── 📚 内容中心 (Content)
│   ├── 课程管理
│   │   ├── 课程列表 ✅ (现有 CourseBuilder 整合)
│   │   ├── 课程审核 🆕 (新增审核工作流)
│   │   └── 课程分类 🆕 (管理 Foundation/Advanced/Implementation)
│   ├── 实验室管理 🆕 (替代"核心算法")
│   │   ├── 工具配置 (管理22个工具的启用/配置)
│   │   └── 算法模板 (CPM/EVM等算法的默认参数)
│   ├── 实战模拟 🆕 (替代"实战项目")
│   │   ├── 场景库 (管理模拟场景)
│   │   ├── 案例剧本 (丹佛机场/NHS等项目)
│   │   └── 评分标准 (配置评分规则)
│   └── 知识图谱 ✅ (保持现有)
│
├── 👥 用户运营 (Users)
│   ├── 用户管理 ✅ (现有 UserTable)
│   ├── 学习进度 🆕 (连接真实进度表)
│   ├── 会员管理 ✅ (保持现有)
│   └── 消息中心 🆕 (新增站内信功能)
│
├── 🌐 社区运营 (Community)
│   ├── 内容审核 🆕 (帖子/评论审核)
│   ├── 话题管理 🆕 (管理话题标签)
│   ├── 举报处理 🆕 (用户举报处理)
│   └── 社区公告 🆕 (社区级别的公告)
│
├── 📢 营销中心 (Marketing)
│   ├── 全站公告 🆕 (系统级公告)
│   ├── 兑换码管理 ✅ (保持现有)
│   └── Banner管理 🆕 (首页轮播图)
│
└── ⚙️ 系统设置 (System)
    ├── 系统配置 🆕 (连接数据库)
    ├── 权限管理 🆕 (角色权限细化)
    └── 操作日志 🆕 (管理员操作记录)
```

### 1.4 新增数据库表DDL

```sql
-- 全站公告表
CREATE TABLE app_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info'|'success'|'warning'|'error'
    priority INTEGER DEFAULT 0, -- 优先级 0-100
    target_audience TEXT DEFAULT 'all', -- 'all'|'free'|'pro'|'pro_plus'
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE, -- NULL表示永久有效
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户关注关系表
CREATE TABLE app_user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    following_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 系统配置表
CREATE TABLE app_system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 实战模拟场景表
CREATE TABLE app_simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium', -- 'Easy'|'Medium'|'Hard'|'Expert'
    category TEXT, -- 'CaseStudy'|'Crisis'|'Planning'|'Team'
    cover_image TEXT,
    stages JSONB DEFAULT '[]', -- 场景阶段配置
    decisions JSONB DEFAULT '[]', -- 决策点配置
    resources JSONB DEFAULT '{}', -- 初始资源
    learning_objectives JSONB DEFAULT '[]', -- 学习目标
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户模拟进度表
CREATE TABLE app_simulation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES app_simulation_scenarios(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 0,
    decisions_made JSONB DEFAULT '[]',
    resources_state JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'in_progress', -- 'in_progress'|'completed'|'abandoned'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, scenario_id)
);
```

---

## 2. 公告系统真实功能方案

### 2.1 功能需求

**后端管理功能：**
- 发布公告（支持富文本）
- 设置公告类型（普通/成功/警告/错误）
- 设置目标受众（全员/Free用户/Pro用户/Pro+用户）
- 设置有效期（开始时间-结束时间）
- 设置优先级（置顶公告）
- 编辑/删除/下线公告

**前端展示功能：**
- Navbar 消息中心展示未读公告
- 公告详情弹窗
- 已读/未读状态跟踪
- 公告历史列表

### 2.2 数据流设计

```
Admin 发布公告
    ↓
supabase.app_announcements (INSERT)
    ↓
前端订阅 (Realtime)
    ↓
Navbar 显示红点提醒
    ↓
用户点击展开消息中心
    ↓
标记已读 → app_user_announcements_read (记录已读状态)
```

### 2.3 已读状态表

```sql
-- 用户公告已读记录
CREATE TABLE app_user_announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES app_announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);
```

### 2.4 前端组件改造

**Navbar 改造：**
- 消息中心分为 "通知" 和 "公告" 两个Tab
- 公告显示优先级图标（🔔普通/✅成功/⚠️警告/❌错误）
- 未读公告显示红点+数字
- 过期公告自动隐藏

---

## 3. 实战模拟重构方案

### 3.1 当前问题

现有 Simulation 页面使用静态案例，问题如下：
- 案例固定，无互动性
- 用户选择不影响结果
- 无评分机制
- 无法追踪学习效果

### 3.2 新方案：分支剧情式实战模拟

**核心概念：**
- **场景 (Scenario)**：完整的项目案例背景
- **阶段 (Stage)**：场景的不同阶段（启动→规划→执行→收尾）
- **决策点 (Decision)**：用户需要做出选择的关键节点
- **资源 (Resources)**：时间/预算/人力/士气等
- **结果 (Outcome)**：基于决策的评分和反馈

**场景设计示例（丹佛机场案例）：**

```
[场景：DIA行李系统危机]

阶段1：项目启动
├── 背景：你被任命为DIA行李系统项目经理
├── 资源：预算5亿美元，工期2年
└── 决策点1：
    ├── 选项A：采用成熟的传统系统（安全但昂贵）
    ├── 选项B：采用创新的自动化系统（风险高但先进）
    └── 选项C：混合方案（平衡但复杂）
    
阶段2：规划危机
├── 触发：航空公司要求提前交付
├── 资源变化：预算削减20%
└── 决策点2：
    ├── 选项A：拒绝变更，坚持原计划
    ├── 选项B：接受挑战，增加人力
    └── 选项C：削减范围，保核心功能

阶段3：执行危机
├── 触发：技术故障频发
├── 资源变化：士气下降，人员流失
└── 决策点3：...

结局：
├── S结局：项目成功（完美决策链）
├── A结局：延期但成功
├── B结局：部分成功
└── F结局：失败（历史真实结局）
```

### 3.3 数据结构

```typescript
// 场景定义
interface SimulationScenario {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    category: 'CaseStudy' | 'Crisis' | 'Planning' | 'Team';
    coverImage: string;
    learningObjectives: string[];
    stages: SimulationStage[];
}

// 阶段
interface SimulationStage {
    id: string;
    name: string;
    description: string;
    context: string; // 场景描述
    resources: ResourceState; // 当前资源状态
    decisions: Decision[];
}

// 决策点
interface Decision {
    id: string;
    question: string;
    description: string;
    options: DecisionOption[];
    timeLimit?: number; // 限时决策（增加紧张感）
}

// 决策选项
interface DecisionOption {
    id: string;
    text: string;
    impact: {
        budget?: number;
        timeline?: number;
        quality?: number;
        morale?: number;
        score: number;
    };
    feedback: string; // 选择后的即时反馈
    nextStageId?: string; // 可能跳转到特殊阶段
}

// 资源状态
interface ResourceState {
    budget: number;      // 预算百分比
    timeline: number;    // 进度百分比
    quality: number;     // 质量分数
    morale: number;      // 团队士气
    stakeholders: number; // 干系人满意度
}
```

### 3.4 评分算法

```typescript
// 综合评分计算
function calculateFinalScore(
    decisions: DecisionRecord[],
    finalResources: ResourceState,
    objectivesMet: boolean[]
): {
    totalScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'F';
    breakdown: ScoreBreakdown;
} {
    // 1. 决策分（40%）
    const decisionScore = decisions.reduce((sum, d) => sum + d.score, 0) / decisions.length * 40;
    
    // 2. 资源管理分（30%）
    const resourceScore = (
        finalResources.budget * 0.1 +
        finalResources.timeline * 0.1 +
        finalResources.quality * 0.05 +
        finalResources.morale * 0.05
    );
    
    // 3. 目标达成（20%）
    const objectiveScore = (objectivesMet.filter(Boolean).length / objectivesMet.length) * 20;
    
    // 4. 时间效率（10%）
    const timeScore = 10; // 根据完成时间计算
    
    const total = decisionScore + resourceScore + objectiveScore + timeScore;
    
    // 评级
    let grade: 'S' | 'A' | 'B' | 'C' | 'F' = 'F';
    if (total >= 95) grade = 'S';
    else if (total >= 85) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    
    return { totalScore: Math.round(total), grade, breakdown };
}
```

### 3.5 UI设计

**模拟流程界面：**
```
┌─────────────────────────────────────────────────────────────┐
│  [场景标题]                              [资源仪表盘]        │
│  丹佛机场行李系统危机                    💰预算 ████████░░   │
│                                          ⏱️进度 ██████░░░░   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📍 阶段 2/5：执行危机                                        │
│                                                             │
│  【场景描述】                                                 │
│  技术团队在测试阶段发现自动化系统的故障率高达15%。            │
│  航空公司威胁如果延误将起诉索赔。                             │
│                                                             │
│  【当前状况】                                                 │
│  • 预算剩余：$2.5亿 (50%)                                    │
│  • 原定上线：3个月后                                         │
│  • 团队士气：低落                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  【需要做出决策】                                             │
│                                                             │
│  ○ 选项A：紧急采购备用系统（-$1亿，保证按时交付）             │
│    风险：预算超支，但能避免延期                               │
│                                                             │
│  ○ 选项B：推迟上线，修复问题（延期6个月，+$5000万）           │
│    风险：面临诉讼和罚款                                       │
│                                                             │
│  ○ 选项C：削减功能范围（保核心功能，部分交付）                │
│    风险：客户不满，项目不完整                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [⏱️ 限时决策: 30秒]            [确认选择]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 社区功能优化方案

### 4.1 功能需求清单

| 功能 | 当前状态 | 需求描述 |
|------|----------|----------|
| 搜索 | ❌ 未实现 | 支持按关键词/用户/标签搜索帖子 |
| 最新发布 | ⚠️ 已有Tab | 需确保排序正确，支持分页 |
| 我的关注 | ❌ 未实现 | 关注用户后，首页显示其帖子 |
| 话题标签 | ⚠️ 部分 | 完善标签系统，支持话题订阅 |
| 帖子分类 | ❌ 未实现 | 按类型筛选（提问/分享/讨论） |
| 内容推荐 | ❌ 未实现 | 基于用户兴趣的推荐算法 |

### 4.2 社区数据结构优化

```sql
-- 社区帖子表扩展
ALTER TABLE app_community_posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'discussion'; -- 'question'|'share'|'discussion'
ALTER TABLE app_community_posts ADD COLUMN IS NOT NULL view_count INTEGER DEFAULT 0;
ALTER TABLE app_community_posts ADD COLUMN IS NOT NULL is_pinned BOOLEAN DEFAULT false;
ALTER TABLE app_community_posts ADD COLUMN IS NOT NULL is_solved BOOLEAN DEFAULT false; -- 问题是否已解决

-- 话题/标签表
CREATE TABLE app_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    follower_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子-话题关联表
CREATE TABLE app_post_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id BIGINT REFERENCES app_community_posts(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES app_topics(id) ON DELETE CASCADE,
    UNIQUE(post_id, topic_id)
);

-- 用户-话题订阅表
CREATE TABLE app_user_topic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES app_topics(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);
```

### 4.3 搜索功能实现

**搜索类型：**
1. **全局搜索** (顶部搜索栏)
   - 搜索帖子内容、标题
   - 搜索用户名
   - 搜索话题标签

2. **筛选搜索** (侧边栏)
   - 按话题筛选
   - 按帖子类型筛选
   - 按发布时间筛选（今天/本周/本月）
   - 按排序筛选（最新/最热/最多评论）

**搜索SQL：**
```sql
-- 帖子搜索
SELECT p.*, u.name as author_name, u.avatar as author_avatar,
       COUNT(DISTINCT l.user_id) as like_count,
       COUNT(DISTINCT c.id) as comment_count
FROM app_community_posts p
LEFT JOIN app_users u ON p.user_id = u.id
LEFT JOIN app_user_likes l ON p.id = l.post_id
LEFT JOIN app_comments c ON p.id = c.post_id
WHERE p.content ILIKE '%关键词%' 
   OR p.user_name ILIKE '%关键词%'
   OR EXISTS (
       SELECT 1 FROM app_post_topics pt
       JOIN app_topics t ON pt.topic_id = t.id
       WHERE pt.post_id = p.id AND t.name ILIKE '%关键词%'
   )
GROUP BY p.id, u.name, u.avatar
ORDER BY p.created_at DESC
LIMIT 20 OFFSET 0;
```

### 4.4 推荐算法（简化版）

```typescript
// 基于用户行为的帖子推荐
function getRecommendedPosts(userId: string): Post[] {
    // 1. 获取用户兴趣标签（从互动历史分析）
    const userTags = getUserInterestTags(userId);
    
    // 2. 获取关注用户的帖子
    const followingPosts = getFollowingPosts(userId);
    
    // 3. 获取热门帖子
    const trendingPosts = getTrendingPosts();
    
    // 4. 混合排序算法
    const scoredPosts = [...followingPosts, ...trendingPosts].map(post => ({
        ...post,
        score: calculatePostScore(post, userTags, userId)
    }));
    
    // 5. 去重并排序
    return scoredPosts
        .sort((a, b) => b.score - a.score)
        .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
        )
        .slice(0, 20);
}

// 评分算法
function calculatePostScore(post: Post, userTags: string[], userId: string): number {
    let score = 0;
    
    // 时间衰减（越新越好）
    const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
    score += Math.max(0, 100 - hoursSincePost * 2);
    
    // 互动热度
    score += post.likes * 2;
    score += post.comments * 5;
    score += post.shares * 10;
    
    // 标签匹配度
    const matchingTags = post.tags.filter(tag => userTags.includes(tag));
    score += matchingTags.length * 15;
    
    // 关注用户加成
    if (post.isFollowing) score += 50;
    
    // 话题订阅加成
    if (post.isSubscribedTopic) score += 30;
    
    return score;
}
```

### 4.5 社区页面布局重构

```
社区页面 (Community)
├── 顶部
│   ├── 搜索栏 🔍 (实时搜索，支持标签#)
│   └── 发布按钮 ✏️
│
├── 主体 (三栏布局)
│   ├── 左侧边栏 (20%)
│   │   ├── 导航菜单
│   │   │   ├── 🏠 推荐
│   │   │   ├── 🔥 热门
│   │   │   ├── 🆕 最新
│   │   │   ├── 👤 我的关注
│   │   │   └── 💬 我的回复
│   │   ├── 话题订阅
│   │   │   ├── #PMP备考
│   │   │   ├── #敏捷实践
│   │   │   └── [+ 发现更多]
│   │   └── 热门话题
│   │
│   ├── 中间流 (60%)
│   │   ├── 筛选栏
│   │   │   ├── [全部] [提问] [分享] [讨论]
│   │   │   └── 排序：[最新] [最热] [精华]
│   │   └── 帖子列表
│   │       ├── 置顶帖 (如果有)
│   │       ├── 普通帖子
│   │       └── 加载更多
│   │
│   └── 右侧边栏 (20%)
│       ├── 👥 推荐关注
│       ├── 🏆 活跃达人
│       └── 📊 社区统计
│
└── 底部
    └── 分页/无限滚动
```

---

## 5. CPM关键路径重构方案

### 5.1 当前问题

1. **界面复杂** - 左侧控制面板占据太多空间
2. **可视化问题** - 箭头位置、标签显示不正确
3. **缺少实时反馈** - 修改任务后不会自动重新计算
4. **缺少关键路径高亮** - 计算后关键路径不明显
5. **无法导出** - 不能保存或分享CPM图
6. **缺少时间轴** - 没有甘特图视图

### 5.2 新方案：双视图CPM工具

**核心功能：**
- **网络图视图** - 现有的节点-连线图
- **甘特图视图** - 新增时间轴视图
- **实时计算** - 任何修改自动重新计算
- **智能布局** - 自动调整节点位置避免重叠
- **数据持久化** - 保存到数据库，支持历史版本

### 5.3 数据结构优化

```typescript
// CPM项目
interface CPMProject {
    id: string;
    name: string;
    description?: string;
    tasks: CPMTask[];
    createdAt: string;
    updatedAt: string;
    userId: string;
}

// 任务节点
interface CPMTask {
    id: string;
    name: string;
    duration: number; // 工期（天）
    optimistic?: number; // 乐观时间（PERT用）
    pessimistic?: number; // 悲观时间（PERT用）
    mostLikely?: number; // 最可能时间（PERT用）
    predecessors: string[]; // 前置任务ID
    successors?: string[]; // 后置任务ID（计算得出）
    
    // 计算结果
    es: number; // 最早开始
    ef: number; // 最早结束
    ls: number; // 最晚开始
    lf: number; // 最晚结束
    slack: number; // 浮动时间
    isCritical: boolean; // 是否关键路径
    level: number; // 层级（用于布局）
    
    // UI属性
    position?: { x: number; y: number }; // 手动调整的位置
    color?: string; // 自定义颜色
}

// 计算结果
interface CPMCalculationResult {
    tasks: CPMTask[];
    projectDuration: number; // 项目总工期
    criticalPath: string[]; // 关键路径任务ID数组
    criticalPaths: string[][]; // 多条关键路径（如果有）
}
```

### 5.4 新界面设计

```
CPM关键路径工具 (Chronos Studio 2.0)
┌─────────────────────────────────────────────────────────────────────┐
│  🔧 Chronos Studio                              [网络图] [甘特图]    │
├─────────────────────────────────────────────────────────────────────┤
│  📊 项目概览面板 (可折叠)                                             │
│  ├── 总工期: 14天  |  关键任务: 4个  |  浮动时间: 2天                │
│  └── [导出PDF] [导出图片] [保存项目] [历史版本]                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │   [网络图视图]                                                │ │
│  │                                                               │ │
│  │     ┌───┐      ┌───┐      ┌───┐      ┌───┐                  │ │
│  │     │ A │─────→│ B │─────→│ D │─────→│ F │  ← 关键路径(红色) │ │
│  │     │3天│      │5天│      │6天│      │3天│                  │ │
│  │     └───┘      └───┘      └───┘      └───┘                  │ │
│  │       │          ↑                                       │ │
│  │       └──────┐   │                                         │ │
│  │              ↓   │                                         │ │
│  │            ┌───┐ │                                         │ │
│  │            │ C │─┘  ← 非关键路径(灰色, +2d浮动)            │ │
│  │            │4天│                                           │ │
│  │            └───┘                                           │ │
│  │                                                               │ │
│  │  点击节点编辑  |  拖拽连线添加依赖  |  右键菜单删除            │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  📋 任务列表 (底部可展开面板)                                         │
│  ┌──────────┬────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │ 任务名称  │ 工期   │ 前置任务  │ ES/EF    │ LS/LF    │ 浮动时间 │ │
│  ├──────────┼────────┼──────────┼──────────┼──────────┼──────────┤ │
│  │ ■ A需求  │ 3天    │ -        │ 0/3      │ 0/3      │ 0 ⭐     │ │
│  │ ■ B设计  │ 5天    │ A        │ 3/8      │ 3/8      │ 0 ⭐     │ │
│  │ □ C架构  │ 4天    │ A        │ 3/7      │ 4/8      │ 1        │ │
│  │ ■ D开发  │ 6天    │ B        │ 8/14     │ 8/14     │ 0 ⭐     │ │
│  └──────────┴────────┴──────────┴──────────┴──────────┴──────────┘ │
│  [+ 添加任务]                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.5 交互优化

**新增交互：**
1. **拖拽创建依赖** - 从任务A拖到任务B自动创建依赖
2. **双击编辑** - 双击节点打开编辑弹窗
3. **右键菜单** - 删除/复制/修改颜色
4. **画布拖拽** - 空白处拖拽移动画布
5. **缩放控制** - 鼠标滚轮缩放，支持 fit-to-screen
6. **实时计算** - 任何修改后自动重新计算关键路径

**任务编辑弹窗：**
```
┌──────────────────────────────┐
│  编辑任务                     │
├──────────────────────────────┤
│  任务名称: [______________]  │
│  工期(天): [__3__]           │
│                              │
│  前置任务:                   │
│  [A需求分析 ▢] [B设计 ▢] ... │
│                              │
│  高级选项 ▼                  │
│  ├── 乐观时间: [__2__]       │
│  ├── 最可能:   [__3__]       │
│  └── 悲观时间: [__5__]       │
│                              │
│  [保存] [删除] [取消]        │
└──────────────────────────────┘
```

### 5.6 甘特图视图

```
甘特图视图
┌─────────────────────────────────────────────────────────────────┐
│ 任务名称      │ 第1周      │ 第2周      │ 第3周      │ 第4周     │
├───────────────┼────────────┼────────────┼────────────┼───────────┤
│ ■ A需求分析   │██████      │            │            │           │
│ ■ B原型设计   │      ██████████        │            │           │
│ □ C后端架构   │      ████████          │            │  ← 浮动   │
│ ■ D前端开发   │            │      ██████████████    │           │
│ ■ E API开发   │            │      ██████████        │           │
│ ■ F集成测试   │            │            │      ████████         │
│                                                               │
│ 图例: ████ 关键路径  ░░░░ 非关键路径  │ 里程碑◆               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 实施优先级建议

### P0 (最高优先级)
1. 公告系统真实功能（影响所有用户）
2. CPM重构（核心工具，当前有bug）
3. 后端Admin菜单整理（开发效率）

### P1 (高优先级)
4. 社区搜索功能（用户体验）
5. 社区关注功能（用户粘性）
6. 实战模拟重构（核心功能）

### P2 (中优先级)
7. 系统配置持久化
8. 学习进度真实数据
9. 内容审核工作流

### P3 (低优先级)
10. Banner管理
11. 操作日志
12. 推荐算法优化

---

## 7. 技术实现注意事项

### 7.1 数据库迁移
- 所有DDL语句需要按依赖顺序执行
- 建议使用 Supabase Migration 管理版本
- 重要：新增表后需要配置RLS权限

### 7.2 前端状态管理
- 考虑使用 Zustand 或 Redux Toolkit 管理复杂状态
- CPM工具需要独立的画布状态管理
- 社区帖子列表需要虚拟滚动优化性能

### 7.3 Realtime订阅
- 公告系统使用 Supabase Realtime 推送
- 社区新帖子实时通知
- 避免过度订阅造成性能问题

### 7.4 性能优化
- CPM图使用 Canvas 替代 SVG（大量节点时）
- 社区帖子列表使用 Intersection Observer 懒加载
- 搜索功能使用防抖（debounce）

---

**方案制定完成，等待评审后进入实施阶段。**
