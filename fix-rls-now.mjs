import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixRLS() {
  console.log('🔧 开始修复 RLS 权限...\n');
  
  const tables = ['app_assignments', 'app_class_sessions', 'app_attendance'];
  
  for (const table of tables) {
    console.log(`📋 处理表: ${table}`);
    
    // 方法1: 尝试禁用 RLS 再重新启用
    try {
      const { error: disableErr } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY`
      });
      
      if (disableErr) {
        console.log(`   ⚠️ 禁用 RLS 失败: ${disableErr.message}`);
      } else {
        console.log('   ✅ 已禁用 RLS');
      }
      
      // 删除现有策略
      const { error: dropErr } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Allow authenticated read access" ON public.${table}; DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.${table}`
      });
      
      if (dropErr) {
        console.log(`   ⚠️ 删除策略失败: ${dropErr.message}`);
      }
      
      // 重新启用 RLS
      const { error: enableErr } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`
      });
      
      if (enableErr) {
        console.log(`   ⚠️ 启用 RLS 失败: ${enableErr.message}`);
      } else {
        console.log('   ✅ 已启用 RLS');
      }
      
      // 创建允许匿名用户读取的策略
      const { error: policyErr } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Allow anonymous read" ON public.${table} FOR SELECT TO anon USING (true)`
      });
      
      if (policyErr) {
        console.log(`   ⚠️ 创建策略失败: ${policyErr.message}`);
      } else {
        console.log('   ✅ 已创建匿名读取策略');
      }
      
    } catch (e) {
      console.log(`   ❌ 错误: ${e.message}`);
    }
    
    console.log('');
  }
  
  // 测试修复结果
  console.log('🔍 测试修复结果...\n');
  
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTI2NDQsImV4cCI6MjA4MjU4ODY0NH0.xVb2gaNftckCN-gbA19iwHc0S0OD1XAc0Hf22LNBAvE';
  const anonClient = createClient(supabaseUrl, anonKey);
  
  for (const table of tables) {
    const { data, error } = await anonClient.from(table).select('*');
    console.log(`${table}: ${error ? '❌ ' + error.message : '✅ ' + (data?.length || 0) + ' 条'}`);
  }
  
  console.log('\n💡 如果测试仍失败，请手动在 Supabase Dashboard 执行:');
  console.log('   https://supabase.com/dashboard/project/ghhvdffsyvzkhbftifzy/sql/editor');
  console.log('\n执行以下 SQL:');
  console.log('─'.repeat(60));
  console.log(`
-- 方案1: 为匿名用户创建读取策略
CREATE POLICY "Allow anonymous read" ON public.app_assignments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read" ON public.app_class_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read" ON public.app_attendance FOR SELECT TO anon USING (true);

-- 方案2: 或者完全禁用 RLS（不推荐用于生产环境）
ALTER TABLE public.app_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_attendance DISABLE ROW LEVEL SECURITY;
  `);
  console.log('─'.repeat(60));
}

fixRLS();
