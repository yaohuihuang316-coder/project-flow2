# app_course_enrollments 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "ea828798-2048-4e29-bb93-5dd6cf58b128" |
| student_id | string | "u-student-001" |
| course_id | string | "c-teacher-001" |
| enrolled_at | string | "2026-01-25T06:30:50.086+00:00" |
| enrolled_by | object | null |
| status | string | "active" |
| last_accessed_at | object | null |
| completion_date | object | null |
| final_score | object | null |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
