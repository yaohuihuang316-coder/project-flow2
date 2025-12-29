import React, { useState } from 'react';
import { Save, Lock, Bell, Globe, Database, Shield, Server, Mail, AlertTriangle, Cloud, ToggleLeft, ToggleRight, Check } from 'lucide-react';

type SettingsTab = 'general' | 'security' | 'notifications' | 'backup' | 'audit';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock Settings State
  const [settings, setSettings] = useState({
      siteName: 'ProjectFlow Enterprise',
      supportEmail: 'support@projectflow.com',
      maintenanceMode: false,
      sessionTimeout: 30, // minutes
      ipWhitelist: '192.168.1.1, 10.0.0.5',
      notifications: {
          signup: true,
          purchase: true,
          alert: true
      }
  });

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 1000);
  };

  const navItems = [
      { id: 'general', label: '通用设置', icon: Globe },
      { id: 'security', label: '安全策略', icon: Shield },
      { id: 'notifications', label: '通知渠道', icon: Bell },
      { id: 'backup', label: '备份与恢复', icon: Database },
      { id: 'audit', label: '审计规则', icon: FileText },
  ];

  function FileText(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>; }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px] animate-fade-in">
      
      {/* --- Left Sidebar --- */}
      <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</h2>
              </div>
              <nav className="p-2 space-y-1">
                  {navItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as SettingsTab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                            activeTab === item.id
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                          <item.icon size={18} className={activeTab === item.id ? 'text-blue-500' : 'text-gray-400'}/>
                          {item.label}
                      </button>
                  ))}
              </nav>
          </div>
          
          {/* Storage Widget */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Cloud size={14}/> 存储空间 (Storage)
              </h3>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 mb-2">
                  <div className="h-full bg-blue-500" style={{width: '45%'}}></div>
                  <div className="h-full bg-yellow-400" style={{width: '20%'}}></div>
                  <div className="h-full bg-green-500" style={{width: '15%'}}></div>
              </div>
              <div className="flex justify-between text-[10px] font-medium text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> DB</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Logs</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Media</div>
              </div>
              <p className="text-xs text-gray-400 mt-3">80GB of 100GB Used</p>
          </div>
      </aside>

      {/* --- Right Content --- */}
      <main className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col">
             
             {/* Header */}
             <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                 <div>
                     <h1 className="text-xl font-bold text-gray-900">
                         {navItems.find(i => i.id === activeTab)?.label}
                     </h1>
                     <p className="text-sm text-gray-500 mt-0.5">管理系统的全局参数</p>
                 </div>
                 <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-70"
                 >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
                    {isSaving ? 'Saving...' : '保存更改'}
                 </button>
             </div>

             {/* Scrollable Form Area */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div className="max-w-2xl space-y-8">
                     
                     {/* --- Tab: General --- */}
                     {activeTab === 'general' && (
                         <>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">站点名称</label>
                                    <input 
                                        type="text" 
                                        value={settings.siteName}
                                        onChange={e => setSettings({...settings, siteName: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">技术支持邮箱</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input 
                                            type="email" 
                                            value={settings.supportEmail}
                                            onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between bg-red-50 border border-red-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-red-900">维护模式 (Maintenance Mode)</h3>
                                            <p className="text-xs text-red-700/80">开启后，只有管理员可访问前台。</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                                        className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>
                            </div>
                         </>
                     )}

                     {/* --- Tab: Security --- */}
                     {activeTab === 'security' && (
                         <>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Session 超时时间 (分钟)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="5" max="120" step="5"
                                        value={settings.sessionTimeout}
                                        onChange={e => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="w-16 text-center py-1 bg-gray-100 rounded-lg text-sm font-mono font-bold">{settings.sessionTimeout} m</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">IP 白名单</label>
                                <p className="text-xs text-gray-400 mb-2">仅允许以下 IP 地址访问后台管理接口，用逗号分隔。</p>
                                <textarea 
                                    rows={4}
                                    value={settings.ipWhitelist}
                                    onChange={e => setSettings({...settings, ipWhitelist: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                />
                            </div>
                         </>
                     )}

                     {/* --- Tab: Notifications --- */}
                     {activeTab === 'notifications' && (
                         <div className="space-y-4">
                            {[
                                { key: 'signup', label: '新用户注册通知', desc: '当有新用户通过邮箱注册时发送通知。' },
                                { key: 'purchase', label: '课程购买/订阅通知', desc: '实时接收订单与支付成功状态。' },
                                { key: 'alert', label: '系统异常报警', desc: 'CPU > 80% 或服务宕机时触发。' }
                            ].map((item: any) => (
                                <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({
                                            ...settings, 
                                            notifications: { ...settings.notifications, [item.key]: !(settings.notifications as any)[item.key] }
                                        })}
                                        className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${
                                            (settings.notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                                            (settings.notifications as any)[item.key] ? 'translate-x-6' : ''
                                        }`}></div>
                                    </button>
                                </div>
                            ))}
                         </div>
                     )}

                     {/* Placeholder for other tabs */}
                     {(activeTab === 'backup' || activeTab === 'audit') && (
                         <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                             <Server size={32} className="mb-3 opacity-50"/>
                             <p className="text-sm font-medium">高级配置模块需连接生产数据库</p>
                         </div>
                     )}

                 </div>
             </div>
          </div>
      </main>
    </div>
  );
};

export default AdminSettings;