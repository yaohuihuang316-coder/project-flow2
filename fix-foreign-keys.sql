-- ==========================================
-- 修复作业和课堂表的外键约束
-- 使其能够与 app_users 和 app_courses 表配合使用
-- ==========================================

-- 1. 首先检查并删除现有的外键约束
ALTER TABLE IF EXISTS app_assignments 
DROP CONSTRAINT IF EXISTS app_assignments_course_id_fkey,
DROP CONSTRAINT IF EXISTS app_assignments_teacher_id_fkey;

ALTER TABLE IF EXISTS app_class_sessions 
DROP CONSTRAINT IF EXISTS app_class_sessions_course_id_fkey,
DROP CONSTRAINT IF EXISTS app_class_sessions_teacher_id_fkey;

ALTER TABLE IF EXISTS app_attendance
DROP CONSTRAINT IF EXISTS app_attendance_session_id_fkey,
DROP CONSTRAINT IF EXISTS app_attendance_student_id_fkey;

-- 2. 修改 app_assignments 表的 course_id 列类型为 TEXT
ALTER TABLE app_assignments 
ALTER COLUMN course_id TYPE TEXT;

-- 3. 添加新的外键约束指向 app_courses
ALTER TABLE app_assignments 
ADD CONSTRAINT app_assignments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES app_courses(id) ON DELETE CASCADE;

-- 4. 修改 app_assignments 表的 teacher_id 列类型为 TEXT
ALTER TABLE app_assignments 
ALTER COLUMN teacher_id TYPE TEXT;

-- 5. 添加新的外键约束指向 app_users
ALTER TABLE app_assignments 
ADD CONSTRAINT app_assignments_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- 6. 修改 app_class_sessions 表的 course_id 列类型为 TEXT
ALTER TABLE app_class_sessions 
ALTER COLUMN course_id TYPE TEXT;

-- 7. 添加新的外键约束指向 app_courses
ALTER TABLE app_class_sessions 
ADD CONSTRAINT app_class_sessions_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES app_courses(id) ON DELETE CASCADE;

-- 8. 修改 app_class_sessions 表的 teacher_id 列类型为 TEXT
ALTER TABLE app_class_sessions 
ALTER COLUMN teacher_id TYPE TEXT;

-- 9. 添加新的外键约束指向 app_users
ALTER TABLE app_class_sessions 
ADD CONSTRAINT app_class_sessions_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- 10. 修改 app_attendance 表的 session_id 和 student_id 列类型
ALTER TABLE app_attendance 
ALTER COLUMN session_id TYPE TEXT,
ALTER COLUMN student_id TYPE TEXT;

-- 11. 添加新的外键约束
ALTER TABLE app_attendance 
ADD CONSTRAINT app_attendance_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES app_class_sessions(id) ON DELETE CASCADE,
ADD CONSTRAINT app_attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- 完成
SELECT '外键约束修复完成' AS status;
