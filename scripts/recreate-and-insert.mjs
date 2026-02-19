import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateTable() {
  console.log('🔧 重新创建表（使用字符串 ID）...\n');

  // 删除旧表
  console.log('📋 删除旧表...');
  await supabase.rpc('exec_sql', { 
    sql: 'DROP TABLE IF EXISTS app_assignment_submissions;' 
  });

  // 创建新表 - 使用字符串类型的 ID
  const createTableSQL = `
    CREATE TABLE app_assignment_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL,
      student_id VARCHAR(50) NOT NULL,
      content TEXT,
      attachments TEXT[],
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
      score INTEGER CHECK (score >= 0 AND score <= 100),
      comment TEXT,
      graded_at TIMESTAMP WITH TIME ZONE,
      graded_by VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(assignment_id, student_id)
    );
  `;

  const { error: createError } = await supabase.rpc('exec_sql', { 
    sql: createTableSQL 
  });

  if (createError) {
    console.error('❌ 创建表失败:', createError.message);
    return false;
  }

  console.log('✅ 表创建成功！');

  // 创建索引
  const indexSQL = `
    CREATE INDEX idx_submissions_assignment ON app_assignment_submissions(assignment_id);
    CREATE INDEX idx_submissions_student ON app_assignment_submissions(student_id);
    CREATE INDEX idx_submissions_status ON app_assignment_submissions(status);
  `;

  await supabase.rpc('exec_sql', { sql: indexSQL });
  console.log('✅ 索引创建成功！');

  // 设置 RLS
  const rlsSQL = `
    ALTER TABLE app_assignment_submissions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authenticated read" ON app_assignment_submissions;
    CREATE POLICY "Allow authenticated read" ON app_assignment_submissions
        FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Allow students to submit" ON app_assignment_submissions;
    CREATE POLICY "Allow students to submit" ON app_assignment_submissions
        FOR INSERT TO authenticated 
        WITH CHECK (auth.uid()::text = student_id);

    DROP POLICY IF EXISTS "Allow teachers to grade" ON app_assignment_submissions;
    CREATE POLICY "Allow teachers to grade" ON app_assignment_submissions
        FOR UPDATE TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM app_assignments a 
                WHERE a.id = assignment_id 
                AND a.teacher_id::text = auth.uid()::text
            )
        );
  `;

  await supabase.rpc('exec_sql', { sql: rlsSQL });
  console.log('✅ RLS 设置成功！');

  return true;
}

async function insertData() {
  console.log('\n📋 插入数据...');

  const { data: assignments } = await supabase
    .from('app_assignments')
    .select('id, teacher_id, title')
    .in('status', ['pending', 'grading'])
    .limit(5);

  const { data: students } = await supabase
    .from('app_users')
    .select('id, name')
    .eq('role', 'Student')
    .limit(10);

  console.log(`📊 作业: ${assignments?.length || 0}, 学生: ${students?.length || 0}`);

  if (!assignments?.length || !students?.length) {
    console.log('⚠️ 数据不足');
    return;
  }

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
    const numSubmissions = Math.floor(Math.random() * 6) + 3;
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numSubmissions);

    for (let i = 0; i < shuffledStudents.length; i++) {
      const student = shuffledStudents[i];
      const isGraded = Math.random() < 0.4;
      
      const { error } = await supabase
        .from('app_assignment_submissions')
        .upsert({
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
        }, {
          onConflict: 'assignment_id,student_id',
          ignoreDuplicates: true
        });

      if (!error) count++;
    }
  }

  console.log(`✅ 成功插入 ${count} 条数据！`);

  // 更新作业统计
  console.log('\n📋 更新作业统计...');
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
  console.log('✅ 统计更新完成');
}

async function verify() {
  console.log('\n📊 验证结果:');
  
  const { data: stats } = await supabase
    .from('app_assignment_submissions')
    .select('status, count');

  const { data: submissions } = await supabase
    .from('app_assignment_submissions')
    .select('status, score, student:student_id(name), assignment:assignment_id(title)')
    .order('submitted_at', { ascending: false })
    .limit(10);

  console.log(`\n📈 总提交数: ${stats?.length || 0}`);
  console.log('\n📝 最新提交:');
  submissions?.forEach(s => {
    console.log(`  - ${s.student?.name}: ${s.assignment?.title?.slice(0, 25)}... ${s.status} ${s.score || ''}`);
  });
}

async function main() {
  const success = await recreateTable();
  if (success) {
    await insertData();
    await verify();
    console.log('\n✨ 全部完成！');
  }
}

main();
