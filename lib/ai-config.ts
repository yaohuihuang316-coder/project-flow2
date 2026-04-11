// AI 模型配置
import { AIModelConfig, MembershipTier } from '../types';

export const AI_MODELS: Record<'basic' | 'pro', AIModelConfig> = {
  basic: {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    description: 'DeepSeek 轻量模型，适合日常问答、写作和课程辅导',
    maxTokens: 8192,
    temperature: 0.7,
    icon: '🧠',
    color: '#2563eb',
    features: ['知识问答', '概念解释', '简单分析', '文档辅助']
  },
  pro: {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    description: 'DeepSeek 统一模型，覆盖高频学习与分析场景',
    maxTokens: 8192,
    temperature: 0.7,
    icon: '🧠',
    color: '#2563eb',
    features: ['知识问答', '概念解释', '简单分析']
  }
};

// 每日调用限制
export const AI_DAILY_LIMITS: Record<MembershipTier, number> = {
  free: 5,
  pro: 20,
  pro_plus: 50
};

// 检查用户是否有权限使用AI模型
export const canUseAIModel = (
  userTier: MembershipTier,
  modelType: 'basic' | 'pro'
): boolean => {
  const tierLevels: Record<MembershipTier, number> = {
    free: 0,
    pro: 1,
    pro_plus: 2
  };
  // pro模型仍保留给 pro_plus 权限，方便和现有会员体系兼容
  // basic模型对所有付费会员(pro/pro_plus)开放
  const requiredLevel = modelType === 'pro' ? 2 : 1;
  return tierLevels[userTier] >= requiredLevel;
};

// 获取用户可用的AI模型
export const getAvailableModels = (userTier: MembershipTier): ('basic' | 'pro')[] => {
  if (userTier === 'free') return [];
  if (userTier === 'pro') return ['basic'];
  if (userTier === 'pro_plus') return ['basic', 'pro'];
  return [];
};

// 获取用户默认模型
export const getDefaultModel = (userTier: MembershipTier): 'basic' | 'pro' | null => {
  if (userTier === 'free') return null;
  if (userTier === 'pro_plus') return 'pro';
  return 'basic';
};

// 获取AI使用限制提示
export const getUsageLimitMessage = (
  used: number,
  limit: number,
  resetTime?: string
): { message: string; type: 'normal' | 'warning' | 'exceeded' } => {
  if (used >= limit) {
    return {
      message: `今日AI调用已达上限 (${limit}/${limit})，将于 ${resetTime ? new Date(resetTime).toLocaleTimeString() : '明天'} 重置`,
      type: 'exceeded'
    };
  }
  if (used >= limit * 0.8) {
    return {
      message: `今日AI调用即将用尽 (${used}/${limit})`,
      type: 'warning'
    };
  }
  return {
    message: `今日AI调用: ${used}/${limit}`,
    type: 'normal'
  };
};

// API Key 获取
export const getDeepSeekApiKey = (): string | null => {
  try {
    // @ts-ignore - Vite env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore - Vite env
      return import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.API_KEY || null;
    }
  } catch (e) {
    console.error('Failed to get DeepSeek API key:', e);
  }
  return null;
};
