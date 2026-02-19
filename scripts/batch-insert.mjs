import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function batchInsert() {
  console.log('🚀 批量插入数据...\n');

  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, teacher_id, title')
    .in('status', ['pending', 'grading'])
    .limit(3);

  const { data: students } = await supabase
    .from('app_users')
    .select('id, name')
    .eq('role', 'Student')
    .limit(5);

  if (!assignments?.length || !students?.length) {
    console.log('⚠️ 数据不足');
    return;
  }

  const submissions = [];
  const contents = [
    '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。',
    '本次作业我深入研究了敏捷开发方法，并尝试将其应用到实际项目中。',
    '作业已完成。我使用了甘特图来规划项目进度，并识别了关键路径。',
    '通过这次作业，我对项目管理有了更深的理解。特别是在成本控制方面，学会了如何制定预算和监控支出。',
    '提交的作业包含完整的项目文档，包括需求分析、设计方案和实施计划。请老师批阅。'
  ];
  const comments = ['完成得很好，思路清晰，继续保持！', '内容完整，但可以在细节方面进一步完善。', '基本达到要求，建议多参考一些实际案例。'];

  for (const assignment of assignments) {
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const isGraded = Math.random() < 0.4;
      submissions.push({
        assignment_id: assignment.id,
        student_id: student.id,
        content: contents[i % contents.length],
        attachments: ['https://example.com/attachment1.pdf'],
        submitted_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: isGraded ? 'graded' : 'submitted',
        score: isGraded ? Math.floor(70 + Math.random() * 25) : null,
        comment: isGraded ? comments[Math.floor(Math.random() * comments.length)] : null,
        graded_at: isGraded ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : null,
        graded_by: isGraded ? assignment.teacher_id : null
      });
    }
  }

  // 批量插入
  const { data, error } = await supabase
    .from('app_assignment_submissions')
    .upsert(submissions, {
      onConflict: 'assignment_id,student_id',
      ignoreDuplicates: true
    });

  if (error) {
    console.error('❌ 插入失败:', error.message);
  } else {
    console.log(`✅ 成功插入 ${submissions.length} 条数据！`);
  }

  // 更新统计
  for (const assignment of assignments) {
    const { count } = await supabase
      .from('app_assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', assignment.id);

    await supabase
      .from('app_assignments')
      .update({ submitted_count: count || 0, status: count > 0 ? 'grading' : assignment.status })
      .eq('id', assignment.id);
  }

  // 验证
  const { data: result } = await supabase
    .from('app_assignment_submissions')
    .select('status, score, student:student_id(name), assignment:assignment_id(title)')
    .limit(10);

  console.log('\n📋 已插入的数据:');
  result?.forEach(s => {
    console.log(`  - ${s.student?.name}: ${s.assignment?.title?.slice(0, 20)}... ${s.status} ${s.score || ''}`);
  });
}

batchInsert();
