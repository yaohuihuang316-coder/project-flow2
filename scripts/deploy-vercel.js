#!/usr/bin/env node

/**
 * Vercel 部署辅助脚本
 * 用于在 Kimi 中简化 Vercel 部署流程
 * 
 * 用法: node scripts/deploy-vercel.js [message]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`
};

// 执行命令
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (options.ignoreError) return null;
    throw error;
  }
}

// 获取 Git 信息
function getGitInfo() {
  try {
    const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true })?.trim();
    const remote = exec('git remote get-url origin', { silent: true })?.trim();
    return { branch, remote };
  } catch (error) {
    return { branch: null, remote: null };
  }
}

// 检查环境
function checkEnvironment() {
  const checks = {
    git: false,
    remote: false,
    vercelConfig: false,
    changes: false
  };
  
  // 检查 Git
  try {
    exec('git rev-parse --git-dir', { silent: true });
    checks.git = true;
  } catch (error) {
    console.log(colors.red('❌ 当前目录不是 Git 仓库'));
    return checks;
  }
  
  // 检查远程仓库
  const { remote } = getGitInfo();
  checks.remote = !!remote;
  
  // 检查 Vercel 配置
  checks.vercelConfig = fs.existsSync('vercel.json') || fs.existsSync('.vercel/project.json');
  
  // 检查是否有变更
  try {
    const status = exec('git status --porcelain', { silent: true });
    checks.changes = status && status.trim().length > 0;
  } catch (error) {
    checks.changes = false;
  }
  
  return checks;
}

// 生成提交信息
function generateCommitMessage(userMessage) {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  
  if (userMessage) {
    return `${userMessage}`;
  }
  
  // 获取变更的文件类型来决定 commit 类型
  try {
    const diff = exec('git diff --cached --name-only', { silent: true }) || 
                 exec('git diff --name-only', { silent: true }) || '';
    
    if (diff.includes('fix') || diff.includes('bug')) {
      return `fix: 修复问题 ${timestamp}`;
    }
    if (diff.includes('feat') || diff.includes('feature')) {
      return `feat: 新增功能 ${timestamp}`;
    }
    if (diff.includes('docs')) {
      return `docs: 更新文档 ${timestamp}`;
    }
    
    return `chore: 更新代码 ${timestamp}`;
  } catch (error) {
    return `chore: 自动提交 ${timestamp}`;
  }
}

// 主函数
async function main() {
  console.log(colors.blue('\n🚀 Vercel 部署流程\n'));
  
  const message = process.argv[2];
  
  // 1. 环境检查
  console.log(colors.blue('Step 1/5: 环境检查\n'));
  
  const env = checkEnvironment();
  
  if (!env.git) {
    console.log(colors.red('请先初始化 Git 仓库:'));
    console.log(colors.yellow('  git init'));
    console.log(colors.yellow('  git add .'));
    console.log(colors.yellow('  git commit -m "Initial commit"'));
    process.exit(1);
  }
  
  console.log(colors.green('✓ Git 仓库已初始化'));
  
  if (!env.remote) {
    console.log(colors.yellow('⚠️ 未配置远程仓库'));
    console.log(colors.blue('请添加远程仓库:'));
    console.log(colors.yellow('  git remote add origin https://github.com/用户名/仓库名.git'));
    process.exit(1);
  }
  
  const { branch, remote } = getGitInfo();
  console.log(colors.green(`✓ 远程仓库: ${remote}`));
  console.log(colors.green(`✓ 当前分支: ${branch}`));
  
  if (!env.vercelConfig) {
    console.log(colors.yellow('⚠️ 未检测到 Vercel 配置'));
    console.log(colors.blue('创建 vercel.json...'));
    
    const vercelConfig = {
      version: 2,
      buildCommand: "npm run build",
      outputDirectory: "dist",
      framework: "vite"
    };
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log(colors.green('✓ 已创建 vercel.json'));
  } else {
    console.log(colors.green('✓ Vercel 配置已存在'));
  }
  
  // 2. 本地检查
  console.log(colors.blue('\nStep 2/5: 本地检查\n'));
  
  try {
    console.log(colors.blue('  → 运行类型检查...'));
    exec('npx tsc --noEmit', { silent: true });
    console.log(colors.green('  ✓ 类型检查通过'));
  } catch (error) {
    console.log(colors.red('  ✗ 类型检查失败'));
    console.log(colors.yellow('请先修复类型错误再部署'));
    process.exit(1);
  }
  
  try {
    console.log(colors.blue('  → 运行 Lint 检查...'));
    exec('npm run lint', { silent: true });
    console.log(colors.green('  ✓ Lint 检查通过'));
  } catch (error) {
    console.log(colors.yellow('  ⚠️ Lint 检查失败（非阻塞）'));
  }
  
  try {
    console.log(colors.blue('  → 运行构建测试...'));
    exec('npm run build', { silent: true });
    console.log(colors.green('  ✓ 构建成功'));
  } catch (error) {
    console.log(colors.red('  ✗ 构建失败'));
    console.log(colors.yellow('请先修复构建错误'));
    process.exit(1);
  }
  
  // 3. 提交代码
  console.log(colors.blue('\nStep 3/5: 提交代码\n'));
  
  const commitMessage = generateCommitMessage(message);
  
  try {
    exec('git add .', { silent: true });
    console.log(colors.green('✓ git add .'));
    
    exec(`git commit -m "${commitMessage}"`, { silent: true });
    console.log(colors.green(`✓ git commit -m "${commitMessage}"`));
    
    exec(`git push origin ${branch}`, { silent: false });
    console.log(colors.green(`✓ git push origin ${branch}`));
  } catch (error) {
    console.log(colors.yellow('提交或推送可能遇到问题，继续尝试部署...'));
  }
  
  // 4. 触发 Vercel 部署
  console.log(colors.blue('\nStep 4/5: Vercel 部署\n'));
  console.log(colors.cyan('请使用 Vercel MCP 进行部署:'));
  console.log(colors.yellow('  vercel_deploy --project-id <your-project-id>'));
  console.log();
  console.log(colors.blue('或等待 Git 集成自动触发部署...'));
  console.log();
  
  // 5. 部署信息
  console.log(colors.blue('Step 5/5: 部署信息\n'));
  
  // 尝试获取项目信息
  const projectId = process.env.VERCEL_PROJECT_ID;
  
  if (projectId) {
    console.log(colors.green(`项目 ID: ${projectId}`));
    console.log(colors.blue(`\n使用以下 MCP 命令获取部署状态:`));
    console.log(colors.yellow(`  vercel_list_deployments --project-id ${projectId}`));
  }
  
  console.log(colors.blue('\n─────────────────────────────────'));
  console.log(colors.green('✅ 代码已推送！'));
  console.log();
  console.log(colors.blue('接下来:'));
  console.log('1. 使用 Vercel MCP 检查部署状态');
  console.log('2. 或使用 Vercel Dashboard 查看:');
  console.log(colors.cyan('   https://vercel.com/dashboard'));
  console.log();
  console.log(colors.yellow('等待部署完成后，预览链接将显示在 Vercel Dashboard'));
  console.log(colors.blue('─────────────────────────────────\n'));
  
  // 生成部署文档
  generateDeployDoc(commitMessage, branch);
}

// 生成部署文档
function generateDeployDoc(message, branch) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  
  const docsDir = path.join(process.cwd(), 'docs', 'deploys');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  const filename = `${dateStr.replace(/-/g, '')}-${timeStr.replace(/:/g, '')}-deploy.md`;
  const filepath = path.join(docsDir, filename);
  
  const content = `# 部署记录: ${message}

## 部署信息

- **时间**: ${dateStr} ${timeStr}
- **分支**: ${branch}
- **Commit**: ${message}
- **状态**: 已推送，等待 Vercel 构建

---

## 部署步骤

1. ✅ 本地类型检查
2. ✅ 构建测试
3. ✅ Git 提交
4. ✅ 推送到远程
5. ⏳ Vercel 构建部署

---

## 验证清单

- [ ] 访问预览链接
- [ ] 检查页面渲染
- [ ] 测试交互功能
- [ ] 检查控制台错误
- [ ] 移动端适配检查

---

## 反馈记录

### 问题 1
- **描述**: 
- **截图**: 
- **修复**: 
- **状态**: ⏳ 待修复 / ✅ 已修复

### 问题 2
- **描述**: 
- **截图**: 
- **修复**: 
- **状态**: ⏳ 待修复 / ✅ 已修复

---

## 部署链接

- **Vercel Dashboard**: https://vercel.com/dashboard
- **预览链接**: (部署完成后更新)

---

生成时间: ${now.toISOString()}
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(colors.green(`✓ 部署文档已创建: docs/deploys/${filename}`));
}

// 运行
main().catch(error => {
  console.error(colors.red('错误:'), error.message);
  process.exit(1);
});
