# ProjectFlow 项目管理学习平台 - 技术文档

## 文档信息
- **版本**: v1.2
- **日期**: 2026-02-03
- **用途**: 毕业论文初稿

---

## 目录
1. [系统概述](#1-系统概述)
2. [技术架构](#2-技术架构)
3. [数据库设计](#3-数据库设计)
4. [核心功能模块](#4-核心功能模块)
5. [会员系统](#5-会员系统)
6. [工具实验室](#6-工具实验室)
7. [用例分析](#7-用例分析)
8. [接口设计](#8-接口设计)

---

## 1. 系统概述

### 1.1 项目背景
ProjectFlow 是一个面向项目管理学习者的综合性在线平台，提供课程体系学习、实践工具、AI辅助和会员进阶等功能。系统采用 gamification（游戏化）设计理念，通过完成课程解锁高级功能，激励用户持续学习。

### 1.2 系统目标
- 提供完整的项目管理知识体系（Foundation → Advanced → Implementation）
- 通过实践工具加深理论理解
- 利用AI技术提供个性化学习辅助
- 建立会员进阶机制，促进用户留存

### 1.3 用户角色
| 角色 | 权限 | 描述 |
|------|------|------|
| Free (免费用户) | 基础课程、3个实验室工具 | 新注册用户，可体验基础功能 |
| Pro (专业会员) | 全部12个基础工具 + 5个高级工具 | 完成5门课程后解锁 |
| Pro+ (高级会员) | 全部22个工具 + 实战模拟 | 完成10门课程后解锁 |
| Admin (管理员) | 后台管理、数据分析 | 系统管理用户 |

---

## 2. 技术架构

### 2.1 技术栈
```
前端: React 18 + TypeScript 5 + Tailwind CSS 3
后端: Supabase (PostgreSQL + Auth + Realtime)
AI: Google Gemini API
图表: Recharts
PDF: jsPDF + html2canvas
部署: Vercel
```

### 2.2 系统架构图
```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (React)                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ Dashboard│ Learning │ ToolsLab │ Community│  AI助手   │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Supabase 服务层                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Authentication│  │   Database   │  │    Storage   │      │
│  │   (Auth)       │  │ (PostgreSQL) │  │   (Images)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Realtime   │  │  Edge Functions│                        │
│  │  (WebSocket) │  │  (Serverless)  │                        │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      外部服务                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Google Gemini│  │  Vercel Edge │  │   CDN        │      │
│  │    AI API    │  │   Network    │  │  (Static)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 项目结构
```
project-flow/
├── components/          # 公共组件
│   ├── MembershipBadge.tsx
│   └── MembershipGuard.tsx
├── lib/                # 工具函数
│   ├── supabaseClient.ts
│   └── membership.ts   # 会员系统核心
├── pages/              # 页面组件
│   ├── LearningHub.tsx # 学习中心
│   ├── ToolsLab.tsx    # 工具实验室
│   ├── AiAssistant.tsx # AI助手
│   └── ...
├── tools/              # 22个工具组件
│   ├── MonteCarloSimulator.tsx
│   ├── PlanningPoker.tsx
│   └── ... (共10个高级工具)
├── types.ts            # TypeScript类型定义
├── db_renovation.sql   # 数据库迁移脚本
└── package.json
```

---

## 3. 数据库设计

### 3.1 核心表结构

#### 3.1.1 用户表 (app_users)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PK | 用户唯一标识 |
| email | TEXT | NOT NULL, UNIQUE | 邮箱地址 |
| name | TEXT | - | 用户姓名 |
| role | TEXT | - | 角色: Student/Admin |
| status | TEXT | DEFAULT '正常' | 账号状态 |
| department | TEXT | - | 所属部门 |
| avatar | TEXT | - | 头像URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| subscription_tier | TEXT | DEFAULT 'free' | 会员等级 |
| xp | INTEGER | DEFAULT 0 | 经验值 |
| streak | INTEGER | DEFAULT 0 | 连续学习天数 |
| ai_tier | TEXT | DEFAULT 'none' | AI权限等级 |
| ai_daily_used | INTEGER | DEFAULT 0 | 今日AI使用次数 |
| ai_daily_reset_at | TIMESTAMPTZ | - | AI使用重置时间 |
| completed_courses_count | INTEGER | DEFAULT 0 | 已完成课程数 |
| membership_expires_at | TIMESTAMPTZ | - | 会员过期时间 |
| is_lifetime_member | BOOLEAN | DEFAULT false | 是否终身会员 |

#### 3.1.2 课程表 (app_courses)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PK | 课程ID |
| category | TEXT | - | 分类: Foundation/Advanced/Implementation |
| title | TEXT | NOT NULL | 课程标题 |
| author | TEXT | - | 讲师姓名 |
| description | TEXT | - | 课程描述 |
| image | TEXT | - | 封面图片URL |
| status | TEXT | DEFAULT 'Published' | 发布状态 |
| duration | TEXT | - | 总时长 |
| views | INTEGER | DEFAULT 0 | 浏览次数 |
| chapters | JSONB | DEFAULT '[]' | 章节数据 |
| resources | JSONB | DEFAULT '[]' | 资源列表 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| rating | FLOAT | DEFAULT 4.5 | 评分 |
| last_update | TIMESTAMPTZ | - | 最后更新 |
| kb_node_ids | JSONB | DEFAULT '[]' | 关联知识节点 |
| learning_path_order | INTEGER | - | 学习路径顺序 |
| category_color | TEXT | - | 分类颜色 |

#### 3.1.3 用户进度表 (app_user_progress)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| user_id | TEXT | FK, PK | 用户ID |
| course_id | TEXT | FK, PK | 课程ID |
| progress | INTEGER | DEFAULT 0 | 进度百分比 |
| status | TEXT | DEFAULT 'Started' | 学习状态 |
| notes | TEXT | - | 学习笔记 |
| last_accessed | TIMESTAMPTZ | DEFAULT NOW() | 最后访问 |
| completed_chapters | JSONB | DEFAULT '[]' | 已完成章节 |

### 3.2 会员系统表

#### 3.2.1 会员订阅记录表 (membership_subscriptions)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 记录ID |
| user_id | TEXT | FK → app_users(id) | 用户ID |
| tier | TEXT | NOT NULL | 等级: pro/pro_plus |
| payment_method | TEXT | - | 付费方式 |
| amount | DECIMAL(10,2) | - | 金额 |
| currency | TEXT | DEFAULT 'CNY' | 货币 |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | 开始时间 |
| expires_at | TIMESTAMPTZ | - | 过期时间 |
| is_active | BOOLEAN | DEFAULT true | 是否有效 |
| metadata | JSONB | DEFAULT '{}' | 扩展数据 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### 3.2.2 会员兑换码表 (membership_codes)
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PK | 记录ID |
| code | TEXT | UNIQUE, NOT NULL | 兑换码 |
| tier | TEXT | NOT NULL | 等级 |
| duration_days | INTEGER | DEFAULT 30 | 有效天数 |
| is_used | BOOLEAN | DEFAULT false | 是否已使用 |
| used_by | TEXT | FK → app_users(id) | 使用人 |
| used_at | TIMESTAMPTZ | - | 使用时间 |
| expires_at | TIMESTAMPTZ | - | 兑换码过期时间 |
| created_by | TEXT | FK → app_users(id) | 创建人 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

### 3.3 工具数据表

#### 3.3.1 蒙特卡洛模拟表 (lab_monte_carlo_simulations)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| user_id | TEXT | 用户ID |
| project_name | TEXT | 项目名称 |
| tasks | JSONB | 任务列表 |
| simulation_results | JSONB | 模拟结果 |
| iterations | INTEGER | 迭代次数 |
| created_at/updated_at | TIMESTAMPTZ | 时间戳 |

(其他工具表结构类似，略)

### 3.4 知识图谱表

#### 3.4.1 知识节点表 (app_kb_nodes)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| label | VARCHAR | 节点名称 |
| type | VARCHAR | 类型: concept/skill/tool |
| description | TEXT | 描述 |
| difficulty | INTEGER | 难度 1-5 |
| estimated_hours | INTEGER | 预计学习时长 |
| created_at | TIMESTAMP | 创建时间 |
| course_id | TEXT | 关联课程 |
| course_category | TEXT | 课程分类 |
| node_level | INTEGER | 节点层级 1-3 |
| prerequisites | JSONB | 前置知识点 |

#### 3.4.2 知识边表 (app_kb_edges)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键 |
| source_id | INTEGER | 源节点ID |
| target_id | INTEGER | 目标节点ID |
| type | VARCHAR | 边类型 |
| weight | NUMERIC | 权重 |
| description | TEXT | 描述 |
| created_at | TIMESTAMP | 创建时间 |
| relation_type | TEXT | 关系类型 |
| strength | INTEGER | 强度 1-3 |

### 3.5 关键数据库函数

```sql
-- 自动更新完成课程数
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

-- 自动升级会员等级
CREATE OR REPLACE FUNCTION check_and_upgrade_membership(p_user_id text)
RETURNS TABLE (old_tier text, new_tier text, upgraded boolean) AS $$
DECLARE
    v_completed_count int;
    v_current_tier text;
    v_upgraded boolean := false;
    v_old_tier text;
BEGIN
    -- 获取当前信息
    SELECT completed_courses_count, LOWER(subscription_tier)
    INTO v_completed_count, v_current_tier
    FROM app_users 
    WHERE id = p_user_id;
    
    v_old_tier := v_current_tier;
    
    -- 升级到 pro (5门课)
    IF v_current_tier = 'free' AND v_completed_count >= 5 THEN
        UPDATE app_users SET subscription_tier = 'pro' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (...)
        VALUES (...);
        v_current_tier := 'pro';
        v_upgraded := true;
    END IF;
    
    -- 升级到 pro_plus (10门课)
    IF v_current_tier IN ('free', 'pro') AND v_completed_count >= 10 THEN
        UPDATE app_users SET subscription_tier = 'pro_plus' WHERE id = p_user_id;
        INSERT INTO membership_subscriptions (...)
        VALUES (...);
        v_current_tier := 'pro_plus';
        v_upgraded := true;
    END IF;
    
    RETURN QUERY SELECT v_old_tier, v_current_tier, v_upgraded;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. 核心功能模块

### 4.1 学习模块 (LearningHub)

#### 4.1.1 功能结构
```
LearningHub
├── Foundation (基础)
│   ├── 体系课程
│   ├── 认证冲刺
│   └── 官方必修
├── Advanced (实验室)
│   ├── Quantitative (量化工具)
│   │   ├── CPM关键路径
│   │   ├── EVM挣值分析
│   │   ├── PERT三点估算
│   │   ├── ROI/NPV模型
│   │   └── 敏捷燃尽图
│   ├── Strategic (战略工具)
│   │   ├── SWOT分析
│   │   ├── 风险EMV
│   │   └── OKR对齐
│   ├── Toolkit (工具箱)
│   │   ├── WBS分解
│   │   ├── 章程生成
│   │   ├── 复盘回顾
│   │   └── 用户故事
│   └── ProLab (高级实验室) [需Pro会员]
│       └── 进入Pro Lab入口
└── Implementation (实战)
    └── 经典案例分析
```

#### 4.1.2 CPM关键路径算法
```typescript
// 核心算法实现
class CpmEngine {
    static calculate(tasks: CpmTask[]): CpmTask[] {
        // 1. 前向遍历计算ES/EF
        // 2. 后向遍历计算LS/LF
        // 3. 计算浮动时间确定关键路径
    }
}

// 可视化使用SVG贝塞尔曲线绘制依赖关系
// 关键路径用红色虚线动画显示
// 非关键路径显示slack时间标签
```

### 4.2 工具实验室 (ToolsLab)

#### 4.2.1 工具清单

**Pro会员工具 (5个)**: 完成5门课程解锁

| 工具ID | 名称 | 功能描述 | 核心算法/技术 |
|--------|------|----------|---------------|
| monte-carlo | 蒙特卡洛模拟器 | 风险量化分析，预测项目完成概率 | PERT分布随机抽样，10,000次模拟 |
| planning-poker | 敏捷估算扑克 | 团队协作估算，达成共识 | 斐波那契数列，偏差分析 |
| kanban-flow | Kanban流动指标 | 可视化累积流图，效率分析 | Lead Time/Cycle Time计算，WIP限制 |
| learning-curve | 学习曲线模型 | 预测生产效率提升 | 经验曲线公式: T_n = T_1 × n^(-b) |
| evm-prediction | 挣值趋势预测 | AI驱动的项目健康分析 | SPI/CPI趋势预测，回归分析 |

**Pro+会员工具 (5个)**: 完成10门课程解锁

| 工具ID | 名称 | 功能描述 | 核心算法/技术 |
|--------|------|----------|---------------|
| velocity-tracker | 迭代速率跟踪 | Sprint燃尽图，速率分析 | 移动平均线，燃尽预测 |
| fmea | FMEA风险分析 | 故障模式与影响分析 | RPN计算: S×O×D |
| ccpm | 关键链法调度 | 资源约束调度优化 | 关键链识别，缓冲管理 |
| fishbone | 鱼骨图分析 | 结构化根因分析 | 人机料法环五维分析 |
| quality-cost | 质量成本模型 | COQ分析优化 | 预防/评估/失败成本分析 |

#### 4.2.2 工具访问控制
```typescript
// 权限检查
const canUseTool = (tool: ToolConfig, user: UserProfile): boolean => {
    const tierLevels = { free: 0, pro: 1, pro_plus: 2 };
    return tierLevels[user.membershipTier] >= tierLevels[tool.requiredTier];
};

// 未授权时显示升级提示
```

### 4.3 AI助手模块

#### 4.3.1 权限分级
| 等级 | 日调用上限 | 模型 |
|------|-----------|------|
| free | 5次 | Gemini Flash |
| pro | 20次 | Gemini Flash + Kimi |
| pro_plus | 50次 | Gemini Pro + Kimi |

#### 4.3.2 功能特性
- 项目管理知识问答
- 案例分析建议
- 工具使用指导
- 学习计划推荐

---

## 5. 会员系统

### 5.1 会员等级体系

```
┌─────────────┐      完成5门课程       ┌─────────────┐      完成10门课程      ┌─────────────┐
│    Free     │ ─────────────────────→ │     Pro     │ ─────────────────────→ │   Pro+      │
│   (0门)     │                        │    (5门)    │                        │   (10门)    │
└─────────────┘                        └─────────────┘                        └─────────────┘
     │                                        │                                      │
     └─ 基础课程                              └─ +5个高级工具                         └─ +5个专家工具
        3个基础工具                            AI 20次/天                            AI 50次/天
        AI 5次/天                              实战模拟(部分)                         全部实战模拟
```

### 5.2 升级机制

#### 5.2.1 自动升级触发条件
```typescript
// 课程完成时触发
if (completedCourses >= 10 && currentTier !== 'pro_plus') {
    upgradeToProPlus();
} else if (completedCourses >= 5 && currentTier === 'free') {
    upgradeToPro();
}
```

#### 5.2.2 升级流程
1. 用户完成课程，进度达到100%
2. 触发 `update_user_completed_courses()` 函数
3. 更新 `completed_courses_count`
4. 调用 `check_and_upgrade_membership()` 检查升级条件
5. 如果满足条件，更新 `subscription_tier`
6. 插入 `membership_subscriptions` 记录
7. 前端检测到升级，显示祝贺弹窗

### 5.3 会员守卫组件
```typescript
// MembershipGuard.tsx
const MembershipGuard: React.FC<{
    user: UserProfile | null;
    targetPage: Page;
    onNavigate: (page: Page) => void;
    children: React.ReactNode;
}> = ({ user, targetPage, onNavigate, children }) => {
    const access = checkAccess(user, targetPage);
    
    if (!access.allowed) {
        return <UpgradePrompt requirement={access.requirement} />;
    }
    
    return <>{children}</>;
};
```

---

## 6. 工具实验室详细设计

### 6.1 蒙特卡洛模拟器 (MonteCarloSimulator)

#### 6.1.1 功能描述
通过随机抽样模拟项目完成时间，提供概率分布和风险评估。

#### 6.1.2 核心算法
```typescript
// PERT分布公式
function pertRandom(optimistic: number, mostLikely: number, pessimistic: number): number {
    const mean = (optimistic + 4 * mostLikely + pessimistic) / 6;
    const std = (pessimistic - optimistic) / 6;
    // 使用Box-Muller变换生成正态分布随机数
    return normalRandom(mean, std);
}

// 模拟运行
function runSimulation(tasks: Task[], iterations: number = 10000): SimulationResult {
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
        // 为每个任务生成随机持续时间
        const simulatedTasks = tasks.map(t => ({
            ...t,
            duration: pertRandom(t.optimistic, t.mostLikely, t.pessimistic)
        }));
        
        // 计算关键路径
        const criticalPath = calculateCriticalPath(simulatedTasks);
        results.push(criticalPath.duration);
    }
    
    // 统计分析
    return {
        mean: mean(results),
        median: median(results),
        p80: percentile(results, 80),
        p90: percentile(results, 90),
        p95: percentile(results, 95),
        histogram: createHistogram(results)
    };
}
```

#### 6.1.3 界面设计
- 任务列表编辑（乐观/最可能/悲观时间）
- 运行模拟按钮
- 结果直方图（Recharts）
- 关键指标卡片（P50/P80/P90/P95）
- 置信区间说明

### 6.2 敏捷估算扑克 (PlanningPoker)

#### 6.2.1 功能描述
团队协作估算工具，支持同步出牌、偏差分析和共识达成。

#### 6.2.2 核心功能
```typescript
// 估算值序列（改良斐波那契）
const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '☕'];

// 偏差分析
function analyzeEstimates(estimates: number[]): {
    average: number;
    median: number;
    deviation: number;
    recommendation: number;
} {
    const validEstimates = estimates.filter(e => typeof e === 'number');
    const average = mean(validEstimates);
    const median = median(validEstimates);
    const deviation = std(validEstimates);
    
    // 推荐值：偏差大时取中位数，偏差小时取平均数
    const recommendation = deviation > 5 ? median : roundToFibonacci(average);
    
    return { average, median, deviation, recommendation };
}
```

### 6.3 FMEA风险分析 (FMEATool)

#### 6.3.1 功能描述
故障模式与影响分析，计算RPN风险优先级数。

#### 6.3.2 计算公式
```
RPN = Severity (1-10) × Occurrence (1-10) × Detection (1-10)

风险分级:
- 高: RPN ≥ 200
- 中: 100 ≤ RPN < 200
- 低: RPN < 100
```

#### 6.3.3 界面元素
- 失效模式列表
- S/O/D评分滑块
- 自动计算的RPN值
- 风险热力图
- 排序和筛选功能

---

## 7. 用例分析

### 7.1 用例图

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌─────────────────┐     ┌─────────────────┐
│   学习课程    │      │    使用工具      │     │   查看进度      │
│   (UC-001)    │      │    (UC-002)     │     │   (UC-003)      │
└───────────────┘      └─────────────────┘     └─────────────────┘
        │                       │
        │              ┌────────┴────────┐
        │              │                 │
        │              ▼                 ▼
        │      ┌───────────────┐ ┌───────────────┐
        │      │ 基础工具(3个) │ │ 高级工具(Pro) │
        │      └───────────────┘ └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     完成5门课程 → 触发升级                        │
│                        (UC-004)                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     系统: 自动升级至Pro                          │
│                     解锁: 5个高级工具                            │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 详细用例描述

#### UC-001: 学习课程
| 项目 | 内容 |
|------|------|
| **用例名称** | 学习课程 |
| **参与者** | 注册用户 |
| **前置条件** | 用户已登录 |
| **后置条件** | 更新学习进度，可能触发会员升级 |
| **主流程** | 1. 用户进入学习中心<br>2. 选择课程分类(Foundation/Advanced/Implementation)<br>3. 选择具体课程<br>4. 观看视频/阅读材料<br>5. 完成章节测试<br>6. 系统更新进度 |
| **扩展流程** | 4a. 课程需要Pro会员: 显示升级提示<br>6a. 进度达到100%: 触发课程完成事件 |

#### UC-002: 使用工具
| 项目 | 内容 |
|------|------|
| **用例名称** | 使用项目管理工具 |
| **参与者** | 注册用户 |
| **前置条件** | 用户已登录，具有相应会员等级 |
| **后置条件** | 保存工具使用记录 |
| **主流程** | 1. 用户进入工具实验室<br>2. 浏览可用工具列表<br>3. 选择工具<br>4. 输入参数/数据<br>5. 运行计算/分析<br>6. 查看结果并导出 |
| **扩展流程** | 3a. 工具需要更高会员等级: 显示升级提示，提供功能预览 |

#### UC-003: 自动升级会员
| 项目 | 内容 |
|------|------|
| **用例名称** | 自动升级会员等级 |
| **参与者** | 系统 (自动执行) |
| **触发条件** | 用户完成课程，completed_courses_count达到阈值 |
| **主流程** | 1. 检测课程完成事件<br>2. 更新completed_courses_count<br>3. 检查是否满足升级条件<br>4. 更新subscription_tier<br>5. 插入订阅记录<br>6. 发送升级通知 |
| **业务规则** | 5门课程→Pro, 10门课程→Pro+ |

#### UC-004: CPM关键路径分析
| 项目 | 内容 |
|------|------|
| **用例名称** | CPM关键路径分析 |
| **参与者** | Pro/Pro+会员 |
| **前置条件** | 用户具有Pro或以上会员等级 |
| **主流程** | 1. 进入CPM工具<br>2. 添加任务列表(名称、工期、前置任务)<br>3. 点击"计算"按钮<br>4. 系统执行前向/后向遍历算法<br>5. 可视化显示关键路径(红色)<br>6. 显示项目总工期和浮动时间 |
| **算法输出** | ES/EF/LS/LF/Slack, 关键路径标识 |

### 7.3 状态图: 用户学习进度

```
┌─────────┐    开始学习     ┌──────────┐    完成50%     ┌──────────┐
│  未开始  │ ─────────────→ │  学习中   │ ────────────→ │  进行中   │
│  (0%)   │                │  (1-49%) │               │  (50-99%)│
└─────────┘                └──────────┘               └─────┬────┘
     ▲                                                      │
     │                                                      │ 完成100%
     │                                                      ▼
     │                                                ┌──────────┐
     │                                                │  已完成   │
     └────────────────────────────────────────────────│  (100%)  │
          重置进度                                    └────┬─────┘
                                                          │
                                                          │ 触发
                                                          ▼
                                                   ┌──────────────┐
                                                   │ 自动升级检查  │
                                                   │ (如满足条件)  │
                                                   └──────────────┘
```

---

## 8. 接口设计

### 8.1 前端类型定义 (types.ts)

```typescript
// 会员等级类型
export type MembershipTier = 'free' | 'pro' | 'pro_plus';

// AI等级类型
export type AITier = 'none' | 'basic' | 'pro';

// 用户档案接口
export interface UserProfile {
    id: string;
    email: string;
    name?: string;
    role?: string;
    avatar?: string;
    department?: string;
    joined_at?: string;
    xp?: number;
    streak?: number;
    // 会员系统字段
    membershipTier: MembershipTier;
    membershipExpiresAt?: string;
    completedCoursesCount: number;
    isLifetimeMember: boolean;
    // AI权限字段
    aiTier: AITier;
    aiDailyUsed: number;
    aiDailyResetAt?: string;
}

// 页面枚举
export enum Page {
    LOGIN = 'login',
    DASHBOARD = 'dashboard',
    LEARNING = 'learning',
    CLASSROOM = 'classroom',
    AI_ASSISTANT = 'ai_assistant',
    COMMUNITY = 'community',
    PROFILE = 'profile',
    SCHEDULE = 'schedule',
    SIMULATION = 'simulation',
    TOOLS_LAB = 'tools_lab',
    MEMBERSHIP = 'membership',
    ADMIN_DASHBOARD = 'admin_dashboard',
    // ... 其他页面
}

// 会员权限要求
export interface MembershipRequirement {
    page: Page;
    minTier: MembershipTier;
    requiredCourses: number;
    title: string;
    description: string;
    benefits: string[];
    icon: string;
}

// 访问检查结果
export interface AccessCheckResult {
    allowed: boolean;
    reason?: string;
    progress?: number;
    currentTier?: MembershipTier;
    requiredTier?: MembershipTier;
    remainingCourses?: number;
    requirement?: MembershipRequirement;
}
```

### 8.2 Supabase API 接口

#### 8.2.1 用户相关
```typescript
// 获取当前用户
const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();

// 更新AI使用次数
await supabase
    .from('app_users')
    .update({ ai_daily_used: ai_daily_used + 1 })
    .eq('id', userId);

// 获取课程进度
const { data: progress } = await supabase
    .from('app_user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
```

#### 8.2.2 工具数据相关
```typescript
// 保存蒙特卡洛模拟
await supabase
    .from('lab_monte_carlo_simulations')
    .upsert({
        user_id: userId,
        project_name: projectName,
        tasks: tasks,
        simulation_results: results,
        iterations: 10000
    });

// 获取用户模拟记录
const { data: simulations } = await supabase
    .from('lab_monte_carlo_simulations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
```

### 8.3 权限检查接口 (lib/membership.ts)

```typescript
// 检查页面访问权限
export function checkAccess(
    user: UserProfile | null, 
    page: Page
): AccessCheckResult;

// 检查是否满足指定等级
export function hasTier(
    user: UserProfile | null,
    minTier: MembershipTier
): boolean;

// 获取下一等级信息
export function getNextTierInfo(
    currentTier: MembershipTier,
    completedCourses: number
): { nextTier: MembershipTier | null; remainingCourses: number } | null;

// 数据库值转换
export function normalizeMembershipTier(
    dbTier: string | null | undefined
): MembershipTier;
```

---

## 9. 部署与配置

### 9.1 环境变量
```
VITE_SUPABASE_URL=<Supabase项目URL>
VITE_SUPABASE_ANON_KEY=<Supabase匿名密钥>
VITE_GOOGLE_AI_API_KEY=<Google Gemini API密钥>
```

### 9.2 部署步骤
1. 执行 `db_renovation.sql` 迁移数据库
2. 配置环境变量
3. 运行 `npm install`
4. 运行 `npm run build`
5. 部署到 Vercel

### 9.3 初始化数据
- 18门种子课程数据
- 22个知识图谱节点
- 15条知识图谱关系边

---

## 10. 总结

本系统实现了完整的项目管理学习平台，核心特性包括：

1. **渐进式学习路径**: Foundation → Advanced → Implementation 三级体系
2. **游戏化会员机制**: 完成课程自动解锁高级功能
3. **丰富的工具集**: 22个专业项目管理工具
4. **AI辅助学习**: 分级AI权限，个性化学习支持
5. **知识图谱**: 可视化知识点关联和依赖关系

技术亮点：
- 使用 Supabase 实现全栈无服务器架构
- TypeScript 严格类型保证代码质量
- 复杂的CPM算法可视化实现
- 完善的会员权限控制体系

---

**文档结束**
