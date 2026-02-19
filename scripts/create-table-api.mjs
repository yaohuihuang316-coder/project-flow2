// 使用 Supabase REST API 创建表和插入数据
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 尝试使用 REST API 创建表...\n');

  // 方法1: 尝试使用 pg_graphql 扩展
  const graphqlQuery = {
    query: `
      mutation {
        createTable(
          name: "app_assignment_submissions"
          columns: [
            { name: "id", type: "uuid", default: "gen_random_uuid()", nullable: false }
            { name: "assignment_id", type: "uuid", nullable: false }
            { name: "student_id", type: "uuid", nullable: false }
            { name: "content", type: "text" }
            { name: "attachments", type: "text[]" }
            { name: "submitted_at", type: "timestamptz", default: "now()" }
            { name: "status", type: "varchar", default: "'submitted'", nullable: false }
            { name: "score", type: "int" }
            { name: "comment", type: "text" }
            { name: "graded_at", type: "timestamptz" }
            { name: "graded_by", type: "uuid" }
            { name: "created_at", type: "timestamptz", default: "now()" }
            { name: "updated_at", type: "timestamptz", default: "now()" }
          ]
          primaryKey: ["id"]
          unique: [{ columns: ["assignment_id", "student_id"] }]
        ) {
          name
        }
      }
    `
  };

  try {
    const response = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify(graphqlQuery)
    });

    const result = await response.json();
    console.log('GraphQL 结果:', result);
  } catch (err) {
    console.log('GraphQL 失败:', err.message);
  }

  // 方法2: 检查表是否已存在
  console.log('\n📋 检查表是否存在...');
  const { data, error } = await supabase
    .from('app_assignment_submissions')
    .select('id')
    .limit(1);

  if (error) {
    console.log('❌ 表不存在或无法访问:', error.message);
    console.log('\n💡 由于 Supabase Service Key 无法执行 DDL 操作，');
    console.log('   请在 Supabase Dashboard 的 SQL Editor 中手动执行以下 SQL:');
    console.log('\n--- 复制以下 SQL ---\n');
    console.log(`
-- 创建作业提交表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON app_assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON app_assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON app_assignment_submissions(status);

-- 启用 RLS
ALTER TABLE app_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Allow authenticated read" ON app_assignment_submissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow students to submit" ON app_assignment_submissions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Allow teachers to grade" ON app_assignment_submissions
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM app_assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
    );
    `);
    console.log('\n--- SQL 结束 ---\n');
  } else {
    console.log('✅ 表已存在，可以插入数据');
    
    // 插入数据
    console.log('\n📋 开始插入数据...');
    
    // 获取作业和学生
    const { data: assignments } = await supabase
      .from('app_assignments')
      .select('id, teacher_id')
      .in('status', ['pending', 'grading'])
      .limit(5);

    const { data: students } = await supabase
      .from('app_users')
      .select('id')
      .eq('role', 'Student')
      .limit(5);

    if (assignments?.length && students?.length) {
      const contents = [
        '我已经完成了项目计划书的编写，包括项目目标、范围、时间表和资源分配。',
        '本次作业我深入研究了敏捷开发方法，并尝试将其应用到实际项目中。',
        '作业已完成。我使用了甘特图来规划项目进度，并识别了关键路径。'
      ];

      let count = 0;
      for (const assignment of assignments.slice(0, 3)) {
        for (let i = 0; i < 3; i++) {
          const student = students[i % students.length];
          const isGraded = Math.random() < 0.4;
          
          const { error: insertError } = await supabase
            .from('app_assignment_submissions')
            .upsert({
              assignment_id: assignment.id,
              student_id: student.id,
              content: contents[i % contents.length],
              status: isGraded ? 'graded' : 'submitted',
              score: isGraded ? Math.floor(70 + Math.random() * 25) : null,
              submitted_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
            }, {
              onConflict: 'assignment_id,student_id',
              ignoreDuplicates: true
            });

          if (!insertError) count++;
        }
      }
      
      console.log(`✅ 成功插入 ${count} 条数据`);
    }
  }
}

main();
