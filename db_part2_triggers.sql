-- ========================================================-- ProjectFlow 数据库初始化 - Part 2: 触发器和函数-- 执行顺序: 第2个执行 (在 Part 1 之后)-- ========================================================
-- 第五部分：触发器和辅助函数
-- ========================================================

-- 通用触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 互动表触发器
DROP TRIGGER IF EXISTS update_app_questions_updated_at ON app_questions;
CREATE TRIGGER update_app_questions_updated_at
    BEFORE UPDATE ON app_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_question_replies_updated_at ON app_question_replies;
CREATE TRIGGER update_app_question_replies_updated_at
    BEFORE UPDATE ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussions_updated_at ON app_discussions;
CREATE TRIGGER update_app_discussions_updated_at
    BEFORE UPDATE ON app_discussions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_discussion_replies_updated_at ON app_discussion_replies;
CREATE TRIGGER update_app_discussion_replies_updated_at
    BEFORE UPDATE ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_notification_settings_updated_at ON app_notification_settings;
CREATE TRIGGER update_app_notification_settings_updated_at
    BEFORE UPDATE ON app_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 作业表触发器
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.app_assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.app_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.app_student_submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 触发器：自动更新讨论最后回复信息
CREATE OR REPLACE FUNCTION update_discussion_last_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_discussions
    SET 
        replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_name
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_discussion_last_reply ON app_discussion_replies;
CREATE TRIGGER trigger_update_discussion_last_reply
    AFTER INSERT ON app_discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_discussion_last_reply();

-- 触发器：更新问题回复数和状态
CREATE OR REPLACE FUNCTION update_question_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_questions
    SET 
        status = CASE 
            WHEN status = 'unanswered' THEN 'answered'
            ELSE status
        END
    WHERE id = NEW.question_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_question_on_reply ON app_question_replies;
CREATE TRIGGER trigger_update_question_on_reply
    AFTER INSERT ON app_question_replies
    FOR EACH ROW EXECUTE FUNCTION update_question_on_reply();

-- 触发器：自动更新作业统计
CREATE OR REPLACE FUNCTION update_assignment_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_assignments
    SET submitted_count = (
        SELECT COUNT(*) 
        FROM public.app_student_submissions 
        WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
    ),
    status = CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM public.app_student_submissions 
            WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
            AND status = 'graded'
        ) = total_count THEN 'completed'
        WHEN (
            SELECT COUNT(*) 
            FROM public.app_student_submissions 
            WHERE assignment_id = COALESCE(NEW.assignment_id, OLD.assignment_id)
        ) > 0 THEN 'grading'
        ELSE 'pending'
    END
    WHERE id = COALESCE(NEW.assignment_id, OLD.assignment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignment_stats_trigger ON public.app_student_submissions;
CREATE TRIGGER update_assignment_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_stats();

-- 触发器：自动标记迟交
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT deadline INTO assignment_deadline
    FROM public.app_assignments
    WHERE id = NEW.assignment_id;
    
    IF NEW.submitted_at > assignment_deadline THEN
        NEW.is_late := TRUE;
        NEW.status := 'late';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS check_late_submission_trigger ON public.app_student_submissions;
CREATE TRIGGER check_late_submission_trigger
    BEFORE INSERT ON public.app_student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_late_submission();

-- 课堂功能函数：计算投票结果
CREATE OR REPLACE FUNCTION calculate_poll_results(poll_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_object_agg(selected_option::text, vote_count)
    INTO result
    FROM (
        SELECT unnest(selected_options) as selected_option, COUNT(*) as vote_count
        FROM app_poll_votes
        WHERE poll_id = poll_uuid
        GROUP BY unnest(selected_options)
    ) subquery;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 课堂功能函数：更新课堂统计
CREATE OR REPLACE FUNCTION update_class_stats(session_uuid UUID)
RETURNS VOID AS $$
DECLARE
    v_total INTEGER;
    v_present INTEGER;
    v_late INTEGER;
    v_absent INTEGER;
    v_questions INTEGER;
    v_answered INTEGER;
    v_polls INTEGER;
    v_votes INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'present'),
        COUNT(*) FILTER (WHERE status = 'late'),
        COUNT(*) FILTER (WHERE status = 'absent')
    INTO v_total, v_present, v_late, v_absent
    FROM app_attendance
    WHERE session_id = session_uuid;
    
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'answered')
    INTO v_questions, v_answered
    FROM app_class_questions
    WHERE session_id = session_uuid;
    
    SELECT COUNT(*), COALESCE(SUM(total_votes), 0)
    INTO v_polls, v_votes
    FROM app_polls
    WHERE session_id = session_uuid;
    
    INSERT INTO app_class_stats (
        session_id, course_id, teacher_id, class_title, class_date,
        total_students, present_count, late_count, absent_count, attendance_rate,
        question_count, answered_questions, poll_count, total_votes
    )
    SELECT 
        s.id, s.course_id, s.teacher_id, s.title, s.actual_start::date,
        v_total, v_present, v_late, v_absent, 
        CASE WHEN v_total > 0 THEN ROUND((v_present + v_late)::numeric / v_total * 100, 2) ELSE 0 END,
        v_questions, v_answered, v_polls, COALESCE(v_votes, 0)
    FROM app_class_sessions s
    WHERE s.id = session_uuid
    ON CONFLICT (session_id) DO UPDATE SET
        total_students = v_total,
        present_count = v_present,
        late_count = v_late,
        absent_count = v_absent,
        attendance_rate = CASE WHEN v_total > 0 THEN ROUND((v_present + v_late)::numeric / v_total * 100, 2) ELSE 0 END,
        question_count = v_questions,
        answered_questions = v_answered,
        poll_count = v_polls,
        total_votes = v_votes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 作业管理函数：批量批改
CREATE OR REPLACE FUNCTION batch_grade_submissions(
    p_submission_ids UUID[],
    p_score INTEGER,
    p_comment TEXT,
    p_teacher_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_submission_id UUID;
BEGIN
    FOREACH v_submission_id IN ARRAY p_submission_ids
    LOOP
        UPDATE public.app_student_submissions
        SET score = p_score,
            comment = p_comment,
            status = 'graded',
            graded_by = p_teacher_id,
            graded_at = NOW()
        WHERE id = v_submission_id
        AND status != 'graded';
        
        IF FOUND THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ language 'plpgsql';

-- 作业管理函数：软删除作业
CREATE OR REPLACE FUNCTION soft_delete_assignment(p_assignment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.app_assignments
    SET is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id = p_assignment_id;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- 作业管理函数：检查作业状态
CREATE OR REPLACE FUNCTION check_assignment_status(p_assignment_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_total INTEGER;
    v_submitted INTEGER;
    v_graded INTEGER;
    v_status TEXT;
BEGIN
    SELECT total_count INTO v_total
    FROM public.app_assignments WHERE id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_submitted
    FROM public.app_student_submissions WHERE assignment_id = p_assignment_id;
    
    SELECT COUNT(*) INTO v_graded
    FROM public.app_student_submissions 
    WHERE assignment_id = p_assignment_id AND status = 'graded';
    
    IF v_graded = v_submitted AND v_submitted > 0 THEN
        v_status := 'completed';
    ELSIF v_submitted > 0 THEN
        v_status := 'grading';
    ELSE
        v_status := 'pending';
    END IF;
    
    RETURN v_status;
END;
$$ language 'plpgsql';

-- 个人资料函数：记录学习活动
CREATE OR REPLACE FUNCTION record_learning_activity(
    p_user_id TEXT,
    p_activity_type TEXT,
    p_xp_earned INTEGER DEFAULT 0,
    p_details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_learning_activity (user_id, activity_date, activity_type, xp_earned, details)
    VALUES (p_user_id, CURRENT_DATE, p_activity_type, p_xp_earned, p_details)
    ON CONFLICT (user_id, activity_date, activity_type) 
    DO UPDATE SET 
        xp_earned = app_learning_activity.xp_earned + EXCLUDED.xp_earned,
        details = app_learning_activity.details || EXCLUDED.details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 个人资料函数：检查并解锁徽章
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id TEXT)
RETURNS TABLE(achievement_id TEXT, is_new BOOLEAN) AS $$
DECLARE
    v_achievement RECORD;
    v_count INTEGER;
    v_should_unlock BOOLEAN;
BEGIN
    FOR v_achievement IN SELECT * FROM app_achievements LOOP
        IF EXISTS (
            SELECT 1 FROM app_user_achievements 
            WHERE user_id = p_user_id AND achievement_id = v_achievement.id
        ) THEN
            CONTINUE;
        END IF;
        
        v_should_unlock := FALSE;
        
        CASE v_achievement.unlock_type
            WHEN 'courses_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_course_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'simulations_completed' THEN
                SELECT COUNT(*) INTO v_count 
                FROM app_simulation_progress 
                WHERE user_id = p_user_id AND status = 'completed';
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'streak_days' THEN
                SELECT COALESCE(MAX(consecutive_days), 0) INTO v_count
                FROM (
                    SELECT COUNT(*) AS consecutive_days
                    FROM (
                        SELECT activity_date, 
                               activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::INTEGER AS grp
                        FROM app_learning_activity
                        WHERE user_id = p_user_id
                    ) t
                    GROUP BY grp
                ) streaks;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'tool_usage' THEN
                SELECT COUNT(DISTINCT tool_id) INTO v_count
                FROM lab_tool_history
                WHERE user_id = p_user_id;
                v_should_unlock := v_count >= v_achievement.unlock_threshold;
                
            WHEN 'skill_score' THEN
                SELECT COUNT(*) INTO v_count
                FROM app_user_skills
                WHERE user_id = p_user_id
                  AND plan_score >= v_achievement.unlock_threshold
                  AND exec_score >= v_achievement.unlock_threshold
                  AND cost_score >= v_achievement.unlock_threshold
                  AND risk_score >= v_achievement.unlock_threshold
                  AND lead_score >= v_achievement.unlock_threshold
                  AND agile_score >= v_achievement.unlock_threshold;
                v_should_unlock := v_count > 0;
        END CASE;
        
        IF v_should_unlock THEN
            INSERT INTO app_user_achievements (user_id, achievement_id, unlocked_at, is_new)
            VALUES (p_user_id, v_achievement.id, NOW(), TRUE);
            
            achievement_id := v_achievement.id;
            is_new := TRUE;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 个人资料函数：计算用户技能分数
CREATE OR REPLACE FUNCTION calculate_user_skills(p_user_id TEXT)
RETURNS VOID AS $$
DECLARE
    v_plan_score INTEGER := 0;
    v_exec_score INTEGER := 0;
    v_cost_score INTEGER := 0;
    v_risk_score INTEGER := 0;
    v_lead_score INTEGER := 0;
    v_agile_score INTEGER := 0;
BEGIN
    SELECT COALESCE(
        (SELECT AVG(score) * 10 
         FROM app_simulation_progress 
         WHERE user_id = p_user_id 
           AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Planning%')
        ), 0
    )::INTEGER INTO v_plan_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 10 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%burn%'), 0) +
        COALESCE((SELECT AVG(completion_rate) FROM app_course_progress WHERE user_id = p_user_id), 0) / 10,
        100
    )::INTEGER INTO v_exec_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 20 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%evm%'), 0),
        100
    )::INTEGER INTO v_cost_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id LIKE '%fishbone%'), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Risk%')
        ), 0),
        100
    )::INTEGER INTO v_risk_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 5 FROM community_posts WHERE user_id = p_user_id), 0) +
        COALESCE((SELECT MAX(streak) FROM app_users WHERE id = p_user_id), 0) * 3,
        100
    )::INTEGER INTO v_lead_score;
    
    SELECT LEAST(
        COALESCE((SELECT COUNT(*) * 15 FROM lab_tool_history WHERE user_id = p_user_id AND tool_id IN ('kanban-flow', 'planning-poker')), 0) +
        COALESCE((SELECT AVG(score) * 10 FROM app_simulation_progress 
                  WHERE user_id = p_user_id 
                    AND scenario_id IN (SELECT id FROM app_simulation_scenarios WHERE category LIKE '%Agile%')
        ), 0),
        100
    )::INTEGER INTO v_agile_score;
    
    INSERT INTO app_user_skills (user_id, plan_score, exec_score, cost_score, risk_score, lead_score, agile_score, calculated_at)
    VALUES (p_user_id, v_plan_score, v_exec_score, v_cost_score, v_risk_score, v_lead_score, v_agile_score, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan_score = EXCLUDED.plan_score,
        exec_score = EXCLUDED.exec_score,
        cost_score = EXCLUDED.cost_score,
        risk_score = EXCLUDED.risk_score,
        lead_score = EXCLUDED.lead_score,
        agile_score = EXCLUDED.agile_score,
        calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================

SELECT '✅ Part 2: 所有触发器和函数创建完成！' as status;
