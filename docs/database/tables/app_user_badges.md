# app_user_badges 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "4bd87c5e-8d63-4c60-9022-42d43255ec74" |
| user_id | string | "test-pp-001" |
| badge_id | string | "pmp_master" |
| badge_name | string | "PMP大师" |
| badge_icon | string | "Crown" |
| badge_color | string | "text-yellow-600" |
| badge_bg | string | "bg-yellow-100" |
| condition | string | "通过PMP模拟考试且分数>85" |
| unlocked_at | string | "2026-02-09T16:48:21.347225+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
