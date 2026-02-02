# ProjectFlow 会员制系统 - 实施指南

## 📋 已完成的内容

### 1. 数据库脚本 ✅
**文件**: `db_membership.sql`

包含：
- 用户表扩展（membership_tier, completed_courses_count等字段）
- 会员订阅记录表
- 自动升级触发器
- 用户课程统计视图
- 管理员函数

### 2. 前端组件 ✅

| 文件 | 功能 |
|------|------|
| `lib/membership.ts` | 权限检查工具函数 |
| `components/MembershipGuard.tsx` | 访问拦截组件 |
| `components/MembershipBadge.tsx` | 会员徽章组件 |
| `components/MembershipCard.tsx` | Dashboard会员卡片 |

### 3. 类型定义 ✅
**文件**: `types.ts` 已更新
- 添加 `MembershipTier` 类型
- 扩展 `UserProfile` 接口
- 添加 `MembershipRequirement` 接口

### 4. 路由集成 ✅
**文件**: `App.tsx` 已更新
- ToolsLab 和 Simulation 页面已添加权限守卫

---

## 🚀 实施步骤

### Step 1: 执行数据库脚本

在 Supabase SQL Editor 中执行：

```sql
-- 复制 db_membership.sql 的全部内容执行
```

执行后验证：
```sql
-- 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users';

-- 应该看到: membership_tier, membership_expires_at, completed_courses_count
```

### Step 2: 更新用户加载逻辑

找到用户登录/获取的地方（通常在 `lib/supabaseClient.ts` 或登录页面），修改查询：

```typescript
// 修改前
const { data: user } = await supabase
  .from('app_users')
  .select('*')
  .eq('id', userId)
  .single();

// 修改后 - 包含会员信息
const { data: user } = await supabase
  .from('app_users')
  .select(`
    *,
    completed_courses_count,
    membership_tier,
    membership_expires_at
  `)
  .eq('id', userId)
  .single();
```

### Step 3: 初始化现有用户

数据库脚本已包含数据迁移，会自动统计现有用户的完成课程数。

如果需要手动刷新：
```sql
SELECT check_and_upgrade_membership('用户ID');
```

### Step 4: 测试验证

#### 测试场景 1: 免费用户访问实验室
1. 确保测试账号的 `membership_tier = 'free'`
2. 确保 `completed_courses_count < 5`
3. 点击工具实验室入口
4. **预期**: 显示锁定页面，提示还需完成X门课程

#### 测试场景 2: 完成课程自动升级
1. 免费用户完成一门课程（设置进度为100）
2. 检查 `app_users` 表的 `completed_courses_count`
3. 当完成5门时，检查是否自动变为 `pro`
4. **预期**: 收到升级提示，可以访问实验室

#### 测试场景 3: Pro用户访问实战
1. Pro用户（完成5-9门课）
2. 点击实战模拟入口
3. **预期**: 显示锁定页面，提示还需完成X门课程解锁Pro+

#### 测试场景 4: Pro+用户
1. 完成10门课程
2. **预期**: 自动升级为 Pro+，可以访问所有功能

---

## 📊 系统行为说明

### 自动升级逻辑

```
用户完成课程 → 触发器更新 completed_courses_count → 检查升级条件 → 自动升级
```

| 当前等级 | 完成课程数 | 新等级 |
|---------|-----------|--------|
| free | 5门 | pro |
| free/pro | 10门 | pro_plus |

### 权限控制

| 页面 | 需要等级 | 需要课程数 |
|------|---------|-----------|
| Dashboard, Learning, Community | free | 0 |
| Knowledge Graph, AI Assistant | free | 0 |
| **Tools Lab** | **pro** | **5** |
| **Simulation** | **pro_plus** | **10** |

---

## 🔧 管理员操作

### 手动设置会员等级

```sql
-- 将用户设为 Pro（永久）
SELECT admin_set_membership('用户ID', 'pro', true);

-- 将用户设为 Pro+（永久）
SELECT admin_set_membership('用户ID', 'pro_plus', true);

-- 将用户降级为免费
SELECT admin_set_membership('用户ID', 'free');
```

### 查询会员统计

```sql
-- 各等级用户数量
SELECT membership_tier, COUNT(*) 
FROM app_users 
GROUP BY membership_tier;

-- 即将达到升级条件的用户
SELECT id, name, completed_courses_count
FROM app_users
WHERE membership_tier = 'free' AND completed_courses_count >= 4;
```

---

## 🎨 自定义配置

### 修改解锁条件

编辑 `lib/membership.ts`:

```typescript
export const MEMBERSHIP_REQUIREMENTS: Record<string, MembershipRequirement> = {
  [Page.TOOLS_LAB]: {
    minTier: 'pro',
    requiredCourses: 3,  // 改为3门
    // ...
  },
  [Page.SIMULATION]: {
    minTier: 'pro_plus',
    requiredCourses: 7,  // 改为7门
    // ...
  }
};
```

### 修改等级名称和样式

编辑 `lib/membership.ts`:

```typescript
export const MEMBERSHIP_CONFIG = {
  pro: {
    name: '专业版',  // 自定义名称
    badge: 'VIP',     // 自定义徽章
    gradient: 'from-purple-500 to-pink-500',  // 自定义颜色
    // ...
  }
};
```

---

## 📱 用户体验流程

```
新用户注册 (free)
    ↓
开始学习课程
    ↓
完成第5门课 → 自动升级 Pro
    ↓
解锁工具实验室 (10个工具)
    ↓
继续学习...
    ↓
完成第10门课 → 自动升级 Pro+
    ↓
解锁实战模拟中心
    ↓
解锁全部功能！
```

---

## ✅ 部署检查清单

- [ ] 执行 `db_membership.sql` 无错误
- [ ] 验证 `app_users` 表有新字段
- [ ] 验证触发器已创建
- [ ] 更新用户查询代码
- [ ] 测试免费用户访问被拦截
- [ ] 测试完成课程后自动升级
- [ ] 验证 Dashboard 显示会员卡片
- [ ] 验证徽章显示正确

---

## 🐛 常见问题

### Q: 用户完成课程但没有升级？
A: 检查触发器是否生效：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_check_membership_upgrade';
```

### Q: 如何手动触发升级检查？
A: 执行函数：
```sql
SELECT * FROM check_and_upgrade_membership('用户ID');
```

### Q: 会员到期后如何处理？
A: 当前版本课程解锁是永久的。如需时间限制，需扩展 `admin_set_membership` 函数设置过期时间。

---

## 📚 相关文档

- 完整方案：`MEMBERSHIP_PLAN.md`
- 数据库脚本：`db_membership.sql`
- 工具函数：`lib/membership.ts`

---

**完成时间**: 预计30分钟部署完成
**影响范围**: 用户系统 + 2个受保护页面
**回滚方案**: 恢复 `app_users` 表字段，移除守卫组件
