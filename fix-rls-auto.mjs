import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixRLS() {
  console.log('🔧 开始自动修复 RLS 权限...\n');
  
  const tables = ['app_assignments', 'app_class_sessions', 'app_attendance'];
  
  for (const table of tables) {
    console.log(`📋 处理表: ${table}`);
    
    // 1. 禁用 RLS
    const { error: e1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY`
    });
    console.log(e1 ? `   ❌ 禁用失败: ${e1.message}` : '   ✅ 已禁用 RLS');
    
    // 2. 重新启用 RLS
    const { error: e2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`
    });
    console.log(e2 ? `   ❌ 启用失败: ${e2.message}` : '   ✅ 已启用 RLS');
    
    // 3. 删除旧策略
    const { error: e3 } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Allow anonymous read" ON public.${table}; DROP POLICY IF EXISTS "Allow authenticated read access" ON public.${table}; DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.${table}`
    });
    console.log(e3 ? `   ❌ 删除策略失败: ${e3.message}` : '   ✅ 已删除旧策略');
    
    // 4. 创建匿名用户读取策略
    const { error: e4 } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Allow anonymous read" ON public.${table} FOR SELECT TO anon USING (true)`
    });
    console.log(e4 ? `   ❌ 创建策略失败: ${e4.message}` : '   ✅ 已创建匿名读取策略');
    
    // 5. 创建认证用户完整权限策略
    const { error: e5 } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Allow authenticated full access" ON public.${table} FOR ALL TO authenticated USING (true) WITH CHECK (true)`
    });
    console.log(e5 ? `   ❌ 创建策略失败: ${e5.message}` : '   ✅ 已创建认证用户策略');
    
    console.log('');
  }
  
  // 测试修复结果
  console.log('🔍 测试修复结果...\n');
  
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTI2NDQsImV4cCI6MjA4MjU4ODY0NH0.xVb2gaNftckCN-gbA19iwHc0S0OD1XAc0Hf22LNBAvE';
  const anonClient = createClient(supabaseUrl, anonKey);
  
  let allSuccess = true;
  for (const table of tables) {
    const { data, error } = await anonClient.from(table).select('count').single();
    const count = data?.count || 0;
    const status = error ? `❌ ${error.message}` : `✅ ${count} 条`;
    console.log(`   ${table}: ${status}`);
    if (error) allSuccess = false;
  }
  
  console.log('\n' + '═'.repeat(60));
  if (allSuccess) {
    console.log('🎉 RLS 修复成功！请刷新页面查看数据。');
  } else {
    console.log('⚠️ 部分修复失败，请检查错误信息。');
  }
  console.log('═'.repeat(60));
}

fixRLS().catch(err => {
  console.error('❌ 执行失败:', err.message);
  console.log('\n💡 可能原因: exec_sql 函数未正确创建或权限不足');
});
