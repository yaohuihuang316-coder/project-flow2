
import React, { useState } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Settings, HelpCircle, Info, ChevronRight, LogOut,
  Clock, Users, BookMarked, Award, Shield, School,
  Mail, Phone, MapPin, Star
} from 'lucide-react';
import { Page, UserProfile } from '../../types';

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

const TeacherProfile: React.FC<TeacherProfileProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('profile');

  // 教师统计数据
  const [stats] = useState<TeacherStats>({
    teachingHours: 1280,
    studentCount: 856,
    courseCount: 12,
    rating: 4.9
  });

  // 认证状态 - 根据用户认证状态动态显示
  const verifications: VerificationStatus[] = [
    { isVerified: true, type: 'identity', label: '实名认证' },
    { isVerified: !!currentUser?.institution_name, type: 'education', label: '学历认证' },
    { isVerified: currentUser?.role === 'Editor' || currentUser?.role === 'SuperAdmin', type: 'teaching', label: '教师资格' }
  ];

  // 教师信息 - 使用 currentUser 数据
  const teacherInfo = {
    name: currentUser?.name || '教师用户',
    title: currentUser?.job_title || '讲师',
    school: currentUser?.institution_name || '暂未设置机构',
    department: currentUser?.department || '项目管理学院',
    email: currentUser?.email || '',
    phone: '138****8888',
    location: '北京市',
    avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher',
    bio: '专注项目管理教育，PMP认证讲师。'
  };

  // ==================== 底部导航 ====================
  const renderBottomNav = () => {
    const navItems = [
      { id: 'home', icon: Home, label: '首页' },
      { id: 'courses', icon: BookOpen, label: '课程' },
      { id: 'class', icon: Video, label: '上课', highlight: true },
      { id: 'assignments', icon: ClipboardList, label: '作业' },
      { id: 'profile', icon: User, label: '我的' },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
                    const pageMap: Record<string, Page> = {
                      'home': Page.TEACHER_DASHBOARD,
                      'courses': Page.TEACHER_COURSES,
                      'class': Page.TEACHER_CLASSROOM,
                      'assignments': Page.TEACHER_ASSIGNMENTS,
                      'profile': Page.TEACHER_PROFILE
                    };
                    onNavigate(pageMap[item.id]);
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
  };

  // ==================== 教师信息卡片 ====================
  const renderTeacherCard = () => (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
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
    <div className="grid grid-cols-2 gap-3">
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
        <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
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
          全部通过
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
        { icon: Settings, label: '教学设置', value: '', color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { icon: HelpCircle, label: '帮助中心', value: '', color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { icon: Info, label: '关于我们', value: 'v2.0.0', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      ].map((item, idx) => (
        <button 
          key={item.label}
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

  // ==================== 退出登录 ====================
  const renderLogoutButton = () => (
    <button 
      onClick={onLogout}
      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all"
    >
      <LogOut size={18} />
      退出登录
    </button>
  );

  // ==================== 主内容 ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
        <div className="p-6 space-y-6 pb-28">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
            <button 
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
              onClick={() => {}}
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>

          {/* 教师信息卡片 */}
          {renderTeacherCard()}

          {/* 教学统计 */}
          {renderTeachingStats()}

          {/* 认证状态 */}
          {renderVerificationStatus()}

          {/* 联系信息 */}
          {renderContactInfo()}

          {/* 功能菜单 */}
          {renderMenuList()}

          {/* 退出登录 */}
          {renderLogoutButton()}
        </div>
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default TeacherProfile;
