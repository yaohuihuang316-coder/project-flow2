#!/usr/bin/env node

/**
 * Supabase 数据库类型检查工具
 * 检查代码中的数据库操作是否与类型定义一致
 * 
 * 用法: node db-type-check.js <文件路径>
 */

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

// 查找类型定义文件
function findTypeDefinition() {
  const possiblePaths = [
    'src/types/database.ts',
    'src/types/supabase.ts',
    'types/database.ts',
    'types/supabase.ts',
    'database.types.ts',
    'supabase/functions/types.ts',
    'app/types/database.ts'
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// 解析类型定义（简化版）
function parseTypeDefinition(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tables = {};
  
  // 提取 Tables 定义
  const tablesMatch = content.match(/Tables:\s*\{([\s\S]*?)(?=Views:|Functions:|Enums:|$)/);
  if (!tablesMatch) {
    return tables;
  }
  
  const tablesContent = tablesMatch[1];
  
  // 提取每个表的定义
  const tableRegex = /(\w+):\s*\{\s*Row:\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = tableRegex.exec(tablesContent)) !== null) {
    const tableName = match[1];
    const fieldsStr = match[2];
    
    const fields = {};
    
    // 解析字段: fieldName: type | null
    const fieldRegex = /(\w+)(\?)?:\s*([^;\n]+)/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(fieldsStr)) !== null) {
      const fieldName = fieldMatch[1];
      const isOptional = fieldMatch[2] === '?';
      const fieldType = fieldMatch[3].trim();
      const isNullable = fieldType.includes('null');
      
      fields[fieldName] = {
        type: fieldType,
        required: !isOptional && !isNullable
      };
    }
    
    tables[tableName] = fields;
  }
  
  return tables;
}

// 计算编辑距离（找相似字符串）
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1] 
        ? matrix[i-1][j-1]
        : Math.min(
            matrix[i-1][j-1] + 1,
            matrix[i][j-1] + 1,
            matrix[i-1][j] + 1
          );
    }
  }
  return matrix[b.length][a.length];
}

// 查找相似表名
function findSimilarTable(input, tables) {
  const tableNames = Object.keys(tables);
  
  // 完全匹配（忽略大小写）
  const exactMatch = tableNames.find(t => t.toLowerCase() === input.toLowerCase());
  if (exactMatch) return exactMatch;
  
  // 编辑距离 <= 2
  const similar = tableNames.filter(t => levenshteinDistance(t, input) <= 2);
  if (similar.length > 0) return similar[0];
  
  // 包含关系
  const contained = tableNames.find(t => t.includes(input) || input.includes(t));
  if (contained) return contained;
  
  return null;
}

// 查找相似字段
function findSimilarField(input, fields) {
  const fieldNames = Object.keys(fields);
  
  // 完全匹配（忽略大小写）
  const exactMatch = fieldNames.find(f => f.toLowerCase() === input.toLowerCase());
  if (exactMatch) return exactMatch;
  
  // 编辑距离 <= 2
  const similar = fieldNames.filter(f => levenshteinDistance(f, input) <= 2);
  if (similar.length > 0) return similar[0];
  
  return null;
}

// 检查代码中的数据库操作
function checkCodeFile(filePath, tables) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const lines = content.split('\n');
  
  // 匹配 supabase.from('table').operation({...})
  const supabaseRegex = /\.from\(['"](\w+)['"]\)\s*\.(insert|update|upsert)\s*\(/g;
  
  // 匹配 prisma.table.operation
  const prismaRegex = /prisma\.(\w+)\.(create|update|upsert)\s*\(/g;
  
  let match;
  
  // 检查 Supabase 操作
  while ((match = supabaseRegex.exec(content)) !== null) {
    const tableName = match[1];
    const operation = match[2];
    const matchIndex = match.index;
    
    // 找到行号
    const lineNum = content.substring(0, matchIndex).split('\n').length;
    
    // 检查表是否存在
    if (!tables[tableName]) {
      const suggestion = findSimilarTable(tableName, tables);
      
      issues.push({
        type: 'table_not_found',
        line: lineNum,
        table: tableName,
        operation,
        suggestion,
        code: lines[lineNum - 1]?.trim()
      });
      continue;
    }
    
    const tableSchema = tables[tableName];
    
    // 提取操作的数据对象（简化处理，找接下来的 { ... }）
    const afterMatch = content.substring(matchIndex + match[0].length);
    const dataMatch = afterMatch.match(/^\s*\{([^}]*)\}/);
    
    if (dataMatch) {
      const dataStr = dataMatch[1];
      
      // 提取字段名
      const fieldRegex = /(\w+)\s*:/g;
      let fieldMatch;
      const usedFields = [];
      
      while ((fieldMatch = fieldRegex.exec(dataStr)) !== null) {
        usedFields.push(fieldMatch[1]);
      }
      
      // 检查每个字段
      for (const field of usedFields) {
        if (!tableSchema[field]) {
          const suggestion = findSimilarField(field, tableSchema);
          
          issues.push({
            type: 'field_not_found',
            line: lineNum,
            table: tableName,
            field,
            operation,
            suggestion,
            code: lines[lineNum - 1]?.trim()
          });
        }
      }
      
      // insert 操作检查必填字段
      if (operation === 'insert' || operation === 'create') {
        const requiredFields = Object.entries(tableSchema)
          .filter(([_, info]) => info.required)
          .map(([name]) => name);
        
        const missing = requiredFields.filter(f => !usedFields.includes(f));
        
        if (missing.length > 0) {
          issues.push({
            type: 'missing_required',
            line: lineNum,
            table: tableName,
            fields: missing,
            operation,
            code: lines[lineNum - 1]?.trim()
          });
        }
      }
    }
  }
  
  // 检查 Prisma 操作
  while ((match = prismaRegex.exec(content)) !== null) {
    const tableName = match[1];
    const operation = match[2];
    const matchIndex = match.index;
    const lineNum = content.substring(0, matchIndex).split('\n').length;
    
    // Prisma 表名通常是驼峰，需要转换
    const normalizedTable = tableName.toLowerCase();
    const actualTable = Object.keys(tables).find(t => 
      t.toLowerCase() === normalizedTable ||
      t.toLowerCase() === normalizedTable + 's'
    );
    
    if (!actualTable) {
      issues.push({
        type: 'prisma_table_not_found',
        line: lineNum,
        table: tableName,
        operation,
        code: lines[lineNum - 1]?.trim()
      });
    }
  }
  
  return issues;
}

// 生成修复建议
function generateFix(issues, originalCode) {
  let fixedCode = originalCode;
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'table_not_found':
        if (issue.suggestion) {
          fixedCode = fixedCode.replace(
            new RegExp(`from\\(['"]${issue.table}['"]\\)`, 'g'),
            `from('${issue.suggestion}')`
          );
        }
        break;
        
      case 'field_not_found':
        if (issue.suggestion) {
          fixedCode = fixedCode.replace(
            new RegExp(`\\b${issue.field}\\b:`, 'g'),
            `${issue.suggestion}:`
          );
        }
        break;
    }
  }
  
  return fixedCode;
}

// 主函数
function main() {
  console.log(colors.blue('🔍 Supabase 数据库类型检查\n'));
  
  // 1. 找类型定义
  const typeFile = findTypeDefinition();
  if (!typeFile) {
    console.log(colors.red('❌ 未找到类型定义文件'));
    console.log(colors.yellow('期望位置:'));
    console.log('  - src/types/database.ts');
    console.log('  - types/database.ts');
    console.log('  - database.types.ts');
    process.exit(1);
  }
  
  console.log(colors.green(`✓ 找到类型定义: ${typeFile}`));
  
  // 2. 解析类型
  const tables = parseTypeDefinition(typeFile);
  const tableNames = Object.keys(tables);
  
  if (tableNames.length === 0) {
    console.log(colors.yellow('⚠️ 未解析到表定义，请检查类型文件格式'));
    process.exit(1);
  }
  
  console.log(colors.green(`✓ 解析到 ${tableNames.length} 个表: ${tableNames.join(', ')}\n`));
  
  // 3. 检查代码文件
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.log(colors.yellow('用法: node db-type-check.js <文件路径>'));
    console.log(colors.yellow('示例: node db-type-check.js src/api/users.ts'));
    process.exit(1);
  }
  
  if (!fs.existsSync(targetFile)) {
    console.log(colors.red(`❌ 文件不存在: ${targetFile}`));
    process.exit(1);
  }
  
  console.log(colors.blue(`检查文件: ${targetFile}\n`));
  
  const originalCode = fs.readFileSync(targetFile, 'utf-8');
  const issues = checkCodeFile(targetFile, tables);
  
  // 4. 输出结果
  if (issues.length === 0) {
    console.log(colors.green('✅ 所有数据库操作类型检查通过！\n'));
    process.exit(0);
  }
  
  console.log(colors.red(`🛑 发现 ${issues.length} 个问题:\n`));
  
  for (const issue of issues) {
    const lineInfo = colors.cyan(`[行 ${issue.line}]`);
    
    switch (issue.type) {
      case 'table_not_found':
        console.log(`${colors.red('❌')} ${lineInfo} 表 '${colors.yellow(issue.table)}' 不存在`);
        if (issue.suggestion) {
          console.log(colors.green(`   建议: 是否应为 '${issue.suggestion}'?`));
        }
        break;
        
      case 'field_not_found':
        console.log(`${colors.red('❌')} ${lineInfo} 表 '${issue.table}' 中字段 '${colors.yellow(issue.field)}' 不存在`);
        if (issue.suggestion) {
          console.log(colors.green(`   建议: 是否应为 '${issue.suggestion}'?`));
        }
        break;
        
      case 'missing_required':
        console.log(`${colors.red('❌')} ${lineInfo} 表 '${issue.table}' ${issue.operation} 操作缺少必填字段:`);
        console.log(colors.yellow(`   ${issue.fields.join(', ')}`));
        break;
        
      case 'prisma_table_not_found':
        console.log(`${colors.red('❌')} ${lineInfo} Prisma 模型 '${issue.table}' 未找到对应的数据库表`);
        break;
    }
    
    if (issue.code) {
      console.log(colors.blue(`   代码: ${issue.code.substring(0, 80)}`));
    }
    console.log('');
  }
  
  // 5. 生成修复建议
  const fixedCode = generateFix(issues, originalCode);
  if (fixedCode !== originalCode) {
    console.log(colors.blue('💡 修复建议（部分问题可自动修复）:\n'));
    console.log(colors.cyan('--- 修复后代码片段 ---'));
    
    // 显示差异部分（简化）
    const lines = fixedCode.split('\n');
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    if (lines.length > 20) {
      console.log(colors.yellow(`... 还有 ${lines.length - 20} 行`));
    }
    
    console.log(colors.cyan('---'));
    console.log(colors.yellow('\n注意: 请仔细核对修复建议，确保逻辑正确后再应用'));
  }
  
  process.exit(1);
}

// 运行
main();
