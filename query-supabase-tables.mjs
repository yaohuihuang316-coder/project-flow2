import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryTables() {
  console.log('🔌 正在连接 Supabase 数据库...\n');
  
  // 方法1: 尝试使用 raw SQL 通过 execute_sql 函数
  try {
    const { data: tables, error } = await supabase
      .rpc('execute_sql', {
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
      });
    
    if (error) {
      console.log('❌ execute_sql RPC 调用失败:', error.message);
    } else {
      console.log('✅ 成功获取表名列表！\n');
      console.log('='.repeat(60));
      tables.forEach((row, index) => {
        console.log(`  ${String(index + 1).padStart(2)}. ${row.table_name}`);
      });
      console.log('='.repeat(60));
      console.log(`\n共找到 ${tables.length} 个表\n`);
      return;
    }
  } catch (e) {
    console.log('❌ execute_sql 不可用:', e.message);
  }

  // 方法2: 尝试直接查询 pg_catalog
  try {
    console.log('\n尝试通过 pg_catalog 查询...');
    const { data: tables, error } = await supabase
      .rpc('list_tables');
    
    if (!error && tables) {
      console.log('✅ 成功获取表名列表！\n');
      console.log('='.repeat(60));
      tables.forEach((row, index) => {
        console.log(`  ${String(index + 1).padStart(2)}. ${row.table_name || row.name}`);
      });
      console.log('='.repeat(60));
      console.log(`\n共找到 ${tables.length} 个表\n`);
      return;
    }
  } catch (e) {
    console.log('❌ list_tables RPC 不可用');
  }

  // 方法3: 尝试查询特定的系统视图
  try {
    console.log('\n尝试查询 supabase_tables 视图...');
    const { data: tables, error } = await supabase
      .from('_tables')
      .select('*');
    
    if (!error && tables) {
      console.log('✅ 成功！\n', tables);
      return;
    }
  } catch (e) {
    console.log('❌ _tables 视图不可用');
  }

  console.log('\n❌ 所有方法都失败了。可能的原因：');
  console.log('   1. 服务角色密钥 (Service Role Key) 权限不足');
  console.log('   2. 数据库中没有创建查询表的 RPC 函数');
  console.log('   3. Supabase 项目连接问题');
  console.log('\n建议：在 Supabase SQL Editor 中执行以下查询：');
  console.log('   SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\';');
}

queryTables();
