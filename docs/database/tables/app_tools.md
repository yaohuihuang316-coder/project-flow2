# app_tools 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "91ea8a8c-96f4-4515-9c7a-c23463b109db" |
| name | string | "蒙特卡洛模拟器" |
| description | string | "基于PERT分布的风险量化分析，10,000次模拟预测项目完成概率" |
| category | string | "risk" |
| icon | string | "Calculator" |
| config | object | {} |
| is_active | boolean | true |
| required_tier | string | "pro" |
| difficulty | string | "Medium" |
| usage_count | number | 0 |
| created_at | string | "2026-02-14T17:07:27.018314+00:00" |
| updated_at | string | "2026-02-14T17:07:27.018314+00:00" |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
