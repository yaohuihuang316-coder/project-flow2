import React, { useState, useRef, useEffect } from 'react';
import { Page, UserProfile } from '../types';
import { LayoutDashboard, Library, PlayCircle, User, LogOut, Bell, CheckCircle, Info, AlertCircle, X } from 'lucide-react';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

// Mock Notifications
const NOTIFICATIONS = [
    { id: 1, title: '课程更新', msg: '《敏捷实战》新增了第4章：Scrum详解', time: '10m ago', type: 'info' },
    { id: 2, title: '作业批改', msg: '您的 "WBS 分解" 作业已被批改，得分 95。', time: '1h ago', type: 'success' },
    { id: 3, title: '系统维护', msg: '系统将于今晚 02:00 进行例行维护。', time: '3h ago', type: 'warning' },
];

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage, currentUser, onLogout }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setIsNotifOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentPage === Page.LOGIN) return null;

  const navItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: '概览' },
    { page: Page.LEARNING, icon: Library, label: '学习中心' },
    { page: Page.CLASSROOM, icon: PlayCircle, label: '课程' },
    { page: Page.PROFILE, icon: User, label: '成就' },
  ];

  const handleNotifClick = () => {
      setIsNotifOpen(!isNotifOpen);
      if (!isNotifOpen) setUnreadCount(0); // Mark as read on open
  };

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={16} className="text-green-500" />;
          case 'warning': return <AlertCircle size={16} className="text-orange-500" />;
          default: return <Info size={16} className="text-blue-500" />;
      }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage(Page.DASHBOARD)}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
          PF
        </div>
        <span className="font-semibold text-lg tracking-tight text-gray-800 hidden sm:block">ProjectFlow</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 bg-gray-100/80 p-1.5 rounded-full border border-gray-200/50 backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                isActive
                  ? 'bg-white text-black shadow-sm scale-100 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 scale-95'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : ''} />
              <span className={`text-sm ${isActive ? 'block' : 'hidden md:block'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
              <button 
                onClick={handleNotifClick}
                className={`p-2.5 rounded-full transition-all duration-300 relative ${isNotifOpen ? 'bg-black text-white' : 'hover:bg-gray-200/50 text-gray-400 hover:text-gray-900'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Dropdown Panel */}
              {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</h3>
                          <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-black"><X size={14}/></button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                          {NOTIFICATIONS.map((notif) => (
                              <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3">
                                  <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                                  <div>
                                      <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.msg}</p>
                                      <span className="text-[10px] text-gray-400 mt-2 block font-medium">{notif.time}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button className="w-full py-2.5 text-xs font-bold text-center text-blue-600 hover:bg-gray-50 transition-colors">
                          View All
                      </button>
                  </div>
              )}
          </div>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
             {currentUser && (
                 <div className="flex items-center gap-2 cursor-default">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-black text-white flex items-center justify-center text-xs font-bold">
                         {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                     </div>
                     <div className="hidden lg:block text-right leading-tight">
                         <div className="text-xs font-bold text-gray-900">{currentUser.name}</div>
                         <div className="text-[10px] text-gray-500">{currentUser.role}</div>
                     </div>
                 </div>
             )}

             <button 
                onClick={onLogout}
                className="p-2.5 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-red-500 transition-colors duration-300"
                title="退出登录"
            >
                <LogOut size={18} />
            </button>
          </div>
      </div>
    </nav>
  );
};

export default Navbar;