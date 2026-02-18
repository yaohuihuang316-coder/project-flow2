# Vercel 部署工作流 - 设置指南

## 快速检查清单

### Step 1: 安装 MCP 工具

```bash
# 必需: Vercel MCP
npx -y @smithery/cli install @vercel/mcp

# 推荐: GitHub MCP（用于推送代码）
npx -y @smithery/cli install @github/mcp-server-github
```

### Step 2: 获取 Token

#### Vercel Token
1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 复制 Token（格式: `vc_xxxxxxxx`）

#### GitHub Token（可选，用于 push）
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 复制 Token（格式: `ghp_xxxxxxxx`）

### Step 3: 配置 Kimi

编辑 `~/.kimi/config.json`（Windows: `C:\Users\你的用户名\.kimi\config.json`）:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp@latest"],
      "env": {
        "VERCEL_TOKEN": "vc_your_token_here"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server-github@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Step 4: 项目配置

#### Git 配置
```bash
cd E:\毕业\project-flow2

# 初始化 Git
git init

# 配置用户信息
git config user.name "你的名字"
git config user.email "your@email.com"

# 添加远程仓库（在 GitHub/GitLab 创建空仓库后）
git remote add origin https://github.com/你的用户名/仓库名.git

# 首次提交
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### Vercel 配置

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. 完成部署向导
4. 在 Project Settings 中获取 **Project ID**

#### 项目文件

确保项目根目录有以下文件：

```
project-flow2/
├── .kimi-rules           # ✅ Kimi 规则
├── vercel.json           # ✅ Vercel 配置
├── package.json          # ✅ 项目配置
├── scripts/
│   └── deploy-vercel.js  # ✅ 部署脚本
└── src/
    └── ...               # 你的代码
```

### Step 5: 环境变量

Windows PowerShell:
```powershell
$env:VERCEL_TOKEN = "vc_your_token"
$env:VERCEL_PROJECT_ID = "prj_your_project_id"
```

或在项目根目录创建 `.env.local`:
```bash
VERCEL_TOKEN=vc_your_token
VERCEL_PROJECT_ID=prj_your_project_id
```

**⚠️ 注意**: `.env.local` 不要提交到 Git！

---

## 验证安装

在 Kimi 中输入：

```
你能使用 vercel_list_deployments 工具吗？
```

如果 Kimi 能正确响应，说明配置成功。

---

## 工作流程

### 标准流程

```
你: 帮我实现登录功能

Kimi: [分析 → 设计 → 等待确认]

你: 开始实现

Kimi: [编写代码 → 本地检查]

你: 部署

Kimi: 
  Step 1: 提交代码
    ✓ git add .
    ✓ git commit
    ✓ git push
  
  Step 2: Vercel 部署
    ✓ 触发部署
    ✓ 构建中...
    ✓ 部署完成
  
  🌐 预览链接: https://your-app.vercel.app

你: [访问链接，提出修改意见]

Kimi: [修复 → 重新部署]
```

---

## 故障排除

### 问题 1: MCP 工具无法使用

**现象**: Kimi 说无法使用 vercel_xxx 工具

**解决**:
1. 检查 `~/.kimi/config.json` 格式是否正确
2. 确保 Token 有效
3. 重启 Kimi

### 问题 2: Git push 失败

**现象**: "fatal: could not read Username"

**解决**:
```bash
# 使用 HTTPS 并配置凭证管理器
git config --global credential.helper manager

# 或改用 SSH
git remote set-url origin git@github.com:用户名/仓库.git
```

### 问题 3: Vercel 部署失败

**现象**: 构建错误

**解决**:
1. 本地先测试构建: `npm run build`
2. 检查 `vercel.json` 配置
3. 查看 Vercel Dashboard 的详细日志

### 问题 4: 部署成功但页面空白

**可能原因**:
1. `outputDirectory` 配置错误
2. 路由重写配置错误

**解决**:
```json
// vite 项目
{
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

// next.js 项目
{
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `.kimi-rules` | Kimi 工作流规则 |
| `vercel.json` | Vercel 部署配置 |
| `scripts/deploy-vercel.js` | 部署辅助脚本 |
| `scripts/auto-commit.js` | 自动提交脚本 |
| `docs/deploys/*.md` | 部署记录文档 |
| `docs/changes/*.md` | 变更记录文档 |

---

## 快捷命令

```bash
# 本地检查
npm run lint              # ESLint 检查
npx tsc --noEmit          # TypeScript 检查
npm run build             # 构建测试

# 部署
node scripts/deploy-vercel.js "提交信息"

# Git
git status                # 查看变更
git log --oneline -5      # 查看提交历史
```

---

## 下一步

1. ✅ 完成上述配置
2. ✅ 在 Kimi 中测试 MCP 工具
3. ✅ 试运行一次部署流程
4. ✅ 开始正式开发
