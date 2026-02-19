import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUUIDUsers() {
    console.log('为UUID格式的演示账号添加数据...\n');
    
    const today = new Date();
    
    // UUID格式的演示账号
    const uuidUsers = [
        { 
            id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 
            email: 'free@test.com',
            name: 'Free用户(UUID)', 
            activityDays: 30, 
            achievements: 5, 
            skillLevel: 'beginner' 
        },
        { 
            id: 'c3d4e5f6-a7b8-9012-cdef-345678901234', 
            email: 'pro@test.com',
            name: 'Pro用户(UUID)', 
            activityDays: 60, 
            achievements: 9, 
            skillLevel: 'intermediate' 
        },
        { 
            id: 'd4e5f6a7-b8c9-0123-defa-456789012345', 
            email: 'pp@test.com',
            name: 'ProPlus用户(UUID)', 
            activityDays: 90, 
            achievements: 12, 
            skillLevel: 'expert' 
        }
    ];
    
    for (const user of uuidUsers) {
        console.log(`处理 ${user.name} (${user.id})...`);
        
        // 1. 添加学习活动数据
        console.log('  - 添加学习活动数据...');
        const activityData = [];
        for (let i = 1; i <= user.activityDays; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * (user.skillLevel === 'expert' ? 1 : user.skillLevel === 'intermediate' ? 2 : 3)));
            
            activityData.push({
                user_id: user.id,
                activity_date: date.toISOString().split('T')[0],
                xp_earned: Math.floor(Math.random() * (user.skillLevel === 'expert' ? 100 : user.skillLevel === 'intermediate' ? 80 : 50) + (user.skillLevel === 'expert' ? 30 : user.skillLevel === 'intermediate' ? 20 : 10)),
                activity_type: ['course', 'simulation', 'tool', 'login'][i % 4]
            });
        }
        
        // 先删除旧数据
        await supabase.from('app_learning_activity').delete().eq('user_id', user.id);
        
        const { error: activityError } = await supabase
            .from('app_learning_activity')
            .insert(activityData);
        
        if (activityError) {
            console.error('    错误:', activityError.message);
        } else {
            console.log(`    ✓ 添加了 ${activityData.length} 条学习活动记录`);
        }
        
        // 2. 添加能力雷达数据
        console.log('  - 添加能力雷达数据...');
        const skillScores = {
            'beginner': { plan: 65, exec: 70, cost: 60, risk: 75, lead: 68, agile: 72 },
            'intermediate': { plan: 78, exec: 82, cost: 75, risk: 85, lead: 80, agile: 88 },
            'expert': { plan: 92, exec: 88, cost: 90, risk: 95, lead: 87, agile: 93 }
        };
        
        const scores = skillScores[user.skillLevel];
        const { error: skillsError } = await supabase
            .from('app_user_skills')
            .upsert({
                user_id: user.id,
                plan_score: scores.plan,
                exec_score: scores.exec,
                cost_score: scores.cost,
                risk_score: scores.risk,
                lead_score: scores.lead,
                agile_score: scores.agile,
                calculated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        
        if (skillsError) {
            console.error('    错误:', skillsError.message);
        } else {
            console.log('    ✓ 能力雷达数据已更新');
        }
        
        // 3. 解锁成就
        console.log('  - 解锁成就徽章...');
        const { data: achievements, error: achError } = await supabase
            .from('app_achievements')
            .select('id')
            .order('rarity', { ascending: false })
            .limit(user.achievements);
        
        if (achError) {
            console.error('    错误:', achError.message);
            continue;
        }
        
        // 先删除旧数据
        await supabase.from('app_user_achievements').delete().eq('user_id', user.id);
        
        const userAchievements = achievements.map((ach) => ({
            user_id: user.id,
            achievement_id: ach.id,
            unlocked_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            is_new: false,
            progress: 100
        }));
        
        const { error: userAchError } = await supabase
            .from('app_user_achievements')
            .insert(userAchievements);
        
        if (userAchError) {
            console.error('    错误:', userAchError.message);
        } else {
            console.log(`    ✓ 解锁了 ${userAchievements.length} 个成就`);
        }
        
        console.log('');
    }
    
    console.log('✅ UUID账号数据添加完成！');
}

seedUUIDUsers().catch(console.error);
