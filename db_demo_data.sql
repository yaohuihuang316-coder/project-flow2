-- ==========================================
-- 演示账号数据填充脚本
-- ==========================================

-- 演示账号ID
DO $$
DECLARE
    demo_user_id TEXT := 'test-pro-001';
    demo_user_id_2 TEXT := 'test-pp-001';
    demo_user_id_3 TEXT := 'test-free-001';
    current_date_val DATE;
    i INTEGER;
BEGIN
    -- 1. 为 Pro 演示账号添加学习活动数据（过去90天）
    FOR i IN 0..90 LOOP
        current_date_val := CURRENT_DATE - i;
        
        -- 随机生成活动（不是所有天都有活动）
        IF random() > 0.3 THEN
            -- 课程学习活动
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id,
                current_date_val,
                'course',
                (random() * 50 + 10)::INTEGER,
                jsonb_build_object('course_name', '项目管理基础', 'duration_minutes', (random() * 60 + 30)::INTEGER)
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
        
        -- 模拟演练活动（频率较低）
        IF random() > 0.8 THEN
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id,
                current_date_val,
                'simulation',
                (random() * 100 + 50)::INTEGER,
                jsonb_build_object('scenario', '项目危机处理', 'score', (random() * 30 + 70)::INTEGER)
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
        
        -- 工具使用活动
        IF random() > 0.6 THEN
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id,
                current_date_val,
                'tool',
                (random() * 30 + 10)::INTEGER,
                jsonb_build_object('tool_name', '蒙特卡洛模拟器', 'usage_count', (random() * 5 + 1)::INTEGER)
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
        
        -- 登录活动（几乎每天都有）
        IF random() > 0.1 THEN
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id,
                current_date_val,
                'login',
                5,
                jsonb_build_object('login_time', '09:00')
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
    END LOOP;
    
    -- 2. 为 Pro 演示账号添加技能评分
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (
        demo_user_id,
        75,  -- Plan
        68,  -- Exec
        82,  -- Cost
        70,  -- Risk
        65,  -- Lead
        78,  -- Agile
        NOW() -- calculated_at
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
    -- 3. 为 Pro 演示账号解锁一些徽章
    INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, progress, is_new)
    SELECT 
        demo_user_id,
        a.id,
        NOW() - (random() * 30 || ' days')::INTERVAL,
        100,
        FALSE
    FROM app_achievements a
    WHERE a.code IN ('scenario_starter', 'course_warrior', 'early_bird', 'streak_warrior', 'tool_expert', 'community_active')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- 4. 为 Pro+ 演示账号添加更丰富的数据
    FOR i IN 0..90 LOOP
        current_date_val := CURRENT_DATE - i;
        
        IF random() > 0.2 THEN
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id_2,
                current_date_val,
                CASE 
                    WHEN random() < 0.4 THEN 'course'
                    WHEN random() < 0.6 THEN 'simulation'
                    WHEN random() < 0.8 THEN 'tool'
                    ELSE 'login'
                END,
                (random() * 80 + 20)::INTEGER,
                '{}'::jsonb
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Pro+ 技能评分（更高）
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (
        demo_user_id_2,
        92,  -- Plan
        88,  -- Exec
        95,  -- Cost
        85,  -- Risk
        90,  -- Lead
        93,  -- Agile
        NOW() -- calculated_at
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
    -- Pro+ 解锁更多徽章
    INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, progress, is_new)
    SELECT 
        demo_user_id_2,
        a.id,
        NOW() - (random() * 60 || ' days')::INTERVAL,
        100,
        FALSE
    FROM app_achievements a
    WHERE a.code IN ('scenario_starter', 'simulation_expert', 'course_warrior', 'streak_master', 
                     'all_rounder', 'tool_expert', 'fishbone_master', 'community_active', 'helper')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- 5. 为 Free 演示账号添加少量数据
    FOR i IN 0..30 LOOP
        current_date_val := CURRENT_DATE - i;
        
        IF random() > 0.7 THEN
            INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
            VALUES (
                demo_user_id_3,
                current_date_val,
                'login',
                5,
                '{}'::jsonb
            )
            ON CONFLICT (user_id, activity_date, activity_type) DO NOTHING;
        END IF;
    END LOOP;
    
    -- Free 技能评分（基础水平）
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (
        demo_user_id_3,
        25,  -- Plan
        20,  -- Exec
        15,  -- Cost
        22,  -- Risk
        30,  -- Lead
        18,  -- Agile
        NOW() -- calculated_at
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
END $$;

-- 查询验证
SELECT '演示数据插入完成' as status;

-- 显示统计数据
SELECT 
    '学习活动' as category,
    user_id,
    COUNT(*) as count,
    SUM(xp_earned) as total_xp
FROM app_learning_activity 
WHERE user_id LIKE 'test-%'
GROUP BY user_id;

SELECT 
    '技能评分' as category,
    user_id,
    plan_score || '/' || exec_score || '/' || cost_score || '/' || risk_score || '/' || lead_score || '/' || agile_score as scores
FROM app_user_skills 
WHERE user_id LIKE 'test-%';

SELECT 
    '已解锁徽章' as category,
    ua.user_id,
    COUNT(*) as badge_count
FROM app_user_achievements ua
WHERE ua.user_id LIKE 'test-%'
GROUP BY ua.user_id;
