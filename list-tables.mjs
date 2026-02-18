import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  }
});

async function listTables() {
  // 使用 raw SQL 查询
  const { data, error } = await supabase.rpc('list_tables');
  
  if (error) {
    // 如果没有 list_tables 函数，尝试直接查询
    const { data: tables, error: err2 } = await supabase
      .schema('information_schema')
      .from('tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');
    
    if (err2) {
      console.error('查询错误:', err2);
      process.exit(1);
    }
    
    console.log('\n📋 数据库表名列表:\n');
    console.log('='.repeat(50));
    tables.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    console.log('='.repeat(50));
    console.log(`\n共找到 ${tables.length} 个表\n`);
    return;
  }

  console.log('\n📋 数据库表名列表:\n');
  console.log('='.repeat(50));
  data.forEach((row, index) => {
    console.log(`  ${index + 1}. ${row.table_name}`);
  });
  console.log('='.repeat(50));
  console.log(`\n共找到 ${data.length} 个表\n`);
}

listTables();
