#!/usr/bin/env pwsh

<#
.SYNOPSIS
    一键部署脚本 - 提交代码并部署到 Vercel
.DESCRIPTION
    自动执行：git add → commit → push → vercel deploy
.EXAMPLE
    .\deploy.ps1 "feat: 添加登录功能"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [string]$Token = $env:VERCEL_TOKEN
)

# 颜色输出
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error($msg) { Write-Host "[ERR] $msg" -ForegroundColor Red }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Host "`n🚀 一键部署脚本`n" -ForegroundColor Blue
Write-Host "============================`n" -ForegroundColor Blue

# Step 1: 检查环境
Write-Info "检查环境..."

if (-not (Test-Path ".git")) {
    Write-Error "当前目录不是 Git 仓库"
    Write-Host "请运行: git init" -ForegroundColor Yellow
    exit 1
}

# Step 2: 本地检查
Write-Info "运行本地检查..."

try {
    npm run lint 2>$null
    Write-Success "Lint 检查通过"
} catch {
    Write-Warn "Lint 检查失败（非阻塞）"
}

try {
    npx tsc --noEmit 2>$null
    Write-Success "TypeScript 检查通过"
} catch {
    Write-Error "TypeScript 检查失败，请修复类型错误"
    exit 1
}

try {
    npm run build 2>$null
    Write-Success "构建成功"
} catch {
    Write-Error "构建失败，请修复错误"
    exit 1
}

# Step 3: Git 提交
Write-Info "提交代码..."

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Error "git add 失败"
    exit 1
}

git commit -m "$Message"
if ($LASTEXITCODE -ne 0) {
    Write-Warn "没有变更需要提交，或提交失败"
}

$branch = git rev-parse --abbrev-ref HEAD
git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Error "git push 失败"
    exit 1
}

Write-Success "代码已推送到远程"

# Step 4: Vercel 部署
Write-Info "开始 Vercel 部署..."

# 检查 Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Info "安装 Vercel CLI..."
    npm install -g vercel
}

# 部署
Write-Host "`n正在部署到 Vercel..." -ForegroundColor Cyan
$env:VERCEL_TOKEN = $Token
vercel --token $Token --yes

if ($LASTEXITCODE -ne 0) {
    Write-Error "Vercel 部署失败"
    exit 1
}

Write-Success "部署成功！"

# Step 5: 获取预览链接
Write-Info "获取预览链接..."

$deployment = vercel ls --token $Token --json | ConvertFrom-Json | Select-Object -First 1
if ($deployment) {
    $url = $deployment.url
    Write-Host "`n============================" -ForegroundColor Green
    Write-Host "🌐 预览链接:" -ForegroundColor Green
    Write-Host "   https://$url" -ForegroundColor Cyan
    Write-Host "============================`n" -ForegroundColor Green
    
    # 打开浏览器（可选）
    $open = Read-Host "是否打开浏览器? (y/n)"
    if ($open -eq "y") {
        Start-Process "https://$url"
    }
}

# Step 6: 生成部署记录
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$docsDir = "docs\deploys"
if (-not (Test-Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
}

$docContent = @"
# 部署记录: $Message

- **时间**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Commit**: $(git rev-parse --short HEAD)
- **消息**: $Message
- **预览链接**: https://$url

## 验证清单

- [ ] 页面正常加载
- [ ] 功能正常
- [ ] 无控制台错误

## 反馈

记录用户反馈和修复...
"@

$docPath = "$docsDir\$timestamp-deploy.md"
$docContent | Out-File -FilePath $docPath -Encoding UTF8

Write-Success "部署记录已保存: $docPath"

Write-Host "`n✅ 全部完成！" -ForegroundColor Green
Write-Host "请在浏览器中验证，如有问题告诉我。`n" -ForegroundColor Cyan
