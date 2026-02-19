import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    const userId = 'test-pp-001';
    
    console.log('调试用户:', userId, '\n');
    
    // 1. 检查app_user_skills表结构和数据
    console.log('1. 检查 app_user_skills 表:');
    const { data: skills, error: skillsError } = await supabase
        .from('app_user_skills')
        .select('*')
        .eq('user_id', userId);
    
    console.log('   查询结果:', skills ? `${skills.length} 条` : 'null');
    console.log('   错误:', skillsError ? skillsError.message : '无');
    if (skills && skills.length > 0) {
        console.log('   第一条数据:', skills[0]);
    }
    
    // 2. 检查app_user_achievements表
    console.log('\n2. 检查 app_user_achievements 表:');
    const { data: achievements, error: achError } = await supabase
        .from('app_user_achievements')
        .select('*')
        .eq('user_id', userId);
    
    console.log('   查询结果:', achievements ? `${achievements.length} 条` : 'null');
    console.log('   错误:', achError ? achError.message : '无');
    
    // 3. 检查app_learning_activity表
    console.log('\n3. 检查 app_learning_activity 表:');
    const { data: activities, error: actError } = await supabase
        .from('app_learning_activity')
        .select('*')
        .eq('user_id', userId)
        .limit(5);
    
    console.log('   查询结果:', activities ? `${activities.length} 条` : 'null');
    console.log('   错误:', actError ? actError.message : '无');
    if (activities && activities.length > 0) {
        console.log('   第一条数据:', activities[0]);
    }
    
    // 4. 检查RLS策略
    console.log('\n4. 检查表结构:');
    const tables = ['app_user_skills', 'app_user_achievements', 'app_learning_activity'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
        
        console.log(`   ${table}: ${error ? '错误: ' + error.message : '正常'}`);
    }
    
    // 5. 重新插入数据测试
    console.log('\n5. 重新插入测试数据:');
    
    // 删除旧数据
    await supabase.from('app_user_skills').delete().eq('user_id', userId);
    await supabase.from('app_user_achievements').delete().eq('user_id', userId);
    await supabase.from('app_learning_activity').delete().eq('user_id', userId);
    
    console.log('   已删除旧数据');
    
    // 插入能力数据
    const { error: insertSkillError } = await supabase
        .from('app_user_skills')
        .insert({
            user_id: userId,
            plan_score: 92,
            exec_score: 88,
            cost_score: 90,
            risk_score: 95,
            lead_score: 87,
            agile_score: 93,
            calculated_at: new Date().toISOString()
        });
    
    console.log('   插入能力数据:', insertSkillError ? '失败: ' + insertSkillError.message : '成功');
    
    // 插入学习活动
    const today = new Date();
    const activityData = [];
    for (let i = 1; i <= 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        activityData.push({
            user_id: userId,
            activity_date: date.toISOString().split('T')[0],
            xp_earned: Math.floor(Math.random() * 50 + 20),
            activity_type: ['course', 'simulation', 'tool', 'login'][i % 4]
        });
    }
    
    const { error: insertActError } = await supabase
        .from('app_learning_activity')
        .insert(activityData);
    
    console.log('   插入学习活动:', insertActError ? '失败: ' + insertActError.message : `成功 (${activityData.length}条)`);
    
    // 获取成就ID并插入
    const { data: achDefs } = await supabase
        .from('app_achievements')
        .select('id')
        .limit(5);
    
    if (achDefs) {
        const userAchievements = achDefs.map(ach => ({
            user_id: userId,
            achievement_id: ach.id,
            unlocked_at: new Date().toISOString(),
            is_new: false,
            progress: 100
        }));
        
        const { error: insertAchError } = await supabase
            .from('app_user_achievements')
            .insert(userAchievements);
        
        console.log('   插入成就:', insertAchError ? '失败: ' + insertAchError.message : `成功 (${userAchievements.length}个)`);
    }
    
    console.log('\n✅ 数据重新插入完成！请刷新页面查看。');
}

debugData().catch(console.error);
