# 安全配置指南

> ⚠️ **安全警告**: 以下 Token 是敏感信息，请妥善保管，不要分享给他人！

---

## 你提供的 Token

| 服务 | Token 类型 | 用途 |
|------|-----------|------|
| Vercel | vcp_xxx | 部署项目到 Vercel |
| GitHub | github_pat_xxx | 推送代码到 GitHub |
| Supabase | JWT Token | 访问 Supabase 数据库 |

---

## Step 1: 配置 Kimi MCP

### Windows 配置

1. 打开配置文件：
   ```powershell
   notepad $env:USERPROFILE\.kimi\config.json
   ```

2. 粘贴以下内容（替换为你的真实 Token）：

   ```json
   {
     "mcpServers": {
       "vercel": {
         "command": "npx",
         "args": ["-y", "@vercel/mcp@latest"],
         "env": {
           "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE"
         }
       },
       "github": {
         "command": "npx",
         "args": ["-y", "@github/mcp-server-github@latest"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
         }
       }
     }
   }
   ```

3. 保存并关闭

### macOS/Linux 配置

```bash
# 创建/编辑配置文件
mkdir -p ~/.kimi
cat > ~/.kimi/config.json << 'EOF'
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp@latest"],
      "env": {
        "VERCEL_TOKEN": "你的_vercel_token"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server-github@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "你的_github_token"
      }
    }
  }
}
EOF
```

---

## Step 2: 配置项目环境变量

在项目根目录创建 `.env.local`：

```bash
# Vercel
VERCEL_TOKEN=vcp_你的token

# GitHub
GITHUB_TOKEN=ghp_你的token

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...你的token
```

**验证 .gitignore 已包含：**
```bash
cat .gitignore | grep env
```

应该看到：
```
.env
.env.local
```

---

## Step 3: 验证配置

### 测试 Vercel Token

```bash
# PowerShell
$env:VERCEL_TOKEN = "vcp_你的token"
Invoke-RestMethod -Uri "https://api.vercel.com/v9/user" -Headers @{ "Authorization" = "Bearer $env:VERCEL_TOKEN" }
```

或浏览器访问：
```
https://api.vercel.com/v9/user?authorization=Bearer%20你的token
```

### 测试 GitHub Token

```bash
# PowerShell
$env:GITHUB_TOKEN = "ghp_你的token"
Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{ "Authorization" = "Bearer $env:GITHUB_TOKEN" }
```

### 在 Kimi 中测试

启动 Kimi 后问：
```
你能使用 vercel_list_deployments 工具吗？
```

如果配置正确，Kimi 会返回可用工具列表。

---

## Step 4: 安全建议

### ✅ 应该做的

1. **定期轮换 Token**
   - Vercel: 每 3 个月重新生成
   - GitHub: 设置过期时间或定期更换

2. **限制 Token 权限**
   - GitHub Token 只勾选必要的 `repo` 权限
   - Vercel Token 使用最小权限

3. **监控使用**
   - 定期查看 GitHub Security Log
   - 查看 Vercel 审计日志

4. **本地存储**
   - 使用 `.env.local` 存储敏感信息
   - 确保 `.env.local` 在 `.gitignore` 中

### ❌ 不应该做的

1. **不要提交 Token 到 Git**
   ```bash
   # 危险！不要这样做
   git add .env.local
   git commit -m "添加配置"
   ```

2. **不要分享 Token**
   - 不要在聊天中发送 Token
   - 不要在公开平台展示

3. **不要使用永久 Token**
   - 设置过期时间
   - 定期更换

---

## 如果 Token 泄露了

### 立即执行：

1. **撤销 Token**
   - Vercel: https://vercel.com/account/tokens → 删除
   - GitHub: https://github.com/settings/tokens → 删除

2. **生成新 Token**
   - 按照上述步骤重新生成
   - 更新配置文件

3. **检查异常活动**
   - 查看 GitHub Security Log
   - 查看 Vercel 部署历史

4. **轮换其他凭证**
   - 如果使用了相同密码的其他服务，一并更换

---

## 快速配置检查

运行以下命令验证配置：

```powershell
# Windows PowerShell
Write-Host "=== 配置检查 ===" -ForegroundColor Cyan

# 检查 Kimi 配置
$configPath = "$env:USERPROFILE\.kimi\config.json"
if (Test-Path $configPath) {
    Write-Host "✓ Kimi 配置文件存在" -ForegroundColor Green
    $config = Get-Content $configPath | ConvertFrom-Json
    if ($config.mcpServers.vercel) {
        Write-Host "✓ Vercel MCP 已配置" -ForegroundColor Green
    }
    if ($config.mcpServers.github) {
        Write-Host "✓ GitHub MCP 已配置" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Kimi 配置文件不存在" -ForegroundColor Red
}

# 检查 .env.local
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local 存在" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local 不存在（创建中...）" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
}

# 检查 .gitignore
if (Select-String -Path ".gitignore" -Pattern "\.env" -Quiet) {
    Write-Host "✓ .gitignore 已配置" -ForegroundColor Green
} else {
    Write-Host "✗ .gitignore 未配置" -ForegroundColor Red
}

Write-Host "`n=== 下一步 ===" -ForegroundColor Cyan
Write-Host "1. 编辑 ~/.kimi/config.json 添加 Token"
Write-Host "2. 编辑 .env.local 添加项目环境变量"
Write-Host "3. 重启 Kimi"
Write-Host "4. 测试: 问 Kimi '你能使用 vercel_list_deployments 吗'"
```

---

## 配置文件位置速查

| 文件 | Windows 路径 | macOS/Linux 路径 |
|------|-------------|------------------|
| Kimi 配置 | `%USERPROFILE%\.kimi\config.json` | `~/.kimi/config.json` |
| 项目环境变量 | `.env.local` (项目根目录) | `.env.local` (项目根目录) |
| Git 配置 | `%USERPROFILE%\.gitconfig` | `~/.gitconfig` |

---

## 完成后

配置完成后，在 Kimi 中：

```
你: 请检查配置

Kimi: 
   检查 MCP 工具:
   - Vercel: ✅ 可用
   - GitHub: ✅ 可用
   
   检查 Git:
   - 仓库: ✅ 已初始化
   - 远程: ✅ 已配置
   
   可以开始开发了！
```
