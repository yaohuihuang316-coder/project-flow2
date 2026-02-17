-- 为 app_class_sessions 表添加签到码字段
-- 执行时间: 2026-02-17

-- 添加签到码字段
ALTER TABLE app_class_sessions 
ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS check_in_expires_at TIMESTAMP WITH TIME ZONE;

-- 添加注释
COMMENT ON COLUMN app_class_sessions.check_in_code IS '签到码，6位数字';
COMMENT ON COLUMN app_class_sessions.check_in_expires_at IS '签到码过期时间';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_class_sessions_check_in_code 
ON app_class_sessions(check_in_code) 
WHERE check_in_code IS NOT NULL;

-- 验证字段添加成功
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_class_sessions' 
AND column_name IN ('check_in_code', 'check_in_expires_at');
