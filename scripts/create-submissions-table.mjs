import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('🔧 创建 app_assignment_submissions 表...\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS app_assignment_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

    -- 添加 RLS 策略
    ALTER TABLE app_assignment_submissions ENABLE ROW LEVEL SECURITY;

    -- 允许认证用户读取
    CREATE POLICY "Allow authenticated read" ON app_assignment_submissions
      FOR SELECT TO authenticated USING (true);

    -- 允许学生提交自己的作业
    CREATE POLICY "Allow students to submit" ON app_assignment_submissions
      FOR INSERT TO authenticated 
      WITH CHECK (auth.uid() = student_id);

    -- 允许教师批改
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

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ 创建表失败:', error.message);
      
      // 尝试直接执行 SQL
      console.log('\n🔄 尝试直接执行 SQL...');
      const { error: directError } = await supabase
        .from('app_assignment_submissions')
        .select('id')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('💡 请手动在 Supabase Dashboard 中执行以下 SQL:');
        console.log(createTableSQL);
      }
    } else {
      console.log('✅ 表创建成功！');
    }
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
    console.log('\n💡 请手动在 Supabase Dashboard 中执行 SQL');
  }
}

createTable();
