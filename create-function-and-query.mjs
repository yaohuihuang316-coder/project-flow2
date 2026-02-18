import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔌 连接 Supabase...\n');
  
  // 尝试直接查询 tables - 使用 supabase 的特殊端点
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 成功获取数据库信息！\n');
      
      // 提取表名
      if (data && data.definitions) {
        const tables = Object.keys(data.definitions)
          .filter(name => !name.startsWith('_') && !name.includes('.'))
          .sort();
        
        console.log('='.repeat(60));
        console.log('📋 Supabase 数据库表名列表 (通过 API 获取)');
        console.log('='.repeat(60));
        tables.forEach((name, index) => {
          console.log(`  ${String(index + 1).padStart(2)}. ${name}`);
        });
        console.log('='.repeat(60));
        console.log(`\n共找到 ${tables.length} 个表\n`);
        return;
      }
    }
  } catch (e) {
    console.log('❌ 直接 API 查询失败:', e.message);
  }

  // 备选方案：尝试使用 pg 模块直接连接
  console.log('\n⚠️ 无法通过 REST API 获取表列表。');
  console.log('\n📋 说明：');
  console.log('   Supabase 的 REST API 默认不暴露系统表查询功能。');
  console.log('   你需要在 Supabase Dashboard 的 SQL Editor 中执行以下命令：\n');
  console.log('='.repeat(60));
  console.log(`SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE' 
ORDER BY table_name;`);
  console.log('='.repeat(60));
  console.log('\n或者手动导入并执行文件：create-list-tables-function.sql\n');
}

main();
