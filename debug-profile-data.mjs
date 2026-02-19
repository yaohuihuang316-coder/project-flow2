import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoginAndData() {
    console.log('模拟登录流程测试...\n');
    
    // 1. 检查用户表中的演示账号
    console.log('1. 检查app_users表中的演示账号:');
    const { data: users, error: userError } = await supabase
        .from('app_users')
        .select('id, email, name, role')
        .ilike('email', '%@test.com')
        .limit(10);
    
    if (userError) {
        console.error('   错误:', userError.message);
    } else {
        console.log(`   找到 ${users?.length} 个演示账号:`);
        users?.forEach(u => console.log(`   - ${u.email}: ${u.id} (${u.name})`));
    }
    
    // 2. 检查auth.users表
    console.log('\n2. 检查auth.users中的账号:');
    const { data: authUsers, error: authError } = await supabase
        .rpc('get_auth_users');
    
    if (authError) {
        console.error('   错误:', authError.message);
        console.log('   (需要创建RPC函数或直接查询)');
    } else {
        console.log('   找到账号:', authUsers);
    }
    
    // 3. 检查数据是否关联正确
    console.log('\n3. 检查数据关联:');
    for (const user of users || []) {
        console.log(`\n   用户: ${user.email}`);
        
        // 检查学习活动
        const { data: act, error: actErr } = await supabase
            .from('app_learning_activity')
            .select('count')
            .eq('user_id', user.id);
        console.log(`   - 学习活动: ${actErr ? '错误: ' + actErr.message : (act?.length || 0) + ' 条'}`);
        
        // 检查能力雷达
        const { data: skill, error: skillErr } = await supabase
            .from('app_user_skills')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        console.log(`   - 能力雷达: ${skillErr ? '错误: ' + skillErr.message : (skill ? '有数据' : '无数据')}`);
        
        // 检查成就
        const { data: ach, error: achErr } = await supabase
            .from('app_user_achievements')
            .select('count')
            .eq('user_id', user.id);
        console.log(`   - 成就: ${achErr ? '错误: ' + achErr.message : (ach?.length || 0) + ' 个'}`);
    }
    
    // 4. 检查Profile页面使用的查询
    console.log('\n4. 模拟Profile页面查询:');
    const testUserId = users?.[0]?.id;
    if (testUserId) {
        console.log(`   测试用户ID: ${testUserId}`);
        
        // 查询1: 学习活动
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { data: activityRaw, error: actError2 } = await supabase
            .from('app_learning_activity')
            .select('*')
            .eq('user_id', testUserId)
            .gte('activity_date', oneYearAgo.toISOString().split('T')[0]);
        
        console.log(`   - 学习活动查询: ${actError2 ? '错误: ' + actError2.message : (activityRaw?.length || 0) + ' 条'}`);
        
        // 查询2: 能力雷达
        const { data: skillsData, error: skillError2 } = await supabase
            .from('app_user_skills')
            .select('*')
            .eq('user_id', testUserId)
            .single();
        
        console.log(`   - 能力雷达查询: ${skillError2 ? '错误: ' + skillError2.message : (skillsData ? '成功' : '无数据')}`);
        
        // 查询3: 成就定义
        const { data: achievementsData, error: achDefError } = await supabase
            .from('app_achievements')
            .select('*')
            .order('rarity', { ascending: false });
        
        console.log(`   - 成就定义查询: ${achDefError ? '错误: ' + achDefError.message : (achievementsData?.length || 0) + ' 个定义'}`);
        
        // 查询4: 用户成就
        const { data: userAchData, error: userAchError } = await supabase
            .from('app_user_achievements')
            .select('*')
            .eq('user_id', testUserId);
        
        console.log(`   - 用户成就查询: ${userAchError ? '错误: ' + userAchError.message : (userAchData?.length || 0) + ' 个'}`);
    }
}

checkLoginAndData().catch(console.error);
