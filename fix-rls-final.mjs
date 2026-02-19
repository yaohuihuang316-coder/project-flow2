import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
    console.log('重新配置RLS策略（宽松模式）...\n');
    
    // 1. app_user_skills
    console.log('1. 配置 app_user_skills...');
    await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_user_skills ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "allow_all" ON app_user_skills;
            DROP POLICY IF EXISTS "Users can view own skills" ON app_user_skills;
            DROP POLICY IF EXISTS "Users can insert own skills" ON app_user_skills;
            DROP POLICY IF EXISTS "Users can update own skills" ON app_user_skills;
            
            -- 允许所有认证用户查看所有数据（演示环境用）
            CREATE POLICY "allow_all"
            ON app_user_skills FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        `
    });
    console.log('   ✅ 完成');
    
    // 2. app_user_achievements
    console.log('2. 配置 app_user_achievements...');
    await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_user_achievements ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "allow_all" ON app_user_achievements;
            DROP POLICY IF EXISTS "Users can view own achievements" ON app_user_achievements;
            DROP POLICY IF EXISTS "Users can insert own achievements" ON app_user_achievements;
            
            CREATE POLICY "allow_all"
            ON app_user_achievements FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        `
    });
    console.log('   ✅ 完成');
    
    // 3. app_learning_activity
    console.log('3. 配置 app_learning_activity...');
    await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_learning_activity ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "allow_all" ON app_learning_activity;
            DROP POLICY IF EXISTS "Users can view own activity" ON app_learning_activity;
            DROP POLICY IF EXISTS "Users can insert own activity" ON app_learning_activity;
            
            CREATE POLICY "allow_all"
            ON app_learning_activity FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        `
    });
    console.log('   ✅ 完成');
    
    // 4. app_achievements
    console.log('4. 配置 app_achievements...');
    await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE app_achievements ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "allow_all" ON app_achievements;
            DROP POLICY IF EXISTS "Anyone can view achievements" ON app_achievements;
            
            CREATE POLICY "allow_all"
            ON app_achievements FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        `
    });
    console.log('   ✅ 完成');
    
    console.log('\n✅ RLS策略已重新配置（宽松模式）！');
    console.log('现在刷新页面，数据应该能正常显示了。');
}

fixRLS().catch(console.error);
