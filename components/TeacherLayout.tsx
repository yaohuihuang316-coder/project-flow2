import React from 'react';
import { Home, BookOpen, Video, ClipboardList, User, LogOut } from 'lucide-react';
import { Page } from '../types';

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'courses' | 'class' | 'assignments' | 'profile';
  onTabChange: (tab: 'home' | 'courses' | 'class' | 'assignments' | 'profile') => void;
  onNavigate?: (page: Page) => void;
  onLogout?: () => void;
  currentUser?: { name?: string; avatar?: string } | null;
  hideBottomNav?: boolean;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onNavigate,
  onLogout,
  hideBottomNav = false
}) => {
  const navItems = [
    { id: 'home' as const, icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
    { id: 'courses' as const, icon: BookOpen, label: '课程', page: Page.TEACHER_COURSES },
    { id: 'class' as const, icon: Video, label: '上课', highlight: true },
    { id: 'assignments' as const, icon: ClipboardList, label: '作业', page: Page.TEACHER_ASSIGNMENTS },
    { id: 'profile' as const, icon: User, label: '我的', page: Page.TEACHER_PROFILE },
  ];

  const handleTabChange = (tabId: typeof navItems[number]['id']) => {
    onTabChange(tabId);
    const item = navItems.find(i => i.id === tabId);
    if (item?.page && onNavigate && tabId !== 'class') {
      onNavigate(item.page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white h-screen sticky top-0 border-r border-gray-200 flex-col">
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">教师端</h1>
          <nav className="space-y-2">
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
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Desktop Logout */}
        {onLogout && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
              <span>退出登录</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile/Tablet Container */}
        <div className="lg:max-w-none max-w-lg mx-auto min-h-screen">
          <div className="p-4 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${
                    item.highlight ? '-mt-4' : ''
                  }`}
                >
                  {item.highlight ? (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isActive ? 'bg-blue-600 shadow-blue-500/30' : 'bg-gray-100'
                    }`}>
                      <Icon size={28} className={isActive ? 'text-white' : 'text-gray-500'} />
                    </div>
                  ) : (
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  )}
                  <span className={`text-[10px] font-medium transition-colors ${
                    item.highlight ? 'text-gray-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-2 w-full"></div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;
