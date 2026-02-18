# app_announcements 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "7b660ee2-703a-4b15-9a5e-30f55387e7fc" |
| title | string | "欢迎使用 ProjectFlow 项目管理学习平台！" |
| content | string | "亲爱的用户，欢迎加入 ProjectFlow！在这里您可以：\r\n• 学习专业的项目管理课程\r |
| type | string | "success" |
| priority | number | 10 |
| target_audience | string | "all" |
| is_active | boolean | true |
| start_at | string | "2026-01-01T00:00:00+00:00" |
| end_at | string | "2026-03-01T00:00:00+00:00" |
| created_by | object | null |
| created_at | string | "2026-01-01T00:00:00+00:00" |
| updated_at | string | "2026-02-15T18:55:22.406565+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
