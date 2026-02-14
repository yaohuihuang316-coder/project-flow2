
/**
 * Membership System - Utilities
 * 会员系统工具函数
 * 
 * 注意：数据库 subscription_tier 使用 'Free'|'Pro'|'Pro+'
 * 代码中使用小写 'free'|'pro'|'pro_plus'
 */

import { Page, UserProfile, MembershipTier, MembershipRequirement } from '../types';
import { supabase } from './supabaseClient';

/**
 * 转换数据库会员等级值为代码格式
 * 数据库: 'Free' | 'Pro' | 'Pro+'  →  代码: 'free' | 'pro' | 'pro_plus'
 */
export function normalizeMembershipTier(dbTier: string | null | undefined): MembershipTier {
  if (!dbTier) return 'free';
  const tier = dbTier.toLowerCase();
  if (tier === 'pro+') return 'pro_plus';
  if (tier === 'pro') return 'pro';
  return 'free';
}

/**
 * 转换代码会员等级值为数据库格式
 * 代码: 'free' | 'pro' | 'pro_plus'  →  数据库: 'Free' | 'Pro' | 'Pro+'
 */
export function toDatabaseMembershipTier(tier: MembershipTier): string {
  const tierMap: Record<MembershipTier, string> = {
    free: 'Free',
    pro: 'Pro',
    pro_plus: 'Pro+'
  };
  return tierMap[tier] || 'Free';
}

// ==========================================
// 会员配置数据结构
// ==========================================

export interface MembershipPlanFeature {
  icon: string;
  text: string;
}

export interface MembershipPlanConfig {
  level: number;
  name: string;
  badge: string;
  color: string;
  gradient: string;
  icon: string;
  requiredCourses: number;
  priceMonthly?: number;
  priceYearly?: number;
  features: MembershipPlanFeature[];
  isActive: boolean;
}

// 会员等级配置 - 作为默认/回退值
export const DEFAULT_MEMBERSHIP_CONFIG: Record<MembershipTier, MembershipPlanConfig> = {
  free: {
    level: 0,
    name: '免费会员',
    badge: 'FREE',
    color: 'bg-gray-100 text-gray-600',
    gradient: 'from-gray-400 to-gray-500',
    icon: 'Star',
    requiredCourses: 0,
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { icon: 'BookOpen', text: 'Foundation 基础课程' },
      { icon: 'BookOpen', text: 'Advanced 进阶课程' },
      { icon: 'Calculator', text: '3个基础工具' },
      { icon: 'MessageSquare', text: '社区发帖权限' },
      { icon: 'Bot', text: 'AI助手 5次/天' }
    ],
    isActive: true
  },
  pro: {
    level: 1,
    name: '专业会员',
    badge: 'PRO',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    gradient: 'from-blue-500 to-cyan-500',
    icon: 'Crown',
    requiredCourses: 5,
    priceMonthly: 99,
    priceYearly: 999,
    features: [
      { icon: 'BookOpen', text: '全部 18 门课程' },
      { icon: 'Calculator', text: '全部 12 个基础工具' },
      { icon: 'Zap', text: '5个高级工具' },
      { icon: 'Bot', text: 'AI助手 20次/天' },
      { icon: 'Target', text: '完整版证书下载' },
      { icon: 'Users', text: '精华帖标识' }
    ],
    isActive: true
  },
  pro_plus: {
    level: 2,
    name: '高级会员',
    badge: 'PRO+',
    color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    gradient: 'from-amber-500 to-orange-500',
    icon: 'Crown',
    requiredCourses: 10,
    priceMonthly: 199,
    priceYearly: 1999,
    features: [
      { icon: 'Star', text: '全部 Pro 权益' },
      { icon: 'Calculator', text: '5个专家级工具' },
      { icon: 'TrendingUp', text: '实战模拟中心' },
      { icon: 'FileText', text: '评分报告 PDF导出' },
      { icon: 'Bot', text: 'AI助手 50次/天' },
      { icon: 'Shield', text: '专家认证标识' },
      { icon: 'Users', text: '1对1专属客服' }
    ],
    isActive: true
  }
};

// 为向后兼容保留别名
export const MEMBERSHIP_CONFIG = DEFAULT_MEMBERSHIP_CONFIG;

// 缓存变量
let cachedMembershipConfig: Record<MembershipTier, MembershipPlanConfig> | null = null;
let configCacheTime: number = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 从数据库获取会员配置
 */
export async function fetchMembershipConfigFromDB(): Promise<Record<MembershipTier, MembershipPlanConfig>> {
  try {
    const { data, error } = await supabase
      .from('app_membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('required_courses', { ascending: true });

    if (error) {
      console.error('Failed to fetch membership config from DB:', error);
      return DEFAULT_MEMBERSHIP_CONFIG;
    }

    if (!data || data.length === 0) {
      return DEFAULT_MEMBERSHIP_CONFIG;
    }

    // 转换数据库格式为代码格式
    const config: Partial<Record<MembershipTier, MembershipPlanConfig>> = {};
    
    data.forEach((plan: any, index: number) => {
      const tier = plan.id as MembershipTier;
      config[tier] = {
        level: index,
        name: plan.name,
        badge: plan.badge,
        color: plan.color,
        gradient: plan.gradient,
        icon: plan.icon,
        requiredCourses: plan.required_courses,
        priceMonthly: plan.price_monthly,
        priceYearly: plan.price_yearly,
        features: Array.isArray(plan.features) ? plan.features : DEFAULT_MEMBERSHIP_CONFIG[tier]?.features || [],
        isActive: plan.is_active
      };
    });

    // 确保所有等级都有配置
    return {
      free: config.free || DEFAULT_MEMBERSHIP_CONFIG.free,
      pro: config.pro || DEFAULT_MEMBERSHIP_CONFIG.pro,
      pro_plus: config.pro_plus || DEFAULT_MEMBERSHIP_CONFIG.pro_plus
    };
  } catch (error) {
    console.error('Error fetching membership config:', error);
    return DEFAULT_MEMBERSHIP_CONFIG;
  }
}

/**
 * 获取会员配置（带缓存）
 */
export async function getMembershipConfig(): Promise<Record<MembershipTier, MembershipPlanConfig>> {
  const now = Date.now();
  
  // 检查缓存是否有效
  if (cachedMembershipConfig && (now - configCacheTime) < CONFIG_CACHE_DURATION) {
    return cachedMembershipConfig;
  }

  // 从数据库获取新配置
  const config = await fetchMembershipConfigFromDB();
  cachedMembershipConfig = config;
  configCacheTime = now;
  
  return config;
}

/**
 * 清除配置缓存（用于配置更新后）
 */
export function clearMembershipConfigCache(): void {
  cachedMembershipConfig = null;
  configCacheTime = 0;
}

/**
 * 更新会员配置到数据库
 */
export async function updateMembershipConfigInDB(
  tier: MembershipTier, 
  updates: Partial<MembershipPlanConfig>
): Promise<boolean> {
  try {
    const dbData: any = {};
    
    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.badge !== undefined) dbData.badge = updates.badge;
    if (updates.color !== undefined) dbData.color = updates.color;
    if (updates.gradient !== undefined) dbData.gradient = updates.gradient;
    if (updates.icon !== undefined) dbData.icon = updates.icon;
    if (updates.requiredCourses !== undefined) dbData.required_courses = updates.requiredCourses;
    if (updates.priceMonthly !== undefined) dbData.price_monthly = updates.priceMonthly;
    if (updates.priceYearly !== undefined) dbData.price_yearly = updates.priceYearly;
    if (updates.features !== undefined) dbData.features = updates.features;
    if (updates.isActive !== undefined) dbData.is_active = updates.isActive;

    const { error } = await supabase
      .from('app_membership_plans')
      .update(dbData)
      .eq('id', tier);

    if (error) {
      console.error('Failed to update membership config:', error);
      return false;
    }

    // 清除缓存
    clearMembershipConfigCache();
    return true;
  } catch (error) {
    console.error('Error updating membership config:', error);
    return false;
  }
}

/**
 * 获取单个等级的配置（同步版本，使用默认值）
 * 注意：此方法使用硬编码默认值，如需动态配置请使用 getMembershipConfig()
 */
export function getMembershipConfigSync(tier: MembershipTier): MembershipPlanConfig {
  return DEFAULT_MEMBERSHIP_CONFIG[tier] || DEFAULT_MEMBERSHIP_CONFIG.free;
}

// 页面权限要求配置
export const MEMBERSHIP_REQUIREMENTS: Record<string, MembershipRequirement> = {
  [Page.TOOLS_LAB]: {
    page: Page.TOOLS_LAB,
    minTier: 'pro',
    requiredCourses: 5,
    title: '工具实验室',
    description: '解锁10个专业项目管理工具，助力数据驱动决策',
    benefits: [
      '蒙特卡洛模拟器 - 风险量化分析',
      '敏捷估算扑克 - 团队协作估算',
      'Kanban流动指标 - 效率可视化',
      '学习曲线模型 - 工期优化预测',
      '挣值趋势预测 - AI驱动分析',
      '迭代速率跟踪 - Sprint燃尽图',
      'FMEA风险分析 - 故障模式识别',
      '关键链法调度 - 资源优化',
      '鱼骨图分析 - 根因诊断',
      '质量成本模型 - COQ分析'
    ],
    icon: 'FlaskConical'
  },
  [Page.SIMULATION]: {
    page: Page.SIMULATION,
    minTier: 'pro_plus',
    requiredCourses: 10,
    title: '实战模拟中心',
    description: '沉浸式项目管理场景演练，在虚拟环境中提升实战能力',
    benefits: [
      '真实职场场景模拟',
      'AI智能评分反馈',
      '多分支剧情决策',
      '能力成长追踪',
      '案例库持续更新',
      '团队协作演练'
    ],
    icon: 'Target'
  }
};

// 检查访问权限
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  progress?: number;
  currentTier?: MembershipTier;
  requiredTier?: MembershipTier;
  remainingCourses?: number;
  requirement?: MembershipRequirement;
}

export function checkAccess(
  user: UserProfile | null, 
  page: Page
): AccessCheckResult {
  // 未登录
  if (!user) {
    return { 
      allowed: false, 
      reason: '请先登录',
      currentTier: 'free'
    };
  }
  
  // 检查页面是否有权限要求
  const req = MEMBERSHIP_REQUIREMENTS[page];
  if (!req) {
    return { allowed: true, currentTier: user.membershipTier };
  }
  
  const tierLevels: Record<MembershipTier, number> = { free: 0, pro: 1, pro_plus: 2 };
  const userLevel = tierLevels[user.membershipTier];
  const requiredLevel = tierLevels[req.minTier];
  
  // 检查等级是否满足
  if (userLevel >= requiredLevel) {
    return { 
      allowed: true, 
      currentTier: user.membershipTier,
      requiredTier: req.minTier
    };
  }
  
  // 计算进度
  const completed = user.completedCoursesCount || 0;
  const required = req.requiredCourses;
  const progress = Math.min(100, (completed / required) * 100);
  
  return {
    allowed: false,
    reason: `需要完成 ${required} 门课程解锁${req.title}`,
    progress,
    currentTier: user.membershipTier,
    requiredTier: req.minTier,
    remainingCourses: required - completed,
    requirement: req
  };
}

// 检查特定等级权限
export function hasTier(
  user: UserProfile | null, 
  minTier: MembershipTier
): boolean {
  if (!user) return false;
  const levels: Record<MembershipTier, number> = { free: 0, pro: 1, pro_plus: 2 };
  return levels[user.membershipTier] >= levels[minTier];
}

// 获取下一等级信息（异步版本 - 使用数据库配置）
export async function getNextTierInfoAsync(user: UserProfile | null): Promise<{
  tier: MembershipTier;
  name: string;
  badge: string;
  requiredCourses: number;
  completedCourses: number;
  remainingCourses: number;
  progress: number;
} | null> {
  if (!user) return null;
  
  const config = await getMembershipConfig();
  const tierOrder: MembershipTier[] = ['free', 'pro', 'pro_plus'];
  const currentIndex = tierOrder.indexOf(user.membershipTier);
  
  if (currentIndex >= tierOrder.length - 1) return null; // 已是最高级
  
  const nextTier = tierOrder[currentIndex + 1];
  const tierConfig = config[nextTier];
  
  return {
    tier: nextTier,
    name: tierConfig.name,
    badge: tierConfig.badge,
    requiredCourses: tierConfig.requiredCourses,
    completedCourses: user.completedCoursesCount || 0,
    remainingCourses: Math.max(0, tierConfig.requiredCourses - (user.completedCoursesCount || 0)),
    progress: Math.min(100, ((user.completedCoursesCount || 0) / Math.max(1, tierConfig.requiredCourses)) * 100)
  };
}

// 获取下一等级信息（同步版本 - 使用默认配置）
export function getNextTierInfo(user: UserProfile | null) {
  if (!user) return null;
  
  const tierOrder: MembershipTier[] = ['free', 'pro', 'pro_plus'];
  const currentIndex = tierOrder.indexOf(user.membershipTier);
  
  if (currentIndex >= tierOrder.length - 1) return null; // 已是最高级
  
  const nextTier = tierOrder[currentIndex + 1];
  const config = DEFAULT_MEMBERSHIP_CONFIG[nextTier];
  
  return {
    tier: nextTier,
    name: config.name,
    badge: config.badge,
    requiredCourses: config.requiredCourses,
    completedCourses: user.completedCoursesCount || 0,
    remainingCourses: Math.max(0, config.requiredCourses - (user.completedCoursesCount || 0)),
    progress: Math.min(100, ((user.completedCoursesCount || 0) / Math.max(1, config.requiredCourses)) * 100)
  };
}

// 获取用户会员信息展示（同步版本）
export function getMembershipDisplay(user: UserProfile | null) {
  if (!user) return DEFAULT_MEMBERSHIP_CONFIG.free;
  return DEFAULT_MEMBERSHIP_CONFIG[user.membershipTier];
}

// 获取用户会员信息展示（异步版本）
export async function getMembershipDisplayAsync(user: UserProfile | null) {
  const config = await getMembershipConfig();
  if (!user) return config.free;
  return config[user.membershipTier];
}

// 获取升级提示文案
export function getUpgradeMessage(user: UserProfile | null): string {
  if (!user) return '注册并开始学习课程，解锁更多功能';
  
  const nextTier = getNextTierInfo(user);
  if (!nextTier) return '恭喜！你已解锁全部功能';
  
  if (user.membershipTier === 'free') {
    return `再完成 ${nextTier.remainingCourses} 门课程，解锁${nextTier.name}权益`;
  }
  
  return `再完成 ${nextTier.remainingCourses} 门课程，解锁全部功能`;
}

// 模拟延迟（用于演示）
export function simulateUpgradeCheck(): Promise<{ upgraded: boolean; newTier?: MembershipTier }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ upgraded: false });
    }, 500);
  });
}

// 格式化会员到期时间
export function formatMembershipExpiry(expiresAt?: string): string {
  if (!expiresAt) return '永久有效';
  
  const date = new Date(expiresAt);
  const now = new Date();
  
  if (date < now) return '已过期';
  
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months}个月后过期`;
  }
  
  return `${days}天后过期`;
}

// 检查是否即将过期（7天内）
export function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  
  const date = new Date(expiresAt);
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return days <= 7 && days > 0;
}
