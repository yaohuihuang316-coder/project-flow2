// 教师端专用类型定义
// 用于统一管理和复用教师端相关的数据类型

import { Page, UserProfile } from '../types';

// ==========================================
// 基础类型
// ==========================================

export type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

export type CourseStatus = 'active' | 'completed' | 'draft' | 'archived';

export type AssignmentStatus = 'pending' | 'grading' | 'completed';

export type ClassStatus = 'upcoming' | 'ongoing' | 'completed';

export type AttendanceStatus = 'present' | 'late' | 'absent';

// ==========================================
// 课程相关
// ==========================================

export interface TeacherCourse {
  id: string;
  title: string;
  category: 'Foundation' | 'Advanced' | 'Implementation';
  description: string;
  studentCount: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  completionRate: number;
  image: string;
  status: CourseStatus;
  nextClass?: string;
  rating: number;
  createdAt: string;
  totalAssignments: number;
  pendingAssignments: number;
}

export interface TodayClass {
  id: string;
  title: string;
  time: string;
  duration: string;
  classroom: string;
  studentCount: number;
  status: ClassStatus;
}

// ==========================================
// 作业相关
// ==========================================

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  content: string;
  deadline: string;
  createdAt: string;
  submittedCount: number;
  totalCount: number;
  status: AssignmentStatus;
  maxScore: number;
  attachments: string[];
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  assignmentId: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  score?: number;
  comment?: string;
  status: 'submitted' | 'graded' | 'late';
}

// ==========================================
// 课堂相关
// ==========================================

export interface AttendanceStudent {
  id: string;
  name: string;
  avatar: string;
  status: AttendanceStatus;
  checkInTime?: string;
}

export interface ClassQuestion {
  id: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  timestamp: string;
  upvotes: number;
  isAnswered: boolean;
}

export interface ClassPoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
}

export interface WhiteboardStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

// ==========================================
// 待办事项
// ==========================================

export interface TodoItem {
  id: string;
  type: 'homework' | 'question' | 'notice';
  title: string;
  count: number;
  urgent?: boolean;
}

// ==========================================
// 统计数据
// ==========================================

export interface TeacherStats {
  courseCount: number;
  studentCount: number;
  pendingGrading: number;
  weekHours: number;
}

// ==========================================
// 表单类型
// ==========================================

export interface CourseForm {
  title: string;
  category: 'Foundation' | 'Advanced' | 'Implementation';
  description: string;
  duration: number;
  maxStudents: number;
}

export interface AssignmentForm {
  title: string;
  courseId: string;
  content: string;
  deadline: string;
  maxScore: number;
  attachments: any[];
}

export interface GradeForm {
  score: number;
  comment: string;
}

// ==========================================
// 组件 Props
// ==========================================

export interface TeacherPageProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

export interface TeacherLayoutProps {
  children: React.ReactNode;
  activeTab: TeacherTab;
  onTabChange: (tab: TeacherTab) => void;
  onNavigate?: (page: Page) => void;
  onLogout?: () => void;
  currentUser?: { name?: string; avatar?: string } | null;
  hideBottomNav?: boolean;
}
