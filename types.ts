
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  CLASSROOM = 'CLASSROOM',
  COMMUNITY = 'COMMUNITY',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PROFILE = 'PROFILE',
  SCHEDULE = 'SCHEDULE',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  SIMULATION = 'SIMULATION',
  TOOLS_LAB = 'TOOLS_LAB',
  MEMBERSHIP = 'MEMBERSHIP', // 会员中心
  // Admin Pages
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_PROGRESS = 'ADMIN_PROGRESS',
  ADMIN_CONTENT = 'ADMIN_CONTENT',
  ADMIN_COMMUNITY = 'ADMIN_COMMUNITY',
  ADMIN_EVENTS = 'ADMIN_EVENTS',
  ADMIN_ANNOUNCEMENTS = 'ADMIN_ANNOUNCEMENTS',
  ADMIN_SYSTEM = 'ADMIN_SYSTEM',
  ADMIN_ANALYTICS = 'ADMIN_ANALYTICS',
  ADMIN_MEMBERSHIP = 'ADMIN_MEMBERSHIP' // 会员管理
  // 已删除: ADMIN_SETTINGS, ADMIN_MONITOR
}

export type AdminRole = 'SuperAdmin' | 'Manager' | 'Editor' | 'Student';

// 会员等级类型
export type MembershipTier = 'free' | 'basic' | 'pro' | 'pro_plus';

// AI 等级类型
export type AITier = 'none' | 'basic' | 'pro';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  joined_at?: string;
  xp?: number;
  streak?: number;
  // 会员系统字段
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  completedCoursesCount: number;
  isLifetimeMember: boolean;
  // AI 权限字段
  aiTier: AITier;
  aiDailyUsed: number;
  aiDailyResetAt?: string;
}

// 会员权限要求配置
export interface MembershipRequirement {
  page: Page;
  minTier: MembershipTier;
  requiredCourses: number;
  title: string;
  description: string;
  benefits: string[];
  icon: string;
}

export interface Course {
  id: string;
  title: string;
  category: 'Foundation' | 'Advanced' | 'Implementation';
  progress: number;
  image: string;
  duration: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  color: string;
  icon: string;
}

// New Interface for Data Integration
export interface ActivityLog {
  id: number;
  user_id: string;
  action_type: 'complete_task' | 'finish_chapter' | 'post_community' | 'login';
  points: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
  likes: number;
}


// ==========================================
// 知识图谱相关类型
// ==========================================

export type KnowledgeNodeType = 'concept' | 'core' | 'skill' | 'tool' | 'certification';
export type KnowledgeNodeLevel = 1 | 2 | 3; // 1=基础, 2=进阶, 3=实战
export type RelationType = 'prerequisite' | 'related' | 'leads_to' | 'part_of';

export interface KnowledgeNode {
  id: string;
  label: string;
  category: string;
  courseId?: string;
  courseCategory?: 'Foundation' | 'Advanced' | 'Implementation';
  nodeLevel: KnowledgeNodeLevel;
  nodeType: KnowledgeNodeType;
  description?: string;
  formula?: string;
  learningHours: number;
  difficulty: number; // 1-5
  prerequisites: string[];
  val?: number; // 节点大小
  masteryLevel?: number; // 用户掌握度 0-100
}

export interface KnowledgeEdge {
  id?: string;
  source: string;
  target: string;
  relationType: RelationType;
  strength: number; // 1-3
}

// ==========================================
// AI 相关类型
// ==========================================

export interface AIModelConfig {
  id: string;
  provider: 'google' | 'moonshot';
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  icon: string;
  color: string;
  features: string[];
}

export interface AIUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  query?: string;
  createdAt: string;
}

// ==========================================
// 会员相关类型
// ==========================================

export interface MembershipCode {
  id: string;
  code: string;
  tier: MembershipTier;
  durationDays: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface MembershipSubscription {
  id: string;
  userId: string;
  tier: MembershipTier;
  paymentMethod?: 'course_completion' | 'payment' | 'code';
  amount?: number;
  currency: string;
  startedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface MembershipStats {
  totalUsers: number;
  freeUsers: number;
  basicUsers: number;
  proUsers: number;
  proPlusUsers: number;
}

// 导出保留
export interface MembershipRequirement {
  page: Page;
  minTier: MembershipTier;
  requiredCourses: number;
  title: string;
  description: string;
  benefits: string[];
  icon: string;
}
