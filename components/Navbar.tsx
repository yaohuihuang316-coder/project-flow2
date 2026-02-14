
import React, { useState, useRef, useEffect } from 'react';
import { Page, UserProfile } from '../types';
import { LayoutDashboard, Library, User, LogOut, Bell, CheckCircle, Info, AlertCircle, X, Users, Bot, Crown, CreditCard } from 'lucide-react';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onNavigate?: (page: Page) => void;
}

// Mock Notifications
const NOTIFICATIONS = [
    { id: 1, title: '课程更新', msg: '《敏捷实战》新增了第4章：Scrum详解', time: '10m ago', type: 'info' },
    { id: 2, title: '作业批改', msg: '您的 "WBS 分解" 作业已被批改，得分 95。', time: '1h ago', type: 'success' },
    { id: 3, title: '系统维护', msg: '系统将于今晚 02:00 进行例行维护。', time: '3h ago', type: 'warning' },
];

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage, currentUser, onLogout, onNavigate }) => {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const upgradeRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setIsNotifOpen(false);
          }
          if (upgradeRef.current && !upgradeRef.current.contains(event.target as Node)) {
              setIsUpgradeOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentPage === Page.LOGIN) return null;

  const navItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: '概览' },
    { page: Page.LEARNING, icon: Library, label: '学习中心' },
    { page: Page.AI_ASSISTANT, icon: Bot, label: 'AI 助手' },
    { page: Page.COMMUNITY, icon: Users, label: '社区' },
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
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/5 scale-95'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : ''} />
              <span className={`text-sm ${isActive ? 'block' : 'hidden md:block'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
          {/* Upgrade Membership Button */}
          <div className="relative" ref={upgradeRef}>
              <button 
                onClick={() => setIsUpgradeOpen(!isUpgradeOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  currentUser?.membershipTier === 'pro_plus' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : currentUser?.membershipTier === 'pro'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Crown size={16} />
                <span className="text-xs font-bold hidden sm:block">
                  {currentUser?.membershipTier === 'pro_plus' ? 'Pro+' : currentUser?.membershipTier === 'pro' ? 'Pro' : '升级会员'}
                </span>
              </button>

              {/* Upgrade Dropdown Panel */}
              {isUpgradeOpen && (
                  <div className="absolute top-full right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex justify-between items-center">
                              <h3 className="text-sm font-bold text-gray-900">升级会员</h3>
                              <button onClick={() => setIsUpgradeOpen(false)} className="text-gray-400 hover:text-black"><X size={14}/></button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">解锁更多高级功能和工具</p>
                      </div>
                      
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                          {/* Free Plan */}
                          <div className={`p-4 rounded-xl border-2 ${currentUser?.membershipTier === 'free' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <span className="text-lg">🆓</span>
                                      <span className="font-bold text-gray-900">Free</span>
                                  </div>
                                  {currentUser?.membershipTier === 'free' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">当前</span>}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">基础课程 + 3个工具</p>
                          </div>

                          {/* Pro Plan */}
                          <div className={`p-4 rounded-xl border-2 ${currentUser?.membershipTier === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 cursor-pointer'}`}
                               onClick={() => { onNavigate?.(Page.MEMBERSHIP); setIsUpgradeOpen(false); }}>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <span className="text-lg">💎</span>
                                      <span className="font-bold text-gray-900">Pro</span>
                                  </div>
                                  <span className="text-lg font-bold text-blue-600">¥99<span className="text-xs text-gray-400">/月</span></span>
                              </div>
                              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> 全部基础工具</li>
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> 5个高级工具</li>
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> AI助手 20次/天</li>
                              </ul>
                              {currentUser?.membershipTier === 'pro' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full mt-2 inline-block">当前</span>}
                          </div>

                          {/* Pro+ Plan */}
                          <div className={`p-4 rounded-xl border-2 ${currentUser?.membershipTier === 'pro_plus' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300 cursor-pointer'}`}
                               onClick={() => { onNavigate?.(Page.MEMBERSHIP); setIsUpgradeOpen(false); }}>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <span className="text-lg">👑</span>
                                      <span className="font-bold text-gray-900">Pro+</span>
                                  </div>
                                  <span className="text-lg font-bold text-amber-600">¥199<span className="text-xs text-gray-400">/月</span></span>
                              </div>
                              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> 全部22个工具</li>
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> 实战模拟中心</li>
                                  <li className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> AI助手 50次/天</li>
                              </ul>
                              {currentUser?.membershipTier === 'pro_plus' && <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full mt-2 inline-block">当前</span>}
                          </div>

                          {/* Payment Methods */}
                          <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-2">支持支付方式</p>
                              <div className="flex gap-2">
                                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md border border-green-200">微信支付</span>
                                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md border border-blue-200">支付宝</span>
                                  <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-md border border-purple-200">兑换码</span>
                              </div>
                          </div>

                          <button 
                              onClick={() => { onNavigate?.(Page.MEMBERSHIP); setIsUpgradeOpen(false); }}
                              className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                          >
                              <CreditCard size={16}/>
                              {currentUser?.membershipTier === 'free' ? '选择并支付' : '管理订阅'}
                          </button>
                      </div>
                  </div>
              )}
          </div>

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