import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 配置
const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAssignmentSubmissions() {
  console.log('🚀 开始插入作业提交数据...\n');

  try {
    // 1. 获取现有作业
    console.log('📋 步骤 1: 获取现有作业列表');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('app_assignments')
      .select('id, title, teacher_id, status, total_count')
      .in('status', ['pending', 'grading'])
      .limit(10);

    if (assignmentsError) {
      console.error('❌ 获取作业失败:', assignmentsError.message);
      return;
    }

    if (!assignments || assignments.length === 0) {
      console.log('⚠️ 没有找到待处理的作业');
      return;
    }

    console.log(`✅ 找到 ${assignments.length} 个作业\n`);

    // 2. 获取学生列表
    console.log('📋 步骤 2: 获取学生列表');
    const { data: students, error: studentsError } = await supabase
      .from('app_users')
      .select('id, name')
      .eq('role', 'Student')
      .limit(10);

    if (studentsError) {
      console.error('❌ 获取学生失败:', studentsError.message);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️ 没有找到学生用户');
      return;
    }

    console.log(`✅ 找到 ${students.length} 个学生\n`);

    // 3. 准备提交数据
    console.log('📋 步骤 3: 准备提交数据');
    const submissions = [];
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

    for (const assignment of assignments) {
      // 为每个作业随机选择 3-8 个学生提交
      const numSubmissions = Math.floor(Math.random() * 6) + 3;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const isGraded = Math.random() < 0.4; // 40% 已批改
        
        submissions.push({
          assignment_id: assignment.id,
          student_id: student.id,
          content: contents[i % contents.length],
          attachments: ['https://example.com/attachment1.pdf', 'https://example.com/attachment2.docx'],
          submitted_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: isGraded ? 'graded' : 'submitted',
          score: isGraded ? Math.floor(70 + Math.random() * 25) : null,
          comment: isGraded ? comments[Math.floor(Math.random() * comments.length)] : null,
          graded_at: isGraded ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString() : null,
          graded_by: isGraded ? assignment.teacher_id : null
        });
      }
    }

    console.log(`✅ 准备了 ${submissions.length} 条提交记录\n`);

    // 4. 插入提交记录
    console.log('📋 步骤 4: 插入提交记录');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const submission of submissions) {
      const { error: insertError } = await supabase
        .from('app_assignment_submissions')
        .upsert(submission, {
          onConflict: 'assignment_id,student_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          skippedCount++;
        } else {
          console.error(`❌ 插入失败:`, insertError.message);
        }
      } else {
        insertedCount++;
      }
    }

    console.log(`✅ 插入成功: ${insertedCount} 条`);
    console.log(`⏭️  跳过重复: ${skippedCount} 条\n`);

    // 5. 更新作业统计
    console.log('📋 步骤 5: 更新作业统计');
    for (const assignment of assignments) {
      // 获取该作业的提交数量
      const { count: submittedCount, error: countError } = await supabase
        .from('app_assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      if (countError) {
        console.error(`❌ 统计作业 ${assignment.id} 失败:`, countError.message);
        continue;
      }

      // 更新作业状态
      const { error: updateError } = await supabase
        .from('app_assignments')
        .update({
          submitted_count: submittedCount || 0,
          status: submittedCount > 0 ? 'grading' : assignment.status
        })
        .eq('id', assignment.id);

      if (updateError) {
        console.error(`❌ 更新作业 ${assignment.id} 失败:`, updateError.message);
      }
    }

    console.log('✅ 作业统计更新完成\n');

    // 6. 验证结果
    console.log('📋 步骤 6: 验证结果');
    const { data: stats, error: statsError } = await supabase
      .from('app_assignments')
      .select('title, total_count, submitted_count, status')
      .in('status', ['pending', 'grading'])
      .limit(5);

    if (statsError) {
      console.error('❌ 获取统计失败:', statsError.message);
    } else {
      console.log('📊 作业统计:');
      stats.forEach(a => {
        console.log(`  - ${a.title}: ${a.submitted_count}/${a.total_count} 提交`);
      });
    }

    const { data: recentSubmissions, error: recentError } = await supabase
      .from('app_assignment_submissions')
      .select(`
        id,
        status,
        score,
        submitted_at,
        student:student_id(name),
        assignment:assignment_id(title)
      `)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (!recentError && recentSubmissions) {
      console.log('\n📝 最新提交:');
      recentSubmissions.forEach(s => {
        console.log(`  - ${s.student?.name}: ${s.assignment?.title} (${s.status})`);
      });
    }

    console.log('\n✨ 数据插入完成！');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

// 执行脚本
seedAssignmentSubmissions();
