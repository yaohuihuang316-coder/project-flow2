import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // 查看现有用户数据
  const { data: users } = await supabase.from('app_users').select('*').limit(3);
  console.log('\n=== app_users 样本 ===');
  console.log(JSON.stringify(users, null, 2));
  
  // 查看现有课程数据
  const { data: courses } = await supabase.from('app_courses').select('*').limit(2);
  console.log('\n=== app_courses 样本 ===');
  console.log(JSON.stringify(courses, null, 2));
  
  // 查看 app_assignments 表结构
  const { data: assignments } = await supabase.from('app_assignments').select('*').limit(1);
  console.log('\n=== app_assignments 样本 ===');
  console.log(JSON.stringify(assignments, null, 2));
}

main();
