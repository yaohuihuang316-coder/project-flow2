
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LEARNING = 'LEARNING',
  CLASSROOM = 'CLASSROOM',
  PROFILE = 'PROFILE',
  SCHEDULE = 'SCHEDULE',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  SIMULATION = 'SIMULATION',
  // Admin Pages
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_CONTENT = 'ADMIN_CONTENT',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS',
  ADMIN_MONITOR = 'ADMIN_MONITOR'
}

export type AdminRole = 'SuperAdmin' | 'Manager' | 'Editor';

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
