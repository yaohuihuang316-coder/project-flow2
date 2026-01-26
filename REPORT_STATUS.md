
# 🚀 ProjectFlow - 企业级项目管理学习系统汇报方案

## 1. 项目概况 (Project Overview)
**项目名称**: ProjectFlow Enterprise Learning  
**当前版本**: v0.9.0 (RC)  
**开发状态**: 核心功能与数据库架构已就绪  
**核心理念**: 融合 Apple HIG 设计美学的沉浸式学习体验，结合 Google Gemini AI 的智能化辅助，打造下一代企业培训 SaaS 平台。

---

## 2. 技术栈与架构 (Tech Stack)

| 领域 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端 (Frontend)** | React 19 + Vite | 采用最新 React 特性，构建高性能单页应用 |
| **UI 设计 (Design)** | Tailwind CSS | 实现高度定制化的 Glassmorphism (毛玻璃) 与 Bento Grid (便当盒) 布局 |
| **后端 (Backend)** | **Supabase (BaaS)** | PostgreSQL 数据库，已配置完整 Schema 与 Seed Data |
| **人工智能 (AI)** | **Google Gemini API** | 集成 `gemini-3-flash` 模型，用于智能助教、题目生成及内容分析 |
| **图表可视化** | Recharts + ECharts | 用于仪表盘数据、知识图谱及燃尽图绘制 |
| **部署平台** | **Flexible (Vercel / Netlify / AWS)** | 支持任何静态托管服务或 Docker 容器化部署 |

---

## 3. 开发进度详情 (Development Status)

### ✅ 前端模块 (Frontend Modules)

*   **身份认证 (Auth)**:
    *   [x] 登录/注册界面 (Glassmorphism 风格)
    *   [x] 演示账号一键登录逻辑
    *   [x] 完整的用户资料补全流程 (Drawer 组件)
*   **仪表盘 (Dashboard)**:
    *   [x] Bento Grid 布局设计
    *   [x] 学习状态雷达图与环形进度图
    *   [x] 快捷入口与每日问候
*   **学习中心 (Learning Hub)**:
    *   [x] 课程列表展示与筛选
    *   [x] **实验室 (Labs)**: 集成 CPM 关键路径、EVM 挣值计算器、PERT 估算器等 10+ 实战工具
    *   [x] **实战模拟 (Simulation)**: 深度集成 AI 驱动的案例模拟器 (如丹佛机场、特斯拉案例)
*   **沉浸式课堂 (Classroom)**:
    *   [x] 视频播放器外壳
    *   [x] **AI 助教**: 基于当前课程上下文的实时问答 (Gemini Streaming)
    *   [x] 笔记系统 (自动云端保存)
    *   [x] 资源下载模拟
*   **社区 (Community)**:
    *   [x] 瀑布流动态展示
    *   [x] 发布动态、点赞、评论互动
    *   [x] 热门话题侧边栏
*   **个人中心 (Profile)**:
    *   [x] 学习热力图 (GitHub Style)
    *   [x] 技能雷达图
    *   [x] **证书系统**: 支持 HTML 转 Canvas 生成高清 PDF 荣誉证书
*   **日程管理 (Schedule)**:
    *   [x] 专注模式 (Pomodoro Timer + 白噪音)
    *   [x] 日程时间轴展示
*   **管理后台 (Admin Console)**:
    *   [x] 独立布局与权限控制
    *   [x] 用户管理 (CRUD)
    *   [x] 内容 CMS (课程发布构建器)
    *   [x] 系统监控 (模拟实时流量地图与日志)

### ✅ 后端与数据 (Backend & Data)

*   **Schema 初始化**: 提供 `db_setup.sql` 脚本，包含 7 大核心业务表。
*   **数据隔离**: 完成 `app_users`, `app_courses`, `app_progress` 等核心表的关联设计。
*   **API 集成**:
    *   [x] Google GenAI SDK 集成完成。
    *   [x] Supabase Row Level Security (RLS) 策略已定义 (Dev Mode)。

---

## 4. 数据库设计概览 (Database Schema)

目前项目使用 **PostgreSQL** (via Supabase)。

1.  **app_users**: 用户核心信息 (Profile)
2.  **app_courses**: 课程元数据、章节 (JSONB)
3.  **app_user_progress**: 用户学习进度与笔记
4.  **app_community_posts**: 社区信息流
5.  **app_kanban_tasks**: 模拟实战看板任务
6.  **app_events**: 用户日程数据
7.  **app_activity_logs**: 用户活跃度日志 (Heatmap Source)

---

## 5. 演示与测试 (Demo & Access)

### 🔗 访问地址
*   **生产环境**: [待填写的部署 URL]
*   **本地开发**: `http://localhost:5173`

### 🔑 演示账号 (Demo Accounts)

1.  **超级管理员 / 经理 (Manager/Admin)**
    *   **Email**: `777@projectflow.com` (或在登录页点击 "试用演示账号")
    *   **权限**: 可访问前台所有功能 + **管理后台**
    *   **角色**: Alex Chen (PMO Director)

### ⚠️ 环境依赖 (Environment Variables)
运行项目需配置 `.env` 文件：
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_gemini_api_key
```
