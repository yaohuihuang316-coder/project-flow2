-- 为演示账号添加个人资料数据
-- 包括：学习活动热力图、能力雷达、成就徽章

-- 演示账号ID
DO $$
DECLARE
    v_user_id UUID;
    v_achievement_id UUID;
    v_today DATE := CURRENT_DATE;
    v_date DATE;
    i INT;
    j INT;
BEGIN
    -- ==========================================
    -- 1. 为 Free 用户 (test-free-001) 添加数据
    -- ==========================================
    v_user_id := 'test-free-001';
    
    -- 1.1 添加学习活动数据（过去90天的热力图数据）
    FOR i IN 1..30 LOOP
        v_date := v_today - (i * 3);
        INSERT INTO app_learning_activity (id, user_id, activity_date, xp_earned, activity_type, created_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            v_date,
            (random() * 50 + 10)::int,
            CASE (i % 4)
                WHEN 0 THEN 'course'
                WHEN 1 THEN 'simulation'
                WHEN 2 THEN 'tool'
                ELSE 'login'
            END,
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 1.2 添加能力雷达数据
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (v_user_id, 65, 70, 60, 75, 68, 72, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
    -- 1.3 解锁部分成就（解锁5个）
    FOR v_achievement_id IN 
        SELECT id FROM app_achievements ORDER BY rarity DESC LIMIT 5
    LOOP
        INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new, progress)
        VALUES (v_user_id, v_achievement_id, NOW() - (random() * 30 || ' days')::interval, false, 100)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
    
    -- ==========================================
    -- 2. 为 Pro 用户 (test-pro-001) 添加数据
    -- ==========================================
    v_user_id := 'test-pro-001';
    
    -- 2.1 添加学习活动数据（过去120天的热力图数据，更活跃）
    FOR i IN 1..60 LOOP
        v_date := v_today - (i * 2);
        INSERT INTO app_learning_activity (id, user_id, activity_date, xp_earned, activity_type, created_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            v_date,
            (random() * 80 + 20)::int,
            CASE (i % 4)
                WHEN 0 THEN 'course'
                WHEN 1 THEN 'simulation'
                WHEN 2 THEN 'tool'
                ELSE 'login'
            END,
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 2.2 添加能力雷达数据（Pro用户能力更强）
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (v_user_id, 78, 82, 75, 85, 80, 88, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
    -- 2.3 解锁更多成就（解锁9个）
    FOR v_achievement_id IN 
        SELECT id FROM app_achievements ORDER BY rarity DESC LIMIT 9
    LOOP
        INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new, progress)
        VALUES (v_user_id, v_achievement_id, NOW() - (random() * 60 || ' days')::interval, false, 100)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
    
    -- ==========================================
    -- 3. 为 ProPlus 用户 (test-pp-001) 添加数据
    -- ==========================================
    v_user_id := 'test-pp-001';
    
    -- 3.1 添加学习活动数据（过去180天的热力图数据，非常活跃）
    FOR i IN 1..90 LOOP
        v_date := v_today - i;
        INSERT INTO app_learning_activity (id, user_id, activity_date, xp_earned, activity_type, created_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            v_date,
            (random() * 100 + 30)::int,
            CASE (i % 4)
                WHEN 0 THEN 'course'
                WHEN 1 THEN 'simulation'
                WHEN 2 THEN 'tool'
                ELSE 'login'
            END,
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 3.2 添加能力雷达数据（ProPlus用户能力最强）
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (v_user_id, 92, 88, 90, 95, 87, 93, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
    
    -- 3.3 解锁大部分成就（解锁12个）
    FOR v_achievement_id IN 
        SELECT id FROM app_achievements ORDER BY rarity DESC LIMIT 12
    LOOP
        INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new, progress)
        VALUES (v_user_id, v_achievement_id, NOW() - (random() * 90 || ' days')::interval, false, 100)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '演示账号数据添加完成！';
    
END $$;

-- 验证数据
SELECT '学习活动统计' as check_item, user_id, COUNT(*) as count 
FROM app_learning_activity 
WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001')
GROUP BY user_id;

SELECT '能力雷达统计' as check_item, user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score
FROM app_user_skills 
WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001');

SELECT '成就解锁统计' as check_item, user_id, COUNT(*) as unlocked_count
FROM app_user_achievements 
WHERE user_id IN ('test-free-001', 'test-pro-001', 'test-pp-001')
GROUP BY user_id;
