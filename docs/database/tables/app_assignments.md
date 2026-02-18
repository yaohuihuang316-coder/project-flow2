# app_assignments 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "2ed360f0-3e21-44da-b0f9-6569d234b7e7" |
| title | string | "项目计划书撰写" |
| content | string | "撰写一份完整的项目计划书" |
| course_id | string | "c-sys-001" |
| teacher_id | string | "340f28b9-8557-4e6f-adbf-e2abb1543ec2" |
| deadline | string | "2026-02-25T09:42:58.956+00:00" |
| max_score | number | 100 |
| attachments | object | [] |
| status | string | "pending" |
| submitted_count | number | 0 |
| total_count | number | 5 |
| created_at | string | "2026-02-18T09:43:01.303691+00:00" |
| updated_at | string | "2026-02-18T09:43:01.303691+00:00" |
| is_deleted | boolean | false |
| deleted_at | object | null |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
