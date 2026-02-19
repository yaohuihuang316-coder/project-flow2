import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log('检查RLS策略...\n');
    
    // 检查表的RLS状态
    const tables = [
        'app_user_skills',
        'app_user_achievements', 
        'app_learning_activity',
        'app_achievements'
    ];
    
    for (const table of tables) {
        console.log(`\n表: ${table}`);
        
        // 查询RLS策略
        const { data: policies, error } = await supabase
            .rpc('get_policies', { table_name: table });
        
        if (error) {
            console.log('  无法查询策略:', error.message);
        } else {
            console.log('  策略:', policies);
        }
        
        // 测试查询
        const { data, error: queryError } = await supabase
            .from(table)
            .select('count')
            .limit(1);
        
        console.log('  查询测试:', queryError ? `错误: ${queryError.message}` : '成功');
    }
}

checkRLS().catch(console.error);
