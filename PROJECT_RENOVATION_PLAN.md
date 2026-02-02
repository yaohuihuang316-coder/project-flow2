# ProjectFlow 平台改造方案

## 📋 改造概述

本次改造包含以下核心模块：
1. **课程与知识图谱深度同步**
2. **知识图谱UI重构**（丰富的节点展示+课程跳转）
3. **AI助手分级体系**（基础版/进阶版）
4. **AI助手页面重构**（解决显示问题）
5. **会员中心页面**（点击专业会员后跳转）

---

## 一、课程与知识图谱同步方案

### 1.1 课程结构扩展

将现有3个分类扩展到 **6课程/分类 × 3分类 = 18门课程**

```
📚 Foundation (基础层) - 蓝色系
├── 01. 项目管理概述 (Intro to PM)
├── 02. 敏捷开发基础 (Agile Basics)
├── 03. WBS工作分解结构 (WBS)
├── 04. 项目进度管理 (Schedule Mgmt)
├── 05. 风险管理入门 (Risk Basics)
└── 06. 团队协作与沟通 (Team & Comm)

🎓 Advanced (进阶层) - 紫色系
├── 07. PMP认证冲刺 (PMP Prep)
├── 08. 挣值管理EVM (Earned Value)
├── 09. CPM关键路径法 (Critical Path)
├── 10. 敏捷Scrum实战 (Scrum Master)
├── 11. 商业分析PBA (Business Analysis)
└── 12. 项目集管理 (Program Mgmt)

🚀 Implementation (实战层) - 橙色系
├── 13. 项目全生命周期 (Full Lifecycle)
├── 14. DevOps体系实战 (DevOps)
├── 15. 经典案例剖析 (Case Studies)
├── 16. 项目管理工具链 (Toolchain)
├── 17. 复盘与持续改进 (Retrospective)
└── 18. 领导力与软技能 (Leadership)
```

### 1.2 数据库表结构改造

```sql
-- ==========================================
-- 1. 知识图谱节点表扩展
-- ==========================================
ALTER TABLE app_kb_nodes 
ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES app_courses(id),
ADD COLUMN IF NOT EXISTS course_category TEXT, -- 'Foundation'|'Advanced'|'Implementation'
ADD COLUMN IF NOT EXISTS node_level INTEGER DEFAULT 1, -- 1=基础, 2=进阶, 3=实战
ADD COLUMN IF NOT EXISTS node_type TEXT DEFAULT 'concept', -- 'concept'|'skill'|'tool'|'certification'
ADD COLUMN IF NOT EXISTS learning_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1, -- 1-5星难度
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb; -- 前置知识点ID数组

-- ==========================================
-- 2. 课程表扩展 - 添加知识图谱关联
-- ==========================================
ALTER TABLE app_courses 
ADD COLUMN IF NOT EXISTS kb_node_ids JSONB DEFAULT '[]'::jsonb, -- 关联的知识点ID列表
ADD COLUMN IF NOT EXISTS learning_path_order INTEGER, -- 学习路径顺序
ADD COLUMN IF NOT EXISTS category_color TEXT; -- 分类颜色标识

-- ==========================================
-- 3. 知识图谱边表扩展 - 支持多种关系类型
-- ==========================================
ALTER TABLE app_kb_edges 
ADD COLUMN IF NOT EXISTS relation_type TEXT DEFAULT 'related', -- 'prerequisite'|'related'|'leads_to'|'part_of'
ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 1; -- 关联强度 1-3

-- ==========================================
-- 4. 用户知识掌握度表
-- ==========================================
CREATE TABLE IF NOT EXISTS app_user_kb_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    node_id TEXT REFERENCES app_kb_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0, -- 0-100 掌握度
    last_studied_at TIMESTAMP WITH TIME ZONE,
    study_count INTEGER DEFAULT 0,
    UNIQUE(user_id, node_id)
);
```

### 1.3 知识图谱节点数据示例

```sql
-- Foundation 层节点 (course_category='Foundation', node_level=1)
INSERT INTO app_kb_nodes (id, label, category, course_id, course_category, node_level, node_type, description, learning_hours, difficulty) VALUES
('kb-pm-intro', '项目管理概述', 'Core', 'c-101', 'Foundation', 1, 'concept', '项目管理的基本概念、五大过程组、十大知识领域', 3, 1),
('kb-agile-manifesto', '敏捷宣言', 'Concept', 'c-102', 'Foundation', 1, 'concept', '敏捷开发的四大价值观和十二原则', 2, 1),
('kb-wbs', 'WBS分解', 'Tool', 'c-103', 'Foundation', 1, 'tool', '工作分解结构的创建方法和最佳实践', 4, 2),
-- ... 每个课程对应3-5个核心知识点

-- Advanced 层节点 (course_category='Advanced', node_level=2)
INSERT INTO app_kb_nodes (id, label, category, course_id, course_category, node_level, node_type, description, learning_hours, difficulty, prerequisites) VALUES
('kb-evm', '挣值管理', 'Core', 'c-107', 'Advanced', 2, 'skill', 'EVM核心指标：PV, EV, AC, SPI, CPI, EAC', 5, 3, '["kb-pm-intro"]'),
('kb-cpm', '关键路径法', 'Tool', 'c-109', 'Advanced', 2, 'tool', 'CPM计算、浮动时间、关键链', 4, 3, '["kb-schedule-basics"]'),
-- ...

-- Implementation 层节点 (course_category='Implementation', node_level=3)
INSERT INTO app_kb_nodes (id, label, category, course_id, 'Implementation', 3, 'skill', '实际项目中的挣值管理应用', 8, 4, '["kb-evm"]');
```

---

## 二、知识图谱UI重构方案

### 2.1 当前问题
- 只有简单的圆圈节点
- 缺乏视觉层次感
- 节点信息展示单一

### 2.2 新UI设计 - 多层级节点系统

```
┌─────────────────────────────────────────────────────────────────┐
│                    知识图谱可视化界面                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────┐         ┌─────────┐         ┌─────────┐         │
│    │  💎     │─────────│  📊     │─────────│  🎯     │         │
│    │  PMP    │         │  EVM    │         │  ROI    │         │
│    │ 认证    │         │ 挣值    │         │ 分析    │         │
│    │ [认证]  │         │ [技能]  │         │ [工具]  │         │
│    └─────────┘         └────┬────┘         └─────────┘         │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐        │
│    │  📈     │         │  ⏱️     │         │  💰     │        │
│    │  SPI    │         │  CPM    │         │  NPV    │        │
│    │ 指标    │         │ 关键路径│         │ 净现值  │        │
│    └─────────┘         └─────────┘         └─────────┘        │
│                                                                 │
│    [图例: 🟦基础 🟪进阶 🟧实战 ⬜概念 💎认证 🔧工具 📊技能]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 节点样式设计

#### 节点类型与样式对应

| 节点类型 | 图标 | 形状 | 大小 | 颜色 | 边框 |
|---------|------|------|------|------|------|
| 概念 (concept) | 💡 | 圆形 | 40px | 灰色 #64748b | 实线 |
| 核心知识 (core) | 📚 | 六边形 | 50px | 蓝色 #3b82f6 | 粗实线 |
| 技能 (skill) | 📊 | 方形(圆角) | 45px | 紫色 #8b5cf6 | 实线 |
| 工具 (tool) | 🔧 | 菱形 | 45px | 橙色 #f59e0b | 实线 |
| 认证 (certification) | 💎 | 星形 | 55px | 金色 #fbbf24 | 双线+发光 |

#### 节点层级样式

```typescript
// 节点渲染配置
const NODE_CONFIG = {
  Foundation: {
    color: '#3b82f6',      // 蓝色
    glowColor: 'rgba(59, 130, 246, 0.3)',
    ringColor: '#60a5fa',
    fontSize: 12
  },
  Advanced: {
    color: '#8b5cf6',      // 紫色
    glowColor: 'rgba(139, 92, 246, 0.3)',
    ringColor: '#a78bfa',
    fontSize: 13
  },
  Implementation: {
    color: '#f97316',      // 橙色
    glowColor: 'rgba(249, 115, 22, 0.3)',
    ringColor: '#fb923c',
    fontSize: 14
  }
};

// 掌握度视觉指示
const MASTERY_INDICATOR = {
  0: { ringOpacity: 0.2, badge: '🔘' },      // 未学习
  25: { ringOpacity: 0.4, badge: '⭐' },     // 初学
  50: { ringOpacity: 0.6, badge: '⭐⭐' },   // 掌握
  75: { ringOpacity: 0.8, badge: '⭐⭐⭐' }, // 熟练
  100: { ringOpacity: 1, badge: '👑' }       // 精通
};
```

### 2.4 边线（关系）样式

```typescript
const EDGE_STYLES = {
  prerequisite: {    // 前置依赖
    color: '#ef4444',
    width: 2,
    dash: [5, 5],
    label: '前置'
  },
  related: {         // 关联
    color: '#94a3b8',
    width: 1,
    dash: null,
    label: '关联'
  },
  leads_to: {        // 进阶
    color: '#22c55e',
    width: 2,
    dash: null,
    label: '进阶'
  },
  part_of: {         // 组成部分
    color: '#3b82f6',
    width: 1,
    dash: [2, 2],
    label: '包含'
  }
};
```

### 2.5 侧边栏详情面板 - 点击节点后

```
┌──────────────────────────────────────┐
│  ✕                                  │
│  ┌──────────────────────────────┐   │
│  │         📚                   │   │
│  │      挣值管理                 │   │
│  │      EVM                      │   │
│  └──────────────────────────────┘   │
│                                      │
│  📊 掌握度: ████████░░ 80%          │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  📖 定义                             │
│  挣值管理(EVM)是一种项目管理技术...  │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  📐 核心公式                         │
│  ┌──────────────────────────────┐   │
│  │ PV = 计划工作 × 计划单价      │   │
│  │ EV = 已完成工作 × 计划单价    │   │
│  │ AC = 已完成工作 × 实际单价    │   │
│  │ SPI = EV / PV                │   │
│  │ CPI = EV / AC                │   │
│  └──────────────────────────────┘   │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🔗 前置知识                         │
│  • 项目管理概述 ✓                   │
│  • 成本管理基础 ✗                   │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  📚 关联课程                         │
│  ┌──────────────────────────────┐   │
│  │  📗 PMP认证冲刺              │   │
│  │  ⏱️ 8小时  ⭐⭐⭐⭐⭐         │   │
│  │  进度: 60%                    │   │
│  │                              │   │
│  │  [🎯 继续学习]               │   │
│  └──────────────────────────────┘   │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🎯 相关知识点                       │
│  ┌─────────┐  ┌─────────┐           │
│  │  SPI    │  │  CPM    │           │
│  └─────────┘  └─────────┘           │
│                                      │
└──────────────────────────────────────┘
```

### 2.6 课程跳转逻辑

```typescript
// 点击节点侧边栏的"继续学习"按钮
const handleContinueLearning = () => {
  if (selectedNode.course_id) {
    // 跳转到课堂页面
    onNavigate(Page.CLASSROOM, selectedNode.course_id);
  }
};

// 或者在Dashboard点击知识图谱widget节点时
const handleNodeClick = (node) => {
  if (node.course_id) {
    // 显示确认弹窗或直接跳转
    showCourseModal(node.course_id);
    // 或
    onNavigate(Page.CLASSROOM, node.course_id);
  }
};
```

---

## 三、AI助手分级权限方案

### 3.1 用户等级与AI权限对照

| 用户等级 | AI基础版 | AI进阶版 | 日调用限制 |
|---------|---------|---------|-----------|
| **Free (免费)** | ❌ 不可用 | ❌ 不可用 | 0 |
| **Basic (基础)** | ✅ Gemini Flash | ❌ 不可用 | 50次/日 |
| **Pro (专业)** | ✅ Gemini Flash | ❌ 不可用 | 100次/日 |
| **Pro+ (高级)** | ✅ Gemini Flash | ✅ Kimi 2.5 | 300次/日 |

### 3.2 AI模型配置

```typescript
// lib/ai-config.ts
export const AI_MODELS = {
  basic: {
    id: 'gemini-3-flash-preview',
    provider: 'google',
    name: 'Gemini Flash',
    description: '快速响应，适合日常问答',
    maxTokens: 2048,
    temperature: 0.7,
    icon: '⚡',
    color: '#4285f4',
    features: ['知识问答', '概念解释', '简单分析']
  },
  pro: {
    id: 'kimi-k2.5',
    provider: 'moonshot',
    name: 'Kimi 2.5',
    description: '深度思考，适合复杂分析',
    maxTokens: 8192,
    temperature: 0.5,
    icon: '🧠',
    color: '#6366f1',
    features: ['深度分析', '文档生成', '代码编写', '战略规划']
  }
};

// 权限检查
export const canUseAIModel = (userTier: string, modelType: 'basic' | 'pro'): boolean => {
  const tierLevels = { free: 0, basic: 1, pro: 2, pro_plus: 3 };
  const requiredLevel = modelType === 'pro' ? 3 : 1; // pro需要pro_plus
  return tierLevels[userTier] >= requiredLevel;
};
```

### 3.3 数据库扩展

```sql
-- 用户表添加AI权限字段
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'none', -- 'none'|'basic'|'pro'
ADD COLUMN IF NOT EXISTS ai_daily_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_daily_reset_at TIMESTAMP WITH TIME ZONE;

-- AI使用记录表
CREATE TABLE IF NOT EXISTS app_ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    model TEXT NOT NULL, -- 'gemini-flash'|'kimi-2.5'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    query TEXT, -- 用户提问（可选记录）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 每日限制重置函数
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
    UPDATE app_users 
    SET ai_daily_used = 0,
        ai_daily_reset_at = NOW() + INTERVAL '1 day'
    WHERE ai_daily_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 四、AI助手页面重构方案

### 4.1 当前问题诊断

从截图分析，当前AI助手页面存在以下问题：
1. **导航栏遮挡**：内容区域没有留出足够的顶部padding
2. **底部输入框被截断**：flex布局高度计算不正确
3. **消息区域溢出**：缺少正确的滚动容器设置
4. **移动端适配差**：响应式断点处理不当
5. **快捷提示区域布局问题**：小屏幕下显示异常

### 4.2 新布局架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navbar (fixed, h-20)                     │
├─────────────────────────────────────────────────────────────────┤
│                      AI助手页面容器                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Header Bar (固定高度 64px)                              │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 🤖 AI智能助手    [Basic ▼] [清空对话]           │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  Messages Area (flex-1, overflow-y-auto)                │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 👤 用户消息                                      │   │   │
│  │  │ ┌─────────────────────────────────────────────┐ │   │   │
│  │  │ │ 如何编写项目计划?                            │ │   │   │
│  │  │ └─────────────────────────────────────────────┘ │   │   │
│  │  │                                                 │   │   │
│  │  │ 🤖 AI回复                                        │   │   │
│  │  │ ┌─────────────────────────────────────────────┐ │   │   │
│  │  │ │ 编写项目计划需要以下步骤:                    │ │   │   │
│  │  │ │ 1. 明确项目目标                               │ │   │   │
│  │  │ │ 2. 定义范围...                                │ │   │   │
│  │  │ └─────────────────────────────────────────────┘ │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Quick Prompts (可选显示，max-height 120px)              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │  │ 🛤️ CPM解释  │ │ 📋 项目章程 │ │ 📊 EVM介绍  │       │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Input Area (固定高度，底部安全区域适配)                 │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ [输入框                        ] [发送]         │   │   │
│  │  │ Enter发送 • Shift+Enter换行                      │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 关键CSS修复

```typescript
// 主容器 - 使用正确的flex布局
const containerClass = `
  h-screen              // 视口高度
  flex                  // flex布局
  flex-col              // 垂直排列
  pt-20                 // 顶部padding避开navbar
  pb-safe               // 底部安全区域（移动端）
  overflow-hidden       // 防止整体滚动
`;

// Header - 固定高度
const headerClass = `
  h-16                  // 固定64px
  flex-shrink-0         // 不收缩
  backdrop-blur-xl
  bg-white/70
  border-b border-white/20
`;

// 消息区域 - 自适应剩余高度，内部滚动
const messagesClass = `
  flex-1                // 占据剩余空间
  min-h-0               // 关键：允许flex子项收缩
  overflow-y-auto       // 垂直滚动
  overflow-x-hidden     // 防止水平滚动
  scroll-smooth
`;

// 输入区域 - 固定底部
const inputClass = `
  flex-shrink-0         // 不收缩
  pb-4                  // 底部padding
  bg-white/70
  backdrop-blur-xl
`;

// 消息气泡 - 响应式宽度
const messageBubbleClass = `
  max-w-[85%]           // 移动端最大85%
  sm:max-w-[75%]        // 平板最大75%
  lg:max-w-[65%]        // 桌面最大65%
`;
```

### 4.4 新增功能组件

#### 4.4.1 AI模型选择器

```typescript
interface ModelSelectorProps {
  currentModel: 'basic' | 'pro';
  userTier: string;
  onChange: (model: 'basic' | 'pro') => void;
}

// 基础用户：显示只读标签 "Gemini Flash"
// Pro用户：显示下拉选择器 [Gemini Flash | Kimi 2.5]
// 当选择Kimi时，如果用户无权限，显示升级提示
```

#### 4.4.2 使用限制提示

```typescript
interface UsageLimitProps {
  used: number;
  limit: number;
  resetTime: Date;
}

// 显示：今日已用 45/50 次，将于 14:00 重置
// 当接近限制时（>80%）显示黄色警告
// 当达到限制时显示红色提示+升级按钮
```

#### 4.4.3 Markdown消息渲染

```typescript
// 支持代码块、列表、表格等Markdown格式
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
```

---

## 五、会员中心页面方案

### 5.1 页面触发方式

在 `Dashboard` 的 `MembershipCard` 组件中，点击后跳转到会员中心页面：

```typescript
// components/MembershipCard.tsx
const handleCardClick = () => {
  onNavigate(Page.MEMBERSHIP); // 新增页面类型
};
```

### 5.2 页面布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navbar                                   │
├─────────────────────────────────────────────────────────────────┤
│                      会员中心页面                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  当前等级卡片                                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  💎 Pro+ 会员                                   │   │   │
│  │  │  有效期至: 2025-12-31                           │   │   │
│  │  │  [管理订阅] [兑换码升级]                        │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  权益对比                                                 │   │
│  │  ┌───────────┬───────────┬───────────┬───────────┐     │   │
│  │  │   功能    │   Free    │    Pro    │   Pro+    │     │   │
│  │  ├───────────┼───────────┼───────────┼───────────┤     │   │
│  │  │ 基础课程  │     ✓     │     ✓     │     ✓     │     │   │
│  │  │ AI基础版  │     ✗     │     ✓     │     ✓     │     │   │
│  │  │ AI进阶版  │     ✗     │     ✗     │     ✓     │     │   │
│  │  │ 工具实验室│     ✗     │     ✓     │     ✓     │     │   │
│  │  │ 实战模拟  │     ✗     │     ✗     │     ✓     │     │   │
│  │  └───────────┴───────────┴───────────┴───────────┘     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  升级选项                                                 │   │
│  │  ┌─────────────────────┐ ┌─────────────────────┐       │   │
│  │  │   💎 Pro 专业版     │ │  👑 Pro+ 高级版     │       │   │
│  │  │   ¥99/月 或 5门课   │ │  ¥199/月 或 10门课  │       │   │
│  │  │                     │ │                     │       │   │
│  │  │   [立即升级]        │ │   [立即升级]        │       │   │
│  │  └─────────────────────┘ └─────────────────────┘       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  我的学习进度                                             │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ 已完成 7/10 门课程，再完成3门即可升级Pro+       │   │   │
│  │  │ ████████████░░░░░░░░ 70%                        │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  兑换码                                                   │   │
│  │  [输入兑换码____________] [兑换]                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 路由配置

```typescript
// types.ts - 新增页面类型
export enum Page {
  // ... 现有页面
  MEMBERSHIP = 'MEMBERSHIP', // 新增会员中心
}

// App.tsx - 添加路由
{currentPage === Page.MEMBERSHIP && (
  <MembershipCenter 
    currentUser={currentUser} 
    onNavigate={navigateTo}
  />
)}
```

### 5.4 数据库扩展

```sql
-- 会员兑换码表
CREATE TABLE IF NOT EXISTS membership_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL, -- 'pro'|'pro_plus'
    duration_days INTEGER DEFAULT 30,
    is_used BOOLEAN DEFAULT false,
    used_by TEXT REFERENCES app_users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'CNY',
    payment_method TEXT, -- 'alipay'|'wechat'|'stripe'
    status TEXT DEFAULT 'pending', -- 'pending'|'success'|'failed'
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);
```

---

## 六、实施计划

### 6.1 数据库迁移脚本 (db_renovation.sql)

```sql
-- 执行顺序：
-- 1. 备份现有数据
-- 2. 添加新列
-- 3. 创建新表
-- 4. 迁移数据
-- 5. 创建索引
-- 6. 设置RLS
```

### 6.2 前端文件变更清单

| 文件 | 变更类型 | 描述 |
|-----|---------|------|
| `types.ts` | 修改 | 添加新Page类型、UserProfile字段 |
| `pages/KnowledgeGraph.tsx` | 重构 | 全新UI实现 |
| `pages/AiAssistant.tsx` | 重构 | 修复布局问题，添加分级功能 |
| `pages/Membership.tsx` | 新增 | 会员中心页面 |
| `components/MembershipCard.tsx` | 修改 | 添加点击跳转 |
| `lib/ai-config.ts` | 新增 | AI模型配置 |
| `lib/membership.ts` | 修改 | 添加权限检查函数 |

### 6.3 实施时间线

| 阶段 | 任务 | 预计工时 |
|-----|------|---------|
| **Phase 1** | 数据库迁移脚本 | 2h |
| **Phase 2** | 课程数据扩展(18门) | 3h |
| **Phase 3** | 知识图谱UI重构 | 4h |
| **Phase 4** | AI助手分级系统 | 3h |
| **Phase 5** | AI助手页面重构 | 3h |
| **Phase 6** | 会员中心页面 | 3h |
| **Phase 7** | 测试与Bug修复 | 2h |
| **总计** | | **20h** |

---

## 七、API接口清单

### 7.1 知识图谱相关

```typescript
// GET /api/knowledge-graph/nodes
// 获取知识图谱节点列表（支持按分类筛选）

// GET /api/knowledge-graph/nodes/:id
// 获取单个节点详情（包含关联课程信息）

// GET /api/knowledge-graph/user-mastery
// 获取当前用户的知识点掌握度

// POST /api/knowledge-graph/track
// 记录用户学习知识点
```

### 7.2 AI助手相关

```typescript
// POST /api/ai/chat
// 发送消息并获取AI回复
// Body: { message: string, model: 'basic'|'pro' }

// GET /api/ai/usage
// 获取今日AI使用统计

// GET /api/ai/models
// 获取可用的AI模型列表（根据用户权限）
```

### 7.3 会员相关

```typescript
// GET /api/membership/status
// 获取当前会员状态

// POST /api/membership/upgrade
// 升级会员（支付/兑换码）

// POST /api/membership/redeem
// 兑换会员码

// GET /api/membership/progress
// 获取通过学习升级所需进度
```

---

## 八、测试检查清单（已迁移至第十章）

此章节内容已整合至 **第十章 测试检查清单**。

---

## 十、测试检查清单

### 10.1 知识图谱测试
- [ ] 18门课程正确显示
- [ ] 节点按分类显示不同颜色
- [ ] 节点按类型显示不同形状
- [ ] 点击节点显示侧边栏详情
- [ ] 侧边栏"继续学习"按钮跳转课堂
- [ ] 掌握度正确显示（从user_kb_mastery表读取）
- [ ] 响应式布局正常

### 10.2 AI助手测试
- [ ] 页面无遮挡，布局正确
- [ ] 消息区域可正常滚动
- [ ] 底部输入框始终可见
- [ ] Free用户无法使用AI
- [ ] Basic用户只能使用Gemini
- [ ] Pro+用户可以切换模型
- [ ] 达到日限制后正确提示
- [ ] Markdown渲染正常

### 10.3 会员中心测试
- [ ] Dashboard点击会员卡片跳转
- [ ] 当前等级正确显示
- [ ] 权益对比表格正确
- [ ] 学习进度计算正确
- [ ] 兑换码功能正常
- [ ] 支付流程（如接入）

### 10.4 后台管理测试
- [ ] 全局设置页面已删除，访问返回404或跳转
- [ ] 服务监控页面已删除，访问返回404或跳转
- [ ] 侧边栏菜单不显示已删除的菜单项
- [ ] 系统配置页面包含原全局设置的功能
- [ ] 原有配置数据已正确迁移
- [ ] 管理员权限控制正常

---

*文档版本: v1.1*
*创建日期: 2026-02-03*
*作者: AI Assistant*


---

## 九、后台管理页面调整

### 9.1 删除页面清单

根据业务精简需求，以下两个后台管理页面将被**删除**：

| 页面 | 路由 | 删除原因 | 替代方案 |
|-----|------|---------|---------|
| **全局设置** | `Page.ADMIN_SETTINGS` | 配置项较少，合并到系统配置 | 合并至「系统配置」页面 |
| **服务监控** | `Page.ADMIN_MONITOR` | 暂不需要系统级监控 | 后续需要时重新开发 |

### 9.2 删除涉及的文件变更

#### 需要删除的文件
```
pages/admin/AdminSettings.tsx    (删除)
pages/admin/AdminMonitor.tsx     (删除)
```

#### 需要修改的文件

**1. types.ts - 移除Page枚举值**
```typescript
export enum Page {
  // ... 其他页面
  // 删除以下两项:
  // ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  // ADMIN_MONITOR = 'ADMIN_MONITOR',
}
```

**2. App.tsx - 移除路由和导入**
```typescript
// 删除导入
// import AdminSettings from './pages/admin/AdminSettings';
// import AdminMonitor from './pages/admin/AdminMonitor';

// 删除路由配置
{currentPage === Page.ADMIN_SETTINGS && <AdminSettings />}
{currentPage === Page.ADMIN_MONITOR && <AdminMonitor />}
```

**3. AdminLayout.tsx - 移除侧边栏菜单项**
```typescript
// 在 menuGroups 中移除以下项:
{
  id: 'system',
  label: '系统核心 (System)',
  items: [
    { label: '系统配置', page: Page.ADMIN_SYSTEM, icon: Settings, roles: ['SuperAdmin'] },
    // 删除: { label: '全局设置', page: Page.ADMIN_SETTINGS, icon: Settings, roles: ['SuperAdmin'] },
    // 删除: { label: '服务监控', page: Page.ADMIN_MONITOR, icon: Activity, roles: ['SuperAdmin'] },
  ]
}
```

### 9.3 系统配置页面合并内容

将「全局设置」的功能合并到「系统配置 (AdminSystem)」页面：

```
系统配置页面新结构:
┌─────────────────────────────────────────┐
│ 系统配置                                 │
├─────────────────────────────────────────┤
│ 📋 基础设置                              │
│   • 站点名称                             │
│   • 站点Logo                             │
│   • 客服联系方式                         │
│                                         │
│ 🔐 安全设置 (原全局设置)                 │
│   • 登录失败限制                         │
│   • 密码强度要求                         │
│   • Session过期时间                      │
│                                         │
│ 📧 通知设置 (原全局设置)                 │
│   • SMTP配置                             │
│   • 短信接口配置                         │
│                                         │
│ 🤖 AI配置 (原全局设置)                   │
│   • API Key管理                          │
│   • 默认模型设置                         │
│   • 调用限制配置                         │
└─────────────────────────────────────────┘
```

### 9.4 数据库清理

```sql
-- 清理相关配置表（如果存在）
-- 注意：先确认是否有重要数据需要迁移

-- 查看是否有数据
SELECT COUNT(*) FROM admin_settings WHERE category IN ('security', 'notification', 'ai');

-- 如有数据，先迁移到系统配置表
INSERT INTO admin_system_configs (key, value, category, description)
SELECT key, value, 'merged_from_settings', description 
FROM admin_settings 
WHERE category IN ('security', 'notification', 'ai');

-- 删除旧表（确认数据已迁移后执行）
-- DROP TABLE IF EXISTS admin_monitor_logs;
-- DROP TABLE IF EXISTS admin_settings;
```

### 9.5 更新后的后台菜单结构

```
后台管理菜单 (AdminLayout)
│
├── 概览 (Overview)
│   ├── 仪表盘
│   └── 数据统计
│
├── 资源中心 (Resources)
│   ├── 体系课程
│   ├── 核心算法
│   ├── 实战项目
│   └── 知识图谱
│
├── 运营中心 (Operations)
│   ├── 用户管理
│   ├── 学习进度
│   ├── 日程活动
│   ├── 内容审核
│   ├── 全站公告
│   └── 会员管理 ⭐新增
│
└── 系统核心 (System)      ← 精简后
    └── 系统配置           ← 合并全局设置功能
```

### 9.6 会员管理后台页面 (AdminMembership)

新增后台会员管理功能，方便管理员管理用户会员状态和兑换码。

#### 页面功能

```
会员管理页面 (pages/admin/AdminMembership.tsx)
┌─────────────────────────────────────────────────────────────────┐
│ 会员管理                                          [生成兑换码 +] │
├─────────────────────────────────────────────────────────────────┤
│ 📊 统计卡片                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │   总会员    │ │  Free用户   │ │   Pro用户   │ │  Pro+用户   │ │
│ │    1,234    │ │     890     │ │     300     │ │     44      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 搜索 [________________]  等级 [全部 ▼]  状态 [全部 ▼]        │
├─────────────────────────────────────────────────────────────────┤
│ 用户列表                                                         │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────┐ │
│ │  用户    │  邮箱    │  当前等级│  到期时间│  完成课程│ 操作 │ │
│ ├──────────┼──────────┼──────────┼──────────┼──────────┼──────┤ │
│ │ 张三     │ z@e.com  │ 💎 Pro   │2025-12-31│    7/10  │[管理]│ │
│ │ 李四     │ l@e.com  │ ⭐ Free  │    -     │    2/5   │[升级]│ │
│ │ 王五     │ w@e.com  │ 👑 Pro+  │2026-06-30│   12/10  │[管理]│ │
│ └──────────┴──────────┴──────────┴──────────┴──────────┴──────┘ │
├─────────────────────────────────────────────────────────────────┤
│ 🎫 兑换码管理                                                    │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│ │  兑换码  │  等级    │  有效期  │  使用状态│  使用者  │       │
│ ├──────────┼──────────┼──────────┼──────────┼──────────┤       │
│ │ PRO2025  │ Pro      │ 30天     │ 已使用   │ 张三     │       │
│ │ PLUS666  │ Pro+     │ 30天     │ 未使用   │ -        │       │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

#### 主要功能

1. **会员统计**：各等级用户数量统计
2. **用户管理**：
   - 查看所有用户的会员状态
   - 手动调整用户会员等级
   - 延长/取消会员有效期
3. **兑换码管理**：
   - 批量生成兑换码
   - 查看兑换码使用状态
   - 作废未使用的兑换码

#### 路由配置

```typescript
// types.ts
export enum Page {
  // ...
  ADMIN_MEMBERSHIP = 'ADMIN_MEMBERSHIP',
}

// AdminLayout.tsx
{
  id: 'community',
  label: '运营中心 (Operations)',
  items: [
    // ...
    { label: '会员管理', page: Page.ADMIN_MEMBERSHIP, icon: Crown, roles: ['SuperAdmin', 'Manager'] },
  ]
}
```

---

## 十、测试检查清单

### 10.1 知识图谱测试
- [ ] 18门课程正确显示
- [ ] 节点按分类显示不同颜色
- [ ] 节点按类型显示不同形状
- [ ] 点击节点显示侧边栏详情
- [ ] 侧边栏"继续学习"按钮跳转课堂
- [ ] 掌握度正确显示（从user_kb_mastery表读取）
- [ ] 响应式布局正常

### 10.2 AI助手测试
- [ ] 页面无遮挡，布局正确
- [ ] 消息区域可正常滚动
- [ ] 底部输入框始终可见
- [ ] Free用户无法使用AI
- [ ] Basic用户只能使用Gemini
- [ ] Pro+用户可以切换模型
- [ ] 达到日限制后正确提示
- [ ] Markdown渲染正常

### 10.3 会员中心测试
- [ ] Dashboard点击会员卡片跳转
- [ ] 当前等级正确显示
- [ ] 权益对比表格正确
- [ ] 学习进度计算正确
- [ ] 兑换码功能正常
- [ ] 支付流程（如接入）

### 10.4 后台管理测试
- [ ] 全局设置页面已删除，访问返回404或跳转
- [ ] 服务监控页面已删除，访问返回404或跳转
- [ ] 侧边栏菜单不显示已删除的菜单项
- [ ] 系统配置页面包含原全局设置的功能
- [ ] 原有配置数据已正确迁移
- [ ] 管理员权限控制正常

---

*文档版本: v1.1*
*更新日期: 2026-02-03*
*作者: AI Assistant*
