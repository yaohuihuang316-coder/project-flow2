#!/usr/bin/env node

/**
 * 自动提交脚本
 * 生成 commit message、执行提交、创建变更文档
 * 
 * 用法: node scripts/auto-commit.js [type] [description]
 * 示例: node scripts/auto-commit.js feat "实现用户登录功能"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`
};

// 执行 shell 命令
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

// 检查 git 状态
function getGitStatus() {
  try {
    const status = exec('git status --porcelain', { silent: true }) || '';
    const lines = status.trim().split('\n').filter(Boolean);
    
    const files = {
      added: [],
      modified: [],
      deleted: [],
      untracked: []
    };
    
    for (const line of lines) {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3);
      
      if (statusCode.includes('A')) files.added.push(file);
      else if (statusCode.includes('D')) files.deleted.push(file);
      else if (statusCode.includes('M')) files.modified.push(file);
      else if (statusCode.includes('??')) files.untracked.push(file);
    }
    
    return files;
  } catch (error) {
    return null;
  }
}

// 获取 git diff 统计
function getDiffStats() {
  try {
    const stats = exec('git diff --stat HEAD', { silent: true }) || '';
    return stats.trim();
  } catch (error) {
    return '';
  }
}

// 获取最近的 commit 信息
function getLastCommit() {
  try {
    const hash = exec('git rev-parse --short HEAD', { silent: true })?.trim();
    const message = exec('git log -1 --pretty=%B', { silent: true })?.trim();
    return { hash, message };
  } catch (error) {
    return null;
  }
}

// 生成变更文档
function generateChangeDoc(type, description, files, stats) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  
  // 创建 docs/changes 目录
  const docsDir = path.join(process.cwd(), 'docs', 'changes');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // 生成文件名
  const safeDesc = description.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 30);
  const filename = `${dateStr.replace(/-/g, '')}-${timeStr.replace(/:/g, '')}-${safeDesc}.md`;
  const filepath = path.join(docsDir, filename);
  
  // 获取 commit hash（提交后）
  const commitInfo = getLastCommit();
  
  // 构建文档内容
  const content = `# 变更记录: ${description}

## 基本信息

- **日期**: ${dateStr} ${timeStr}
- **Commit**: ${commitInfo?.hash || '待生成'}
- **类型**: ${type}
- **描述**: ${description}

---

## 实现内容

### ${getTypeLabel(type)}
${description}

### 涉及文件

**新增文件 (${files.added.length} 个)**:  
${files.added.map(f => `- \\`\\`${f}\\`\\``).join('\n') || '- 无'}

**修改文件 (${files.modified.length} 个)**:  
${files.modified.map(f => `- \\`\\`${f}\\`\\``).join('\n') || '- 无'}

**删除文件 (${files.deleted.length} 个)**:  
${files.deleted.map(f => `- \\`\\`${f}\\`\\``).join('\n') || '- 无'}

**未跟踪文件 (${files.untracked.length} 个)**:  
${files.untracked.map(f => `- \\`\\`${f}\\`\\``).join('\n') || '- 无'}

---

## 变更统计

\`\`\`\n${stats || '无统计数据'}
\`\`\`

---

## 验证步骤

### 前置条件
- [ ] 环境已配置
- [ ] 依赖已安装: \\`npm install\\`

### 代码验证
- [ ] TypeScript 类型检查: \\`npx tsc --noEmit\\`
- [ ] Lint 检查: \\`npm run lint\\`
- [ ] 构建测试: \\`npm run build\\`

### 功能验证
- [ ] 启动开发服务器: \\`npm run dev\\`
- [ ] 访问 http://localhost:5173
- [ ] 验证功能正常

---

## 如何验证本次变更

\`\`\`bash
# 1. 查看变更
git show ${commitInfo?.hash || 'HEAD'}

# 2. 检查文件
git diff HEAD~1 --name-only

# 3. 本地测试
npm run dev
\`\`\`

---

## 回滚方法

如需撤销本次提交：

\`\`\`bash
# 方式 1: 撤销 commit，保留修改
git reset --soft HEAD~1

# 方式 2: 完全回滚到上一个版本（谨慎！）
git reset --hard HEAD~1

# 方式 3: 创建反向提交
git revert ${commitInfo?.hash || 'HEAD'}
\`\`\`

---

## 备注

- 本次提交由 AI 辅助生成
- 生成时间: ${now.toISOString()}
- 如有问题请及时反馈
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  
  return { filepath, filename };
}

// 获取类型标签
function getTypeLabel(type) {
  const labels = {
    feat: '✨ 新增功能',
    fix: '🐛 Bug 修复',
    docs: '📝 文档更新',
    style: '💄 代码格式',
    refactor: '♻️ 代码重构',
    test: '✅ 测试相关',
    chore: '🔧 构建/工具'
  };
  return labels[type] || '📦 其他变更';
}

// 生成 commit message
function generateCommitMessage(type, description, files) {
  const scope = detectScope(files);
  const scopeStr = scope ? `(${scope})` : '';
  
  let message = `${type}${scopeStr}: ${description}\n\n`;
  
  // 添加变更详情
  const changes = [];
  if (files.added.length > 0) {
    changes.push(`新增:\n${files.added.map(f => `- ${f}`).join('\n')}`);
  }
  if (files.modified.length > 0) {
    changes.push(`修改:\n${files.modified.map(f => `- ${f}`).join('\n')}`);
  }
  if (files.deleted.length > 0) {
    changes.push(`删除:\n${files.deleted.map(f => `- ${f}`).join('\n')}`);
  }
  
  if (changes.length > 0) {
    message += changes.join('\n\n') + '\n';
  }
  
  return message.trim();
}

// 检测 scope
function detectScope(files) {
  const allFiles = [...files.added, ...files.modified, ...files.deleted];
  const scopes = {};
  
  for (const file of allFiles) {
    const parts = file.split('/');
    if (parts.length > 1) {
      const scope = parts[0];
      scopes[scope] = (scopes[scope] || 0) + 1;
    }
  }
  
  // 返回出现次数最多的 scope
  const sorted = Object.entries(scopes).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

// 主函数
function main() {
  console.log(colors.blue('\n🚀 自动提交工具\n'));
  
  // 参数解析
  const type = process.argv[2] || 'feat';
  const description = process.argv[3] || '自动提交';
  
  // 1. 检查 git 仓库
  if (!fs.existsSync('.git')) {
    console.log(colors.red('❌ 当前目录不是 git 仓库'));
    console.log(colors.yellow('请先执行: git init'));
    process.exit(1);
  }
  
  // 2. 检查变更
  const files = getGitStatus();
  if (!files) {
    console.log(colors.red('❌ 无法获取 git 状态'));
    process.exit(1);
  }
  
  const totalChanges = files.added.length + files.modified.length + 
                       files.deleted.length + files.untracked.length;
  
  if (totalChanges === 0) {
    console.log(colors.yellow('⚠️ 没有检测到文件变更'));
    console.log(colors.gray('提示: 先修改文件再提交'));
    process.exit(0);
  }
  
  // 3. 显示变更摘要
  console.log(colors.blue('📦 变更摘要\n'));
  console.log(`${colors.green('新增')}: ${files.added.length} 个文件`);
  console.log(`${colors.yellow('修改')}: ${files.modified.length} 个文件`);
  console.log(`${colors.red('删除')}: ${files.deleted.length} 个文件`);
  console.log(`${colors.gray('未跟踪')}: ${files.untracked.length} 个文件`);
  console.log();
  
  // 4. 生成 commit message
  const commitMessage = generateCommitMessage(type, description, files);
  
  console.log(colors.blue('📝 生成的 Commit Message:\n'));
  console.log(colors.cyan('─'.repeat(50)));
  console.log(commitMessage);
  console.log(colors.cyan('─'.repeat(50)));
  console.log();
  
  // 5. 执行提交
  console.log(colors.blue('⏳ 执行提交...\n'));
  
  try {
    // git add
    exec('git add .', { silent: true });
    console.log(colors.green('✓ git add .'));
    
    // git commit
    const commitFile = path.join(require('os').tmpdir(), 'commit-msg.txt');
    fs.writeFileSync(commitFile, commitMessage, 'utf-8');
    exec(`git commit -F "${commitFile}"`, { silent: true });
    fs.unlinkSync(commitFile);
    
    console.log(colors.green('✓ git commit'));
    console.log();
    
  } catch (error) {
    console.log(colors.red('❌ 提交失败'));
    console.log(colors.red(error.message));
    process.exit(1);
  }
  
  // 6. 获取 diff 统计
  const stats = getDiffStats();
  
  // 7. 生成变更文档
  console.log(colors.blue('📝 生成变更文档...\n'));
  
  const doc = generateChangeDoc(type, description, files, stats);
  
  console.log(colors.green(`✓ 文档已创建: ${doc.filename}`));
  console.log(colors.gray(`  路径: ${doc.filepath}`));
  console.log();
  
  // 8. 获取提交信息
  const commitInfo = getLastCommit();
  
  // 9. 输出完成报告
  console.log(colors.green('✅ 提交完成！\n'));
  console.log(colors.blue('提交信息:'));
  console.log(`  Hash: ${colors.cyan(commitInfo?.hash || 'unknown')}`);
  console.log(`  Message: ${description}`);
  console.log();
  console.log(colors.blue('生成的文档:'));
  console.log(`  ${doc.filepath}`);
  console.log();
  
  // 10. 提示下一步
  console.log(colors.blue('可用命令:'));
  console.log(`  查看提交: ${colors.cyan(`git show ${commitInfo?.hash}`)}`);
  console.log(`  查看文档: ${colors.cyan(`code "${doc.filepath}"`)}`);
  console.log(`  推送到远程: ${colors.cyan('git push')}`);
  console.log();
}

// 运行
main();
