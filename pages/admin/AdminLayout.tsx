import React, { useState } from 'react';
import { Page, AdminRole, UserProfile } from '../../types';
import { 
  LayoutDashboard, Users, FileText, Settings, 
  LogOut, Bell, ChevronRight, Shield, Activity, Menu, X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser?: UserProfile | null;
  currentRole?: AdminRole; // Optional prop if we want to force override locally
  setRole?: (role: AdminRole) => void; // Optional if we keep the switcher
  onLogout?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, currentPage, setPage, currentUser, onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Use user's role, default to Student if not found
  const role = currentUser?.role || 'Student';

  // 菜单配置 (已中文化)
  const menuItems = [
    { 
      label: '仪表盘', 
      page: Page.ADMIN_DASHBOARD, 
      icon: LayoutDashboard, 
      roles: ['SuperAdmin', 'Manager', 'Editor'] 
    },
    { 
      label: '用户管理', 
      page: Page.ADMIN_USERS, 
      icon: Users, 
      roles: ['SuperAdmin', 'Manager'] 
    },
    { 
      label: '内容 CMS', 
      page: Page.ADMIN_CONTENT, 
      icon: FileText, 
      roles: ['SuperAdmin', 'Manager', 'Editor'] 
    },
    { 
      label: '系统设置', 
      page: Page.ADMIN_SETTINGS, 
      icon: Settings, 
      roles: ['SuperAdmin'] 
    },
    {
      label: '服务器监控',
      page: Page.ADMIN_MONITOR, 
      icon: Activity, 
      roles: ['SuperAdmin']
    }
  ];

  const handleNavClick = (page: Page) => {
      setPage(page);
      setIsSidebarOpen(false); // Close drawer on mobile nav
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex font-sans text-[#1D1D1F]">
      
      {/* --- Mobile Sidebar Overlay --- */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* --- Sidebar (Responsive) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center text-white font-bold text-xs mr-3">
                A
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">管理后台</span>
          </div>
          {/* Close Button Mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
              <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            主菜单
          </div>
          {menuItems.map((item) => {
            // Permission Check
            if (!item.roles.includes(role)) return null;

            const isActive = currentPage === item.page;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} strokeWidth={2} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full px-2"
          >
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 transition-all">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
              {/* Hamburger Mobile */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                  <Menu size={20} />
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hidden sm:inline">ProjectFlow</span>
                <ChevronRight size={14} className="hidden sm:inline" />
                <span className="font-semibold text-gray-900">
                {menuItems.find(i => i.page === currentPage)?.label || 'Console'}
                </span>
              </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <Shield size={14} className="text-gray-500"/>
              <span className="text-xs font-bold text-gray-700">{role}</span>
            </div>

            <div className="h-4 w-px bg-gray-300 hidden md:block"></div>

            <button className="relative text-gray-400 hover:text-gray-600 p-2">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
               {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;