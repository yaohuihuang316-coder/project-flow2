import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  console.log('🔧 使用 Service Role Key 执行 SQL...\n');

  // SQL 语句 - 创建表
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

  try {
    // 方法1: 尝试使用 pg_execute 函数
    console.log('📋 尝试使用 pg_execute...');
    const { error: execError } = await supabase.rpc('pg_execute', { 
      query: createTableSQL 
    });

    if (execError) {
      console.log('⚠️ pg_execute 失败:', execError.message);
      
      // 方法2: 尝试使用 exec_sql 函数
      console.log('📋 尝试使用 exec_sql...');
      const { error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (sqlError) {
        console.log('⚠️ exec_sql 失败:', sqlError.message);
        
        // 方法3: 使用 REST API 直接发送 SQL
        console.log('📋 尝试使用 REST API...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Prefer': 'tx=commit'
          },
          body: JSON.stringify({
            query: createTableSQL
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('⚠️ REST API 失败:', errorText);
          
          console.log('\n❌ 所有自动方法都失败了');
          console.log('💡 原因: Supabase 的 Service Role Key 默认不允许执行 DDL');
          console.log('📝 解决方案: 必须在 Supabase Dashboard 中手动执行 SQL');
          console.log('\n🔗 请访问:');
          console.log('   https://supabase.com/dashboard/project/ghhvdffsyvzkhbftifzy/sql/new');
          console.log('\n📋 然后复制执行 db_create_and_seed_submissions.sql 文件中的 SQL');
        } else {
          console.log('✅ 表创建成功！');
        }
      } else {
        console.log('✅ 表创建成功！');
      }
    } else {
      console.log('✅ 表创建成功！');
    }
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

executeSQL();
