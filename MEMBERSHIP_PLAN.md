# ProjectFlow 会员制完整实施方案

## 📋 方案概述

### 会员等级体系

| 等级 | 名称 | 标识 | 解锁条件 | 核心权益 |
|------|------|------|----------|----------|
| **Free** | 免费会员 | ⭐ | 注册即得 | 基础课程学习、社区浏览 |
| **Pro** | 专业会员 | 💎 | 完成5门课 或 付费 | 🔓 解锁工具实验室、优先客服 |
| **Pro+** | 高级会员 | 👑 | 完成10门课 或 付费 | 🔓 解锁实战模拟、AI助手增强、全部工具 |

### 权限对照表

| 功能模块 | Free | Pro | Pro+ |
|----------|------|-----|------|
| 基础课程学习 | ✅ | ✅ | ✅ |
| 社区互动 | ✅ | ✅ | ✅ |
| 知识图谱 | ✅ | ✅ | ✅ |
| **工具实验室 (10个工具)** | ❌ | ✅ | ✅ |
| **实战模拟中心** | ❌ | ❌ | ✅ |
| AI助手 (基础) | ✅ | ✅ | ✅ |
| AI助手 (增强/分析) | ❌ | ❌ | ✅ |
| 学习数据分析 | 基础 | 详细 | 完整 |
| 证书下载 | ❌ | ✅ | ✅ |
| 专属客服 | ❌ | ✅ | ✅ |

---

## 🗄️ 数据库设计

### 1. 用户表扩展 (app_users)

```sql
-- 添加到 app_users 表
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_courses_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_lifetime_member boolean DEFAULT false;

-- 会员等级: 'free', 'pro', 'pro_plus'
```

### 2. 会员订阅记录表

```sql
CREATE TABLE public.membership_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id text REFERENCES public.app_users(id) ON DELETE CASCADE,
    tier text NOT NULL, -- 'pro', 'pro_plus'
    payment_method text, -- 'course_completion', 'payment'
    amount decimal(10,2), -- 付费金额（如果是付费升级）
    currency text DEFAULT 'CNY',
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.membership_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" 
    ON public.membership_subscriptions FOR ALL 
    USING (user_id = current_user_id()); -- 或使用 auth.uid()
```

### 3. 课程完成追踪视图

```sql
-- 创建视图自动统计用户完成的课程数
CREATE OR REPLACE VIEW user_course_stats AS
SELECT 
    user_id,
    COUNT(*) as enrolled_courses,
    COUNT(*) FILTER (WHERE progress >= 100) as completed_courses
FROM app_user_progress
GROUP BY user_id;

-- 创建函数自动更新用户完成课程数
CREATE OR REPLACE FUNCTION update_user_completed_courses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_users 
    SET completed_courses_count = (
        SELECT COUNT(*) 
        FROM app_user_progress 
        WHERE user_id = NEW.user_id AND progress >= 100
    )
    WHERE id = NEW.user_id;
    
    -- 检查是否达到升级条件
    PERFORM check_and_upgrade_membership(NEW.user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器
CREATE TRIGGER update_completed_courses
AFTER INSERT OR UPDATE ON app_user_progress
FOR EACH ROW EXECUTE FUNCTION update_user_completed_courses();
```

### 4. 自动升级函数

```sql
CREATE OR REPLACE FUNCTION check_and_upgrade_membership(user_uuid text)
RETURNS void AS $$
DECLARE
    completed_count int;
    current_tier text;
BEGIN
    SELECT completed_courses_count, membership_tier 
    INTO completed_count, current_tier
    FROM app_users WHERE id = user_uuid;
    
    -- 升级到 Pro
    IF current_tier = 'free' AND completed_count >= 5 THEN
        UPDATE app_users 
        SET membership_tier = 'pro',
            membership_expires_at = NULL  -- 课程解锁是永久的
        WHERE id = user_uuid;
        
        INSERT INTO membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at)
        VALUES 
            (user_uuid, 'pro', 'course_completion', true, now());
    END IF;
    
    -- 升级到 Pro+
    IF current_tier IN ('free', 'pro') AND completed_count >= 10 THEN
        UPDATE app_users 
        SET membership_tier = 'pro_plus',
            membership_expires_at = NULL
        WHERE id = user_uuid;
        
        INSERT INTO membership_subscriptions 
            (user_id, tier, payment_method, is_active, started_at)
        VALUES 
            (user_uuid, 'pro_plus', 'course_completion', true, now());
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 前端实施方案

### 1. 类型定义扩展 (types.ts)

```typescript
export type MembershipTier = 'free' | 'pro' | 'pro_plus';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  xp?: number;
  streak?: number;
  // 新增会员字段
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  completedCoursesCount: number;
  isLifetimeMember: boolean;
}

export interface MembershipRequirement {
  page: Page;
  minTier: MembershipTier;
  requiredCourses: number;
  title: string;
  description: string;
  benefits: string[];
}
```

### 2. 权限配置 (lib/membership.ts)

```typescript
export const MEMBERSHIP_REQUIREMENTS: Record<string, MembershipRequirement> = {
  [Page.TOOLS_LAB]: {
    page: Page.TOOLS_LAB,
    minTier: 'pro',
    requiredCourses: 5,
    title: '工具实验室',
    description: '解锁10个专业项目管理工具',
    benefits: [
      '蒙特卡洛模拟器',
      '敏捷估算扑克',
      'Kanban流动指标',
      '学习曲线模型',
      '...等10个工具'
    ]
  },
  [Page.SIMULATION]: {
    page: Page.SIMULATION,
    minTier: 'pro_plus',
    requiredCourses: 10,
    title: '实战模拟中心',
    description: '沉浸式项目管理场景演练',
    benefits: [
      '真实职场场景模拟',
      'AI智能评分反馈',
      '多分支剧情决策',
      '能力提升追踪'
    ]
  }
};

export function checkAccess(
  user: UserProfile | null, 
  page: Page
): { allowed: boolean; reason?: string; progress?: number } {
  if (!user) return { allowed: false, reason: '请先登录' };
  
  const req = MEMBERSHIP_REQUIREMENTS[page];
  if (!req) return { allowed: true }; // 无限制的页面
  
  // 检查等级
  const tierLevel = { free: 0, pro: 1, pro_plus: 2 };
  if (tierLevel[user.membershipTier] >= tierLevel[req.minTier]) {
    return { allowed: true };
  }
  
  // 检查课程进度
  const progress = Math.min(100, (user.completedCoursesCount / req.requiredCourses) * 100);
  
  return {
    allowed: false,
    reason: `需要完成 ${req.requiredCourses} 门课程解锁`,
    progress,
    remainingCourses: req.requiredCourses - user.completedCoursesCount
  };
}
```

### 3. 访问拦截组件 (components/MembershipGuard.tsx)

```typescript
import React from 'react';
import { Lock, Award, BookOpen, ArrowRight } from 'lucide-react';
import { Page, UserProfile } from '../types';
import { checkAccess, MEMBERSHIP_REQUIREMENTS } from '../lib/membership';

interface MembershipGuardProps {
  user: UserProfile | null;
  targetPage: Page;
  children: React.ReactNode;
  onNavigate: (page: Page) => void;
}

const MembershipGuard: React.FC<MembershipGuardProps> = ({ 
  user, targetPage, children, onNavigate 
}) => {
  const access = checkAccess(user, targetPage);
  
  if (access.allowed) return <>{children}</>;
  
  const req = MEMBERSHIP_REQUIREMENTS[targetPage];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* 顶部锁定提示 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">功能已锁定</h2>
          <p className="text-white/80">{req.title} 需要 {req.minTier === 'pro' ? 'Pro' : 'Pro+'} 会员</p>
        </div>
        
        <div className="p-8">
          {/* 进度展示 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">课程完成进度</span>
              <span className="font-medium text-purple-600">
                {user?.completedCoursesCount || 0} / {req.requiredCourses} 门
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${access.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              再完成 {req.requiredCourses - (user?.completedCoursesCount || 0)} 门课程即可解锁
            </p>
          </div>
          
          {/* 功能权益 */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              解锁后获得
            </h3>
            <ul className="space-y-2">
              {req.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-3">
            <button 
              onClick={() => onNavigate(Page.LEARNING)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <BookOpen size={18} />
              继续学习课程
              <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onNavigate(Page.PROFILE)}
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              查看会员中心
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipGuard;
```

### 4. 会员徽章组件 (components/MembershipBadge.tsx)

```typescript
import React from 'react';
import { Crown, Diamond, Star } from 'lucide-react';
import { MembershipTier } from '../types';

interface MembershipBadgeProps {
  tier: MembershipTier;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  free: { icon: Star, color: 'bg-gray-100 text-gray-600', label: 'FREE' },
  pro: { icon: Diamond, color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white', label: 'PRO' },
  pro_plus: { icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', label: 'PRO+' }
};

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ tier, size = 'md' }) => {
  const config = tierConfig[tier];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${config.color} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {config.label}
    </span>
  );
};

export default MembershipBadge;
```

---

## 🔧 集成步骤

### Step 1: 执行数据库脚本

```bash
# 在 Supabase SQL Editor 中执行
\i db_membership.sql
```

### Step 2: 更新类型定义

修改 `types.ts` 添加会员相关类型

### Step 3: 创建工具函数

创建 `lib/membership.ts` 权限检查工具

### Step 4: 更新用户加载逻辑

修改登录/用户获取逻辑，加载会员信息

```typescript
// lib/auth.ts 或类似文件
export async function loadUserWithMembership(userId: string): Promise<UserProfile> {
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
    
  return user as UserProfile;
}
```

### Step 5: 路由守卫集成

在 App.tsx 中添加权限检查

```typescript
// 在 renderPage 中添加守卫
{currentPage === Page.TOOLS_LAB && (
  <MembershipGuard 
    user={currentUser} 
    targetPage={Page.TOOLS_LAB}
    onNavigate={navigateTo}
  >
    <ToolsLab onBack={() => navigateTo(Page.DASHBOARD)} currentUser={currentUser} />
  </MembershipGuard>
)}
```

### Step 6: 添加会员展示

在 Dashboard 和 Profile 页面显示会员徽章和进度

---

## 📱 UI 设计要点

### 会员进度卡片 (Dashboard)

```
┌─────────────────────────────────────┐
│  💎 Pro 会员                    3/5 │
│  再完成2门课程解锁实验室             │
│  [==========>      ] 60%            │
│  查看推荐课程 →                     │
└─────────────────────────────────────┘
```

### 锁定页面设计

- 毛玻璃效果遮罩
- 清晰的进度指示
- 引人注目的CTA按钮
- 权益预览列表

### 成就提示

当用户自动升级时显示 Toast:
"🎉 恭喜！你已完成5门课程，自动升级为 Pro 会员！"

---

## 📊 后续扩展建议

### Phase 2: 付费系统
- 集成Stripe/支付宝
- 月付/年付选项
- 优惠券系统
- 推荐返利

### Phase 3: 更多权益
- 专属导师咨询
- 线下活动优先
- 企业版定制
- API访问权限

### Phase 4: 游戏化
- 会员专属徽章
- 排行榜系统
- 学习挑战
- 积分商城

---

## ✅ 实施检查清单

- [ ] 数据库脚本执行成功
- [ ] 类型定义更新
- [ ] MembershipGuard 组件实现
- [ ] MembershipBadge 组件实现
- [ ] 权限检查函数实现
- [ ] 路由守卫集成
- [ ] Dashboard 会员卡片添加
- [ ] Profile 会员中心添加
- [ ] 测试各种场景（免费/Pro/Pro+）
- [ ] 验证自动升级逻辑

---

## 🚀 预期效果

1. **提升留存**: 通过解锁机制激励用户完成更多课程
2. **自然转化**: 课程完成后再解锁高级功能，用户体验更流畅
3. **价值感知**: 清晰的进度展示让用户感知成长
4. **付费铺垫**: 为后续付费会员体系建立用户习惯
