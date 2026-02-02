
/**
 * Membership System - Utilities
 * 会员系统工具函数
 * 
 * 注意：数据库 subscription_tier 使用 'Free'|'Pro'|'Pro+'
 * 代码中使用小写 'free'|'pro'|'pro_plus'
 */

import { Page, UserProfile, MembershipTier, MembershipRequirement } from '../types';

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

// 会员等级配置 - 与数据库保持一致
export const MEMBERSHIP_CONFIG: Record<MembershipTier, {
  level: number;
  name: string;
  badge: string;
  color: string;
  gradient: string;
  icon: string;
  requiredCourses: number;
}> = {
  free: {
    level: 0,
    name: '免费会员',
    badge: 'FREE',
    color: 'bg-gray-100 text-gray-600',
    gradient: 'from-gray-400 to-gray-500',
    icon: 'Star',
    requiredCourses: 0
  },
  pro: {
    level: 1,
    name: '专业会员',
    badge: 'PRO',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    gradient: 'from-blue-500 to-cyan-500',
    icon: 'Crown',
    requiredCourses: 5  // 5门课程解锁
  },
  pro_plus: {
    level: 2,
    name: '高级会员',
    badge: 'PRO+',
    color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    gradient: 'from-amber-500 to-orange-500',
    icon: 'Crown',
    requiredCourses: 10  // 10门课程解锁
  }
};

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

// 获取下一等级信息
export function getNextTierInfo(user: UserProfile | null) {
  if (!user) return null;
  
  const tierOrder: MembershipTier[] = ['free', 'pro', 'pro_plus'];
  const currentIndex = tierOrder.indexOf(user.membershipTier);
  
  if (currentIndex >= tierOrder.length - 1) return null; // 已是最高级
  
  const nextTier = tierOrder[currentIndex + 1];
  const config = MEMBERSHIP_CONFIG[nextTier];
  
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

// 获取用户会员信息展示
export function getMembershipDisplay(user: UserProfile | null) {
  if (!user) return MEMBERSHIP_CONFIG.free;
  return MEMBERSHIP_CONFIG[user.membershipTier];
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
