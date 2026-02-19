import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableAllRLS() {
    console.log('完全禁用个人资料相关表的RLS...\n');
    
    const tables = [
        'app_user_skills',
        'app_user_achievements',
        'app_learning_activity',
        'app_achievements'
    ];
    
    for (const table of tables) {
        console.log(`禁用 ${table}...`);
        
        // 删除所有策略
        const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: `
                DO $$
                DECLARE
                    pol RECORD;
                BEGIN
                    FOR pol IN 
                        SELECT policyname 
                        FROM pg_policies 
                        WHERE tablename = '${table}'
                    LOOP
                        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON ${table}';
                    END LOOP;
                END $$;
            `
        });
        
        if (dropError) {
            console.log(`  删除策略: ${dropError.message}`);
        }
        
        // 禁用RLS
        const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
        
        if (error) {
            console.error(`  ❌ 错误: ${error.message}`);
        } else {
            console.log(`  ✅ RLS已禁用`);
        }
    }
    
    console.log('\n✅ 所有表的RLS已完全禁用！');
    console.log('请刷新页面查看数据。');
}

disableAllRLS().catch(console.error);
