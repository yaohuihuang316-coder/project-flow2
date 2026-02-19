import React, { useState } from 'react';
import { Page, UserProfile } from '../types';
import { TeacherTab } from '../types/teacher';
import TeacherLayout from '../components/TeacherLayout';
import TeacherHome from '../components/teacher/TeacherHome';
import MyCourses from './teacher/MyCourses';
import Classroom from './teacher/Classroom';
import Assignments from './teacher/Assignments';
import Profile from './teacher/Profile';
import {
  useTeacherStats,
  useTodayClasses,
  useTeacherCourses,
  useTeacherTodos
} from '../hooks/teacher';

interface TeacherDashboardProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('home');

  // 使用自定义 hooks 获取数据
  const { stats, loading: statsLoading } = useTeacherStats(currentUser?.id);
  const { classes: todayClasses, loading: classesLoading } = useTodayClasses(currentUser?.id);
  const { courses: myCourses, loading: coursesLoading } = useTeacherCourses(currentUser?.id, 4);
  const { todos, loading: todosLoading } = useTeacherTodos(currentUser?.id);

  const loading = statsLoading || classesLoading || coursesLoading || todosLoading;

  // 处理标签切换
  const handleTabChange = (tab: TeacherTab) => {
    setActiveTab(tab);
    
    // 同步导航到对应页面
    if (onNavigate) {
      switch (tab) {
        case 'home':
          onNavigate(Page.TEACHER_DASHBOARD);
          break;
        case 'courses':
          onNavigate(Page.TEACHER_COURSES);
          break;
        case 'assignments':
          onNavigate(Page.TEACHER_ASSIGNMENTS);
          break;
        case 'profile':
          onNavigate(Page.TEACHER_PROFILE);
          break;
        default:
          break;
      }
    }
  };

  // 开始上课
  const handleStartClass = (_classId: string) => {
    setActiveTab('class');
    // 可以在这里传递 classId 给 Classroom 组件
  };

  // 渲染内容
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <TeacherHome
            currentUser={currentUser}
            stats={stats}
            todayClasses={todayClasses}
            todos={todos}
            myCourses={myCourses}
            loading={loading}
            onStartClass={handleStartClass}
            onNavigate={handleTabChange}
          />
        );
      case 'courses':
        return (
          <MyCourses
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        );
      case 'class':
        return (
          <Classroom
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        );
      case 'assignments':
        return (
          <Assignments
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            currentUser={currentUser}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        );
      default:
        return (
          <TeacherHome
            currentUser={currentUser}
            stats={stats}
            todayClasses={todayClasses}
            todos={todos}
            myCourses={myCourses}
            loading={loading}
            onStartClass={handleStartClass}
            onNavigate={handleTabChange}
          />
        );
    }
  };

  return (
    <TeacherLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onNavigate={onNavigate}
      onLogout={onLogout}
      currentUser={currentUser}
    >
      {renderContent()}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
