# app_events 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | number | 1 |
| user_id | string | "u-stu-01" |
| title | string | "每日敏捷站会" |
| start_time | string | "09:00 AM" |
| duration | string | "15min" |
| type | string | "meeting" |
| created_at | string | "2025-12-30T05:06:59.845281+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
