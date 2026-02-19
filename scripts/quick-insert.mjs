import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickInsert() {
  console.log('🚀 快速插入数据...\n');

  // 只取2个作业和3个学生，快速插入
  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, teacher_id')
    .in('status', ['pending', 'grading'])
    .limit(2);

  const { data: students } = await supabase
    .from('app_users')
    .select('id, name')
    .eq('role', 'Student')
    .limit(3);

  console.log(`📊 作业: ${assignments?.length || 0}, 学生: ${students?.length || 0}`);

  if (!assignments?.length || !students?.length) {
    console.log('⚠️ 数据不足');
    return;
  }

  const contents = [
    '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。',
    '本次作业我深入研究了敏捷开发方法，并尝试将其应用到实际项目中。',
    '作业已完成。我使用了甘特图来规划项目进度，并识别了关键路径。'
  ];

  let count = 0;
  
  for (const assignment of assignments) {
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const isGraded = Math.random() < 0.4;
      
      console.log(`📝 插入: ${student.name} - 作业 ${assignment.id.slice(0, 8)}...`);
      
      const { error } = await supabase
        .from('app_assignment_submissions')
        .upsert({
          assignment_id: assignment.id,
          student_id: student.id,
          content: contents[i % contents.length],
          status: isGraded ? 'graded' : 'submitted',
          score: isGraded ? Math.floor(75 + Math.random() * 20) : null,
          submitted_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'assignment_id,student_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.log(`❌ 失败: ${error.message}`);
      } else {
        count++;
        console.log(`✅ 成功`);
      }
    }
  }

  console.log(`\n✨ 完成！插入 ${count} 条数据`);

  // 验证
  const { data: result } = await supabase
    .from('app_assignment_submissions')
    .select('status, score, student:student_id(name), assignment:assignment_id(title)')
    .limit(5);

  console.log('\n📋 已插入的数据:');
  result?.forEach(s => {
    console.log(`  - ${s.student?.name}: ${s.status} ${s.score ? '(' + s.score + '分)' : ''}`);
  });
}

quickInsert();
