# ProjectFlow 平台完整实施方案 V3.0

**制定日期**: 2026-02-03  
**状态**: 实施方案（含SQL脚本）

---

## 目录
1. [数据库修复与补全](#1-数据库修复与补全)
2. [后端菜单重构](#2-后端菜单重构)
3. [实战模拟系统方案](#3-实战模拟系统方案)
4. [报告生成与PDF导出](#4-报告生成与pdf导出)
5. [兑换码系统完善](#5-兑换码系统完善)
6. [会员页面优化](#6-会员页面优化)
7. [社区数据填充](#7-社区数据填充)
8. [公告系统](#8-公告系统)
9. [实施顺序建议](#9-实施顺序建议)

---

## 1. 数据库修复与补全

### 1.1 课程数据修复

当前课程表已有部分数据，但需要确保每个分类完整6门课程。

**检查现有课程：**
```sql
-- 查看当前课程分布
SELECT category, COUNT(*) as count 
FROM app_courses 
GROUP BY category;
```

**补全课程SQL：**
```sql
-- ==========================================
-- 课程数据补全脚本
-- 确保 Foundation/Advanced/Implementation 各6门
-- ==========================================

DO $$
DECLARE
    -- Foundation 课程章节（补全缺失的）
    chapters_f1 jsonb := '[{"id": "ch-1-1", "title": "项目管理概述", "duration": "15:00", "type": "video"}, {"id": "ch-1-2", "title": "五大过程组", "duration": "20:00", "type": "video"}, {"id": "ch-1-3", "title": "十大知识领域", "duration": "25:00", "type": "video"}]';
    chapters_f2 jsonb := '[{"id": "ch-2-1", "title": "敏捷宣言解读", "duration": "15:00", "type": "video"}, {"id": "ch-2-2", "title": "Scrum框架", "duration": "30:00", "type": "video"}, {"id": "ch-2-3", "title": "看板方法", "duration": "20:00", "type": "video"}]';
    chapters_f3 jsonb := '[{"id": "ch-3-1", "title": "WBS基础", "duration": "20:00", "type": "video"}, {"id": "ch-3-2", "title": "分解技巧", "duration": "25:00", "type": "video"}, {"id": "ch-3-3", "title": "WBS实践", "duration": "30:00", "type": "video"}]';
    chapters_f4 jsonb := '[{"id": "ch-4-1", "title": "进度规划", "duration": "20:00", "type": "video"}, {"id": "ch-4-2", "title": "关键路径", "duration": "25:00", "type": "video"}, {"id": "ch-4-3", "title": "进度控制", "duration": "20:00", "type": "video"}]';
    chapters_f5 jsonb := '[{"id": "ch-5-1", "title": "风险识别", "duration": "15:00", "type": "video"}, {"id": "ch-5-2", "title": "风险评估", "duration": "20:00", "type": "video"}, {"id": "ch-5-3", "title": "风险应对", "duration": "20:00", "type": "video"}]';
    chapters_f6 jsonb := '[{"id": "ch-6-1", "title": "团队建设", "duration": "15:00", "type": "video"}, {"id": "ch-6-2", "title": "沟通技巧", "duration": "20:00", "type": "video"}, {"id": "ch-6-3", "title": "冲突解决", "duration": "20:00", "type": "video"}]';
    
    -- Advanced 课程章节
    chapters_a1 jsonb := '[{"id": "ch-a1-1", "title": "PMP考试指南", "duration": "30:00", "type": "video"}, {"id": "ch-a1-2", "title": "敏捷专题", "duration": "45:00", "type": "video"}, {"id": "ch-a1-3", "title": "模拟考试", "duration": "60:00", "type": "quiz"}]';
    chapters_a2 jsonb := '[{"id": "ch-a2-1", "title": "EVM基础", "duration": "20:00", "type": "video"}, {"id": "ch-a2-2", "title": "指标分析", "duration": "25:00", "type": "video"}, {"id": "ch-a2-3", "title": "预测技术", "duration": "30:00", "type": "video"}]';
    chapters_a3 jsonb := '[{"id": "ch-a3-1", "title": "CPM算法", "duration": "25:00", "type": "video"}, {"id": "ch-a3-2", "title": "资源优化", "duration": "30:00", "type": "video"}, {"id": "ch-a3-3", "title": "关键链", "duration": "20:00", "type": "video"}]';
    chapters_a4 jsonb := '[{"id": "ch-a4-1", "title": "Scrum Master", "duration": "30:00", "type": "video"}, {"id": "ch-a4-2", "title": "敏捷教练", "duration": "35:00", "type": "video"}, {"id": "ch-a4-3", "title": "规模化敏捷", "duration": "40:00", "type": "video"}]';
    chapters_a5 jsonb := '[{"id": "ch-a5-1", "title": "需求分析", "duration": "25:00", "type": "video"}, {"id": "ch-a5-2", "title": "商业论证", "duration": "30:00", "type": "video"}, {"id": "ch-a5-3", "title": "价值交付", "duration": "25:00", "type": "video"}]';
    chapters_a6 jsonb := '[{"id": "ch-a6-1", "title": "项目集战略", "duration": "30:00", "type": "video"}, {"id": "ch-a6-2", "title": "治理框架", "duration": "35:00", "type": "video"}, {"id": "ch-a6-3", "title": "收益管理", "duration": "30:00", "type": "video"}]';
    
    -- Implementation 课程章节
    chapters_i1 jsonb := '[{"id": "ch-i1-1", "title": "启动阶段", "duration": "30:00", "type": "video"}, {"id": "ch-i1-2", "title": "规划阶段", "duration": "45:00", "type": "video"}, {"id": "ch-i1-3", "title": "执行监控", "duration": "40:00", "type": "video"}, {"id": "ch-i1-4", "title": "收尾阶段", "duration": "25:00", "type": "video"}]';
    chapters_i2 jsonb := '[{"id": "ch-i2-1", "title": "CI/CD", "duration": "35:00", "type": "video"}, {"id": "ch-i2-2", "title": "容器化", "duration": "40:00", "type": "video"}, {"id": "ch-i2-3", "title": "监控告警", "duration": "30:00", "type": "video"}]';
    chapters_i3 jsonb := '[{"id": "ch-i3-1", "title": "成功案例", "duration": "45:00", "type": "video"}, {"id": "ch-i3-2", "title": "失败案例", "duration": "45:00", "type": "video"}, {"id": "ch-i3-3", "title": "经验教训", "duration": "30:00", "type": "video"}]';
    chapters_i4 jsonb := '[{"id": "ch-i4-1", "title": "Jira实战", "duration": "30:00", "type": "video"}, {"id": "ch-i4-2", "title": "MS Project", "duration": "35:00", "type": "video"}, {"id": "ch-i4-3", "title": "Confluence", "duration": "25:00", "type": "video"}]';
    chapters_i5 jsonb := '[{"id": "ch-i5-1", "title": "复盘方法", "duration": "25:00", "type": "video"}, {"id": "ch-i5-2", "title": "持续改进", "duration": "30:00", "type": "video"}, {"id": "ch-i5-3", "title": "知识管理", "duration": "25:00", "type": "video"}]';
    chapters_i6 jsonb := '[{"id": "ch-i6-1", "title": "领导力", "duration": "35:00", "type": "video"}, {"id": "ch-i6-2", "title": "影响力", "duration": "30:00", "type": "video"}, {"id": "ch-i6-3", "title": "情商管理", "duration": "30:00", "type": "video"}]';
BEGIN
    -- Foundation 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-f1', '项目管理概述', 'Dr. Zhang', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', '3h 30m', chapters_f1, 1200, 1, '#3b82f6'),
    ('c-f2', '敏捷开发基础', 'Alex Agile', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800', '2h 45m', chapters_f2, 980, 2, '#3b82f6'),
    ('c-f3', 'WBS工作分解结构', 'Mike Wang', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800', '3h 15m', chapters_f3, 850, 3, '#3b82f6'),
    ('c-f4', '项目进度管理', 'Sarah Li', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800', '3h 00m', chapters_f4, 920, 4, '#3b82f6'),
    ('c-f5', '风险管理入门', 'Tom Chen', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', '2h 20m', chapters_f5, 780, 5, '#3b82f6'),
    ('c-f6', '团队协作与沟通', 'Lisa Wu', 'Foundation', 'Published', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', '2h 30m', chapters_f6, 890, 6, '#3b82f6')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;

    -- Advanced 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-a1', 'PMP认证冲刺', 'Dr. Emily', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', '5h 45m', chapters_a1, 2100, 7, '#8b5cf6'),
    ('c-a2', '挣值管理EVM', 'Prof. Liu', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', '3h 15m', chapters_a2, 1350, 8, '#8b5cf6'),
    ('c-a3', 'CPM关键路径法', 'Dr. Wang', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800', '3h 15m', chapters_a3, 1180, 9, '#8b5cf6'),
    ('c-a4', '敏捷Scrum实战', 'Coach Mike', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800', '4h 30m', chapters_a4, 1650, 10, '#8b5cf6'),
    ('c-a5', '商业分析PBA', 'Sarah BA', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', '3h 15m', chapters_a5, 920, 11, '#8b5cf6'),
    ('c-a6', '项目集管理', 'Director Chen', 'Advanced', 'Published', 'https://images.unsplash.com/photo-1553877615-29246752c5d7?w=800', '4h 00m', chapters_a6, 780, 12, '#8b5cf6')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;

    -- Implementation 课程 (6门)
    INSERT INTO app_courses (id, title, author, category, status, image, duration, chapters, views, learning_path_order, category_color) VALUES
    ('c-i1', '项目全生命周期实战', 'Senior PM Zhang', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800', '5h 30m', chapters_i1, 1450, 13, '#f97316'),
    ('c-i2', 'DevOps体系实战', 'DevOps Li', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1667372393119-c8f473882e8e?w=800', '4h 30m', chapters_i2, 1180, 14, '#f97316'),
    ('c-i3', '经典案例剖析', 'Case Study Team', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', '4h 00m', chapters_i3, 1650, 15, '#f97316'),
    ('c-i4', '项目管理工具链', 'Tool Expert Wang', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800', '3h 30m', chapters_i4, 1320, 16, '#f97316'),
    ('c-i5', '复盘与持续改进', 'Improvement Coach', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', '3h 00m', chapters_i5, 980, 17, '#f97316'),
    ('c-i6', '领导力与软技能', 'Leadership Expert', 'Implementation', 'Published', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', '3h 30m', chapters_i6, 1150, 18, '#f97316')
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        chapters = EXCLUDED.chapters,
        learning_path_order = EXCLUDED.learning_path_order,
        category_color = EXCLUDED.category_color;
END $$;
```

### 1.2 新增数据库表

```sql
---

## 2. 后端菜单重构

### 2.1 当前问题分析

| 菜单项 | 当前状态 | 问题描述 |
|--------|----------|----------|
| 体系课程 | ⚠️ 部分可用 | 有CourseBuilder但缺少审核流程 |
| 核心算法 | ❌ 占位符 | 无实际功能 |
| 实战项目 | ❌ 占位符 | 无实际功能 |
| 知识图谱 | ✅ 可用 | 功能完整 |
| 用户管理 | ✅ 可用 | 基础功能完整 |
| 学习进度 | ❌ Mock数据 | 未连接真实数据 |
| 日程活动 | ❌ 占位符 | 仅有UI框架 |
| 内容审核 | ⚠️ 部分可用 | 功能未完善 |
| 全站公告 | ❌ Mock数据 | 纯前端状态 |
| 会员管理 | ✅ 可用 | 基础功能已连接数据库 |
| 系统配置 | ❌ 本地状态 | 配置仅保存在前端 |

### 2.2 新菜单结构

```
后台管理系统重构
├── 📊 概览 (Overview)
│   ├── 仪表盘 ✅ (保持现有，连接真实统计)
│   └── 数据统计 ✅ (保持现有)
│
├── 📚 内容中心 (Content)
│   ├── 课程管理
│   │   ├── 课程列表 ✅ (现有CourseBuilder整合)
│   │   ├── 课程审核 🆕 (新增审核工作流)
│   │   └── 课程分类 🆕 (管理Foundation/Advanced/Implementation)
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
│   ├── 用户管理 ✅ (现有UserTable)
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

### 2.3 需要新增的表

```sql
-- 系统配置表
CREATE TABLE app_system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banner轮播图表
CREATE TABLE app_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT DEFAULT 'home', -- 'home'|'learning'|'community'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE app_admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT REFERENCES app_users(id),
    action TEXT NOT NULL, -- 'create'|'update'|'delete'|'login'
    target_type TEXT, -- 'course'|'user'|'post'|'announcement'
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 站内信表
CREATE TABLE app_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT REFERENCES app_users(id),
    recipient_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 内容举报表
CREATE TABLE app_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT REFERENCES app_users(id),
    target_type TEXT NOT NULL, -- 'post'|'comment'|'user'
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending'|'processing'|'resolved'|'rejected'
    handled_by TEXT REFERENCES app_users(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. 实战模拟系统方案

### 3.1 案例设计

**案例1: 丹佛国际机场行李系统危机**
难度: Expert | 场景: 5个阶段 | 每个决策点: 4个选项

```
阶段1: 项目启动
背景: 你被任命为DIA行李系统项目经理，预算5亿，工期2年
决策点1: 技术方案选择
├─ 选项A: 采用成熟传统系统（安全，+10分，预算-10%）
├─ 选项B: 采用创新自动化系统（风险高，+30分，技术+1）
├─ 选项C: 混合方案（平衡，+20分，复杂度+1）
└─ 选项D: 外包给国际大厂（昂贵，+15分，预算-20%，质量+1）

阶段2: 需求变更危机  
触发: 航空公司要求提前6个月交付
决策点2: 变更响应
├─ 选项A: 拒绝变更，坚持原计划（-10分，客户满意度-2）
├─ 选项B: 接受挑战，增加人力（+20分，预算-15%，士气-1）
├─ 选项C: 削减范围，保核心功能（+15分，功能-1）
└─ 选项D: 采用快速原型法（+25分，风险+1，技术+1）

阶段3: 技术故障频发
触发: 自动化系统故障率达15%
决策点3: 质量危机应对
├─ 选项A: 全面返工（-5分，延期3月，质量+2）
├─ 选项B: 局部修复（+10分，故障率降至8%）
├─ 选项C: 更换供应商（+5分，延期2月，预算-10%）
└─ 选项D: 增加测试投入（+20分，预算-8%，质量+1）

阶段4: 媒体负面报道
触发: 项目延期被曝光，媒体施压
决策点4: 公关危机
├─ 选项A: 保持沉默（-15分，声誉-2）
├─ 选项B: 主动公开进度（+10分，透明度+1）
├─ 选项C: 承诺提前交付（+5分，风险+2）
└─ 选项D: 邀请媒体参观（+20分，声誉+1，士气+1）

阶段5: 最终交付决策
触发: 系统仍有问题，但Deadline已到
决策点5: 交付抉择
├─ 选项A: 强制上线（+5分，客户满意度-3，可能有事故）
├─ 选项B: 申请延期（+15分，预算-10%，质量+1）
├─ 选项C: 分阶段交付（+25分，核心功能优先）
└─ 选项D: 取消自动化，改人工（+10分，技术-2，预算-5%）
```

**案例2: NHS英国医疗IT系统**
难度: Hard | 场景: 4个阶段

**案例3: 特斯拉Model 3产能危机**
难度: Medium | 场景: 4个阶段

**案例4: 阿波罗13号救援**
难度: Expert | 场景: 3个阶段（紧凑）

### 3.2 数据库表

```sql
-- 实战模拟场景表
CREATE TABLE IF NOT EXISTS app_simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium', -- 'Easy'|'Medium'|'Hard'|'Expert'
    category TEXT, -- 'CaseStudy'|'Crisis'|'Planning'|'Team'
    cover_image TEXT,
    stages JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    resources JSONB DEFAULT '{}',
    learning_objectives JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户模拟进度表
CREATE TABLE IF NOT EXISTS app_simulation_progress (
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

### 3.3 报告生成需求

模拟结束后生成报告，包含：
1. **执行摘要** - 总体评分和评级
2. **决策分析** - 每个阶段的选择和得分
3. **资源管理** - 预算/时间/质量变化曲线
4. **关键转折点** - 影响最大的决策
5. **学习建议** - 针对薄弱环节的推荐课程
6. **历史对比** - 与其他用户的对比

**PDF导出功能：**
- 使用 jsPDF + html2canvas
- 报告模板包含图表和文字
- 支持打印友好格式

---

## 4. 报告生成与PDF导出

### 4.1 报告数据结构

```typescript
interface SimulationReport {
    scenarioId: string;
    scenarioTitle: string;
    userId: string;
    userName: string;
    completedAt: string;
    finalScore: number;
    maxScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'F';
    ranking: number;
    breakdown: {
        decisionScore: number;
        resourceScore: number;
        objectiveScore: number;
        timeScore: number;
    };
    decisions: Array<{
        stageId: string;
        stageName: string;
        question: string;
        selectedOption: string;
        optionText: string;
        score: number;
        maxScore: number;
        feedback: string;
    }>;
    resourceHistory: Array<{
        stage: string;
        budget: number;
        timeline: number;
        quality: number;
        morale: number;
    }>;
    recommendations: Array<{
        type: 'strength' | 'weakness';
        area: string;
        description: string;
        suggestedCourses: string[];
    }>;
}
```

---

## 5. 兑换码系统完善

### 5.1 兑换码生成逻辑

后台Admin可以：
1. 批量生成兑换码（支持自定义前缀）
2. 设置兑换码有效期
3. 设置兑换码类型（Pro/Pro+）
4. 设置兑换时长（30天/90天/永久）
5. 导出兑换码列表（CSV）

**兑换码格式：** `PF-PRO-XXXXXX` (6位随机字母数字)

### 5.2 前端兑换功能

会员页面增加兑换码输入框：
- 输入框支持自动格式化
- 实时验证兑换码有效性
- 兑换成功后立即更新会员等级

### 5.3 兑换码测试数据

```sql
INSERT INTO membership_codes (code, tier, duration_days, is_used, created_at) VALUES
('PF-PRO-TEST01', 'pro', 30, false, NOW()),
('PF-PRO-TEST02', 'pro', 90, false, NOW()),
('PF-PROPLUS-01', 'pro_plus', 30, false, NOW()),
('PF-LIFETIME-01', 'pro_plus', 36500, false, NOW());
```

---

## 6. 会员页面优化

### 6.1 页面布局

**三栏对比布局：**

```
┌─────────────────────────────────────────────────────────────────┐
│                     选择您的会员计划                             │
├──────────────────┬──────────────────┬───────────────────────────┤
│                  │                  │                           │
│    🆓 Free       │    💎 Pro        │    👑 Pro+                │
│                  │                  │                           │
│   免费开始       │   ¥99/月         │   ¥199/月                 │
│                  │   或完成5门课    │   或完成10门课             │
│                  │                  │                           │
│  [当前计划]      │  [升级]          │  [升级]                   │
│                  │                  │                           │
├──────────────────┼──────────────────┼───────────────────────────┤
│  ✓ 基础课程      │  ✓ 基础课程      │  ✓ 基础课程               │
│  ✓ 3个基础工具   │  ✓ 全部12个工具  │  ✓ 全部22个工具           │
│  ✗ AI助手        │  ✓ AI助手 20次   │  ✓ AI助手 50次            │
│  ✗ 实战模拟      │  ✗ 实战模拟      │  ✓ 实战模拟中心           │
│                  │                  │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 6.2 详细对比表

| 功能 | Free | Pro | Pro+ |
|------|------|-----|------|
| **课程访问** | | | |
| Foundation课程 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| Advanced课程 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| Implementation课程 | ⚠️ 限前3章 | ✅ 全部 | ✅ 全部 |
| **工具实验室** | | | |
| 基础工具(12个) | ✅ 3个 | ✅ 全部 | ✅ 全部 |
| 高级工具(5个) | ❌ | ✅ 全部 | ✅ 全部 |
| 专家工具(5个) | ❌ | ❌ | ✅ 全部 |
| **AI助手** | | | |
| 日调用次数 | 5次 | 20次 | 50次 |
| 可用模型 | Gemini Flash | Gemini + Kimi | Gemini Pro + Kimi |
| 高级分析 | ❌ | ❌ | ✅ |
| **实战模拟** | | | |
| 案例学习 | ✅ 阅读 | ✅ 互动 | ✅ 互动 |
| 分支剧情模拟 | ❌ | ❌ | ✅ 全部场景 |
| 评分报告 | ❌ | ❌ | ✅ PDF导出 |
| **社区特权** | | | |
| 发帖权限 | ✅ | ✅ | ✅ |
| 精华标识 | ❌ | ✅ | ✅ |
| 专家认证 | ❌ | ❌ | ✅ |
| **其他** | | | |
| 证书下载 | ✅ 基础 | ✅ 完整 | ✅ 完整 |
| 客服支持 | 社区 | 邮件 | 1对1 |
| 价格 | 免费 | ¥99/月 | ¥199/月 |
| 解锁方式 | 注册 | 5门课/付费 | 10门课/付费 |

### 6.3 兑换码区域

在会员页面底部增加：
- 输入框："有兑换码？立即激活"
- 按钮：验证并激活
- 提示：兑换码可从企业培训或活动获得

---

## 7. 社区数据填充

### 7.1 话题数据

```sql
INSERT INTO app_topics (name, description, icon, color, follower_count, post_count) VALUES
('PMP备考', 'PMP认证考试备考交流', '📚', '#3b82f6', 1200, 450),
('敏捷实践', 'Scrum、看板等敏捷方法实践', '🏃', '#22c55e', 980, 320),
('项目管理工具', 'Jira、MS Project等工具使用', '🛠️', '#f59e0b', 750, 280),
('职场感悟', '项目经理职业发展、软技能', '💼', '#8b5cf6', 650, 190),
('案例讨论', '经典项目案例分析', '📊', '#ef4444', 520, 150),
('求职招聘', 'PM岗位招聘信息', '💼', '#06b6d4', 480, 200);
```

### 7.2 帖子数据（20条）

```sql
INSERT INTO app_community_posts (user_id, user_name, user_avatar, role, content, tags, likes, comments, created_at) VALUES
('u-001', '张经理', 'https://i.pravatar.cc/150?u=001', 'Manager', '刚带领团队完成了一个大型ERP实施项目，分享一下 lessons learned：1. 需求变更必须书面确认 2. 预留20%缓冲时间 3. 干系人管理比技术更重要', '["#项目管理", "#经验分享"]', 45, 12, NOW() - INTERVAL '2 hours'),
('u-002', '李敏捷', 'https://i.pravatar.cc/150?u=002', 'Student', '求助：团队 velocity 持续下降，从30点降到18点，大家有什么诊断方法吗？', '["#敏捷实践", "#求助"]', 12, 8, NOW() - INTERVAL '5 hours'),
('u-003', '王总监', 'https://i.pravatar.cc/150?u=003', 'Director', '推荐一本好书《项目管理的艺术》，作者是Basecamp创始人，很多观点颠覆传统认知', '["#读书", "#PMP备考"]', 89, 23, NOW() - INTERVAL '1 day'),
('u-004', '陈Scrum', 'https://i.pravatar.cc/150?u=004', 'Manager', '我们团队尝试取消了每日站会，改为异步更新，两周后效率反而提升了。不是所有仪式都适合每个团队', '["#敏捷实践", "#团队协作"]', 156, 45, NOW() - INTERVAL '1 day'),
('u-005', '刘助理', 'https://i.pravatar.cc/150?u=005', 'Student', '终于通过PMP考试了！备考3个月，分享我的笔记给大家', '["#PMP备考", "#经验分享"]', 234, 67, NOW() - INTERVAL '2 days'),
('u-006', '赵PM', 'https://i.pravatar.cc/150?u=006', 'Manager', '遇到一个很难搞的客户，需求一周改三次，有什么好的应对策略吗？', '["#客户管理", "#求助"]', 34, 15, NOW() - INTERVAL '3 days'),
('u-007', '钱教练', 'https://i.pravatar.cc/150?u=007', 'Director', '敏捷转型不只是流程改变，更重要的是思维转变。推荐一个案例：Spotify的部落模型', '["#敏捷转型", "#案例分享"]', 178, 34, NOW() - INTERVAL '3 days'),
('u-008', '孙助理', 'https://i.pravatar.cc/150?u=008', 'Student', '新人PM求建议：如何在没有实权的情况下推动项目？', '["#职场", "#求助"]', 67, 28, NOW() - INTERVAL '4 days'),
('u-009', '周经理', 'https://i.pravatar.cc/150?u=009', 'Manager', '项目延期了两个月，今天终于上线了。复盘一下：最大的问题是对技术难点预估不足', '["#复盘", "#经验分享"]', 123, 19, NOW() - INTERVAL '4 days'),
('u-010', '吴敏捷', 'https://i.pravatar.cc/150?u=010', 'Manager', '关于估算的一个技巧：用历史数据做参考，比凭空估算准确得多', '["#估算", "#技巧"]', 89, 12, NOW() - INTERVAL '5 days');
```

---

## 8. 公告系统

### 8.1 公告数据

```sql
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
('系统维护通知', '系统将于今晚02:00-04:00进行例行维护，期间部分功能可能不可用', 'warning', 90, 'all', true, NOW(), NOW() + INTERVAL '1 day'),
('Pro Lab上线', '全新的Pro Lab高级实验室正式上线！包含蒙特卡洛模拟、FMEA分析等10个专业工具', 'success', 80, 'all', true, NOW(), NOW() + INTERVAL '7 days'),
('社区规范更新', '请大家文明交流，禁止发布广告和违规内容', 'info', 50, 'all', true, NOW(), NULL);
```

---

## 9. 实施顺序建议

### 阶段1: 数据库修复（1天）
1. 执行课程数据补全SQL
2. 创建新增表
3. 插入测试数据

### 阶段2: 后端菜单重构（2天）
1. 删除/合并占位菜单
2. 新增真实管理页面
3. 连接数据库

### 阶段3: 公告系统（1天）
1. 后端Admin公告管理
2. 前端Navbar消息中心

### 阶段4: 会员页面（1天）
1. 三栏布局
2. 对比表格
3. 兑换码功能

### 阶段5: 社区优化（2天）
1. 搜索功能
2. 关注功能
3. 话题标签

### 阶段6: 实战模拟（3天）
1. 场景编辑器
2. 模拟引擎
3. 报告PDF导出

---

**方案完成。**
CREATE TABLE IF NOT EXISTS app_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info'|'success'|'warning'|'error'
    priority INTEGER DEFAULT 0,
    target_audience TEXT DEFAULT 'all', -- 'all'|'free'|'pro'|'pro_plus'
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户公告已读记录
CREATE TABLE IF NOT EXISTS app_user_announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    announcement_id UUID REFERENCES app_announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- 3. 实战模拟场景表
CREATE TABLE IF NOT EXISTS app_simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'Medium',
    category TEXT,
    cover_image TEXT,
    stages JSONB DEFAULT '[]',
    decisions JSONB DEFAULT '[]',
    resources JSONB DEFAULT '{}',
    learning_objectives JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户模拟进度表
CREATE TABLE IF NOT EXISTS app_simulation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES app_simulation_scenarios(id) ON DELETE CASCADE,
    current_stage INTEGER DEFAULT 0,
    decisions_made JSONB DEFAULT '[]',
    resources_state JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, scenario_id)
);

-- 5. 用户关注表
CREATE TABLE IF NOT EXISTS app_user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    following_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 6. 话题表
CREATE TABLE IF NOT EXISTS app_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    follower_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 帖子话题关联表
CREATE TABLE IF NOT EXISTS app_post_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id BIGINT REFERENCES app_community_posts(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES app_topics(id) ON DELETE CASCADE,
    UNIQUE(post_id, topic_id)
);

-- 8. CPM项目保存表
CREATE TABLE IF NOT EXISTS app_cpm_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    tasks JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. 实战模拟系统方案

### 2.1 案例设计

**案例1: 丹佛国际机场行李系统危机**
难度: Expert | 场景: 5个阶段 | 每个决策点: 4个选项

```
阶段1: 项目启动
背景: 你被任命为DIA行李系统项目经理，预算5亿，工期2年
决策点1: 技术方案选择
├─ 选项A: 采用成熟传统系统（安全，+10分，预算-10%）
├─ 选项B: 采用创新自动化系统（风险高，+30分，技术+1）
├─ 选项C: 混合方案（平衡，+20分，复杂度+1）
└─ 选项D: 外包给国际大厂（昂贵，+15分，预算-20%，质量+1）

阶段2: 需求变更危机  
触发: 航空公司要求提前6个月交付
决策点2: 变更响应
├─ 选项A: 拒绝变更，坚持原计划（-10分，客户满意度-2）
├─ 选项B: 接受挑战，增加人力（+20分，预算-15%，士气-1）
├─ 选项C: 削减范围，保核心功能（+15分，功能-1）
└─ 选项D: 采用快速原型法（+25分，风险+1，技术+1）

阶段3: 技术故障频发
触发: 自动化系统故障率达15%
决策点3: 质量危机应对
├─ 选项A: 全面返工（-5分，延期3月，质量+2）
├─ 选项B: 局部修复（+10分，故障率降至8%）
├─ 选项C: 更换供应商（+5分，延期2月，预算-10%）
└─ 选项D: 增加测试投入（+20分，预算-8%，质量+1）

阶段4: 媒体负面报道
触发: 项目延期被曝光，媒体施压
决策点4: 公关危机
├─ 选项A: 保持沉默（-15分，声誉-2）
├─ 选项B: 主动公开进度（+10分，透明度+1）
├─ 选项C: 承诺提前交付（+5分，风险+2）
└─ 选项D: 邀请媒体参观（+20分，声誉+1，士气+1）

阶段5: 最终交付决策
触发: 系统仍有问题，但Deadline已到
决策点5: 交付抉择
├─ 选项A: 强制上线（+5分，客户满意度-3，可能有事故）
├─ 选项B: 申请延期（+15分，预算-10%，质量+1）
├─ 选项C: 分阶段交付（+25分，核心功能优先）
└─ 选项D: 取消自动化，改人工（+10分，技术-2，预算-5%）
```

**案例2: NHS英国医疗IT系统**
难度: Hard | 场景: 4个阶段 | 多结局

**案例3: 特斯拉Model 3产能危机**
难度: Medium | 场景: 4个阶段

**案例4: 阿波罗13号救援**
难度: Expert | 场景: 3个阶段（紧凑）

### 2.2 报告生成需求

模拟结束后生成报告，包含：
1. **执行摘要** - 总体评分和评级
2. **决策分析** - 每个阶段的选择和得分
3. **资源管理** - 预算/时间/质量变化曲线
4. **关键转折点** - 影响最大的决策
5. **学习建议** - 针对薄弱环节的推荐课程
6. **历史对比** - 与其他用户的对比

**PDF导出功能：**
- 使用 jsPDF + html2canvas
- 报告模板包含图表和文字
- 支持打印友好格式

---

## 3. 报告生成与PDF导出

### 3.1 报告数据结构

```typescript
interface SimulationReport {
    // 基础信息
    scenarioId: string;
    scenarioTitle: string;
    userId: string;
    userName: string;
    completedAt: string;
    
    // 评分结果
    finalScore: number;
    maxScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'F';
    ranking: number; // 超过x%的用户
    
    // 分项得分
    breakdown: {
        decisionScore: number;      // 决策分 (40%)
        resourceScore: number;      // 资源分 (30%)
        objectiveScore: number;     // 目标分 (20%)
        timeScore: number;          // 时间分 (10%)
    };
    
    // 决策记录
    decisions: Array<{
        stageId: string;
        stageName: string;
        question: string;
        selectedOption: string;
        optionText: string;
        score: number;
        maxScore: number;
        feedback: string;
    }>;
    
    // 资源变化历史
    resourceHistory: Array<{
        stage: string;
        budget: number;
        timeline: number;
        quality: number;
        morale: number;
    }>;
    
    // 学习建议
    recommendations: Array<{
        type: 'strength' | 'weakness';
        area: string;
        description: string;
        suggestedCourses: string[];
    }>;
}
```

### 3.2 PDF导出实现

使用库: `jspdf`, `html2canvas`

报告模板设计:
- 封面: 项目名称、用户、日期、总体评分
- 第2页: 评分详情和雷达图
- 第3页: 决策分析表格
- 第4页: 资源变化曲线图
- 第5页: 学习建议

---

## 4. 兑换码系统完善

### 4.1 兑换码生成逻辑

后台Admin可以：
1. 批量生成兑换码（支持自定义前缀）
2. 设置兑换码有效期
3. 设置兑换码类型（Pro/Pro+）
4. 设置兑换时长（30天/90天/永久）
5. 导出兑换码列表（CSV）

**兑换码格式：** `PF-PRO-XXXXXX` (6位随机字母数字)

### 4.2 前端兑换功能

会员页面增加兑换码输入框：
- 输入框支持自动格式化
- 实时验证兑换码有效性
- 兑换成功后立即更新会员等级

### 4.3 兑换码SQL

```sql
-- 生成测试兑换码
INSERT INTO membership_codes (code, tier, duration_days, is_used, created_at) VALUES
('PF-PRO-TEST01', 'pro', 30, false, NOW()),
('PF-PRO-TEST02', 'pro', 90, false, NOW()),
('PF-PROPLUS-01', 'pro_plus', 30, false, NOW()),
('PF-LIFETIME-01', 'pro_plus', 36500, false, NOW());
```

---

## 5. 会员页面优化

### 5.1 页面布局

**三栏对比布局：**

```
┌─────────────────────────────────────────────────────────────────┐
│                     选择您的会员计划                             │
├──────────────────┬──────────────────┬───────────────────────────┤
│                  │                  │                           │
│    🆓 Free       │    💎 Pro        │    👑 Pro+                │
│                  │                  │                           │
│   免费开始       │   ¥99/月         │   ¥199/月                 │
│                  │   或完成5门课    │   或完成10门课             │
│                  │                  │                           │
│  [当前计划]      │  [升级]          │  [升级]                   │
│                  │                  │                           │
├──────────────────┼──────────────────┼───────────────────────────┤
│  ✓ 基础课程      │  ✓ 基础课程      │  ✓ 基础课程               │
│  ✓ 3个基础工具   │  ✓ 全部12个工具  │  ✓ 全部22个工具           │
│  ✗ AI助手        │  ✓ AI助手 20次   │  ✓ AI助手 50次            │
│  ✗ 实战模拟      │  ✗ 实战模拟      │  ✓ 实战模拟中心           │
│                  │                  │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 5.2 详细对比表

| 功能 | Free | Pro | Pro+ |
|------|------|-----|------|
| **课程访问** | | | |
| Foundation课程 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| Advanced课程 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| Implementation课程 | ⚠️ 限前3章 | ✅ 全部 | ✅ 全部 |
| **工具实验室** | | | |
| 基础工具(12个) | ✅ 3个 | ✅ 全部 | ✅ 全部 |
| 高级工具(5个) | ❌ | ✅ 全部 | ✅ 全部 |
| 专家工具(5个) | ❌ | ❌ | ✅ 全部 |
| **AI助手** | | | |
| 日调用次数 | 5次 | 20次 | 50次 |
| 可用模型 | Gemini Flash | Gemini + Kimi | Gemini Pro + Kimi |
| 高级分析 | ❌ | ❌ | ✅ |
| **实战模拟** | | | |
| 案例学习 | ✅ 阅读 | ✅ 互动 | ✅ 互动 |
| 分支剧情模拟 | ❌ | ❌ | ✅ 全部场景 |
| 评分报告 | ❌ | ❌ | ✅ PDF导出 |
| **社区特权** | | | |
| 发帖权限 | ✅ | ✅ | ✅ |
| 精华标识 | ❌ | ✅ | ✅ |
| 专家认证 | ❌ | ❌ | ✅ |
| **其他** | | | |
| 证书下载 | ✅ 基础 | ✅ 完整 | ✅ 完整 |
| 客服支持 | 社区 | 邮件 | 1对1 |
| 价格 | 免费 | ¥99/月 | ¥199/月 |
| 解锁方式 | 注册 | 5门课/付费 | 10门课/付费 |

### 5.3 兑换码区域

在会员页面底部增加：
- 输入框："有兑换码？立即激活"
- 按钮：验证并激活
- 提示：兑换码可从企业培训或活动获得

---

## 6. 社区数据填充

### 6.1 话题数据

```sql
INSERT INTO app_topics (name, description, icon, color, follower_count, post_count) VALUES
('PMP备考', 'PMP认证考试备考交流', '📚', '#3b82f6', 1200, 450),
('敏捷实践', 'Scrum、看板等敏捷方法实践', '🏃', '#22c55e', 980, 320),
('项目管理工具', 'Jira、MS Project等工具使用', '🛠️', '#f59e0b', 750, 280),
('职场感悟', '项目经理职业发展、软技能', '💼', '#8b5cf6', 650, 190),
('案例讨论', '经典项目案例分析', '📊', '#ef4444', 520, 150),
('求职招聘', 'PM岗位招聘信息', '💼', '#06b6d4', 480, 200);
```

### 6.2 帖子数据

```sql
-- 插入20条社区帖子
INSERT INTO app_community_posts (user_id, user_name, user_avatar, role, content, tags, likes, comments, created_at) VALUES
('u-001', '张经理', 'https://i.pravatar.cc/150?u=001', 'Manager', '刚带领团队完成了一个大型ERP实施项目，分享一下 lessons learned：1. 需求变更必须书面确认 2. 预留20%缓冲时间 3. 干系人管理比技术更重要', '["#项目管理", "#经验分享"]', 45, 12, NOW() - INTERVAL '2 hours'),
('u-002', '李敏捷', 'https://i.pravatar.cc/150?u=002', 'Student', '求助：团队 velocity 持续下降，从30点降到18点，大家有什么诊断方法吗？', '["#敏捷实践", "#求助"]', 12, 8, NOW() - INTERVAL '5 hours'),
('u-003', '王总监', 'https://i.pravatar.cc/150?u=003', 'Director', '推荐一本好书《项目管理的艺术》，作者是Basecamp创始人，很多观点颠覆传统认知', '["#读书", "#PMP备考"]', 89, 23, NOW() - INTERVAL '1 day'),
('u-004', '陈Scrum', 'https://i.pravatar.cc/150?u=004', 'Manager', '我们团队尝试取消了每日站会，改为异步更新，两周后效率反而提升了。不是所有仪式都适合每个团队', '["#敏捷实践", "#团队协作"]', 156, 45, NOW() - INTERVAL '1 day'),
('u-005', '刘助理', 'https://i.pravatar.cc/150?u=005', 'Student', '终于通过PMP考试了！备考3个月，分享我的笔记给大家', '["#PMP备考", "#经验分享"]', 234, 67, NOW() - INTERVAL '2 days');
-- 继续插入15条...
```

### 6.3 评论数据

```sql
-- 为帖子添加评论
INSERT INTO app_comments (post_id, user_id, user_name, user_avatar, content, likes, created_at) VALUES
(1, 'u-006', '赵PM', 'https://i.pravatar.cc/150?u=006', '非常赞同！干系人管理确实是项目成功的关键', 8, NOW() - INTERVAL '1 hour'),
(1, 'u-007', '钱敏捷', 'https://i.pravatar.cc/150?u=007', '请教一下，如何管理那种总是变需求的客户？', 3, NOW() - INTERVAL '30 minutes');
```

---

## 7. 公告系统

### 7.1 公告数据

```sql
INSERT INTO app_announcements (title, content, type, priority, target_audience, is_active, start_at, end_at) VALUES
('系统维护通知', '系统将于今晚02:00-04:00进行例行维护，期间部分功能可能不可用', 'warning', 90, 'all', true, NOW(), NOW() + INTERVAL '1 day'),
('Pro Lab上线', '全新的Pro Lab高级实验室正式上线！包含蒙特卡洛模拟、FMEA分析等10个专业工具', 'success', 80, 'all', true, NOW(), NOW() + INTERVAL '7 days'),
('社区规范更新', '请大家文明交流，禁止发布广告和违规内容', 'info', 50, 'all', true, NOW(), NULL);
```

---

## 8. 实施顺序建议

### 阶段1: 数据库修复（1天）
1. 执行课程数据补全SQL
2. 创建新增表（公告、模拟、关注等）
3. 插入测试数据（社区、公告、兑换码）

### 阶段2: 会员页面优化（1天）
1. 重构会员页面为三栏布局
2. 添加详细对比表格
3. 添加兑换码输入功能

### 阶段3: 公告系统（1天）
1. 后端Admin公告管理
2. 前端Navbar消息中心
3. 已读/未读状态

### 阶段4: 社区优化（2天）
1. 搜索功能
2. 关注功能
3. 话题标签

### 阶段5: 实战模拟（3天）
1. 场景编辑器
2. 模拟执行引擎
3. 报告生成
4. PDF导出

### 阶段6: 兑换码系统（1天）
1. 后台生成兑换码
2. 前端兑换功能
3. 兑换逻辑

---

**方案完成，等待评审后开始实施。**
