import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('📊 验证数据...\n');

  // 统计
  const { count: total } = await supabase
    .from('app_assignment_submissions')
    .select('*', { count: 'exact', head: true });

  const { count: graded } = await supabase
    .from('app_assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'graded');

  const { count: submitted } = await supabase
    .from('app_assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted');

  console.log(`📈 总提交数: ${total}`);
  console.log(`✅ 已批改: ${graded}`);
  console.log(`📝 待批改: ${submitted}\n`);

  // 作业统计
  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('title, submitted_count, total_count, status')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('📚 作业统计:');
  assignments?.forEach(a => {
    console.log(`  - ${a.title?.slice(0, 30)}: ${a.submitted_count}/${a.total_count} (${a.status})`);
  });

  // 最新提交
  const { data: submissions } = await supabase
    .from('app_assignment_submissions')
    .select('content, status, score, student:student_id(name), assignment:assignment_id(title)')
    .order('submitted_at', { ascending: false })
    .limit(5);

  console.log('\n📝 最新提交:');
  submissions?.forEach(s => {
    const score = s.score ? `${s.score}分` : '未评分';
    console.log(`  - ${s.student?.name}: ${s.assignment?.title?.slice(0, 25)}... [${s.status}] ${score}`);
  });

  console.log('\n✨ 数据验证完成！');
}

verify();
