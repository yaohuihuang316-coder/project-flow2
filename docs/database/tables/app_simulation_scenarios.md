# app_simulation_scenarios 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "a5d48778-ea84-432e-a90e-0bbdc5307fef" |
| title | string | "项目危机处理" |
| description | string | "模拟项目中突发危机的应对决策，测试你的危机管理能力" |
| difficulty | string | "Hard" |
| category | string | "Crisis Management" |
| cover_image | string | "https://images.unsplash.com/photo-1552664730-d307 |
| stages | object | [{"id":"stage-1","title":"危机发现","context":"你是一名项目经 |
| decisions | object | [] |
| resources | object | {} |
| learning_objectives | object | ["危机管理","冲突解决","进度压缩","团队管理"] |
| is_published | boolean | true |
| created_at | string | "2026-02-14T16:48:21.347225+00:00" |
| updated_at | string | "2026-02-14T16:48:21.347225+00:00" |
| estimated_time | number | 15 |
| completion_count | number | 0 |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
