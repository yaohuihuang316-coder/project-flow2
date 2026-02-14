# 会员配置数据库管理功能

## 概述

本功能将原本硬编码在 `lib/membership.ts` 中的 `MEMBERSHIP_CONFIG` 改为从数据库动态获取，支持在后台管理界面实时修改会员配置。

## 文件变更

### 1. 数据库表 (db_membership_config.sql)
- 创建 `app_membership_plans` 表存储会员配置
- 包含字段：id, name, badge, color, gradient, icon, required_courses, price_monthly, price_yearly, features, is_active
- 默认插入 free/pro/pro_plus 三个等级的配置数据
- 包含 RLS 策略，只允许管理员修改

### 2. lib/membership.ts
- 保留 `DEFAULT_MEMBERSHIP_CONFIG` 作为默认值
- 新增 `MembershipPlanConfig` 和 `MembershipPlanFeature` 类型
- 新增 `fetchMembershipConfigFromDB()` - 从数据库获取配置
- 新增 `getMembershipConfig()` - 带缓存的获取配置
- 新增 `updateMembershipConfigInDB()` - 更新配置到数据库
- 新增 `clearMembershipConfigCache()` - 清除缓存
- 新增异步版本 `getNextTierInfoAsync()` 和 `getMembershipDisplayAsync()`
- 保留同步版本函数作为向后兼容

### 3. pages/Membership.tsx
- 使用 `useEffect` 加载会员配置
- 显示加载状态
- 根据数据库配置动态渲染会员卡片
- 支持动态图标映射

### 4. pages/admin/AdminMembership.tsx
- 新增"会员配置"标签页
- 支持编辑每个会员等级的配置：
  - 名称、Badge
  - 图标选择
  - 所需课程数
  - 渐变色和颜色类名
  - 月付/年付价格
  - 权益列表（支持增删改）
- 实时预览效果

## 使用方法

### 初始化数据库

```bash
# 在 Supabase SQL 编辑器中执行
db_membership_config.sql
```

### 在前端使用动态配置

```typescript
import { getMembershipConfig, getNextTierInfoAsync } from './lib/membership';

// 获取配置（带5分钟缓存）
const config = await getMembershipConfig();

// 使用配置
const proConfig = config.pro;
console.log(proConfig.name, proConfig.priceMonthly);

// 获取下一等级信息
const nextTier = await getNextTierInfoAsync(currentUser);
```

### 更新配置

```typescript
import { updateMembershipConfigInDB, clearMembershipConfigCache } from './lib/membership';

// 更新 Pro 会员价格
await updateMembershipConfigInDB('pro', {
  priceMonthly: 129,
  priceYearly: 1299
});

// 清除缓存（通常不需要，update函数会自动清除）
clearMembershipConfigCache();
```

## 配置缓存

- 默认缓存时间：5分钟
- 缓存会自动过期
- 更新配置后会自动清除缓存

## 注意事项

1. 数据库表需要手动创建（执行 SQL 文件）
2. Free 会员的基础设置（ID、等级）不建议修改
3. 图标名称需要与 lucide-react 的图标名对应
4. 渐变色使用 Tailwind 的 from...to... 格式
5. 修改配置后前台页面会自动显示新配置
