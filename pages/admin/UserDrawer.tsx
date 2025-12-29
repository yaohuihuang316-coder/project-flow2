import React, { useState, useEffect } from 'react';
import { X, User, Shield, Activity, Save, RefreshCw, Key, Lock, Mail, Building } from 'lucide-react';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null; // Null means creating a new user
  onSave: (userData: any) => void;
}

const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose, user, onSave }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'logs'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '', email: '', role: 'Student', status: 'Active', department: 'General', bio: ''
  });

  // Init Form Data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status === '正常' ? 'Active' : user.status === '已封禁' ? 'Banned' : 'Inactive',
        department: 'Product Team', // Mock data
        bio: 'Frontend developer passionate about UI/UX.' // Mock data
      });
    } else {
      setFormData({ name: '', email: '', role: 'Student', status: 'Active', department: '', bio: '' });
    }
  }, [user, isOpen]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      onSave({
        ...user,
        ...formData,
        status: formData.status === 'Active' ? '正常' : formData.status === 'Banned' ? '已封禁' : '未激活'
      });
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-[70] transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user ? '编辑用户详情' : '创建新用户'}</h2>
            <p className="text-xs text-gray-500">{user ? `ID: ${user.id} • Registered ${user.joined}` : '填写以下信息以添加用户'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex gap-6">
          {[
            { id: 'profile', label: '资料概览', icon: User },
            { id: 'security', label: '权限与安全', icon: Shield },
            { id: 'logs', label: '操作日志', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
          
          {/* --- Tab: Profile --- */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-blue-600">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : <User />}
                </div>
                <div>
                  <button className="text-xs font-bold bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                    <RefreshCw size={12} /> 随机生成头像
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2">支持 JPG, PNG. 最大 2MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">全名 (Full Name)</label>
                   <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: John Doe"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">电子邮箱 (Email)</label>
                   <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: john@company.com"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">部门 (Department)</label>
                   <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ex: Engineering"
                      />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* --- Tab: Security --- */}
          {activeTab === 'security' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-sm font-bold text-gray-900 mb-4">账号状态</h3>
                   <div className="grid grid-cols-3 gap-3">
                      {['Active', 'Inactive', 'Banned'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFormData({...formData, status})}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            formData.status === status
                            ? status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' : status === 'Banned' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <h3 className="text-sm font-bold text-gray-900 mb-4">角色分配</h3>
                   <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                   >
                      <option value="学生">学生 (Student)</option>
                      <option value="企业会员">企业会员 (Enterprise)</option>
                      <option value="经理">经理 (Manager)</option>
                      <option value="管理员">管理员 (Admin)</option>
                   </select>
                   <p className="text-[10px] text-gray-400 mt-2">
                      管理员拥有系统的完全访问权限，请谨慎分配。
                   </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <button className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                        <Key size={16} /> 发送重置密码邮件
                    </button>
                    <button className="w-full mt-3 py-2.5 border border-red-200 bg-red-50 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2">
                        <Lock size={16} /> 强制下线
                    </button>
                </div>
             </div>
          )}

          {/* --- Tab: Logs --- */}
          {activeTab === 'logs' && (
              <div className="space-y-4 animate-fade-in">
                  {[
                      { action: 'Login Success', ip: '192.168.1.45', time: '2 mins ago', device: 'Chrome / Mac OS' },
                      { action: 'Updated Profile', ip: '192.168.1.45', time: '2 hours ago', device: 'Chrome / Mac OS' },
                      { action: 'Completed Course: PMP', ip: '192.168.1.45', time: '1 day ago', device: 'Mobile App' },
                  ].map((log, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-2 h-2 mt-2 rounded-full bg-gray-300 shrink-0"></div>
                          <div>
                              <p className="text-sm font-bold text-gray-800">{log.action}</p>
                              <p className="text-xs text-gray-500 font-mono mt-1">{log.ip} • {log.device}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{log.time}</p>
                          </div>
                      </div>
                  ))}
              </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
          <button 
             onClick={onClose}
             className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
             取消
          </button>
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex-1 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
             {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
             {isSaving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDrawer;