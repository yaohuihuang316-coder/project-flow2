import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableAndInsertData() {
  console.log('🚀 开始创建表并插入数据...\n');

  try {
    // 1. 创建表
    console.log('📋 步骤 1: 创建 app_assignment_submissions 表');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS app_assignment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID NOT NULL REFERENCES app_assignments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        content TEXT,
        attachments TEXT[],
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
        score INTEGER CHECK (score >= 0 AND score <= 100),
        comment TEXT,
        graded_at TIMESTAMP WITH TIME ZONE,
        graded_by UUID REFERENCES app_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(assignment_id, student_id)
      );
    `;

    // 使用 supabase 的 rpc 执行 SQL
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    });

    if (createError) {
      console.log('⚠️ 使用 RPC 失败，尝试直接创建:', createError.message);
      
      // 尝试直接查询看表是否存在
      const { error: checkError } = await supabase
        .from('app_assignment_submissions')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('does not exist')) {
        console.log('❌ 表不存在且无法自动创建');
        console.log('💡 请手动在 Supabase Dashboard 执行 SQL');
        return;
      } else {
        console.log('✅ 表已存在');
      }
    } else {
      console.log('✅ 表创建成功');
    }

    // 2. 创建索引和 RLS
    console.log('\n📋 步骤 2: 创建索引和 RLS 策略');
    
    const setupSQL = `
      CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON app_assignment_submissions(assignment_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student ON app_assignment_submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON app_assignment_submissions(status);

      ALTER TABLE app_assignment_submissions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow authenticated read" ON app_assignment_submissions;
      CREATE POLICY "Allow authenticated read" ON app_assignment_submissions
          FOR SELECT TO authenticated USING (true);

      DROP POLICY IF EXISTS "Allow students to submit" ON app_assignment_submissions;
      CREATE POLICY "Allow students to submit" ON app_assignment_submissions
          FOR INSERT TO authenticated 
          WITH CHECK (auth.uid() = student_id);

      DROP POLICY IF EXISTS "Allow teachers to grade" ON app_assignment_submissions;
      CREATE POLICY "Allow teachers to grade" ON app_assignment_submissions
          FOR UPDATE TO authenticated 
          USING (
              EXISTS (
                  SELECT 1 FROM app_assignments a 
                  WHERE a.id = assignment_id 
                  AND a.teacher_id = auth.uid()
              )
          );
    `;

    const { error: setupError } = await supabase.rpc('exec_sql', { 
      sql_query: setupSQL 
    });

    if (setupError) {
      console.log('⚠️ 设置索引和 RLS 失败:', setupError.message);
    } else {
      console.log('✅ 索引和 RLS 设置成功');
    }

    // 3. 获取现有作业和学生
    console.log('\n📋 步骤 3: 获取作业和学生数据');
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('app_assignments')
      .select('id, title, teacher_id, status, total_count')
      .in('status', ['pending', 'grading'])
      .limit(10);

    if (assignmentsError) {
      console.error('❌ 获取作业失败:', assignmentsError.message);
      return;
    }

    console.log(`✅ 找到 ${assignments?.length || 0} 个作业`);

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
      console.log('⚠️ 没有足够的数据，跳过插入');
      return;
    }

    // 4. 准备并插入数据
    console.log('\n📋 步骤 4: 插入作业提交数据');
    
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

    let insertedCount = 0;
    let skippedCount = 0;

    for (const assignment of assignments) {
      // 为每个作业随机选择 3-8 个学生提交
      const numSubmissions = Math.floor(Math.random() * 6) + 3;
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

      for (let i = 0; i < shuffledStudents.length; i++) {
        const student = shuffledStudents[i];
        const isGraded = Math.random() < 0.4; // 40% 已批改
        
        const submissionData = {
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
        };

        const { error: insertError } = await supabase
          .from('app_assignment_submissions')
          .upsert(submissionData, {
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
    }

    console.log(`✅ 插入成功: ${insertedCount} 条`);
    console.log(`⏭️  跳过重复: ${skippedCount} 条`);

    // 5. 更新作业统计
    console.log('\n📋 步骤 5: 更新作业统计');
    
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
        console.error(`❌ 更新作业 ${assignment.id} 失败:`, updateError.message);
      }
    }

    console.log('✅ 作业统计更新完成');

    // 6. 验证结果
    console.log('\n📋 步骤 6: 验证结果');
    
    const { data: stats } = await supabase
      .from('app_assignment_submissions')
      .select('status', { count: 'exact' });

    const { data: gradedCount } = await supabase
      .from('app_assignment_submissions')
      .select('id', { count: 'exact' })
      .eq('status', 'graded');

    console.log(`📊 总提交数: ${stats?.length || 0}`);
    console.log(`📊 已批改: ${gradedCount?.length || 0}`);

    console.log('\n✨ 数据插入完成！');

  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

createTableAndInsertData();
