# app_user_achievements 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "076418c3-fe8e-4af2-a59b-f2f5c245efc0" |
| user_id | string | "test-pro-001" |
| achievement_id | string | "bf8216bd-e406-4e04-ac89-8b71be718ead" |
| unlocked_at | string | "2026-01-27T13:54:42.003501+00:00" |
| progress | number | 100 |
| is_new | boolean | false |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
