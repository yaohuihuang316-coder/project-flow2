
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  CLASSROOM = 'CLASSROOM', // Kept for detail view
  COMMUNITY = 'COMMUNITY', // New Top-level Nav
  AI_ASSISTANT = 'AI_ASSISTANT', // New AI Page
  PROFILE = 'PROFILE',
  SCHEDULE = 'SCHEDULE',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  SIMULATION = 'SIMULATION',
  TOOLS_LAB = 'TOOLS_LAB',
  // Admin Pages
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_PROGRESS = 'ADMIN_PROGRESS', // 学习进度管理
  ADMIN_CONTENT = 'ADMIN_CONTENT',
  ADMIN_COMMUNITY = 'ADMIN_COMMUNITY', // New Admin Page
  ADMIN_EVENTS = 'ADMIN_EVENTS', // 日程活动管理
  ADMIN_ANNOUNCEMENTS = 'ADMIN_ANNOUNCEMENTS', // New: Announcements Manager
  ADMIN_SYSTEM = 'ADMIN_SYSTEM', // 系统配置管理
  ADMIN_ANALYTICS = 'ADMIN_ANALYTICS', // 数据统计看板
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  ADMIN_MONITOR = 'ADMIN_MONITOR'
}

export type AdminRole = 'SuperAdmin' | 'Manager' | 'Editor' | 'Student';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
  department?: string;
  joined_at?: string;
  xp?: number; // Added XP
  streak?: number; // Added Streak
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
