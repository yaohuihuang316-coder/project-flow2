import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('检查演示账号的实际ID...\n');
    
    // 查询演示账号
    const { data: users, error } = await supabase
        .from('app_users')
        .select('id, email, name')
        .in('email', ['free@test.com', 'pro@test.com', 'pp@test.com']);
    
    if (error) {
        console.error('错误:', error.message);
        return;
    }
    
    console.log('找到的演示账号:');
    users?.forEach(user => {
        console.log(`  - ${user.name}: ${user.email}`);
        console.log(`    ID: ${user.id}`);
        console.log('');
    });
    
    // 检查数据是否匹配
    console.log('\n检查数据匹配...');
    for (const user of users || []) {
        const { data: activities } = await supabase
            .from('app_learning_activity')
            .select('count')
            .eq('user_id', user.id);
        
        const { data: skills } = await supabase
            .from('app_user_skills')
            .select('*')
            .eq('user_id', user.id);
        
        const { data: achievements } = await supabase
            .from('app_user_achievements')
            .select('count')
            .eq('user_id', user.id);
        
        console.log(`\n${user.name} (${user.id}):`);
        console.log(`  - 学习活动: ${activities?.length || 0}`);
        console.log(`  - 能力数据: ${skills ? '有' : '无'}`);
        console.log(`  - 成就: ${achievements?.length || 0}`);
    }
}

checkUsers().catch(console.error);
