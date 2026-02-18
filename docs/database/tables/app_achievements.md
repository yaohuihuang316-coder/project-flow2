# app_achievements 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "40b9016b-d957-4cf1-976c-66df45e84047" |
| code | string | "pmp_master" |
| name | string | "PMP大师" |
| description | string | "完成全部体系课程" |
| icon | string | "Trophy" |
| category | string | "learning" |
| unlock_type | string | "courses_completed" |
| unlock_threshold | number | 12 |
| unlock_condition | object | {} |
| rarity | string | "legendary" |
| is_hidden | boolean | false |
| created_at | string | "2026-02-14T19:41:59.679329+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
