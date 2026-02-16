# ProjectFlow 问题修复计划方案

## 问题概述

根据反馈，当前存在以下4个主要问题需要修复：

1. **教师端首页UI布局问题** - 页面不自适应，显示异常
2. **实战模拟完成页面英文+PDF乱码** - 未全中文，下载功能异常
3. **公告管理无数据** - SQL已执行但前端不显示
4. **教师端功能不完整** - 所有按钮需实现功能

---

## 问题1：教师端首页UI自适应修复

### 问题描述
- 图1显示教师端首页布局异常
- 页面元素可能未正确适配移动端/桌面端
- max-w-lg 等限制导致显示区域过小

### 修复方案

#### 1.1 分析当前布局
```
文件：pages/teacher/MyCourses.tsx, Classroom.tsx, Assignments.tsx, Interactions.tsx, Profile.tsx
问题：
- 使用了 max-w-lg (512px) 限制宽度
- 在桌面端显示区域过小
- 需要响应式布局适配
```

#### 1.2 修复措施
- [ ] 移除 `max-w-lg` 限制，改为 `max-w-7xl` 或自适应
- [ ] 添加响应式断点：
  - 移动端：< 640px (sm)
  - 平板端：640px - 1024px (md/lg)
  - 桌面端：> 1024px (xl/2xl)
- [ ] 底部导航栏适配桌面端（可隐藏或显示为侧边栏）
- [ ] 卡片布局改为网格系统

#### 1.3 具体修改
```tsx
// 修改前
<div className="max-w-lg mx-auto min-h-screen bg-gray-50">

// 修改后
<div className="max-w-7xl mx-auto min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
```

---

## 问题2：实战模拟完成页面修复

### 问题描述
- 图2显示 "Simulation Complete" 英文页面
- "Download Report" 下载的PDF乱码
- 期望：全中文 + 正确的AI报告下载

### 修复方案

#### 2.1 定位问题代码
```
文件：pages/LearningHub.tsx
搜索：Simulation Complete, Download Report, Return to Hub
```

#### 2.2 中文本地化
- [ ] "Simulation Complete" → "模拟完成"
- [ ] "You have completed the scenario analysis." → "您已完成场景分析。"
- [ ] "Download Report" → "下载报告"
- [ ] "Return to Hub" → "返回中心"

#### 2.3 PDF下载修复
**问题分析：**
- 当前使用 jsPDF 生成PDF
- 中文支持需要引入中文字体
- 或者改为下载HTML报告（已实现的方案）

**修复选项：**

**选项A：使用HTML报告（推荐，已实现）**
- 复用 Simulation.tsx 中的 generateHTMLReport 功能
- 导出美观的HTML报告，用户可打印为PDF

**选项B：修复PDF中文**
- 引入支持中文的字体文件（如 Noto Sans SC）
- 字体文件较大，增加 bundle 体积

#### 2.4 实施建议
采用选项A，复用已有的 HTML 报告生成逻辑：
```tsx
import { generateHTMLReport } from '../lib/kimiService';

const handleDownloadReport = () => {
    const htmlContent = generateHTMLReport(reportData, kimiReport);
    // 下载HTML文件
};
```

---

## 问题3：公告管理无数据显示

### 问题描述
- 图3显示公告管理页面为0条
- SQL已执行，但前端不显示

### 问题分析
**可能原因：**
1. 表名不一致（app_announcements vs 其他）
2. 字段名不匹配
3. RLS策略限制
4. 前端查询条件过滤

### 修复方案

#### 3.1 检查数据库
```sql
-- 确认表结构和数据
SELECT * FROM app_announcements LIMIT 5;

-- 检查字段名
\d app_announcements
```

#### 3.2 检查前端查询
```
文件：pages/admin/AdminAnnouncements.tsx
搜索：fetchAnnouncements, .from('app_announcements')
```

#### 3.3 检查RLS策略
```sql
-- 查看表权限
SELECT * FROM pg_policies WHERE tablename = 'app_announcements';
```

#### 3.4 修复措施
- [ ] 确认表名和字段名匹配
- [ ] 检查是否有 is_active 过滤条件
- [ ] 确认当前用户有查询权限
- [ ] 必要时添加 RLS 例外或使用 service key

---

## 问题4：教师端功能完整实现

### 需求描述
完全实现教师端所有页面的按钮功能

### 涉及页面
1. **MyCourses.tsx** - 我的课程
2. **Classroom.tsx** - 上课/课堂
3. **Assignments.tsx** - 作业管理
4. **Interactions.tsx** - 学生互动
5. **Profile.tsx** - 个人中心

### 功能清单与实现方案

#### 4.1 MyCourses - 我的课程
| 按钮/功能 | 当前状态 | 实现方案 |
|-----------|----------|----------|
| 搜索课程 | ✅ 已实现 | 本地过滤 |
| 筛选状态 | ⚠️ 占位 | 实现状态过滤逻辑 |
| 创建课程 | ⚠️ 占位 | 添加创建课程Modal |
| 查看详情 | ⚠️ 占位 | 跳转课程详情页 |
| 编辑课程 | ❌ 未实现 | 添加编辑功能 |

#### 4.2 Classroom - 上课
| 按钮/功能 | 当前状态 | 实现方案 |
|-----------|----------|----------|
| 开始上课 | ✅ 已实现 | 课堂状态管理 |
| 结束课堂 | ✅ 已实现 | 计时器+状态重置 |
| 屏幕共享 | ⚠️ 模拟 | 集成WebRTC或模拟 |
| 白板绘制 | ✅ 已实现 | Canvas绘制 |
| 学生签到 | ⚠️ 模拟数据 | 连接真实学生数据 |
| 学生提问 | ⚠️ 模拟数据 | 实现提问接收 |
| 课堂投票 | ⚠️ 模拟功能 | 实现投票创建/展示 |
| 课程回放 | ❌ 未实现 | 添加回放功能 |
| 课堂统计 | ❌ 未实现 | 数据统计展示 |

#### 4.3 Assignments - 作业管理
| 按钮/功能 | 当前状态 | 实现方案 |
|-----------|----------|----------|
| 创建作业 | ⚠️ 部分实现 | 完善表单+提交 |
| 搜索作业 | ⚠️ 占位 | 实现搜索过滤 |
| 筛选状态 | ⚠️ 占位 | 状态筛选逻辑 |
| 批量操作 | ❌ 未实现 | 批量批改/删除 |
| 快速打分 | ⚠️ 模拟 | 实现打分保存 |
| 作业详情 | ⚠️ 部分实现 | 完整详情展示 |
| 导出成绩 | ❌ 未实现 | Excel导出功能 |

#### 4.4 Interactions - 学生互动
| 按钮/功能 | 当前状态 | 实现方案 |
|-----------|----------|----------|
| Q&A列表 | ⚠️ 模拟数据 | 连接真实数据 |
| 回复问题 | ⚠️ 占位 | 实现回复功能 |
| 讨论区 | ⚠️ 占位 | 实现讨论功能 |
| 通知管理 | ⚠️ 占位 | 通知列表+操作 |
| 置顶帖子 | ❌ 未实现 | 置顶功能 |
| 标记已读 | ❌ 未实现 | 批量标记 |

#### 4.5 Profile - 个人中心
| 按钮/功能 | 当前状态 | 实现方案 |
|-----------|----------|----------|
| 教师信息 | ⚠️ 硬编码 | 读取currentUser |
| 教学统计 | ⚠️ 硬编码 | 查询真实数据 |
| 认证状态 | ⚠️ 硬编码 | 读取认证状态 |
| 申请认证 | ✅ 已实现 | 跳转注册页面 |
| 编辑资料 | ❌ 未实现 | 编辑表单 |
| 设置 | ❌ 未实现 | 设置页面 |
| 退出登录 | ✅ 已实现 | onLogout |

### 优先级划分

**P0 - 核心功能（必须实现）**
- 课程创建/编辑
- 作业创建/批改
- 学生互动Q&A
- 教师资料读取真实数据

**P1 - 重要功能（建议实现）**
- 课堂投票完整功能
- 学生签到真实数据
- 作业批量操作
- 讨论区功能

**P2 - 增强功能（可选）**
- 课程回放
- 导出成绩
- 屏幕共享
- 设置页面

---

## 实施计划时间表

### 阶段1：UI修复 + 数据问题（1天）
- [ ] 修复教师端首页自适应
- [ ] 修复公告管理数据问题
- [ ] 修复实战模拟完成页面中文

### 阶段2：核心功能实现（2-3天）
- [ ] MyCourses 课程创建/编辑
- [ ] Assignments 作业完整功能
- [ ] Profile 读取真实数据

### 阶段3：互动功能实现（1-2天）
- [ ] Interactions Q&A功能
- [ ] Classroom 投票/签到功能

### 阶段4：优化与测试（1天）
- [ ] 功能联调测试
- [ ] UI细节优化
- [ ] 部署上线

---

## 技术实现要点

### 数据库补充
需要创建/更新的表：
- `app_courses` - 课程表
- `app_assignments` - 作业表
- `app_student_submissions` - 学生作业提交表
- `app_class_sessions` - 课堂会话表
- `app_polls` - 投票表
- `app_questions` - 学生提问表

### 关键组件开发
1. **CourseCreateModal** - 创建课程弹窗
2. **AssignmentCreateModal** - 创建作业弹窗
3. **GradeModal** - 批改作业弹窗
4. **PollCreateModal** - 创建投票弹窗

---

## 等待确认

请确认以下事项后开始实施：

1. **教师端功能范围**：是否按P0/P1/P2优先级全部实现？
2. **PDF报告方案**：使用HTML报告还是修复PDF中文？
3. **数据库权限**：是否需要调整RLS策略？
4. **实施顺序**：按阶段1→2→3→4顺序进行？
5. **时间预期**：预计4-7天完成，时间是否可接受？

---

*方案制定完成，等待确认后实施。*
