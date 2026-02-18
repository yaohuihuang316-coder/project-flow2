# MCP 工具速查表

## 概述

本工作流需要以下 MCP 工具：

| MCP | 优先级 | 用途 | 是否必需 |
|-----|--------|------|----------|
| Vercel MCP | ⭐⭐⭐ | 部署项目、获取预览链接 | ✅ 必需 |
| GitHub MCP | ⭐⭐ | 推送代码、创建 PR | ⚠️ 推荐 |
| Bash | ⭐⭐⭐ | 执行命令（已内置） | ✅ 内置 |

---

## Vercel MCP 工具

### 1. vercel_deploy
部署项目到 Vercel

```json
{
  "name": "vercel_deploy",
  "arguments": {
    "projectId": "prj_xxxxxx",
    "name": "可选的部署名称"
  }
}
```

**使用场景**: 
- 手动触发部署
- 获取预览链接

---

### 2. vercel_list_deployments
列出项目的所有部署

```json
{
  "name": "vercel_list_deployments",
  "arguments": {
    "projectId": "prj_xxxxxx",
    "limit": 10
  }
}
```

**使用场景**:
- 获取最近的部署
- 查找预览链接

---

### 3. vercel_get_deployment
获取特定部署的详情

```json
{
  "name": "vercel_get_deployment",
  "arguments": {
    "deploymentId": "dpl_xxxxxx"
  }
}
```

**返回信息**:
- 部署状态 (READY / BUILDING / ERROR)
- 预览链接
- 构建日志

---

### 4. vercel_get_project
获取项目信息

```json
{
  "name": "vercel_get_project",
  "arguments": {
    "projectId": "prj_xxxxxx"
  }
}
```

**返回信息**:
- 项目名称
- 框架类型
- 最新部署

---

## GitHub MCP 工具

### 1. github_create_or_update_file
创建或更新文件

```json
{
  "name": "github_create_or_update_file",
  "arguments": {
    "owner": "用户名",
    "repo": "仓库名",
    "path": "文件路径",
    "content": "文件内容(base64)",
    "message": "commit message"
  }
}
```

---

### 2. github_push
推送代码变更

```json
{
  "name": "github_push",
  "arguments": {
    "owner": "用户名",
    "repo": "仓库名",
    "branch": "main",
    "files": ["src/app.tsx"]
  }
}
```

---

## Bash 工具（内置）

### 执行命令
```json
{
  "name": "bash",
  "arguments": {
    "command": "git status",
    "description": "检查 Git 状态"
  }
}
```

**常用命令**:
- `git add .`
- `git commit -m "message"`
- `git push origin main`
- `npm run build`
- `npx tsc --noEmit`

---

## 工作流中的工具使用

### 场景 1: 完整部署流程

```
用户说: "部署"

Kimi 执行:
1. bash: git add .
2. bash: git commit -m "xxx"
3. bash: git push origin main
4. vercel_list_deployments (查询最新部署)
5. 等待部署完成
6. 返回预览链接
```

### 场景 2: 检查部署状态

```
用户问: "部署好了吗"

Kimi 执行:
1. vercel_list_deployments
2. 检查最新部署状态
3. 返回结果
```

### 场景 3: 获取部署日志

```
用户问: "为什么部署失败了"

Kimi 执行:
1. vercel_list_deployments
2. vercel_get_deployment (获取详情)
3. 分析错误日志
4. 提供解决方案
```

---

## 配置模板

### Kimi 配置文件

位置: `~/.kimi/config.json`

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

---

## 获取 Token

### Vercel Token

1. 访问: https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 名称: "Kimi MCP"
4. 复制 Token

### GitHub Token

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选权限:
   - ✅ repo (完整仓库访问)
4. 点击 Generate
5. 复制 Token

---

## 故障排除

### MCP 无法连接

```bash
# 测试 Vercel Token
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v9/user

# 测试 GitHub Token
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/user
```

### 工具未响应

1. 检查配置文件格式
2. 确保 Token 有效
3. 重启 Kimi
4. 检查网络连接

---

## 相关文档

- Vercel API: https://vercel.com/docs/rest-api
- GitHub API: https://docs.github.com/en/rest
- Smithery: https://smithery.ai
