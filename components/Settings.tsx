import React, { useState, useEffect } from 'react';
import {
  User, Mail, Lock, Bell, Shield, Camera,
  Eye, EyeOff, Save, Loader2, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface SettingsProps {
  currentUser?: UserProfile | null;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 密码修改状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 邮箱修改状态
  const [emailForm, setEmailForm] = useState({
    newEmail: currentUser?.email || '',
    password: ''
  });

  // 个人资料状态
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    avatar: currentUser?.avatar || '',
    bio: currentUser?.bio || ''
  });

  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    classReminders: true,
    announcementNotifications: true,
    marketingEmails: false
  });

  // 同步用户数据到表单
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        avatar: currentUser.avatar || '',
        bio: currentUser.bio || ''
      });
      setEmailForm(prev => ({
        ...prev,
        newEmail: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  // 修改密码
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 验证
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少需要6个字符' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '密码修改成功！' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '密码修改失败' });
    } finally {
      setIsLoading(false);
    }
  };

  // 修改邮箱
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      setMessage({ type: 'error', text: '请输入有效的邮箱地址' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: '邮箱修改请求已发送，请查收新邮箱的验证邮件' 
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '邮箱修改失败' });
    } finally {
      setIsLoading(false);
    }
  };

  // 修改个人资料
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentUser?.id) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          name: profileForm.name,
          bio: profileForm.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '个人资料更新成功！' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '更新失败' });
    } finally {
      setIsLoading(false);
    }
  };

  // 切换通知设置
  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // 这里可以添加保存到数据库的逻辑
    setMessage({ type: 'success', text: '设置已更新' });
    setTimeout(() => setMessage(null), 2000);
  };

  const menuItems = [
    { id: 'profile', icon: User, label: '个人资料' },
    { id: 'password', icon: Lock, label: '修改密码' },
    { id: 'email', icon: Mail, label: '修改邮箱' },
    { id: 'notifications', icon: Bell, label: '通知设置' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <Shield size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧菜单 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMessage(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* 修改密码 */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">修改密码</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入当前密码"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({ ...showPassword, current: !showPassword.current })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入新密码（至少6位）"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请再次输入新密码"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        保存修改
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 修改邮箱 */}
            {activeTab === 'email' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">修改邮箱</h2>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600">
                      当前邮箱：<span className="font-medium text-gray-900">{currentUser?.email}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新邮箱地址
                    </label>
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入新邮箱地址"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码（验证身份）
                    </label>
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入当前密码"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">
                      修改邮箱后，您需要在新邮箱中点击验证链接完成确认。
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        发送验证邮件...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        发送验证邮件
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 个人资料 */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">个人资料</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* 头像 */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={profileForm.avatar || 'https://i.pravatar.cc/150?u=default'}
                        alt="头像"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100"
                      />
                      <button
                        type="button"
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                        title="更换头像"
                      >
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">头像</p>
                      <p className="text-sm text-gray-500">支持 JPG、PNG 格式，最大 2MB</p>
                    </div>
                  </div>

                  {/* 昵称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入昵称"
                    />
                  </div>

                  {/* 个人简介 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      个人简介
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="介绍一下自己..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{profileForm.bio.length}/200 字符</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        保存修改
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 通知设置 */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">通知设置</h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: '邮件通知', desc: '接收重要的系统邮件通知' },
                    { key: 'assignmentReminders', label: '作业提醒', desc: '作业截止前接收提醒' },
                    { key: 'classReminders', label: '上课提醒', desc: '课程开始前接收提醒' },
                    { key: 'announcementNotifications', label: '公告通知', desc: '接收平台公告和更新' },
                    { key: 'marketingEmails', label: '营销邮件', desc: '接收课程推荐和优惠信息' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.key as keyof typeof notificationSettings)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          notificationSettings[item.key as keyof typeof notificationSettings]
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notificationSettings[item.key as keyof typeof notificationSettings]
                              ? 'translate-x-7'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
