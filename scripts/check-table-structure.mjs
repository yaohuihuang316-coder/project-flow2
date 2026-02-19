import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 检查表结构...\n');

  // 检查 app_users 表
  console.log('📋 检查 app_users 表:');
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .limit(1);

  if (userError) {
    console.error('❌ 查询失败:', userError.message);
  } else {
    console.log('✅ app_users 表存在');
    console.log('  字段:', Object.keys(user[0]).join(', '));
  }

  // 检查 app_assignments 表
  console.log('\n📋 检查 app_assignments 表:');
  const { data: assignment, error: assignmentError } = await supabase
    .from('app_assignments')
    .select('*')
    .limit(1);

  if (assignmentError) {
    console.error('❌ 查询失败:', assignmentError.message);
  } else {
    console.log('✅ app_assignments 表存在');
    console.log('  字段:', Object.keys(assignment[0]).join(', '));
  }

  // 检查 auth.users 表是否可访问
  console.log('\n📋 检查 auth.users 表:');
  const { data: authUser, error: authError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (authError) {
    console.log('⚠️ auth.users 无法直接访问:', authError.message);
  } else {
    console.log('✅ auth.users 可访问');
  }
}

checkTables();
