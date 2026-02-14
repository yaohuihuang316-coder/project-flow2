
import React, { useState, useRef, useEffect } from 'react';
import { Page, UserProfile } from '../types';
import { LayoutDashboard, Library, User, LogOut, Bell, CheckCircle, Info, AlertCircle, X, Users, Bot, Crown, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface NavbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onNavigate?: (page: Page) => void;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: number;
  created_at: string;
  is_read?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setPage, currentUser, onLogout, onNavigate }) => {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const upgradeRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'announcements' | 'notifications'>('announcements');
  const notifRef = useRef<HTMLDivElement>(null);
  
  // 真实公告数据
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // 计算未读公告数
  const unreadCount = announcements.filter(a => !readAnnouncements.has(a.id)).length;

  // 获取公告列表
  const fetchAnnouncements = async () => {
    if (!currentUser) return;
    setIsLoadingNotifs(true);
    try {
      // 获取有效公告
      const { data: announcementsData, error } = await supabase
        .from('app_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_at', new Date().toISOString())
        .or(`end_at.is.null,end_at.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // 根据目标受众过滤
      const filtered = (announcementsData || []).filter(a => {
        if (a.target_audience === 'all') return true;
        return a.target_audience === currentUser?.membershipTier;
      });

      setAnnouncements(filtered);

      // 获取已读记录
      const { data: readData } = await supabase
        .from('app_user_announcement_reads')
        .select('announcement_id')
        .eq('user_id', currentUser.id);

      if (readData) {
        setReadAnnouncements(new Set(readData.map(r => r.announcement_id)));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  // 标记公告为已读
  const markAsRead = async (announcementId: string) => {
    if (!currentUser || readAnnouncements.has(announcementId)) return;
    
    try {
      const { error } = await supabase
        .from('app_user_announcement_reads')
        .insert({
          user_id: currentUser.id,
          announcement_id: announcementId,
          read_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') throw error; // 忽略重复插入错误
      
      setReadAnnouncements(prev => new Set([...prev, announcementId]));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    if (!currentUser || announcements.length === 0) return;
    
    const unreadIds = announcements.filter(a => !readAnnouncements.has(a.id)).map(a => a.id);
    if (unreadIds.length === 0) return;

    try {
      const reads = unreadIds.map(id => ({
        user_id: currentUser.id,
        announcement_id: id,
        read_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('app_user_announcement_reads')
        .insert(reads);

      if (error && error.code !== '23505') throw error;
      
      setReadAnnouncements(prev => new Set([...prev, ...unreadIds]));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // 点击通知按钮时获取数据
  const handleNotifClick = () => {
    const newState = !isNotifOpen;
    setIsNotifOpen(newState);
    if (newState) {
      fetchAnnouncements();
    }
  };

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

  // 定期刷新公告（每5分钟）
  useEffect(() => {
    if (!currentUser) return;
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (currentPage === Page.LOGIN) return null;

  const navItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: '概览' },
    { page: Page.LEARNING, icon: Library, label: '学习中心' },
    { page: Page.AI_ASSISTANT, icon: Bot, label: 'AI 助手' },
    { page: Page.COMMUNITY, icon: Users, label: '社区' },
    { page: Page.PROFILE, icon: User, label: '成就' },
  ];

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={16} className="text-green-500" />;
          case 'warning': return <AlertCircle size={16} className="text-orange-500" />;
          case 'error': return <AlertCircle size={16} className="text-red-500" />;
          default: return <Info size={16} className="text-blue-500" />;
      }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return date.toLocaleDateString('zh-CN');
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
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right">
                      {/* Tabs */}
                      <div className="flex border-b border-gray-100">
                        <button 
                          className={`flex-1 py-3 text-sm font-bold ${activeNotifTab === 'announcements' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
                          onClick={() => setActiveNotifTab('announcements')}
                        >
                          公告 {unreadCount > 0 && <span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </button>
                        <button 
                          className={`flex-1 py-3 text-sm font-bold ${activeNotifTab === 'notifications' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
                          onClick={() => setActiveNotifTab('notifications')}
                        >
                          通知
                        </button>
                      </div>

                      {/* Content */}
                      <div className="max-h-[400px] overflow-y-auto">
                        {activeNotifTab === 'announcements' ? (
                          isLoadingNotifs ? (
                            <div className="py-10 text-center text-gray-400">
                              <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full mb-2" />
                              <p className="text-xs">加载中...</p>
                            </div>
                          ) : announcements.length === 0 ? (
                            <div className="py-10 text-center text-gray-400">
                              <Info size={32} className="mx-auto mb-2 opacity-30" />
                              <p className="text-xs">暂无公告</p>
                            </div>
                          ) : (
                            <>
                              {announcements.map((notif) => (
                                  <div 
                                    key={notif.id} 
                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                                      !readAnnouncements.has(notif.id) ? 'bg-blue-50/30' : ''
                                    }`}
                                    onClick={() => markAsRead(notif.id)}
                                  >
                                      <div className="flex gap-3">
                                          <div className={`p-2 rounded-lg ${getTypeColor(notif.type)}`}>
                                              {getNotifIcon(notif.type)}
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                                                {!readAnnouncements.has(notif.id) && (
                                                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.content}</p>
                                              <span className="text-[10px] text-gray-400 mt-2 block font-medium">{formatTime(notif.created_at)}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {announcements.length > 0 && (
                                <button 
                                  onClick={markAllAsRead}
                                  className="w-full py-3 text-xs font-bold text-center text-blue-600 hover:bg-gray-50 transition-colors"
                                >
                                  全部已读
                                </button>
                              )}
                            </>
                          )
                        ) : (
                          <div className="py-10 text-center text-gray-400">
                            <Info size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">暂无通知</p>
                          </div>
                        )}
                      </div>
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
