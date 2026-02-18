# app_community_posts 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | number | 1 |
| user_id | string | "u-alex-demo" |
| user_name | string | "Alex Chen" |
| user_avatar | string | "https://images.unsplash.com/photo-1599566150163-2 |
| role | string | "Student" |
| content | string | "终于拿到了 PMP 证书！🎉 感谢 Michael 老师的课程，特别是关于风险管理的那一章，在实 |
| image | object | null |
| tags | object | ["PMP","备考心得","ProjectManagement"] |
| likes | number | 128 |
| comments | number | 45 |
| created_at | string | "2025-12-30T03:24:13.281365+00:00" |
| is_pinned | boolean | false |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
