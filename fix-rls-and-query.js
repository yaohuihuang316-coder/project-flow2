import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, serviceKey);

// 已知的表列表（基于项目中的 SQL 文件）
const knownTables = [
  'app_users',
  'app_courses',
  'app_assignments',
  'app_class_sessions',
  'app_attendance',
  'app_course_enrollments',
  'app_announcements',
  'app_community_posts',
  'app_community_comments',
  'app_simulations',
  'app_simulation_scenarios',
  'app_kb_articles',
  'app_tools',
  'app_memberships',
  'app_payments',
  'app_progress',
  'app_activities',
  'app_notifications',
  'app_interactions',
  'app_ai_conversations',
  'app_learning_paths',
  'app_knowledge_nodes',
  'app_achievements',
  'app_user_achievements',
  'app_badges',
  'app_user_badges',
  'app_sessions',
  'app_session_participants',
  'app_polls',
  'app_poll_options',
  'app_poll_votes',
  'app_questions',
  'app_answers',
  'app_reviews',
  'app_subscriptions',
  'app_events',
  'app_event_registrations',
  'app_categories',
  'app_tags',
  'app_course_tags',
  'app_files',
  'app_settings'
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔧 任务 1: 查询数据库结构');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: 获取每张表的列信息
  console.log('📊 步骤 1: 获取表结构...\n');
  
  const dbSchema = {};
  const existingTables = [];
  
  for (const tableName of knownTables) {
    try {
      // 尝试查询表，如果成功则表存在
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(tableName);
        
        // 从返回的数据推断列信息
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]).map(col => ({
            column_name: col,
            data_type: typeof data[0][col],
            sample_value: data[0][col]
          }));
          dbSchema[tableName] = columns;
          console.log(`  ✅ ${tableName}: ${columns.length} 列`);
        } else {
          // 表存在但没有数据
          dbSchema[tableName] = [{ column_name: '（表为空，无法推断结构）', data_type: '-', sample_value: '-' }];
          console.log(`  ⚠️  ${tableName}: 表为空`);
        }
      } else {
        console.log(`  ❌ ${tableName}: 不存在`);
      }
    } catch (e) {
      console.log(`  ❌ ${tableName}: ${e.message}`);
    }
  }

  console.log(`\n✅ 发现 ${existingTables.length} 张表\n`);

  // Step 2: 创建文档目录并保存
  console.log('📁 步骤 2: 创建文档目录...');
  const docsDir = path.join(process.cwd(), 'docs', 'database');
  fs.mkdirSync(docsDir, { recursive: true });

  // 保存完整数据库结构
  const schemaPath = path.join(docsDir, 'schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(dbSchema, null, 2), 'utf-8');
  console.log(`✅ 数据库结构已保存到: ${schemaPath}`);

  // 生成 Markdown 文档
  let mdContent = '# 数据库结构文档\n\n';
  mdContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  mdContent += `项目: ProjectFlow2\n\n`;
  mdContent += `Supabase URL: ${supabaseUrl}\n\n`;
  mdContent += `总表数: ${existingTables.length}\n\n`;
  mdContent += '---\n\n';

  mdContent += '## 表列表\n\n';
  existingTables.forEach((table, i) => {
    mdContent += `${i + 1}. [${table}](#${table})\n`;
  });
  mdContent += '\n---\n\n';

  for (const [tableName, columns] of Object.entries(dbSchema)) {
    mdContent += `## ${tableName}\n\n`;
    mdContent += '| 列名 | 数据类型 | 示例值 |\n';
    mdContent += '|------|----------|--------|\n';
    
    for (const col of columns) {
      const sample = col.sample_value !== null ? JSON.stringify(col.sample_value).substring(0, 50) : 'null';
      mdContent += `| ${col.column_name} | ${col.data_type} | ${sample} |\n`;
    }
    mdContent += '\n';
  }

  const mdPath = path.join(docsDir, 'schema.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`✅ Markdown 文档已保存到: ${mdPath}`);

  // Step 3: 生成每个表的单独文档
  console.log('\n📄 步骤 3: 生成单表文档...');
  const tablesDir = path.join(docsDir, 'tables');
  fs.mkdirSync(tablesDir, { recursive: true });

  for (const [tableName, columns] of Object.entries(dbSchema)) {
    const tableMd = `# ${tableName} 表\n\n## 列信息\n\n| 列名 | 数据类型 | 示例值 |\n|------|----------|--------|\n` +
      columns.map(col => {
        const sample = col.sample_value !== null ? JSON.stringify(col.sample_value).substring(0, 50) : 'null';
        return `| ${col.column_name} | ${col.data_type} | ${sample} |`;
      }).join('\n') +
      '\n\n## 示例查询\n\n```sql\n-- 查询所有数据\nSELECT * FROM ${tableName} LIMIT 10;\n\n-- 查询数据条数\nSELECT COUNT(*) FROM ${tableName};\n```\n';
    
    fs.writeFileSync(path.join(tablesDir, `${tableName}.md`), tableMd, 'utf-8');
  }
  console.log(`✅ 单表文档已保存到: ${tablesDir}`);

  // Step 4: 查询关键表的数据统计
  console.log('\n📈 步骤 4: 数据统计...\n');
  
  const stats = {};
  for (const tableName of existingTables) {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      stats[tableName] = count || 0;
      console.log(`  ${tableName}: ${count || 0} 条`);
    }
  }

  const statsPath = path.join(docsDir, 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`\n✅ 统计数据已保存到: ${statsPath}`);

  // Step 5: 测试 RLS
  console.log('\n🔍 步骤 5: 测试匿名密钥访问...');
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTI2NDQsImV4cCI6MjA4MjU4ODY0NH0.xVb2gaNftckCN-gbA19iwHc0S0OD1XAc0Hf22LNBAvE';
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const rlsTests = {};
  
  // 测试关键表
  const criticalTables = ['app_assignments', 'app_class_sessions', 'app_attendance', 'app_courses', 'app_users'];
  for (const tableName of criticalTables) {
    const { data, error } = await anonClient.from(tableName).select('*').limit(2);
    const status = error ? { status: 'failed', error: error.message } : { status: 'success', count: data?.length || 0 };
    rlsTests[tableName] = status;
    console.log(`   ${tableName}: ${error ? '❌ ' + error.message : '✅ ' + (data?.length || 0) + ' 条'}`);
  }

  // 生成总结
  const summary = {
    project: 'ProjectFlow2',
    generatedAt: new Date().toISOString(),
    supabaseUrl,
    tableCount: existingTables.length,
    tables: existingTables,
    stats,
    rlsTest: rlsTests
  };

  const summaryPath = path.join(docsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n✅ 总结已保存到: ${summaryPath}`);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ 任务 1 完成！');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📁 生成的文件:');
  console.log(`   - docs/database/schema.json (完整结构)`);
  console.log(`   - docs/database/schema.md (Markdown文档)`);
  console.log(`   - docs/database/tables/*.md (单表文档)`);
  console.log(`   - docs/database/stats.json (数据统计)`);
  console.log(`   - docs/database/summary.json (总结)`);
  console.log('\n⚠️  RLS 状态:');
  Object.entries(rlsTests).forEach(([table, result]) => {
    console.log(`   ${table}: ${result.status === 'success' ? '✅ 正常' : '❌ 需要修复 - ' + result.error}`);
  });
}

main().catch(console.error);
