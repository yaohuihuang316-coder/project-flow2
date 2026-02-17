# Project Configuration

## 项目信息

这是一个 React + Vite + Supabase 的教育管理平台项目。

## 技术栈

- 前端：React + TypeScript + Vite
- 后端：Supabase (PostgreSQL + Auth + Storage)
- 部署：Vercel

## 开发规范

### 必须使用的 Skill

每次开发任务时，**必须先加载** `iterative-dev` skill：

```
/skill iterative-dev
```

该 skill 确保遵循正确的开发流程：
- 小步快跑开发
- 每次开发必须启动本地预览
- 阶段完成后部署验证
- 失败自动调试或求助

### 开发命令

```bash
# 启动开发服务器（每次开发必须执行）
npm run dev

# 构建项目
npm run build

# 类型检查
npm run typecheck
```

### 代码规范

- 组件放在 `components/` 目录
- 页面放在 `pages/` 目录
- 工具函数放在 `lib/` 目录
- 类型定义放在 `types.ts`

### 数据库

- Supabase 数据库
- SQL 文件在项目根目录（`db_*.sql`）
- 修改数据库后需要更新相应的 SQL 文件
