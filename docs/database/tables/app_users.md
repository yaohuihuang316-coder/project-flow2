# app_users 表

## 列信息

| 列名 | 数据类型 | 示例值 |
|------|----------|--------|
| id | string | "u-admin-01" |
| email | string | "admin@company.com" |
| name | string | "Admin User" |
| role | string | "SuperAdmin" |
| status | string | "正常" |
| department | string | "IT部" |
| avatar | string | "https://images.unsplash.com/photo-1560250097-0b93 |
| created_at | string | "2025-12-29T17:24:56.994169+00:00" |
| subscription_tier | string | "pro" |
| xp | number | 0 |
| streak | number | 0 |
| ai_tier | string | "none" |
| ai_daily_used | number | 0 |
| ai_daily_reset_at | object | null |
| completed_courses_count | number | 0 |
| membership_expires_at | object | null |
| is_lifetime_member | boolean | false |
| teacher_license_url | object | null |
| teacher_verified_at | object | null |
| teacher_verified_by | object | null |
| institution_name | object | null |
| institution_code | object | null |
| job_title | object | null |

## 示例查询

```sql
-- 查询所有数据
SELECT * FROM ${tableName} LIMIT 10;

-- 查询数据条数
SELECT COUNT(*) FROM ${tableName};
```
