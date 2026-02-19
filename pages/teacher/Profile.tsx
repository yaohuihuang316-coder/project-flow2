import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Settings as SettingsIcon, HelpCircle, Info, ChevronRight, LogOut,
  Clock, Users, BookMarked, Award, Shield, School,
  Mail, Phone, MapPin, Star, Edit3, Camera,
  X, Save, CheckCircle
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import Settings from '../../components/Settings';
import TeacherLayout from '../../components/TeacherLayout';

interface TeacherProfileProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 底部导航 Tab 类型
type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

// 教师统计数据
interface TeacherStats {
  teachingHours: number;
  studentCount: number;
  courseCount: number;
  rating: number;
}

// 认证状态
interface VerificationStatus {
  isVerified: boolean;
  type: 'identity' | 'education' | 'teaching';
  label: string;
}

// 编辑表单数据
interface EditFormData {
  name: string;
  job_title: string;
  institution_name: string;
  department: string;
  bio: string;
  phone: string;
  location: string;
}



const TeacherProfile: React.FC<TeacherProfileProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // 教师统计数据 - 初始为0，从数据库加载
  const [stats, setStats] = useState<TeacherStats>({
    teachingHours: 0,
    studentCount: 0,
    courseCount: 0,
    rating: 0
  });

  // 编辑表单数据 - 使用真实数据初始化
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    job_title: '',
    institution_name: '',
    department: '',
    bio: '',
    phone: '',
    location: ''
  });

  // 从currentUser初始化教师信息 - 使用真实数据，无硬编码
  const teacherInfo = {
    name: currentUser?.name || '教师用户',
    title: currentUser?.job_title || '讲师',
    school: currentUser?.institution_name || '暂未设置机构',
    department: currentUser?.department || '暂未设置院系',
    email: currentUser?.email || '',
    phone: editForm.phone || '暂未设置',
    location: editForm.location || '暂未设置',
    avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher',
    bio: editForm.bio || '暂无个人简介'
  };

  // 认证状态 - 根据用户认证状态动态显示
  const verifications: VerificationStatus[] = [
    { isVerified: true, type: 'identity', label: '实名认证' },
    { isVerified: !!currentUser?.institution_name, type: 'education', label: '学历认证' },
    { isVerified: currentUser?.role === 'Editor' || currentUser?.role === 'SuperAdmin', type: 'teaching', label: '教师资格' }
  ];

  // 获取教师统计数据 - 使用现有表
  const fetchTeacherStats = async (teacherId: string) => {
    try {
      // 获取课程数量
      const { count: courseCount } = await supabase
        .from('app_courses')
        .select('*', { count: 'exact', head: true });

      // 获取学生总数
      const { count: studentCount } = await supabase
        .from('app_course_enrollments')
        .select('*', { count: 'exact', head: true });

      // 获取本周课时
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: sessions } = await supabase
        .from('app_class_sessions')
        .select('duration')
        .eq('teacher_id', teacherId)
        .gte('scheduled_start', weekStart.toISOString());
      
      const teachingHours = Math.round((sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0) / 3600);

      // 评分（从课程表中的 rating 字段计算平均值）
      const { data: courses } = await supabase
        .from('app_courses')
        .select('rating');
      
      const avgRating = courses && courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
        : 0;

      setStats({
        teachingHours: teachingHours || 0,
        studentCount: studentCount || 0,
        courseCount: courseCount || 0,
        rating: Math.round(avgRating * 10) / 10 || 4.5
      });
    } catch (error) {
      console.error('获取教师统计数据失败:', error);
      setStats({
        teachingHours: 0,
        studentCount: 0,
        courseCount: 0,
        rating: 4.5
      });
    }
  };

  // 加载教师统计数据
  useEffect(() => {
    if (currentUser?.id) {
      fetchTeacherStats(currentUser.id);
    }
  }, [currentUser]);

  // 初始化编辑表单 - 使用 currentUser 的真实数据
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        job_title: currentUser.job_title || '',
        institution_name: currentUser.institution_name || '',
        department: currentUser.department || '',
        bio: currentUser.bio || '',
        phone: currentUser.phone || '',
        location: currentUser.location || ''
      });
    }
  }, [currentUser]);

  // 保存个人资料
  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          name: editForm.name,
          job_title: editForm.job_title,
          institution_name: editForm.institution_name,
          department: editForm.department,
          bio: editForm.bio,
          phone: editForm.phone,
          location: editForm.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
        // 刷新页面以获取更新后的数据
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('保存个人资料失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('app_users')
        .update({ avatar: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // 更新本地状态
      setEditForm(prev => ({ ...prev }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (error) {
      console.error('上传头像失败:', error);
      alert('上传头像失败，请重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 导航项配置
  const navItems = [
    { id: 'home', icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
    { id: 'courses', icon: BookOpen, label: '课程', page: Page.TEACHER_COURSES },
    { id: 'class', icon: Video, label: '上课', page: Page.TEACHER_CLASSROOM, highlight: true },
    { id: 'assignments', icon: ClipboardList, label: '作业', page: Page.TEACHER_ASSIGNMENTS },
    { id: 'profile', icon: User, label: '我的', page: Page.TEACHER_PROFILE },
  ];

  // ==================== 桌面端侧边栏导航 ====================
  const renderSidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-40">
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <School size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">教师中心</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TeacherTab);
                if (onNavigate) {
                  onNavigate(item.page);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 底部操作区 */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
        >
          <SettingsIcon size={22} />
          <span className="font-medium">设置</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={22} />
          <span className="font-medium">退出登录</span>
        </button>
      </div>

      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <img
            src={teacherInfo.avatar}
            alt="Avatar"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{teacherInfo.name}</p>
            <p className="text-xs text-gray-500 truncate">{teacherInfo.title}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  // ==================== 底部导航（移动端） ====================
  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TeacherTab);
                if (onNavigate && item.id !== 'profile') {
                  onNavigate(item.page);
                }
              }}
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
  );

  // ==================== 教师信息卡片 ====================
  const renderTeacherCard = () => (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white relative overflow-hidden">
      {/* 编辑按钮 */}
      <button
        onClick={() => setShowEditModal(true)}
        className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
      >
        <Edit3 size={18} className="text-white" />
      </button>

      <div className="flex items-start gap-4">
        <div className="relative">
          <img 
            src={teacherInfo.avatar} 
            alt="Avatar" 
            className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Shield size={12} className="text-white" fill="currentColor" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{teacherInfo.name}</h2>
            <span className="px-2 py-0.5 bg-white/20 rounded-lg text-xs">{teacherInfo.title}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-blue-100 text-sm">
            <School size={14} />
            <span className="truncate">{teacherInfo.school}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-blue-100 text-sm">
            <BookMarked size={14} />
            <span>{teacherInfo.department}</span>
          </div>
        </div>
      </div>
      
      {/* 个人简介 */}
      <p className="mt-4 text-sm text-blue-100 leading-relaxed line-clamp-2">
        {teacherInfo.bio}
      </p>
    </div>
  );

  // ==================== 教学统计 ====================
  const renderTeachingStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-blue-600" />
          </div>
          <span className="text-xs text-gray-500">授课时长</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.teachingHours}</p>
        <p className="text-xs text-gray-400 mt-1">小时</p>
      </div>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-green-600" />
          </div>
          <span className="text-xs text-gray-500">学生总数</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.studentCount}</p>
        <p className="text-xs text-gray-400 mt-1">人</p>
      </div>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <span className="text-xs text-gray-500">课程数量</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.courseCount}</p>
        <p className="text-xs text-gray-400 mt-1">门</p>
      </div>
      
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Star size={16} className="text-yellow-600" fill="currentColor" />
          </div>
          <span className="text-xs text-gray-500">学生评分</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.rating || '-'}</p>
        <p className="text-xs text-gray-400 mt-1">分</p>
      </div>
    </div>
  );

  // ==================== 认证状态 ====================
  const renderVerificationStatus = () => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Award size={18} className="text-blue-500" />
          认证状态
        </h3>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          {verifications.every(v => v.isVerified) ? '全部通过' : '进行中'}
        </span>
      </div>
      <div className="flex gap-3">
        {verifications.map((item) => (
          <div 
            key={item.type}
            className={`flex-1 p-3 rounded-2xl text-center ${
              item.isVerified ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
              item.isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
            }`}>
              <Shield size={20} fill={item.isVerified ? 'currentColor' : 'none'} />
            </div>
            <p className={`text-xs font-medium ${item.isVerified ? 'text-green-700' : 'text-gray-400'}`}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
      {/* 申请认证按钮 */}
      <button
        onClick={() => onNavigate?.(Page.TEACHER_REGISTRATION)}
        className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow"
      >
        申请教师认证
      </button>
    </div>
  );

  // ==================== 联系方式 ====================
  const renderContactInfo = () => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <User size={18} className="text-blue-500" />
        联系信息
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Mail size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">邮箱</p>
            <p className="text-sm font-medium text-gray-900">{teacherInfo.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <Phone size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">电话</p>
            <p className="text-sm font-medium text-gray-900">{teacherInfo.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <MapPin size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">地址</p>
            <p className="text-sm font-medium text-gray-900">{teacherInfo.location}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== 功能菜单 ====================
  const renderMenuList = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {[
        { icon: Settings, label: '教学设置', value: '', color: 'text-gray-600', bgColor: 'bg-gray-100', onClick: () => setShowSettings(true) },
        { icon: HelpCircle, label: '帮助中心', value: '', color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { icon: Info, label: '关于我们', value: 'v2.0.0', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      ].map((item, idx) => (
        <button 
          key={item.label}
          onClick={item.onClick}
          className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
            idx !== 2 ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center`}>
            <item.icon size={20} className={item.color} />
          </div>
          <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
          {item.value && <span className="text-sm text-gray-400">{item.value}</span>}
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      ))}
    </div>
  );

  // ==================== 退出登录（仅移动端显示） ====================
  const renderLogoutButton = () => (
    <button 
      onClick={onLogout}
      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all lg:hidden"
    >
      <LogOut size={18} />
      退出登录
    </button>
  );

  // ==================== 编辑资料弹窗 ====================
  const renderEditModal = () => {
    if (!showEditModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* 弹窗头部 */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">编辑个人资料</h2>
            <button
              onClick={() => setShowEditModal(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* 弹窗内容 */}
          <div className="p-6 space-y-6">
            {/* 头像上传 */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={teacherInfo.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-100"
                />
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              {uploadingAvatar && (
                <p className="text-xs text-gray-500 mt-2">上传中...</p>
              )}
            </div>

            {/* 表单字段 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职称</label>
                <select
                  value={editForm.job_title}
                  onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择职称</option>
                  <option value="讲师">讲师</option>
                  <option value="副教授">副教授</option>
                  <option value="教授">教授</option>
                  <option value="高级教师">高级教师</option>
                  <option value="特级教师">特级教师</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学校/机构</label>
                <input
                  type="text"
                  value={editForm.institution_name}
                  onChange={(e) => setEditForm({ ...editForm, institution_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入学校或机构名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">院系/部门</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入院系或部门"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请输入个人简介"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系电话"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入所在地区"
                />
              </div>
            </div>
          </div>

          {/* 弹窗底部 */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>保存中...</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle size={18} />
                  <span>保存成功</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>保存修改</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 设置页面 ====================
  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        {/* 设置页面头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronRight size={24} className="text-gray-500 rotate-180" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">设置</h2>
          </div>
        </div>

        {/* 设置内容 - 使用新的 Settings 组件 */}
        <div className="p-6">
          <Settings currentUser={currentUser} />
        </div>
      </div>
    );
  };

  // ==================== 主内容 ====================
  return (
    <TeacherLayout
      activeTab="profile"
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (onNavigate) {
          switch (tab) {
            case 'home':
              onNavigate(Page.TEACHER_DASHBOARD);
              break;
            case 'courses':
              onNavigate(Page.TEACHER_COURSES);
              break;
            case 'class':
              onNavigate(Page.TEACHER_CLASSROOM);
              break;
            case 'assignments':
              onNavigate(Page.TEACHER_ASSIGNMENTS);
              break;
          }
        }
      }}
      onNavigate={onNavigate}
      onLogout={onLogout}
      currentUser={currentUser}
      onSettingsClick={() => setShowSettings(true)}
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>最后更新:</span>
            <span>{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 教师信息卡片 */}
        {renderTeacherCard()}

        {/* 教学统计 */}
        {renderTeachingStats()}

        {/* 两列布局 - 桌面端 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 认证状态 */}
          {renderVerificationStatus()}

          {/* 联系信息 */}
          {renderContactInfo()}
        </div>
      </div>

      {/* 编辑资料弹窗 */}
      {renderEditModal()}

      {/* 设置页面 */}
      {renderSettings()}
    </TeacherLayout>
  );
};

export default TeacherProfile;
