import React from 'react';
import { Home, BookOpen, Video, ClipboardList, User, LogOut, Settings, GraduationCap } from 'lucide-react';
import { Page } from '../types';

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'courses' | 'class' | 'assignments' | 'profile';
  onTabChange: (tab: 'home' | 'courses' | 'class' | 'assignments' | 'profile') => void;
  onNavigate?: (page: Page) => void;
  onLogout?: () => void;
  currentUser?: { name?: string; avatar?: string; role?: string } | null;
  hideBottomNav?: boolean;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onNavigate,
  onLogout,
  currentUser,
  hideBottomNav = false
}) => {
  const navItems = [
    { id: 'home' as const, icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
    { id: 'courses' as const, icon: BookOpen, label: '课程', page: Page.TEACHER_COURSES },
    { id: 'class' as const, icon: Video, label: '上课', page: Page.TEACHER_CLASSROOM },
    { id: 'assignments' as const, icon: ClipboardList, label: '作业', page: Page.TEACHER_ASSIGNMENTS },
    { id: 'profile' as const, icon: User, label: '我的', page: Page.TEACHER_PROFILE },
  ];

  const handleTabChange = (tabId: typeof navItems[number]['id']) => {
    onTabChange(tabId);
    const item = navItems.find(i => i.id === tabId);
    if (item?.page && onNavigate) {
      onNavigate(item.page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white h-screen sticky top-0 border-r border-gray-200 flex-col">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">教师中心</span>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings & Logout */}
        <div className="p-6 pt-0 mt-auto">
          <div className="border-t border-gray-100 pt-4 space-y-1">
            <button
              onClick={() => {
                // 设置功能在个人中心页面内，先跳转到个人中心
                onNavigate?.(Page.TEACHER_PROFILE);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Settings size={20} />
              <span>设置</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                <span>退出登录</span>
              </button>
            )}
          </div>
          
          {/* User Info */}
          {currentUser && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://i.pravatar.cc/150?u=teacher'}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name || '教师'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role || '讲师'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;
