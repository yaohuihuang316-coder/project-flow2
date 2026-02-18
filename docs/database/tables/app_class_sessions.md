# app_class_sessions 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "4c2cdfb7-7030-4928-ab03-fae6062253ed" |
| course_id | string | "c-sys-001" |
| teacher_id | string | "340f28b9-8557-4e6f-adbf-e2abb1543ec2" |
| title | string | "项目管理基础 - 第1讲" |
| description | object | null |
| classroom | object | null |
| scheduled_start | string | "2026-02-16T18:42:59.257+00:00" |
| scheduled_end | string | "2026-02-16T19:42:59.257+00:00" |
| actual_start | object | null |
| actual_end | object | null |
| duration | object | null |
| status | string | "completed" |
| max_students | number | 30 |
| recording_enabled | boolean | false |
| recording_started_at | object | null |
| recording_ended_at | object | null |
| recording_duration | object | null |
| recording_url | object | null |
| recording_file_size | object | null |
| recording_status | object | null |
| screen_share_enabled | boolean | false |
| screen_share_started_at | object | null |
| screen_share_ended_at | object | null |
| whiteboard_data | object | [] |
| attendance_count | number | 0 |
| question_count | number | 0 |
| poll_count | number | 0 |
| engagement_score | object | null |
| created_at | string | "2026-02-18T09:43:02.236585+00:00" |
| updated_at | string | "2026-02-18T09:43:02.236585+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
