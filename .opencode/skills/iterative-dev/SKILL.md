---
name: iterative-dev
description: 迭代开发工作流 - 小步快跑开发、阶段部署验证、失败自动调试或求助
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: iterative-development
---

## 迭代开发工作流

遵循此工作流进行开发，确保每个阶段都经过验证后再进入下一阶段。

---

## MCP 工具

本项目已配置以下 MCP 服务器：

### 1. Puppeteer MCP（浏览器自动化 + 截图）

使用 `puppeteer` MCP 工具进行浏览器操作和截图。

**可用工具：**
- `puppeteer_navigate` - 导航到 URL
- `puppeteer_screenshot` - 截取页面或元素截图
- `puppeteer_click` - 点击元素
- `puppeteer_fill` - 填写表单
- `puppeteer_select` - 选择下拉选项
- `puppeteer_hover` - 悬停元素

### 2. Supabase MCP（数据库操作）

使用 `supabase` MCP 工具进行数据库操作。

**可用工具：**
- `list_tables` - 列出所有表
- `list_extensions` - 列出扩展
- `list_migrations` - 列出迁移
- `execute_sql` - 执行 SQL 语句（查询和写入）
- `apply_migration` - 应用数据库迁移

---

## 工作流程

### 1. 查看计划
- 开始每个任务前，先明确当前阶段的目标
- 确认需要完成的具体功能点

### 2. 开发阶段
- **编码 + 本地Commit（不部署）**
- 采用小步快跑策略，频繁提交
- 每个小功能完成后立即commit
- **每次开发时必须启动预览**：`npm run dev`
- 不要在这个阶段部署到服务器

### 3. 本地预览验证（使用 Puppeteer MCP）

#### 启动开发服务器

```bash
npm run dev
```

#### 使用 Puppeteer 进行验证

**步骤1：导航到页面**

使用 `puppeteer_navigate` 工具：
```
url: "http://localhost:5173"
```

**步骤2：操作页面（如需要）**

- 点击按钮：使用 `puppeteer_click`
- 填写表单：使用 `puppeteer_fill`
- 悬停元素：使用 `puppeteer_hover`

**步骤3：截图验证**

使用 `puppeteer_screenshot` 工具：
```
name: "local_阶段名_步骤名"
selector: "可选，指定元素选择器"
width: 1440
height: 900
fullPage: true
```

**截图命名规范：**
- 本地验证：`local_{阶段}_{步骤}`
- 线上验证：`prod_{阶段}_{步骤}`
- 错误截图：`error_{阶段}_{时间戳}`

### 4. 数据库操作（使用 Supabase MCP）

#### 查询数据

使用 `execute_sql` 工具：

```sql
-- 查询用户表
SELECT * FROM profiles LIMIT 10;

-- 查询课程
SELECT id, title, teacher_id FROM courses WHERE status = 'active';
```

#### 插入数据

使用 `execute_sql` 工具：

```sql
-- 插入测试数据
INSERT INTO courses (title, description, teacher_id, status)
VALUES ('测试课程', '这是一个测试课程', 'teacher-uuid', 'active');
```

#### 更新数据

```sql
-- 更新用户状态
UPDATE profiles SET role = 'teacher' WHERE id = 'user-uuid';
```

#### 查看表结构

使用 `list_tables` 工具查看所有表，或执行：

```sql
-- 查看表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

### 5. 阶段完成检查
- 判断是否完成了当前大阶段的所有功能
- **如果未完成**：返回开发阶段继续编码
- **如果已完成**：进入部署验证流程

### 6. 部署验证流程（仅阶段完成时执行）

#### 6.1 部署到服务器
- 只有在阶段功能完全完成后才部署
- 推送到 git 仓库（Vercel 自动部署）

```bash
git add .
git commit -m "feat: 完成某某阶段功能"
git push
```

#### 6.2 线上验证

使用 Puppeteer MCP 访问线上地址：

```
puppeteer_navigate: { url: "https://project-flow2.vercel.app" }
puppeteer_screenshot: { name: "prod_阶段名_验证" }
```

#### 6.3 验证结果判断

**验证通过：**
- 标记当前阶段完成
- 进入下一阶段

**验证失败：**
- 保留截图用于问题分析
- 进入失败处理流程

### 7. 失败处理流程

#### 7.1 统计失败次数
- 记录当前阶段的失败次数

#### 7.2 根据失败次数决定下一步

**失败次数 < 3次：**
- 自主调试
- 使用 Puppeteer 查看页面截图分析问题
- 使用 Supabase 查询相关数据排查
- 返回开发阶段修复问题
- 重新验证

**失败次数 >= 3次：**
- 停止自动调试
- 向用户求助

### 8. 求助用户（失败3次以上时）

当需要求助时，必须提供以下信息：

1. **截图**：使用 Puppeteer 截取的问题截图
2. **问题描述**：清晰描述遇到的问题
3. **数据库状态**：使用 Supabase MCP 查询的相关数据
4. **已尝试方案**：列出已经尝试过的解决方案
5. **建议思路**：提出可能的解决方向供用户参考

---

## 重要原则

1. **必须预览**：每次开发时都要启动本地开发服务器预览
2. **使用 MCP 工具**：
   - 用 Puppeteer MCP 进行浏览器截图和验证
   - 用 Supabase MCP 进行数据库查询和写入
3. **小步快跑**：频繁的小提交优于大的提交
4. **阶段验证**：每个阶段完成后必须验证
5. **截图留证**：验证失败时保留截图
6. **自动重试**：失败3次以内自主调试
7. **及时求助**：超过3次失败立即向用户求助

---

## 本项目命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 类型检查
npm run typecheck

# Git 提交
git add . && git commit -m "message" && git push
```

---

## 常用验证流程示例

### 示例1：验证登录功能

```
1. puppeteer_navigate: { url: "http://localhost:5173/auth" }
2. puppeteer_screenshot: { name: "local_auth_01_login_page" }
3. puppeteer_click: { selector: "button:has-text('Admin')" }
4. puppeteer_screenshot: { name: "local_auth_02_after_login" }
```

### 示例2：查询数据库验证数据

```
execute_sql: { 
  sql: "SELECT * FROM profiles WHERE email = 'test@example.com'" 
}
```

### 示例3：插入测试数据

```
execute_sql: {
  sql: "INSERT INTO announcements (title, content, author_id) VALUES ('测试公告', '内容', 'admin-uuid')"
}
```

---

## 状态追踪

在开发过程中，维护以下状态：

- `current_phase`: 当前阶段名称
- `phase_complete`: 阶段是否完成 (true/false)
- `fail_count`: 当前阶段失败次数
- `screenshot_paths`: 截图文件列表
- `dev_server_running`: 开发服务器是否运行中 (true/false)
