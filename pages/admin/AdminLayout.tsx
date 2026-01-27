
import React, { useState } from 'react';
import { Page, AdminRole, UserProfile } from '../../types';
import {
  LayoutDashboard, Users, FileText, Settings,
  LogOut, Bell, ChevronRight, Shield, Activity, Menu, X, MessageSquare,
  ChevronDown, BookOpen, Tag, Clock, Network, Megaphone, TrendingUp, Calendar, BarChart3
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  // Upgrade: onNavigate allows passing params (secondaryId) for tab switching
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  currentTabParam?: string; // To highlight sub-items
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children, currentPage, onNavigate, currentUser, onLogout, currentTabParam
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['content', 'community', 'system']);

  const role = currentUser?.role || 'Student';

  // Enhanced Menu Structure
  const menuGroups = [
    {
      id: 'main',
      label: '概览 (Overview)',
      items: [
        { label: '仪表盘', page: Page.ADMIN_DASHBOARD, icon: LayoutDashboard, roles: ['SuperAdmin', 'Manager', 'Editor'] },
        { label: '数据统计', page: Page.ADMIN_ANALYTICS, icon: BarChart3, roles: ['SuperAdmin', 'Manager'] },
      ]
    },
    {
      id: 'content',
      label: '资源中心 (Resources)',
      items: [
        { label: '体系课程', page: Page.ADMIN_CONTENT, param: 'courses', icon: BookOpen, roles: ['SuperAdmin', 'Manager', 'Editor'] },
        { label: '核心算法', page: Page.ADMIN_CONTENT, param: 'labs', icon: Tag, roles: ['SuperAdmin', 'Manager', 'Editor'] },
        { label: '实战项目', page: Page.ADMIN_CONTENT, param: 'projects', icon: Clock, roles: ['SuperAdmin', 'Manager', 'Editor'] },
        { label: '知识图谱', page: Page.ADMIN_CONTENT, param: 'graph', icon: Network, roles: ['SuperAdmin', 'Manager', 'Editor'] },
      ]
    },
    {
      id: 'community',
      label: '运营中心 (Operations)',
      items: [
        { label: '用户管理', page: Page.ADMIN_USERS, icon: Users, roles: ['SuperAdmin', 'Manager'] },
        { label: '学习进度', page: Page.ADMIN_PROGRESS, icon: TrendingUp, roles: ['SuperAdmin', 'Manager'] },
        { label: '日程活动', page: Page.ADMIN_EVENTS, icon: Calendar, roles: ['SuperAdmin', 'Manager'] },
        { label: '内容审核', page: Page.ADMIN_COMMUNITY, icon: MessageSquare, roles: ['SuperAdmin', 'Manager'] },
        { label: '全站公告', page: Page.ADMIN_ANNOUNCEMENTS, icon: Megaphone, roles: ['SuperAdmin', 'Manager'] },
      ]
    },
    {
      id: 'system',
      label: '系统核心 (System)',
      items: [
        { label: '系统配置', page: Page.ADMIN_SYSTEM, icon: Settings, roles: ['SuperAdmin'] },
        { label: '全局设置', page: Page.ADMIN_SETTINGS, icon: Settings, roles: ['SuperAdmin'] },
        { label: '服务监控', page: Page.ADMIN_MONITOR, icon: Activity, roles: ['SuperAdmin'] },
      ]
    }
  ];

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleNavClick = (page: Page, param?: string) => {
    onNavigate(page, param);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex font-sans text-[#1D1D1F]">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#FBFBFD] border-r border-gray-200/80 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl md:shadow-none
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-sm shadow-md">
              PF
            </div>
            <span className="font-semibold text-gray-900 tracking-tight text-base">Admin Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {menuGroups.map(group => {
            // Check if user has access to any item in this group
            const hasAccess = group.items.some(item => item.roles.includes(role));
            if (!hasAccess) return null;

            const isExpanded = expandedGroups.includes(group.id);

            return (
              <div key={group.id}>
                {group.id !== 'main' && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between w-full text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 hover:text-gray-600 transition-colors"
                  >
                    {group.label}
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>
                )}

                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isExpanded || group.id === 'main' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.items.map(item => {
                    if (!item.roles.includes(role)) return null;

                    // Check active state (Page Match AND Param Match if param exists)
                    const isActive = currentPage === item.page && (!item.param || item.param === currentTabParam);

                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNavClick(item.page, item.param)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-white/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{currentUser?.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors w-full border border-transparent hover:border-red-100"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Minimal Header for Mobile/Context */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="font-bold text-gray-900 text-lg">
              {/* Dynamic Title based on selection */}
              {currentPage === Page.ADMIN_CONTENT && currentTabParam === 'courses' ? '体系课程管理' :
                currentPage === Page.ADMIN_CONTENT && currentTabParam === 'labs' ? '核心算法实验' :
                  currentPage === Page.ADMIN_CONTENT && currentTabParam === 'projects' ? '实战项目剧本' :
                    currentPage === Page.ADMIN_CONTENT && currentTabParam === 'graph' ? '知识图谱构建' :
                      '控制台'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-[#F5F5F7]">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
