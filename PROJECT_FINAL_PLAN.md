# ProjectFlow 项目最终实施计划

> **版本**: v1.0  
> **制定日期**: 2026-02-17  
> **目标**: 完成所有功能开发、Bug修复和最终优化

---

## 📋 项目现状总结

### 技术栈
- **前端**: React 18 + TypeScript 5 + Tailwind CSS 3
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: Google Gemini API + Moonshot API
- **图表**: Recharts + ECharts
- **PDF**: jsPDF + html2canvas

### 已完成模块
| 模块 | 状态 | 说明 |
|------|------|------|
| 学生端Dashboard | ✅ 80% | UI完成，部分数据为模拟 |
| 学习中心 | ✅ 90% | 课程播放、笔记、模拟演练完成 |
| 社区功能 | ✅ 85% | 帖子、评论、点赞、关注已实现 |
| AI助手 | ✅ 90% | 多模型切换、使用限制已实现 |
| 会员系统 | ✅ 95% | 三级会员、权限控制完善 |
| 工具实验室 | ✅ 85% | 8个工具已实现，需扩展至22个 |
| 教师端UI | ✅ 70% | 界面完成，功能多为占位符 |
| 管理后台 | ✅ 60% | 基础框架，需完善数据对接 |
| 数据库 | ✅ 75% | 表结构完成，需执行和优化 |

---

## 🚨 问题清单（按优先级排序）

### P0 - 阻塞性问题（必须立即修复）

#### 1. 数据库SQL执行问题
- **问题**: SQL文件死锁、外键约束、类型不匹配
- **影响**: 无法初始化数据库
- **解决状态**: ✅ 已拆分为4个Part，需按序执行
- **操作**: 
  ```bash
  # 执行顺序
  1. db_part1_tables.sql      # 基础表结构
  2. db_part2_triggers.sql    # 触发器和函数
  3. db_part3_views_rls.sql   # 视图和RLS策略
  # 跳过 db_part4_data.sql（示例数据可选）
  ```

#### 2. 教师端功能占位符问题
- **问题**: MyCourses、Classroom、Assignments等页面功能未实现
- **影响**: 教师无法使用核心功能
- **文件**: 
  - `pages/teacher/MyCourses.tsx` - 课程创建/编辑为占位
  - `pages/teacher/Classroom.tsx` - 签到/投票/提问为模拟数据
  - `pages/teacher/Assignments.tsx` - 作业批改为占位
  - `pages/teacher/Interactions.tsx` - 互动功能未连接真实数据

#### 3. Supabase连接配置
- **问题**: `supabaseClient.ts` 使用placeholder，.env配置不完整
- **影响**: 无法连接真实数据库
- **解决**: 需提供真实的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

---

### P1 - 重要问题（严重影响用户体验）

#### 4. 教师端UI自适应问题
- **问题**: 使用 `max-w-lg` 限制宽度，桌面端显示过小
- **文件**: 
  - `pages/teacher/MyCourses.tsx`
  - `pages/teacher/Classroom.tsx`
  - `pages/teacher/Assignments.tsx`
  - `pages/teacher/Interactions.tsx`
  - `pages/teacher/Profile.tsx`
- **修复**:
  ```tsx
  // 修改前
  <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
  
  // 修改后
  <div className="max-w-7xl mx-auto min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
  ```

#### 5. 实战模拟完成页面问题
- **问题**: 
  - 英文文案 "Simulation Complete" 等
  - PDF下载中文乱码
- **文件**: `pages/Simulation.tsx` 或 `pages/LearningHub.tsx`
- **修复**:
  - 本地化所有英文文案
  - 使用 `generateHTMLReport` 替代 jsPDF（已提供）

#### 6. 公告管理无数据
- **问题**: SQL已执行但前端不显示
- **可能原因**:
  - RLS策略限制
  - 字段名不匹配
  - 前端查询条件过滤
- **检查**:
  ```sql
  -- 确认数据存在
  SELECT * FROM app_announcements LIMIT 5;
  
  -- 检查RLS策略
  SELECT * FROM pg_policies WHERE tablename = 'app_announcements';
  ```

---

### P2 - 功能完善（提升完整性）

#### 7. 工具实验室扩展
- **现状**: 仅实现8个工具
- **目标**: 22个专业工具
- **已实现**:
  - MonteCarloSimulator (蒙特卡洛)
  - PlanningPoker (规划扑克)
  - KanbanFlowMetrics (Kanban流)
  - LearningCurve (学习曲线)
  - EVMPrediction (挣值预测)
  - CCPMSchedule (关键链)
  - FishboneDiagram (鱼骨图)
  - QualityCost (质量成本)
- **待实现**: 14个新工具

#### 8. 社区功能优化
- **文件**: `pages/Community.tsx`
- **问题**:
  - 图片上传未实现
  - 话题标签筛选不完善
  - 关注/粉丝功能待完善

#### 9. AI助手优化
- **文件**: `pages/AiAssistant.tsx`
- **问题**:
  - 历史记录未持久化
  - 多轮对话上下文管理
  - 文件上传分析功能

---

## 📊 详细实施计划

### Phase 1: 数据库基础（Day 1-2）

**目标**: 建立完整的数据库基础

| 任务 | 文件/操作 | 预计时间 | 依赖 |
|------|-----------|----------|------|
| 1.1 执行Part 1 SQL | `db_part1_tables.sql` | 2h | - |
| 1.2 执行Part 2 SQL | `db_part2_triggers.sql` | 1h | 1.1 |
| 1.3 执行Part 3 SQL | `db_part3_views_rls.sql` | 1h | 1.2 |
| 1.4 验证表结构 | Supabase Dashboard | 1h | 1.3 |
| 1.5 配置Supabase连接 | `.env` + `supabaseClient.ts` | 1h | - |

**关键检查点**:
- [ ] 所有表创建成功
- [ ] RLS策略正确配置
- [ ] 前端能正常连接数据库

---

### Phase 2: 教师端核心功能（Day 3-6）

**目标**: 实现教师端所有核心功能

#### Day 3: MyCourses 课程管理
**文件**: `pages/teacher/MyCourses.tsx`

| 功能 | 状态 | 实现内容 |
|------|------|----------|
| 创建课程 | ⚠️ 占位 | 完善 `CourseCreateModal`，连接 `app_courses` 表 |
| 编辑课程 | ❌ 未实现 | 添加 `CourseEditModal` |
| 搜索/筛选 | ⚠️ 占位 | 实现本地过滤逻辑 |
| 查看详情 | ⚠️ 占位 | 跳转详情页或展开卡片 |

**数据库操作**:
```sql
-- 插入新课程
INSERT INTO app_courses (id, title, category, description, teacher_id, status)
VALUES (gen_random_uuid(), '课程标题', 'Foundation', '描述', auth.uid(), 'draft');
```

#### Day 4-5: Classroom 课堂功能
**文件**: `pages/teacher/Classroom.tsx`

| 功能 | 状态 | 实现内容 |
|------|------|----------|
| 开始/结束上课 | ✅ 已实现 | 状态管理完善 |
| 学生签到 | ⚠️ 模拟 | 连接 `app_attendance` 表，实时订阅 |
| 课堂投票 | ⚠️ 模拟 | 完善 `PollCreateModal`，连接 `app_polls` |
| 学生提问 | ⚠️ 模拟 | 连接 `app_class_questions`，实时推送 |
| 白板绘制 | ✅ 已实现 | 保存到 `app_class_sessions.whiteboard_data` |
| 课程回放 | ❌ 未实现 | 录制逻辑（模拟或真实） |
| 课堂统计 | ❌ 未实现 | 调用 `update_class_stats()` |

**关键实现**:
```typescript
// 实时订阅学生签到
useEffect(() => {
  const subscription = supabase
    .channel('attendance')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'app_attendance', filter: `session_id=eq.${sessionId}` },
      (payload) => { /* 更新UI */ }
    )
    .subscribe();
  return () => { subscription.unsubscribe(); };
}, [sessionId]);
```

#### Day 6: Assignments 作业管理
**文件**: `pages/teacher/Assignments.tsx`

| 功能 | 状态 | 实现内容 |
|------|------|----------|
| 创建作业 | ⚠️ 部分 | 完善表单验证，保存到 `app_assignments` |
| 作业列表 | ✅ 已实现 | 查询真实数据 |
| 查看提交 | ⚠️ 模拟 | 从 `app_student_submissions` 查询 |
| 批改作业 | ⚠️ 模拟 | 保存分数和评语 |
| 批量操作 | ❌ 未实现 | 批量批改功能 |
| 导出成绩 | ❌ 未实现 | Excel导出（可选） |

---

### Phase 3: 问题修复（Day 7-8）

#### Day 7: UI修复

| 问题 | 文件 | 修复内容 |
|------|------|----------|
| 教师端自适应 | 5个文件 | 统一改为 `max-w-7xl` |
| 底部导航适配 | `TeacherDashboard.tsx` | 桌面端显示为侧边栏 |
| 卡片网格布局 | 5个文件 | 使用 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |

**统一布局模板**:
```tsx
<div className="max-w-7xl mx-auto min-h-screen bg-gray-50">
  {/* 桌面端侧边栏 + 移动端底部导航 */}
  <div className="flex">
    <aside className="hidden lg:block w-64 ...">...</aside>
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      {/* 内容区域 */}
    </main>
  </div>
  {/* 移动端底部导航 */}
  <nav className="lg:hidden fixed bottom-0 ...">...</nav>
</div>
```

#### Day 8: 数据与本地化修复

| 问题 | 文件 | 修复内容 |
|------|------|----------|
| 实战模拟英文 | `pages/Simulation.tsx` | 替换所有英文文案 |
| PDF中文乱码 | `pages/Simulation.tsx` | 使用 `generateHTMLReport` |
| 公告无数据 | `pages/admin/AdminAnnouncements.tsx` | 检查查询条件和RLS |

**文案本地化**:
```tsx
// 修改前
<h2>Simulation Complete</h2>
<button>Download Report</button>

// 修改后
<h2>模拟完成</h2>
<button>下载报告</button>
```

---

### Phase 4: 功能完善（Day 9-12）

#### Day 9: Interactions 学生互动
**文件**: `pages/teacher/Interactions.tsx`

| 功能 | 实现内容 |
|------|----------|
| Q&A列表 | 连接 `app_questions`，显示真实提问 |
| 回复问题 | 实现回复功能，更新 `app_question_replies` |
| 讨论区 | 连接 `app_discussions` |
| 通知管理 | 连接 `app_notifications` |

#### Day 10-11: 工具实验室扩展
**文件**: `pages/ToolsLab.tsx` + `tools/`

**待实现工具清单**:
| 工具ID | 名称 | 类别 | 复杂度 |
|--------|------|------|--------|
| risk-matrix | 风险概率影响矩阵 | 风险 | 中 |
| decision-tree | 决策树分析 | 决策 | 高 |
| wbs-builder | WBS工作分解 | 规划 | 中 |
| pert-chart | PERT网络图 | 调度 | 高 |
| resource-leveling | 资源平衡 | 资源 | 高 |
| stakeholder-map | 干系人分析 | 沟通 | 低 |
| burndown-chart | 燃尽图 | 敏捷 | 中 |
| velocity-tracker | 速率跟踪 | 敏捷 | 中 |
| earned-value | 挣值分析 | EVM | 中 |
| ... | 更多工具 | ... | ... |

#### Day 12: Profile 个人中心
**文件**: `pages/teacher/Profile.tsx`

| 功能 | 实现内容 |
|------|----------|
| 读取真实数据 | 从 `currentUser` 和 `app_users` 读取 |
| 教学统计 | 查询课程数、学生数、作业数 |
| 编辑资料 | 实现 `EditProfileModal` |
| 设置页面 | 通知设置、主题设置 |

---

### Phase 5: 管理后台完善（Day 13-14）

**文件**: `pages/admin/*.tsx`

| 页面 | 功能 | 实现内容 |
|------|------|----------|
| AdminDashboard | 数据概览 | 连接真实统计数据 |
| UserTable | 用户管理 | 完善增删改查 |
| AdminAnnouncements | 公告管理 | 修复数据查询 |
| AdminContent | 内容管理 | 课程审核、帖子管理 |
| AdminMembership | 会员管理 | 订单、退款处理 |
| AdminAnalytics | 数据分析 | 图表数据对接 |

---

### Phase 6: 最终优化（Day 15-16）

#### 性能优化

| 优化项 | 文件 | 措施 |
|--------|------|------|
| 代码分割 | `App.tsx` | 使用 `React.lazy` 懒加载页面 |
| 数据缓存 | 多处 | 实现 SWR 或 React Query |
| 图片优化 | 多处 | 使用 WebP，添加懒加载 |
| 包体积 | `vite.config.ts` | 分析并优化 bundle |

**懒加载实现**:
```tsx
// 修改前
import TeacherDashboard from './pages/TeacherDashboard';

// 修改后
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
```

#### 体验优化

| 优化项 | 措施 |
|--------|------|
| 加载状态 | 统一 Skeleton 组件 |
| 错误处理 | 统一 Error Boundary |
| 空状态 | 空数据时显示引导 |
| 动画过渡 | 页面切换动画 |

#### 代码质量

| 优化项 | 措施 |
|--------|------|
| TypeScript严格模式 | 修复所有 `any` 类型 |
| 组件抽离 | 重复逻辑提取为 Hooks |
| 常量管理 | 统一配置常量 |
| 注释完善 | 关键函数添加 JSDoc |

---

## 🎯 项目结束前检查清单

### 功能完整性
- [ ] 学生端所有页面功能完整
- [ ] 教师端所有页面功能完整
- [ ] 管理后台所有页面功能完整
- [ ] 22个工具全部可用
- [ ] AI助手功能完善

### 数据连接
- [ ] 所有页面使用真实数据（无mock）
- [ ] 实时功能正常（Realtime）
- [ ] 权限控制正确（RLS）

### 用户体验
- [ ] 移动端适配完整
- [ ] 加载速度快（< 3s）
- [ ] 无明显的UI错位
- [ ] 所有文案中文

### 代码质量
- [ ] 无 TypeScript 错误
- [ ] 无 Console 报错
- [ ] 代码规范统一
- [ ] 关键功能有注释

### 部署准备
- [ ] 环境变量配置完整
- [ ] 数据库迁移脚本
- [ ] 构建成功
- [ ] 线上测试通过

---

## 📁 SQL文件使用说明

### 已拆分的SQL文件

| 文件 | 内容 | 执行顺序 | 是否必须 |
|------|------|----------|----------|
| `db_part1_tables.sql` | 所有基础表结构 | 1 | ✅ 必须 |
| `db_part2_triggers.sql` | 触发器和函数 | 2 | ✅ 必须 |
| `db_part3_views_rls.sql` | 视图和RLS策略 | 3 | ✅ 必须 |
| `db_part4_data.sql` | 示例数据 | 4 | ❌ 可选 |

### 执行方法

```bash
# 在Supabase SQL Editor中按顺序执行

# Step 1: 创建表结构
\i db_part1_tables.sql

# Step 2: 创建触发器
\i db_part2_triggers.sql

# Step 3: 创建视图和RLS
\i db_part3_views_rls.sql

# Step 4: 插入示例数据（可选）
\i db_part4_data.sql
```

### 前提条件
执行 SQL 前确保以下表已存在（由基础数据库提供）：
- `auth.users` - Supabase 认证用户表
- `app_users` - 应用用户表
- `app_courses` - 课程表
- `app_course_enrollments` - 课程报名表

---

## ⚠️ 风险提示

1. **数据库依赖**: 必须先执行基础数据库SQL，才能执行Part 1-4
2. **类型不匹配**: `app_course_enrollments.student_id` 为 TEXT，与 `auth.uid()` (UUID) 比较需转换
3. **RLS限制**: 部分查询可能因RLS策略返回空，需使用 service role key 或调整策略
4. **外部依赖**: AI功能依赖 Moonshot 和 Gemini API，需配置有效密钥

---

## 📞 需要确认的事项

1. **是否继续完善教师端所有功能？**（预计6天工作量）
2. **是否扩展22个完整工具？**（预计3天工作量）
3. **是否完善管理后台？**（预计2天工作量）
4. **是否需要性能优化？**（预计2天工作量）
5. **数据库基础表是否已创建？**（`app_users`, `app_courses` 等）

---

*计划制定完成，确认后开始实施。*
