import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
    console.log('临时禁用个人资料表的RLS进行测试...\n');
    
    const tables = [
        'app_user_skills',
        'app_user_achievements',
        'app_learning_activity',
        'app_achievements'
    ];
    
    for (const table of tables) {
        console.log(`禁用 ${table} 的RLS...`);
        
        const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
        
        if (error) {
            console.error(`  错误: ${error.message}`);
        } else {
            console.log('  ✅ 已禁用');
        }
    }
    
    console.log('\n✅ RLS已临时禁用，请刷新页面测试！');
    console.log('测试完成后记得重新启用RLS');
}

disableRLS().catch(console.error);
