import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSubmissionData() {
  console.log('🚀 开始插入作业提交数据...\n');

  try {
    // 1. 获取现有作业
    const { data: assignments, error: assignmentsError } = await supabase
      .from('app_assignments')
      .select('id, title, teacher_id, status')
      .limit(10);

    if (assignmentsError) {
      console.error('❌ 获取作业失败:', assignmentsError.message);
      return;
    }

    console.log(`✅ 找到 ${assignments?.length || 0} 个作业`);

    // 2. 获取学生
    const { data: students, error: studentsError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(10);

    if (studentsError) {
      console.error('❌ 获取学生失败:', studentsError.message);
      return;
    }

    console.log(`✅ 找到 ${students?.length || 0} 个学生`);

    if (!assignments?.length || !students?.length) {
      console.log('⚠️ 没有足够的数据');
      return;
    }

    // 3. 准备提交内容
    const contents = [
      '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。',
      '本次作业深入研究了敏捷开发方法，并尝试将其应用到实际项目中。',
      '作业已完成。使用了甘特图来规划项目进度，并识别了关键路径。',
      '通过这次作业，对项目管理有了更深的理解，特别是在成本控制方面。',
      '提交的作业包含完整的项目文档，包括需求分析、设计方案和实施计划。'
    ];

    // 4. 插入数据
    let insertedCount = 0;
    
    for (const assignment of assignments) {
      // 为每个作业随机选择 5-8 个学生提交
      const numSubmissions = Math.floor(Math.random() * 4) + 5;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const isGraded = Math.random() < 0.5; // 50% 已批改
        
        const submissionData = {
          assignment_id: assignment.id,
          student_id: student.id,
          content: contents[i % contents.length],
          submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: isGraded ? 'graded' : 'submitted',
          score: isGraded ? Math.floor(65 + Math.random() * 30) : null,
        };

        const { error: insertError } = await supabase
          .from('app_assignment_submissions')
          .upsert(submissionData, {
            onConflict: 'assignment_id,student_id',
            ignoreDuplicates: true
          });

        if (insertError) {
          if (!insertError.message.includes('duplicate')) {
            console.error(`❌ 插入失败:`, insertError.message);
          }
        } else {
          insertedCount++;
          process.stdout.write(`\r✅ 已插入: ${insertedCount} 条`);
        }
      }
    }

    console.log(`\n\n✅ 总共插入: ${insertedCount} 条提交记录`);

    // 5. 更新作业统计
    console.log('\n📊 更新作业统计...');
    
    for (const assignment of assignments) {
      const { count: submittedCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      await supabase
        .from('app_assignments')
        .update({
          submitted_count: submittedCount || 0,
          status: submittedCount > 0 ? 'grading' : assignment.status
        })
        .eq('id', assignment.id);
    }

    console.log('✅ 作业统计更新完成！');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

insertSubmissionData();
