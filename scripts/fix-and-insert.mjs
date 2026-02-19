import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAndInsert() {
  console.log('🔧 检查学生 ID 格式...\n');

  const { data: students, error } = await supabase
    .from('app_users')
    .select('id, name, role')
    .eq('role', 'Student')
    .limit(10);

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  console.log('📋 学生列表:');
  students?.forEach(s => {
    console.log(`  - ${s.name}: ${s.id} (${s.id.length === 36 ? 'UUID' : 'String'})`);
  });

  // 过滤出 UUID 格式的学生
  const validStudents = students?.filter(s => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(s.id);
  });

  console.log(`\n✅ 有效学生数: ${validStudents?.length || 0}`);

  if (!validStudents?.length) {
    console.log('⚠️ 没有 UUID 格式的学生，尝试查找所有用户...');
    
    const { data: allUsers } = await supabase
      .from('app_users')
      .select('id, name, role')
      .limit(10);
    
    console.log('\n📋 所有用户:');
    allUsers?.forEach(u => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id);
      console.log(`  - ${u.name} (${u.role}): ${u.id} ${isUUID ? '✅' : '❌'}`);
    });
    
    return;
  }

  // 获取作业
  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, teacher_id, title')
    .in('status', ['pending', 'grading'])
    .limit(3);

  console.log(`📊 作业数: ${assignments?.length || 0}\n`);

  if (!assignments?.length) {
    console.log('⚠️ 没有作业');
    return;
  }

  // 插入数据
  const contents = [
    '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。附件中包含详细的文档。',
    '本次作业我深入研究了敏捷开发方法，并尝试将其应用到实际项目中。遇到了一些挑战，但通过团队协作解决了。',
    '作业已完成。我使用了甘特图来规划项目进度，并识别了关键路径。风险管理部分还需要进一步完善。',
    '通过这次作业，我对项目管理有了更深的理解。特别是在成本控制方面，学会了如何制定预算和监控支出。',
    '提交的作业包含完整的项目文档，包括需求分析、设计方案和实施计划。请老师批阅。'
  ];

  const comments = [
    '完成得很好，思路清晰，继续保持！',
    '内容完整，但可以在细节方面进一步完善。',
    '基本达到要求，建议多参考一些实际案例。'
  ];

  let count = 0;

  for (const assignment of assignments) {
    console.log(`📚 作业: ${assignment.title}`);
    
    for (let i = 0; i < Math.min(3, validStudents.length); i++) {
      const student = validStudents[i];
      const isGraded = Math.random() < 0.4;
      
      const { error: insertError } = await supabase
        .from('app_assignment_submissions')
        .upsert({
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
        }, {
          onConflict: 'assignment_id,student_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.log(`  ❌ ${student.name}: ${insertError.message}`);
      } else {
        console.log(`  ✅ ${student.name}: ${isGraded ? '已批改' : '已提交'}`);
        count++;
      }
    }
  }

  console.log(`\n✨ 成功插入 ${count} 条数据！`);

  // 更新作业统计
  console.log('\n📋 更新作业统计...');
  for (const assignment of assignments) {
    const { count: submittedCount } = await supabase
      .from('app_assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', assignment.id);

    const { error: updateError } = await supabase
      .from('app_assignments')
      .update({
        submitted_count: submittedCount || 0,
        status: submittedCount > 0 ? 'grading' : assignment.status
      })
      .eq('id', assignment.id);

    if (updateError) {
      console.log(`  ❌ ${assignment.title}: ${updateError.message}`);
    } else {
      console.log(`  ✅ ${assignment.title}: ${submittedCount} 提交`);
    }
  }

  // 验证结果
  console.log('\n📊 验证结果:');
  const { data: result } = await supabase
    .from('app_assignment_submissions')
    .select('status, score, student:student_id(name), assignment:assignment_id(title)')
    .order('submitted_at', { ascending: false })
    .limit(10);

  result?.forEach(s => {
    console.log(`  - ${s.student?.name}: ${s.assignment?.title?.slice(0, 20)}... ${s.status} ${s.score || ''}`);
  });
}

fixAndInsert();
