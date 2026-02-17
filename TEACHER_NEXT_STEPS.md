# 教师端下一步开发计划

> 基于 MCP 验证结果，制定后续开发路线图

---

## 📊 当前状态回顾

### ✅ 已完成验证

| 阶段 | 功能 | MCP 验证结果 | 截图证据 |
|------|------|-------------|---------|
| Phase 2 | UI 响应式布局 | ✅ 已验证 | `verify-phase1-02-teacher-classroom.png` |
| Phase 3 | AdminTeachers | ⏸️ 代码完成 | `verify-phase3-*.png` |
| Phase 4 | AdminAnnouncements | ⏸️ 已有实现 | `verify-phase4-*.png` |

### ⚠️ 关键问题
- **Vercel 部署延迟**: 生产环境未显示最新代码（`AdminTeachers`, `AdminAnnouncements`）
- **MCP Token 失效**: 无法手动触发部署

---

## 🎯 下一步开发计划

### 阶段 A: 部署与验证（高优先级）

#### A.1 解决部署问题
- [ ] 获取新的 Vercel Token
- [ ] 或配置 GitHub Actions 自动部署
- [ ] 验证生产环境代码版本

#### A.2 完整功能验证
```bash
# Phase 2 响应式验证
node verify-phase1.mjs

# Phase 3 教师管理验证  
node verify-phase3.mjs

# Phase 4 公告管理验证
node verify-phase4.mjs
```

**验证截图要求:**
- [ ] 375px (iPhone SE) - 移动端布局
- [ ] 768px (iPad) - 平板布局
- [ ] 1440px (Desktop) - 桌面端布局

---

### 阶段 B: 作业系统优化（中优先级）

#### B.1 作业批改界面
**目标**: 优化教师作业批改体验

**功能清单:**
- [ ] 作业列表筛选（待批改/已批改/全部）
- [ ] 批量批改功能
- [ ] 评分标准设置
- [ ] 评语模板
- [ ] 成绩统计分析

**页面位置:**
```
pages/teacher/Assignments.tsx
```

**数据表:**
- `app_assignments` - 作业信息
- `app_submissions` - 学生提交
- `app_grades` - 评分记录

#### B.2 学生作业详情
**功能清单:**
- [ ] 作业提交内容预览
- [ ] 附件下载
- [ ] 批改历史记录
- [ ] 学生作业对比（防抄袭）

---

### 阶段 C: 课程管理增强（中优先级）

#### C.1 课程内容编辑
**功能清单:**
- [ ] 富文本编辑器集成
- [ ] 视频上传管理
- [ ] 课件资源管理
- [ ] 课程章节拖拽排序
- [ ] 课程预览功能

**页面位置:**
```
pages/teacher/MyCourses.tsx
components/CourseEditor.tsx (新建)
```

#### C.2 学生进度跟踪
**功能清单:**
- [ ] 班级学习进度总览
- [ ] 学生个人进度详情
- [ ] 课程完成率统计
- [ ] 学习时长分析
- [ ] 预警学生提醒

---

### 阶段 D: 互动功能（中优先级）

#### D.1 课堂互动
**功能清单:**
- [ ] 实时问答（Q&A）
- [ ] 随堂测验
- [ ] 投票功能
- [ ] 学生举手发言
- [ ] 课堂笔记共享

**技术方案:**
```typescript
// Supabase Realtime 订阅
const channel = supabase
  .channel('classroom-interactions')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'interactions' 
  }, callback)
  .subscribe();
```

#### D.2 讨论区管理
**功能清单:**
- [ ] 课程讨论区
- [ ] 置顶/精华帖子
- [ ] 敏感词过滤
- [ ] 学生发言权限控制

---

### 阶段 E: 数据报表（低优先级）

#### E.1 教学数据看板
**功能清单:**
- [ ] 授课时长统计
- [ ] 学生活跃度分析
- [ ] 课程满意度评分
- [ ] 收入统计（如有付费课程）

#### E.2 数据导出
**功能清单:**
- [ ] 学生名单导出（CSV/Excel）
- [ ] 成绩表导出
- [ ] 签到记录导出
- [ ] 课程数据报表导出

---

## 🛠️ 技术优化项

### 性能优化
- [ ] 代码分割（减少首屏加载）
- [ ] 图片懒加载
- [ ] 数据分页加载
- [ ] 虚拟列表（长列表优化）

### 用户体验
- [ ] 加载骨架屏
- [ ] 操作反馈（Toast 提示）
- [ ] 快捷键支持
- [ ] 离线模式（PWA）

---

## 📅 开发时间线

### 第 1 周：部署与验证
- 解决 Vercel 部署问题
- 完成 Phase 2/3/4 生产环境验证
- 修复验证中发现的问题

### 第 2-3 周：作业系统
- 作业批改界面优化
- 学生作业详情页面
- 成绩统计分析

### 第 4-5 周：课程管理
- 课程内容编辑器
- 学生进度跟踪
- 课程预览功能

### 第 6-7 周：互动功能
- 课堂实时互动
- 讨论区管理
- 测验投票功能

### 第 8 周：数据报表
- 教学数据看板
- 数据导出功能
- 性能优化

---

## 🔍 代码审查清单

### 新增页面检查项
- [ ] TypeScript 类型定义完整
- [ ] 错误处理（try-catch）
- [ ] Loading 状态
- [ ] 空状态提示
- [ ] 响应式布局（移动端/桌面端）
- [ ] 权限控制（角色检查）

### 数据库操作检查项
- [ ] RLS 策略配置
- [ ] 索引优化
- [ ] 批量操作限制
- [ ] 数据校验

---

## 📁 文件组织建议

```
pages/teacher/
├── Dashboard.tsx              # 首页（已完成）
├── Classroom.tsx              # 上课（签到码功能）
├── MyCourses.tsx              # 我的课程
├── Assignments.tsx            # 作业管理
├── Profile.tsx                # 个人资料
├── CourseEditor/              # 课程编辑（新建）
│   ├── index.tsx
│   ├── ChapterEditor.tsx
│   └── ResourceManager.tsx
├── AssignmentGrading/         # 作业批改（新建）
│   ├── index.tsx
│   ├── SubmissionDetail.tsx
│   └── GradeBatch.tsx
└── Analytics/                 # 数据分析（新建）
    ├── index.tsx
    ├── StudentProgress.tsx
    └── CourseStats.tsx

pages/admin/
├── AdminTeachers.tsx          # 教师管理（已完成）
├── AdminAnnouncements.tsx     # 公告管理（已完成）
└── AdminClassSessions.tsx     # 课堂监控（可选）

components/teacher/
├── Whiteboard.tsx             # 白板组件
├── CheckInCard.tsx            # 签到卡片
├── QuestionList.tsx           # 问答列表
└── PollCreator.tsx            # 投票创建

hooks/
├── useTeacherCourses.ts       # 教师课程数据
├── useClassSession.ts         # 课堂会话数据
├── useAttendance.ts           # 签到数据
└── useAssignmentStats.ts      # 作业统计
```

---

## ✅ 验收标准

### 功能验收
- [ ] 教师可以发布和管理课程
- [ ] 教师可以批改作业并给出反馈
- [ ] 教师可以查看学生学习进度
- [ ] 教师可以进行课堂互动
- [ ] 数据可以导出备份

### 性能验收
- [ ] 首屏加载 < 3s
- [ ] 页面切换 < 1s
- [ ] 大数据列表滚动流畅
- [ ] 移动端操作流畅

---

## 📝 备注

1. **部署问题优先解决** - 所有新功能开发前，先确保现有代码能正常部署
2. **渐进式开发** - 每个功能完成后立即本地 Commit，阶段完成统一验证
3. **用户反馈** - 根据教师实际使用反馈调整优先级

---

*文档生成时间: 2026-02-17*  
*基于 Commit: 5ff1096*
