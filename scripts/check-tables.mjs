import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 检查数据库表...\n');

  try {
    // 直接查询 app_assignments 表
    console.log('📊 检查 app_assignments 表:');
    const { data: assignments, error: assignmentError } = await supabase
      .from('app_assignments')
      .select('*')
      .limit(3);

    if (assignmentError) {
      console.error('❌ 查询 app_assignments 失败:', assignmentError.message);
    } else {
      console.log(`✅ 找到 ${assignments.length} 条作业记录`);
      if (assignments.length > 0) {
        console.log('  字段:', Object.keys(assignments[0]).join(', '));
      }
    }

    // 尝试查询提交表
    console.log('\n📊 检查 app_assignment_submissions 表:');
    const { data: submissions, error: submissionError } = await supabase
      .from('app_assignment_submissions')
      .select('*')
      .limit(1);

    if (submissionError) {
      console.error('❌ 查询失败:', submissionError.message);
      if (submissionError.message.includes('does not exist') || 
          submissionError.message.includes('Could not find')) {
        console.log('💡 表不存在，需要创建');
      }
    } else {
      console.log(`✅ 找到 ${submissions.length} 条提交记录`);
    }

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

checkTables();
