import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSubmissionsForAllAssignments() {
  console.log('🚀 为所有作业插入提交数据...\n');

  try {
    // 获取所有作业
    const { data: assignments, error: assignmentError } = await supabase
      .from('app_assignments')
      .select('id, title')
      .limit(50);

    if (assignmentError || !assignments?.length) {
      console.error('❌ 获取作业失败:', assignmentError?.message);
      return;
    }

    console.log(`✅ 找到 ${assignments.length} 个作业`);

    // 获取学生
    const { data: students, error: studentsError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(20);

    if (studentsError || !students?.length) {
      console.error('❌ 获取学生失败:', studentsError?.message);
      return;
    }

    console.log(`✅ 找到 ${students.length} 个学生`);

    // 准备提交内容模板
    const contentTemplates = [
      '我已经认真完成了本次作业，通过实践加深了对知识点的理解。',
      '本次作业让我学到了很多，特别是在实际应用方面有了新的认识。',
      '作业完成过程中遇到了一些困难，但通过查阅资料和思考最终解决了。',
      '通过本次作业的练习，我对课程内容有了更深入的理解和掌握。',
      '按时完成了作业，并按照要求提交了所有必要的材料和文档。',
      '在完成作业的过程中，我结合了课堂所学知识和实际案例进行分析。',
      '本次作业的完成让我对项目管理方法有了更清晰的认识和实践体验。',
      '认真完成了作业要求，并在过程中发现了自己的不足之处，需要继续学习。'
    ];

    let totalInserted = 0;

    // 为每个作业插入提交
    for (const assignment of assignments) {
      // 检查是否已有提交
      const { count: existingCount } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      if (existingCount > 0) {
        console.log(`⏭️  作业 "${assignment.title}" 已有 ${existingCount} 条提交，跳过`);
        continue;
      }

      console.log(`\n📋 为作业 "${assignment.title}" 插入提交...`);
      
      // 随机选择3-8个学生
      const numSubmissions = Math.floor(Math.random() * 6) + 3;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      let insertedCount = 0;

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const isGraded = Math.random() < 0.5; // 50% 已批改
        const score = isGraded ? 60 + Math.floor(Math.random() * 35) : null;

        const submissionData = {
          assignment_id: assignment.id,
          student_id: student.id,
          content: contentTemplates[i % contentTemplates.length],
          submitted_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: isGraded ? 'graded' : 'submitted',
          score: score,
          comment: isGraded ? '完成得很好，继续保持！' : null,
          graded_at: isGraded ? new Date().toISOString() : null,
        };

        const { error: insertError } = await supabase
          .from('app_assignment_submissions')
          .insert(submissionData);

        if (insertError) {
          console.error(`❌ 插入失败:`, insertError.message);
        } else {
          insertedCount++;
          totalInserted++;
        }
      }

      console.log(`✅ 插入完成: ${insertedCount} 条`);

      // 更新作业统计
      await supabase
        .from('app_assignments')
        .update({
          submitted_count: insertedCount,
          graded_count: Math.floor(insertedCount * 0.5),
          status: 'grading'
        })
        .eq('id', assignment.id);
    }

    console.log(`\n✅ 全部完成！总共插入 ${totalInserted} 条提交记录`);
    console.log('🔄 请刷新页面查看效果');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

insertSubmissionsForAllAssignments();
