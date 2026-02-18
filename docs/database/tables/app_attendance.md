# app_attendance 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "93ca02a6-d948-4789-ac85-6b7485f3c2eb" |
| session_id | string | "4c2cdfb7-7030-4928-ab03-fae6062253ed" |
| student_id | string | "23d45360-290b-4c65-b5da-d55a00ad6d5b" |
| status | string | "present" |
| check_in_time | string | "2026-02-17T18:58:24.581+00:00" |
| check_out_time | object | null |
| device_type | object | null |
| device_name | object | null |
| ip_address | object | null |
| user_agent | object | null |
| location_lat | object | null |
| location_lng | object | null |
| location_accuracy | object | null |
| notes | object | null |
| created_at | string | "2026-02-18T09:43:02.566282+00:00" |
| updated_at | string | "2026-02-18T09:43:02.566282+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
