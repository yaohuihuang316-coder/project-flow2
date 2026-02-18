# 国内可用工作流指南

> 由于 Claude Code 在国内无法连接，使用以下替代方案

---

## 推荐工作流

### 方式 1: VS Code + Kimi 插件（最佳体验）

1. **安装 Kimi VS Code 插件**
   - 打开 VS Code
   - 扩展 → 搜索 "Kimi" → 安装

2. **配置 API Key**
   - `Ctrl+Shift+P` → `Kimi: 设置 API Key`
   - 从 https://platform.moonshot.cn/ 获取

3. **开发流程**
   ```
   在 VS Code 写代码
        ↓
   选中代码 → 右键 → "询问 Kimi"
        ↓
   Kimi 给出建议
        ↓
   应用修改
        ↓
   运行 .\deploy.ps1 "提交信息"
        ↓
   浏览器验证
   ```

---

### 方式 2: Kimi 网页版 + 本地开发（简单直接）

1. **写代码**
   - 访问 https://kimi.moonshot.cn
   - 描述需求，让 Kimi 生成代码
   - 复制代码到项目文件

2. **本地测试**
   ```bash
   npm run dev      # 本地预览
   npm run build    # 构建测试
   ```

3. **一键部署**
   ```powershell
   .\deploy.ps1 "feat: 添加登录功能"
   ```

4. **浏览器验证**
   - 访问返回的预览链接
   - 截图反馈问题
   - 回到步骤 1 修复

---

## 可用脚本

### 1. deploy.ps1 - 一键部署

```powershell
# 提交并部署
.\deploy.ps1 "feat: 实现用户登录"

# 功能：
# - 运行类型检查
# - 运行构建测试
# - git add / commit / push
# - vercel 部署
# - 返回预览链接
# - 生成部署记录
```

### 2. 本地检查

```powershell
# 完整检查
npm run lint && npx tsc --noEmit && npm run build

# 快速构建
npm run build
```

### 3. Git 操作

```powershell
# 手动提交
git add .
git commit -m "feat: xxx"
git push

# 或运行脚本
node scripts/auto-commit.js feat "描述"
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `.kimi-rules` | AI 工作流规则（给 Kimi 看） |
| `task.json` | 任务清单 |
| `deploy.ps1` | 一键部署脚本 |
| `scripts/auto-commit.js` | 自动提交脚本 |
| `docs/changes/` | 变更记录 |
| `docs/deploys/` | 部署记录 |

---

## 快速开始

### 第 1 次使用

```powershell
cd "E:\毕业\project-flow2"

# 1. 安装依赖
npm install

# 2. 安装 Vercel CLI
npm install -g vercel

# 3. 启动开发服务器
npm run dev
```

### 开发迭代

```powershell
# 1. 修改代码（使用 Kimi 辅助）
# ...

# 2. 一键部署
.\deploy.ps1 "feat: 添加新功能"

# 3. 浏览器验证
# 访问返回的链接

# 4. 有问题？在 Kimi 中贴出代码和错误
# "这个组件渲染有问题，帮我修复"

# 5. 重复步骤 1-4
```

---

## 提示词模板

### 给 Kimi 的标准开场白

```
请按照以下规则帮我开发：

1. 先阅读项目中的 .kimi-rules 文件
2. 查看 task.json 了解当前任务
3. 检查 src/types/database.ts 了解数据结构
4. 按工作流执行：分析 → 设计 → 等待确认 → 实现

当前任务：[描述你的需求]
```

### 修复问题

```
页面出现了以下问题：
- 问题描述：
- 截图/代码：
- 期望效果：

请帮我修复，保持原有代码风格。
```

---

## 故障排除

### 部署失败

```powershell
# 检查错误
vercel --logs

# 本地先测试构建
npm run build
```

### 类型错误

```powershell
# 检查类型
npx tsc --noEmit
```

### Git 问题

```powershell
# 检查状态
git status

# 强制推送（慎用）
git push -f origin main
```

---

## 联系方式

如有问题：
1. 查看 `docs/deploys/` 下的部署记录
2. 检查 Vercel Dashboard: https://vercel.com/dashboard
3. 重新运行 `deploy.ps1`
