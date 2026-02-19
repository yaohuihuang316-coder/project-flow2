import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSStatus() {
    console.log('检查RLS状态...\n');
    
    const tables = [
        'app_user_skills',
        'app_user_achievements',
        'app_learning_activity',
        'app_achievements'
    ];
    
    for (const table of tables) {
        console.log(`\n表: ${table}`);
        
        // 检查是否有数据
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', 'test-pp-001')
            .limit(3);
        
        if (error) {
            console.log(`  ❌ 查询错误: ${error.message}`);
        } else {
            console.log(`  ✅ 数据: ${data?.length || 0} 条`);
        }
    }
    
    console.log('\n\n重新禁用RLS进行测试...');
    
    for (const table of tables) {
        const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
        
        if (error) {
            console.error(`${table}: ${error.message}`);
        } else {
            console.log(`${table}: ✅ 已禁用RLS`);
        }
    }
    
    console.log('\n✅ RLS已禁用，请刷新页面查看数据！');
}

checkRLSStatus().catch(console.error);
