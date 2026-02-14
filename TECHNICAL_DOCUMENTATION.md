# ProjectFlow 技术文档

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [前端架构](#5-前端架构)
6. [页面组件详解](#6-页面组件详解)
7. [类型系统](#7-类型系统)
8. [API 集成](#8-api-集成)
9. [部署配置](#9-部署配置)

---

## 1. 项目概述

ProjectFlow 是一个企业级项目管理学习平台，集成了课程学习、知识图谱、实战模拟、AI 助手和社区功能。系统采用会员制分级访问控制，支持从免费用户到 Pro+ 会员的渐进式权限升级。

### 核心功能模块

- **Dashboard**: 用户仪表盘，展示学习进度和统计
- **LearningHub**: 学习中心，包含 CPM 等实验室工具
- **Classroom**: 课程学习页面
- **KnowledgeGraphV2**: 3D 知识图谱可视化
- **LearningPath**: 个性化学习路径规划（新增）
- **Simulation**: 实战模拟场景
- **ToolsLab**: 专业 PM 工具集合
- **Community**: 社区讨论
- **AI Assistant**: AI 学习助手
- **Membership**: 会员系统
- **Admin**: 后台管理系统

---

## 2. 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | 样式框架 |
| Lucide React | latest | 图标库 |
| Recharts | 2.x | 数据可视化 |
| ECharts | 5.x | 知识图谱可视化 |
| jsPDF | latest | PDF 导出 |
| html2canvas | latest | 截图导出 |

### 后端服务

| 服务 | 用途 |
|------|------|
| Supabase | PostgreSQL 数据库 + Auth |
| Google GenAI | Gemini AI 模型 |
| Moonshot AI | Kimi AI 报告生成 |

### 部署

- **平台**: Vercel
- **环境变量**: `.env` 文件配置

---

## 3. 项目结构

```
project-flow2/
├── App.tsx                    # 主应用组件，路由管理
├── index.tsx                  # 入口文件
├── index.html                 # HTML 模板
├── types.ts                   # 全局类型定义
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 依赖管理
├── vercel.json                # Vercel 部署配置
│
├── components/                # 公共组件
│   ├── Navbar.tsx             # 桌面端导航栏
│   ├── MobileTabbar.tsx       # 移动端底部导航
│   └── MembershipGuard.tsx    # 会员权限守卫
│
├── pages/                     # 页面组件
│   ├── Dashboard.tsx          # 仪表盘
│   ├── LearningHub.tsx        # 学习中心（含 CPM 工具）
│   ├── Classroom.tsx          # 课程学习
│   ├── KnowledgeGraphV2.tsx   # 知识图谱 3D
│   ├── LearningPath.tsx       # 学习路径页面（新增）
│   ├── Simulation.tsx         # 实战模拟
│   ├── ToolsLab.tsx           # 工具实验室
│   ├── Community.tsx          # 社区
│   ├── AiAssistant.tsx        # AI 助手
│   ├── Profile.tsx            # 个人中心
│   ├── Schedule.tsx           # 日程管理
│   ├── Membership.tsx         # 会员中心
│   ├── Payment.tsx            # 支付页面
│   ├── Login.tsx              # 登录页面
│   └── admin/                 # 后台管理页面
│       ├── AdminLayout.tsx
│       ├── AdminDashboard.tsx
│       ├── UserTable.tsx
│       ├── AdminProgress.tsx
│       ├── AdminContent.tsx
│       ├── AdminCommunity.tsx
│       ├── AdminAnnouncements.tsx
│       ├── AdminMembership.tsx
│       ├── AdminSimulation.tsx
│       └── AdminAnalytics.tsx
│
├── lib/                       # 工具库
│   ├── supabaseClient.ts      # Supabase 客户端配置
│   └── kimiService.ts         # Kimi AI 服务
│
├── tools/                     # 实验室工具组件
│   ├── CCPMSchedule.tsx       # 关键链项目管理
│   └── ...                    # 其他工具
│
├── docs/                      # 文档目录
│
└── *.sql                      # 数据库脚本
    ├── db_complete.sql        # 完整数据库脚本
    ├── db_setup.sql           # 基础表结构
    ├── db_simulation_*.sql    # 模拟场景数据
    └── db_tools_*.sql         # 工具相关表
```

---

## 4. 数据库设计

### 4.1 核心表结构

#### 4.1.1 用户表 (app_users)

```sql
CREATE TABLE app_users (
    id TEXT PRIMARY KEY,                    -- 用户唯一标识
    email TEXT NOT NULL UNIQUE,             -- 邮箱
    name TEXT,                              -- 用户名
    role TEXT DEFAULT 'Student',            -- 角色: SuperAdmin/Manager/Editor/Student
    status TEXT DEFAULT '正常',              -- 状态
    department TEXT,                        -- 部门
    avatar TEXT,                            -- 头像 URL
    created_at TIMESTAMPTZ DEFAULT NOW(),   -- 创建时间
    
    -- 会员系统字段
    subscription_tier TEXT DEFAULT 'free',  -- 会员等级: free/pro/pro_plus
    membership_expires_at TIMESTAMPTZ,      -- 会员过期时间
    is_lifetime_member BOOLEAN DEFAULT false, -- 终身会员
    completed_courses_count INTEGER DEFAULT 0, -- 完成课程数
    
    -- 积分系统
    xp INTEGER DEFAULT 0,                   -- 经验值
    streak INTEGER DEFAULT 0,               -- 连续学习天数
    
    -- AI 权限
    ai_tier TEXT DEFAULT 'none',            -- AI 等级: none/basic/pro
    ai_daily_used INTEGER DEFAULT 0,        -- 今日 AI 使用次数
    ai_daily_reset_at TIMESTAMPTZ           -- AI 计数重置时间
);
```

**字段说明:**
- `subscription_tier`: 会员等级控制，影响功能访问权限
- `completed_courses_count`: 自动触发会员升级（5门→Pro, 10门→Pro+）
- `ai_tier`: 控制 AI 助手功能访问级别

#### 4.1.2 课程表 (app_courses)

```sql
CREATE TABLE app_courses (
    id TEXT PRIMARY KEY,                    -- 课程ID
    category TEXT,                          -- 分类: Foundation/Advanced/Implementation
    title TEXT NOT NULL,                    -- 课程标题
    author TEXT,                            -- 讲师
    description TEXT,                       -- 描述
    image TEXT,                             -- 封面图
    status TEXT DEFAULT 'Published',        -- 状态
    duration TEXT,                          -- 总时长
    views INTEGER DEFAULT 0,                -- 浏览数
    rating DOUBLE PRECISION DEFAULT 4.5,    -- 评分
    
    -- JSON 字段存储复杂数据
    chapters JSONB DEFAULT '[]',            -- 章节列表
    resources JSONB DEFAULT '[]',           -- 资源列表
    kb_node_ids JSONB DEFAULT '[]',         -- 关联知识节点
    
    -- 学习路径排序
    learning_path_order INTEGER,            -- 学习路径顺序
    category_color TEXT,                    -- 分类颜色
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_update TIMESTAMPTZ
);
```

**chapters JSON 结构:**
```json
[
  {
    "id": "ch-1-1",
    "title": "章节标题",
    "duration": "15:00",
    "type": "video|quiz|article"
  }
]
```

#### 4.1.3 用户进度表 (app_user_progress)

```sql
CREATE TABLE app_user_progress (
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES app_courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,             -- 进度百分比 0-100
    status TEXT DEFAULT 'Started',          -- Started/In Progress/Completed
    notes TEXT,                             -- 学习笔记
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    completed_chapters JSONB DEFAULT '[]',  -- 已完成章节ID列表
    PRIMARY KEY (user_id, course_id)
);
```

**触发器:** 自动更新用户 `completed_courses_count`

```sql
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
```

#### 4.1.4 知识图谱节点表 (app_kb_nodes)

```sql
CREATE TABLE app_kb_nodes (
    id SERIAL PRIMARY KEY,                  -- 节点ID
    label VARCHAR NOT NULL UNIQUE,          -- 节点名称
    type VARCHAR NOT NULL,                  -- 类型: concept/skill/tool/certification
    description TEXT,                       -- 描述
    difficulty INTEGER DEFAULT 1,           -- 难度 1-5
    estimated_hours INTEGER DEFAULT 0,      -- 预计学时
    
    -- 关联课程
    course_id TEXT REFERENCES app_courses(id),
    course_category TEXT,                   -- 课程分类
    node_level INTEGER DEFAULT 1,           -- 节点层级 1-3
    
    -- 前置知识
    prerequisites JSONB DEFAULT '[]',       -- 前置节点ID列表
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**节点类型说明:**
- `concept`: 概念性知识
- `skill`: 技能类知识
- `tool`: 工具使用
- `certification`: 认证相关

#### 4.1.5 知识图谱边表 (app_kb_edges)

```sql
CREATE TABLE app_kb_edges (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,             -- 源节点ID
    target_id INTEGER NOT NULL,             -- 目标节点ID
    type VARCHAR NOT NULL,                  -- 关系类型
    relation_type TEXT DEFAULT 'related',   -- prerequisite/related/leads_to
    strength INTEGER DEFAULT 1,             -- 关系强度 1-3
    weight NUMERIC DEFAULT 1.0,             -- 权重
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.6 用户知识掌握度表 (app_user_kb_mastery) - 新增

```sql
CREATE TABLE app_user_kb_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id INTEGER REFERENCES app_kb_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0,        -- 掌握度 0-100
    last_studied_at TIMESTAMPTZ,            -- 最后学习时间
    study_count INTEGER DEFAULT 0,          -- 学习次数
    UNIQUE(user_id, node_id)
);
```

**用途:** 记录用户对知识图谱中各节点的掌握程度，用于学习路径计算。

#### 4.1.7 社区帖子表 (app_community_posts)

```sql
CREATE TABLE app_community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES app_users(id),
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    role TEXT,
    content TEXT NOT NULL,
    image TEXT,
    tags JSONB DEFAULT '[]',
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false,
    post_type TEXT DEFAULT 'discussion',    -- discussion/question/resource
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.8 实战模拟场景表 (app_simulation_scenarios)

```sql
CREATE TABLE app_simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium',       -- Easy/Medium/Hard/Expert
    category TEXT,
    cover_image TEXT,
    stages JSONB DEFAULT '[]',              -- 场景阶段
    decisions JSONB DEFAULT '[]',           -- 决策选项
    resources JSONB DEFAULT '{}',           -- 初始资源
    learning_objectives JSONB DEFAULT '[]', -- 学习目标
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.9 用户模拟进度表 (app_simulation_progress)

```sql
CREATE TABLE app_simulation_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES app_simulation_scenarios(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 0,
    decisions_made JSONB DEFAULT '[]',      -- 已做决策记录
    resources_state JSONB DEFAULT '{}',     -- 当前资源状态
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'in_progress',      -- in_progress/completed/abandoned
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, scenario_id)
);
```

#### 4.1.10 会员订阅记录表 (membership_subscriptions)

```sql
CREATE TABLE membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,                     -- free/pro/pro_plus
    payment_method TEXT,                    -- course_completion/payment/code
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',            -- 额外信息
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.11 会员兑换码表 (membership_codes)

```sql
CREATE TABLE membership_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,              -- 兑换码
    tier TEXT NOT NULL,                     -- pro/pro_plus
    duration_days INTEGER DEFAULT 30,       -- 有效期天数
    is_used BOOLEAN DEFAULT false,
    used_by TEXT REFERENCES app_users(id),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                 -- 兑换码过期时间
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 索引设计

```sql
-- 用户相关
CREATE INDEX idx_app_users_tier ON app_users(subscription_tier);
CREATE INDEX idx_app_users_email ON app_users(email);

-- 课程相关
CREATE INDEX idx_app_courses_category ON app_courses(category);
CREATE INDEX idx_app_courses_status ON app_courses(status);

-- 进度相关
CREATE INDEX idx_app_user_progress_user ON app_user_progress(user_id);
CREATE INDEX idx_app_user_progress_course ON app_user_progress(course_id);

-- 社区相关
CREATE INDEX idx_app_community_posts_user ON app_community_posts(user_id);
CREATE INDEX idx_app_community_posts_created ON app_community_posts(created_at DESC);
CREATE INDEX idx_app_community_posts_type ON app_community_posts(post_type);

-- 知识图谱相关
CREATE INDEX idx_kb_nodes_course ON app_kb_nodes(course_id);
CREATE INDEX idx_kb_nodes_type ON app_kb_nodes(type);
CREATE INDEX idx_kb_edges_source ON app_kb_edges(source_id);
CREATE INDEX idx_kb_edges_target ON app_kb_edges(target_id);

-- 模拟相关
CREATE INDEX idx_simulation_progress_user ON app_simulation_progress(user_id);
CREATE INDEX idx_simulation_scenarios_published ON app_simulation_scenarios(is_published);

-- 掌握度相关
CREATE INDEX idx_user_kb_mastery_user ON app_user_kb_mastery(user_id);
CREATE INDEX idx_user_kb_mastery_node ON app_user_kb_mastery(node_id);
```

### 4.3 RLS (Row Level Security) 策略

```sql
-- 用户表：公开访问（简化开发）
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Users" ON app_users FOR ALL USING (true);

-- 课程表：公开访问
ALTER TABLE app_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Courses" ON app_courses FOR ALL USING (true);

-- 用户进度：仅访问自己的数据
ALTER TABLE app_user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own progress" ON app_user_progress
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::text);

-- 模拟进度：仅访问自己的数据
ALTER TABLE app_simulation_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own simulation progress" ON app_simulation_progress
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::text);

-- 公告：仅查看有效的
ALTER TABLE app_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements public read" ON app_announcements
    FOR SELECT USING (is_active = true AND (end_at IS NULL OR end_at > NOW()));
```

---

## 5. 前端架构

### 5.1 路由系统

使用基于枚举的单页应用路由系统：

```typescript
// types.ts
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  CLASSROOM = 'CLASSROOM',
  COMMUNITY = 'COMMUNITY',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PROFILE = 'PROFILE',
  SCHEDULE = 'SCHEDULE',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  LEARNING_PATH = 'LEARNING_PATH',  // 新增
  SIMULATION = 'SIMULATION',
  TOOLS_LAB = 'TOOLS_LAB',
  MEMBERSHIP = 'MEMBERSHIP',
  PAYMENT = 'PAYMENT',
  // 后台页面...
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  // ...
}
```

路由切换通过 `navigateTo(page, param)` 函数实现：

```typescript
// App.tsx
const navigateTo = (page: Page, param?: string) => {
  if (param) setCurrentParam(param);
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

### 5.2 会员权限控制

使用 `MembershipGuard` 组件进行权限控制：

```typescript
// components/MembershipGuard.tsx
interface MembershipGuardProps {
  user: UserProfile | null;
  targetPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}
```

权限检查逻辑：
1. 检查用户是否登录
2. 检查用户会员等级是否满足要求
3. 若不满足，跳转到会员中心或显示升级提示

### 5.3 状态管理

使用 React Hooks 进行状态管理：

- `useState`: 组件本地状态
- `useEffect`: 副作用处理（数据获取、订阅）
- `useCallback`: 回调函数缓存
- `useContext`: 跨组件状态共享（Toast 系统）

全局状态：
- `currentUser`: 当前登录用户
- `currentPage`: 当前页面
- `currentParam`: 当前页面参数（课程ID、节点ID等）

---

## 6. 页面组件详解

### 6.1 LearningPath 学习路径页面（新增）

**文件:** `pages/LearningPath.tsx`

**功能:** 展示知识点的完整学习路径、相关资源和学习统计。

**核心接口:**

```typescript
interface LearningPathProps {
  nodeId?: string;                    // 目标知识节点ID
  currentUser?: UserProfile | null;   // 当前用户
  onNavigate?: (page: Page, param?: string) => void;
  onBack?: () => void;
}
```

**主要功能模块:**

1. **学习路径计算**
   - BFS 算法找最短学习路径
   - 前置知识自动收集
   - 路径节点状态管理（已完成/当前/锁定）

2. **学习资源生成**
   - 视频资源
   - 文章阅读
   - 练习题
   - 工具使用指南

3. **统计展示**
   - 已完成/总节点数
   - 总学习时长
   - 总体进度百分比
   - 预计完成日期

**数据流:**
```
1. 接收 nodeId 参数
2. 查询 app_kb_nodes 获取所有节点
3. 查询 app_user_kb_mastery 获取用户掌握度
4. 计算学习路径（考虑前置依赖）
5. 查询相关节点（同分类/同难度）
6. 生成学习资源列表
7. 计算统计数据
```

### 6.2 KnowledgeGraphV2 知识图谱

**文件:** `pages/KnowledgeGraphV2.tsx`

**功能:** 3D 可视化知识图谱，支持交互探索。

**核心特性:**
- Canvas 绘制力导向图
- 节点分类显示（基础/进阶/专家）
- 搜索和筛选功能
- AI 学习助手集成
- 学习路径高亮

**视图模式:**
- `all`: 显示所有节点
- `unlocked`: 仅显示已解锁节点
- `path`: 显示学习路径节点

### 6.3 Simulation 实战模拟

**文件:** `pages/Simulation.tsx`

**功能:** 项目管理实战场景模拟。

**核心数据结构:**

```typescript
interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  stages: SimulationStage[];
  learning_objectives: string[];
}

interface SimulationStage {
  id: string;
  title: string;
  description: string;
  decisions: Decision[];
  resources?: ResourceState;
}

interface Decision {
  id: string;
  text: string;
  impact: {
    score: number;
    resources?: ResourceState;
    feedback: string;
  };
  is_optimal?: boolean;
}
```

**AI 报告生成:**
- 使用 Kimi API 生成个性化学习报告
- 展示在页面内（非 PDF 导出）

### 6.4 LearningHub CPM 工具

**文件:** `pages/LearningHub.tsx` (CpmStudio 组件)

**功能:** 关键路径法可视化分析工具。

**核心算法:**

```typescript
class CpmEngine {
  static calculate(tasks: CpmTask[]): CpmTask[] {
    // 1. 正向计算 ES, EF
    // 2. 反向计算 LS, LF
    // 3. 计算浮动时间
    // 4. 确定关键路径
  }
}
```

**特性:**
- 预设项目模板（软件/建筑/活动）
- 交互式任务编辑
- 网络图可视化
- 关键路径高亮
- 项目导出功能

---

## 7. 类型系统

### 7.1 用户相关类型

```typescript
export type MembershipTier = 'free' | 'pro' | 'pro_plus';
export type AITier = 'none' | 'basic' | 'pro';
export type AdminRole = 'SuperAdmin' | 'Manager' | 'Editor' | 'Student';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  completedCoursesCount: number;
  isLifetimeMember: boolean;
  aiTier: AITier;
  aiDailyUsed: number;
  xp?: number;
  streak?: number;
}
```

### 7.2 知识图谱类型

```typescript
export type KnowledgeNodeType = 'concept' | 'core' | 'skill' | 'tool' | 'certification';
export type KnowledgeNodeLevel = 1 | 2 | 3;
export type RelationType = 'prerequisite' | 'related' | 'leads_to' | 'part_of';

export interface KnowledgeNode {
  id: string;
  label: string;
  category: string;
  courseId?: string;
  nodeLevel: KnowledgeNodeLevel;
  nodeType: KnowledgeNodeType;
  description?: string;
  learningHours: number;
  difficulty: number;
  prerequisites: string[];
  masteryLevel?: number;
}
```

---

## 8. API 集成

### 8.1 Supabase 集成

```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 8.2 数据查询模式

```typescript
// 查询示例
const { data, error } = await supabase
  .from('app_courses')
  .select('*')
  .eq('status', 'Published')
  .order('created_at', { ascending: false });

// 关联查询
const { data } = await supabase
  .from('app_user_progress')
  .select('*, app_courses(*)')
  .eq('user_id', userId);

// JSON 字段查询
const { data } = await supabase
  .from('app_courses')
  .select('*')
  .contains('kb_node_ids', [nodeId]);
```

### 8.3 Kimi AI 服务

```typescript
// lib/kimiService.ts
export const generateSimulationReport = async (
  data: SimulationReportData
): Promise<KimiReportResponse> => {
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_MOONSHOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        { role: 'system', content: '你是项目管理专家...' },
        { role: 'user', content: generatePrompt(data) }
      ]
    })
  });
  return response.json();
};
```

---

## 9. 部署配置

### 9.1 环境变量

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MOONSHOT_API_KEY=your-moonshot-key
VITE_GOOGLE_API_KEY=your-google-key
```

### 9.2 Vercel 配置

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 9.3 构建命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

---

## 附录

### A. 数据库完整脚本

详见 `db_complete.sql` 文件，包含：
- 所有表结构定义
- 索引创建
- 触发器和函数
- RLS 策略
- 种子数据

### B. 会员升级逻辑

```sql
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
    
    -- 完成5门课程升级到 Pro
    IF v_current_tier = 'free' AND v_completed_count >= 5 THEN
        UPDATE app_users SET subscription_tier = 'pro' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (...);
        v_current_tier := 'pro';
        v_upgraded := true;
    END IF;
    
    -- 完成10门课程升级到 Pro+
    IF v_current_tier IN ('free', 'pro') AND v_completed_count >= 10 THEN
        UPDATE app_users SET subscription_tier = 'pro_plus' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (...);
        v_current_tier := 'pro_plus';
        v_upgraded := true;
    END IF;
    
    RETURN QUERY SELECT v_old_tier, v_current_tier, v_upgraded;
END;
$$ LANGUAGE plpgsql;
```

---

**文档版本:** v1.0  
**更新日期:** 2026-02-14  
**作者:** AI Assistant
