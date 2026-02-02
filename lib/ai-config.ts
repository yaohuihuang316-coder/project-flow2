// AI 模型配置
import { AIModelConfig, MembershipTier } from '../types';

export const AI_MODELS: Record<'basic' | 'pro', AIModelConfig> = {
  basic: {
    id: 'gemini-3-flash-preview',
    provider: 'google',
    name: 'Gemini Flash',
    description: '快速响应，适合日常问答和基础项目管理知识',
    maxTokens: 2048,
    temperature: 0.7,
    icon: '⚡',
    color: '#4285f4',
    features: ['知识问答', '概念解释', '简单分析']
  },
  pro: {
    id: 'kimi-k2.5',
    provider: 'moonshot',
    name: 'Kimi 2.5',
    description: '深度思考，适合复杂分析和专业文档生成',
    maxTokens: 8192,
    temperature: 0.5,
    icon: '🧠',
    color: '#6366f1',
    features: ['深度分析', '文档生成', '代码编写', '战略规划', '复杂计算']
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
  // pro模型需要pro_plus, basic模型需要pro
  const requiredLevel = modelType === 'pro' ? 2 : 1;
  return tierLevels[userTier] >= requiredLevel;
};

// 获取用户可用的AI模型
export const getAvailableModels = (userTier: MembershipTier): ('basic' | 'pro')[] => {
  if (userTier === 'free') return [];
  if (userTier === 'basic' || userTier === 'pro') return ['basic'];
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
export const getGeminiApiKey = (): string | null => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_GEMINI_API_KEY || null;
    }
  } catch (e) {
    console.error('Failed to get Gemini API key:', e);
  }
  return null;
};

export const getMoonshotApiKey = (): string | null => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_MOONSHOT_API_KEY || null;
    }
  } catch (e) {
    console.error('Failed to get Moonshot API key:', e);
  }
  return null;
};
