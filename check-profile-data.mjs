import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('检查演示账号数据...\n');
    
    const userIds = ['test-free-001', 'test-pro-001', 'test-pp-001'];
    
    for (const userId of userIds) {
        console.log(`\n=== 用户: ${userId} ===`);
        
        // 1. 检查学习活动
        const { data: activities, error: actError, count: actCount } = await supabase
            .from('app_learning_activity')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        
        console.log(`\n1. 学习活动 (${actCount || 0} 条):`);
        if (actError) {
            console.error('   错误:', actError.message);
        } else if (activities && activities.length > 0) {
            console.log('   前3条记录:');
            activities.slice(0, 3).forEach(act => {
                console.log(`   - ${act.activity_date}: ${act.xp_earned} XP (${act.activity_type})`);
            });
        } else {
            console.log('   ⚠️ 没有数据');
        }
        
        // 2. 检查能力雷达
        const { data: skills, error: skillError } = await supabase
            .from('app_user_skills')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        console.log(`\n2. 能力雷达:`);
        if (skillError) {
            console.error('   错误:', skillError.message);
        } else if (skills) {
            console.log(`   规划:${skills.plan_score} 执行:${skills.exec_score} 成本:${skills.cost_score}`);
            console.log(`   风险:${skills.risk_score} 领导:${skills.lead_score} 敏捷:${skills.agile_score}`);
        } else {
            console.log('   ⚠️ 没有数据');
        }
        
        // 3. 检查成就
        const { data: achievements, error: achError, count: achCount } = await supabase
            .from('app_user_achievements')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        
        console.log(`\n3. 成就解锁 (${achCount || 0} 个):`);
        if (achError) {
            console.error('   错误:', achError.message);
        } else if (achievements && achievements.length > 0) {
            console.log('   已解锁成就ID:', achievements.map(a => a.achievement_id).join(', '));
        } else {
            console.log('   ⚠️ 没有数据');
        }
    }
    
    // 检查表是否存在
    console.log('\n\n=== 检查表结构 ===');
    
    const tables = ['app_learning_activity', 'app_user_skills', 'app_user_achievements', 'app_achievements'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
        
        if (error) {
            console.error(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: 表存在`);
        }
    }
}

checkData().catch(console.error);
