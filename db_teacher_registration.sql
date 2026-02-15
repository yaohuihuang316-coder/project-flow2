-- ==========================================
-- ProjectFlow 教师注册功能数据库更新
-- 包含：教师身份支持、企业许可存储
-- ==========================================

-- 1. 更新用户表，添加教师相关字段
DO $$
BEGIN
    -- 添加教师认证状态字段
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS teacher_license_url TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS teacher_verified_at TIMESTAMPTZ;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS teacher_verified_by TEXT REFERENCES app_users(id);
    
    -- 添加教育机构信息
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS institution_name TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS institution_code TEXT;
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS job_title TEXT;
END $$;

-- 2. 创建文档存储桶（用于存储企业许可）
-- 注意：需要在 Supabase Dashboard 手动创建，或使用以下 SQL（如果支持）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- 3. Storage 权限配置（用于企业许可上传）
-- 允许认证用户上传文档
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = 'teacher-licenses'
    );

-- 允许用户查看自己的文档
CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'documents' AND
        owner = auth.uid()::text
    );

-- 允许管理员查看所有文档
CREATE POLICY "Admins can view all documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM app_users
            WHERE id = auth.uid()::text AND role IN ('SuperAdmin', 'Manager')
        )
    );

-- 4. 创建教师审核记录表
CREATE TABLE IF NOT EXISTS app_teacher_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- 提交信息
    license_url TEXT NOT NULL,
    institution_name TEXT,
    institution_code TEXT,
    job_title TEXT,
    
    -- 审核信息
    status TEXT DEFAULT 'pending',       -- pending/approved/rejected
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT REFERENCES app_users(id),
    review_notes TEXT,
    
    UNIQUE(teacher_id)
);

-- 5. 创建教师端访问权限视图
CREATE OR REPLACE VIEW view_teacher_access AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.teacher_verified_at,
    CASE 
        WHEN u.role = 'Teacher' AND u.status = '正常' AND u.teacher_verified_at IS NOT NULL 
        THEN true 
        ELSE false 
    END as can_access_teacher_portal
FROM app_users u;

-- 6. 教师审核触发器
CREATE OR REPLACE FUNCTION handle_teacher_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- 当审核通过时，更新用户状态
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE app_users 
        SET 
            status = '正常',
            teacher_verified_at = NOW(),
            teacher_verified_by = NEW.reviewed_by
        WHERE id = NEW.teacher_id;
        
        -- 发送通知（可选）
        INSERT INTO app_messages (recipient_id, title, content, sent_at)
        VALUES (
            NEW.teacher_id,
            '教师认证通过',
            '恭喜！您的教师认证已通过审核，现在可以创建课程了。',
            NOW()
        );
    END IF;
    
    -- 当审核拒绝时
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        INSERT INTO app_messages (recipient_id, title, content, sent_at)
        VALUES (
            NEW.teacher_id,
            '教师认证未通过',
            '抱歉，您的教师认证未通过审核。原因：' || COALESCE(NEW.review_notes, '资料不完整'),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_verification ON app_teacher_verifications;
CREATE TRIGGER trigger_teacher_verification
    AFTER UPDATE ON app_teacher_verifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_teacher_verification();

-- 7. 创建演示账号（可选）
INSERT INTO app_users (
    id, email, name, role, status, 
    department, avatar, xp, streak,
    subscription_tier, completed_courses_count,
    teacher_verified_at
) VALUES (
    'test-teacher-001',
    'teacher@test.com',
    '张老师',
    'Editor',
    '正常',
    '项目管理学院',
    'https://i.pravatar.cc/150?u=teacher001',
    3500,
    45,
    'pro',
    8,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    teacher_verified_at = EXCLUDED.teacher_verified_at;

-- 8. 为演示教师添加课程关联
INSERT INTO app_teacher_courses (teacher_id, course_id, role)
SELECT 
    'test-teacher-001',
    c.id,
    'primary'
FROM app_courses c
WHERE c.id IN ('c-101', 'c-102', 'c-a1', 'c-a2')
ON CONFLICT DO NOTHING;

-- 9. 索引优化
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_status ON app_teacher_verifications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_teacher ON app_teacher_verifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_teacher_status ON app_users(role, status, teacher_verified_at) 
WHERE role = 'Teacher';

-- 10. RLS 策略
ALTER TABLE app_teacher_verifications ENABLE ROW LEVEL SECURITY;

-- 教师只能查看自己的审核记录
CREATE POLICY "Teachers see own verification" ON app_teacher_verifications
    FOR SELECT USING (teacher_id = current_setting('app.current_user_id', true)::text);

-- 管理员可以查看所有审核记录
CREATE POLICY "Admins see all verifications" ON app_teacher_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = current_setting('app.current_user_id', true)::text 
            AND role IN ('SuperAdmin', 'Manager')
        )
    );

COMMENT ON TABLE app_teacher_verifications IS '教师认证审核记录';
COMMENT ON COLUMN app_users.teacher_license_url IS '企业许可文件路径';
COMMENT ON COLUMN app_users.teacher_verified_at IS '教师认证通过时间';
