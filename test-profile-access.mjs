import { createClient } from '@supabase/supabase-js';

// 使用匿名密钥（模拟前端用户）
const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NTI0MTQsImV4cCI6MjA1NDQyODQxNH0.VMSkRmDZzK0qO9eL9Z1L2q3L4q5L6q7L8q9L0q1L2q';

const supabase = createClient(supabaseUrl, anonKey);

async function testAsAnonymous() {
    console.log('以匿名用户测试数据读取...\n');
    
    // 先登录一个演示账号
    console.log('1. 登录演示账号 (free@test.com)...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'free@test.com',
        password: 'demo123456'
    });
    
    if (loginError) {
        console.error('   登录失败:', loginError.message);
        // 尝试直接测试，可能不需要登录
    } else {
        console.log('   ✅ 登录成功:', loginData.user?.id);
    }
    
    const userId = loginData?.user?.id || 'test-free-001';
    
    // 测试读取学习活动
    console.log('\n2. 测试读取学习活动...');
    const { data: activities, error: actError } = await supabase
        .from('app_learning_activity')
        .select('*')
        .eq('user_id', userId)
        .limit(3);
    
    if (actError) {
        console.error('   ❌ 错误:', actError.message);
    } else {
        console.log(`   ✅ 成功读取 ${activities?.length || 0} 条记录`);
        if (activities && activities.length > 0) {
            console.log('   样例:', activities[0]);
        }
    }
    
    // 测试读取能力雷达
    console.log('\n3. 测试读取能力雷达...');
    const { data: skills, error: skillError } = await supabase
        .from('app_user_skills')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (skillError) {
        console.error('   ❌ 错误:', skillError.message);
    } else {
        console.log('   ✅ 成功读取能力数据');
        console.log('   数据:', skills);
    }
    
    // 测试读取成就
    console.log('\n4. 测试读取成就...');
    const { data: achievements, error: achError } = await supabase
        .from('app_user_achievements')
        .select('*')
        .eq('user_id', userId)
        .limit(3);
    
    if (achError) {
        console.error('   ❌ 错误:', achError.message);
    } else {
        console.log(`   ✅ 成功读取 ${achievements?.length || 0} 条记录`);
    }
    
    // 测试读取成就定义
    console.log('\n5. 测试读取成就定义...');
    const { data: achDefs, error: achDefError } = await supabase
        .from('app_achievements')
        .select('*')
        .limit(3);
    
    if (achDefError) {
        console.error('   ❌ 错误:', achDefError.message);
    } else {
        console.log(`   ✅ 成功读取 ${achDefs?.length || 0} 条成就定义`);
    }
    
    // 登出
    await supabase.auth.signOut();
}

testAsAnonymous().catch(console.error);
