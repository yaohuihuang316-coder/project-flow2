# app_courses 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "c-sys-001" |
| category | string | "Course" |
| title | string | "项目全生命周期管理实战" |
| author | string | "项目管理中心" |
| description | string | "从项目启动到收尾的端到端管理体系，涵盖五大过程组与十大知识领域在企业内部的落地实践。" |
| image | string | "https://images.unsplash.com/photo-1519389950473-4 |
| status | string | "Published" |
| duration | string | "12h 30m" |
| views | number | 0 |
| chapters | object | [{"type":"video","title":"第1章：项目启动与立项","duration": |
| resources | object | [{"url":"#","name":"项目管理手册_V3.0.pdf","size":"15MB" |
| created_at | string | "2025-12-29T17:24:56.994169+00:00" |
| rating | number | 4.5 |
| last_update | object | null |
| kb_node_ids | object | [] |
| learning_path_order | object | null |
| category_color | object | null |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
