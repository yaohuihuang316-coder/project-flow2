import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertGanttChartSubmissions() {
  console.log('🚀 为甘特图制作作业插入提交数据...\n');

  try {
    // 获取"甘特图制作"作业ID
    const { data: assignments, error: assignmentError } = await supabase
      .from('app_assignments')
      .select('id, title')
      .ilike('title', '%甘特图%')
      .limit(2);

    if (assignmentError || !assignments?.length) {
      console.error('❌ 找不到甘特图作业:', assignmentError?.message);
      return;
    }

    console.log(`✅ 找到 ${assignments.length} 个甘特图作业`);

    // 获取学生
    const { data: students, error: studentsError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(10);

    if (studentsError || !students?.length) {
      console.error('❌ 获取学生失败:', studentsError?.message);
      return;
    }

    console.log(`✅ 找到 ${students.length} 个学生`);

    // 为每个甘特图作业插入提交
    for (const assignment of assignments) {
      console.log(`\n📋 为作业 "${assignment.title}" (${assignment.id}) 插入提交...`);
      
      // 准备提交内容
      const contents = [
        '我使用Microsoft Project制作了项目甘特图，详细规划了项目的各个阶段和里程碑。图表中包含了任务依赖关系、关键路径和资源分配。',
        '本次作业使用Excel制作了甘特图，通过条件格式和公式实现了自动计算功能。图表清晰展示了项目进度和任务完成情况。',
        '我使用在线工具GanttProject完成了甘特图制作，包含了完整的任务分解、时间估算和资源分配。图表导出为PDF格式便于分享。',
        '作业完成了甘特图的制作，使用不同颜色区分了不同类型的任务。图表中标注了关键里程碑和检查点。',
        '通过本次作业，我掌握了甘特图的制作方法。图表中详细列出了每个任务的开始时间、结束时间和负责人。'
      ];

      let insertedCount = 0;
      
      // 为每个作业随机选择5-8个学生提交
      const numSubmissions = Math.floor(Math.random() * 4) + 5;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const isGraded = Math.random() < 0.6; // 60% 已批改
        
        // 根据内容质量生成分数
        let score = 70 + Math.floor(Math.random() * 25); // 70-95分
        
        const submissionData = {
          assignment_id: assignment.id,
          student_id: student.id,
          content: contents[i % contents.length],
          submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: isGraded ? 'graded' : 'submitted',
          score: isGraded ? score : null,
          comment: isGraded ? '完成得很好，思路清晰，继续保持！' : null,
          graded_at: isGraded ? new Date().toISOString() : null,
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

      console.log(`\n✅ 作业 "${assignment.title}" 插入完成: ${insertedCount} 条`);

      // 更新作业统计
      const { count: submittedCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      const { count: gradedCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)
        .eq('status', 'graded');

      await supabase
        .from('app_assignments')
        .update({
          submitted_count: submittedCount || 0,
          graded_count: gradedCount || 0,
          status: submittedCount > 0 ? 'grading' : 'pending'
        })
        .eq('id', assignment.id);

      console.log(`📊 更新作业统计: 已提交 ${submittedCount}, 已批改 ${gradedCount}`);
    }

    console.log('\n✅ 所有数据插入完成！');
    console.log('🔄 请刷新页面查看效果');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

insertGanttChartSubmissions();
