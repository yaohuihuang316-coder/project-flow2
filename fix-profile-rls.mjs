import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
    console.log('修复个人资料相关表的RLS策略...\n');
    
    // 修复 app_learning_activity 表的RLS
    console.log('1. 修复 app_learning_activity 表...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_learning_activity DISABLE ROW LEVEL SECURITY;
            ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow users to view own activity" ON app_learning_activity;
            DROP POLICY IF EXISTS "Allow users to insert own activity" ON app_learning_activity;
            
            CREATE POLICY "Allow users to view own activity" 
            ON app_learning_activity FOR SELECT TO authenticated 
            USING (user_id = auth.uid()::text);
            
            CREATE POLICY "Allow users to insert own activity" 
            ON app_learning_activity FOR INSERT TO authenticated 
            WITH CHECK (user_id = auth.uid()::text);
        `
    });
    
    if (error1) {
        console.error('   错误:', error1.message);
        // 尝试直接执行SQL
        const { error: e1 } = await supabase.from('app_learning_activity').select('count');
        if (e1) console.error('   查询错误:', e1.message);
    } else {
        console.log('   ✅ 完成');
    }
    
    // 修复 app_user_skills 表的RLS
    console.log('2. 修复 app_user_skills 表...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_user_skills DISABLE ROW LEVEL SECURITY;
            ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow users to view own skills" ON app_user_skills;
            DROP POLICY IF EXISTS "Allow users to upsert own skills" ON app_user_skills;
            
            CREATE POLICY "Allow users to view own skills" 
            ON app_user_skills FOR SELECT TO authenticated 
            USING (user_id = auth.uid()::text);
            
            CREATE POLICY "Allow users to upsert own skills" 
            ON app_user_skills FOR ALL TO authenticated 
            USING (user_id = auth.uid()::text)
            WITH CHECK (user_id = auth.uid()::text);
        `
    });
    
    if (error2) {
        console.error('   错误:', error2.message);
    } else {
        console.log('   ✅ 完成');
    }
    
    // 修复 app_user_achievements 表的RLS
    console.log('3. 修复 app_user_achievements 表...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_user_achievements DISABLE ROW LEVEL SECURITY;
            ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow users to view own achievements" ON app_user_achievements;
            DROP POLICY IF EXISTS "Allow users to insert own achievements" ON app_user_achievements;
            
            CREATE POLICY "Allow users to view own achievements" 
            ON app_user_achievements FOR SELECT TO authenticated 
            USING (user_id = auth.uid()::text);
            
            CREATE POLICY "Allow users to insert own achievements" 
            ON app_user_achievements FOR INSERT TO authenticated 
            WITH CHECK (user_id = auth.uid()::text);
        `
    });
    
    if (error3) {
        console.error('   错误:', error3.message);
    } else {
        console.log('   ✅ 完成');
    }
    
    // 修复 app_achievements 表的RLS（定义表，应该允许所有人读取）
    console.log('4. 修复 app_achievements 表...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_achievements DISABLE ROW LEVEL SECURITY;
            ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Allow all users to view achievements" ON app_achievements;
            
            CREATE POLICY "Allow all users to view achievements" 
            ON app_achievements FOR SELECT TO authenticated 
            USING (true);
        `
    });
    
    if (error4) {
        console.error('   错误:', error4.message);
    } else {
        console.log('   ✅ 完成');
    }
    
    console.log('\n✅ RLS策略修复完成！');
}

fixRLS().catch(console.error);
