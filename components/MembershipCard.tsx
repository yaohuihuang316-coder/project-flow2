
import React from 'react';
import { Crown, ChevronRight, BookOpen, Sparkles, Target } from 'lucide-react';
import { UserProfile } from '../types';
import { getNextTierInfo, getMembershipDisplay, MEMBERSHIP_CONFIG } from '../lib/membership';
import MembershipBadge, { MembershipProgress } from './MembershipBadge';

interface MembershipCardProps {
  user: UserProfile | null;
  onNavigate: (page: any) => void;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ user, onNavigate }) => {
  if (!user) return null;
  
  const nextTier = getNextTierInfo(user);
  const display = getMembershipDisplay(user);
  const isMaxTier = user.membershipTier === 'pro_plus';
  
  // 最高等级显示
  if (isMaxTier) {
    return (
      <div 
        onClick={() => onNavigate('PROFILE')}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-orange-500/20 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Crown size={32} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MembershipBadge tier="pro_plus" size="md" />
                <span className="text-white/80 text-sm">最高等级</span>
              </div>
              <h3 className="text-xl font-bold">恭喜！你已解锁全部功能</h3>
              <p className="text-white/80 text-sm mt-1">
                已完成 {user.completedCoursesCount} 门课程
              </p>
            </div>
          </div>
          <ChevronRight size={24} className="text-white/60 group-hover:translate-x-1 transition-transform" />
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">10</p>
            <p className="text-xs text-white/70">工具可用</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">∞</p>
            <p className="text-xs text-white/70">实战模拟</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">AI</p>
            <p className="text-xs text-white/70">增强助手</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 有下一等级的显示
  if (nextTier) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MembershipBadge tier={user.membershipTier} size="lg" />
            <div>
              <h3 className="font-bold text-gray-900">{display.name}</h3>
              <p className="text-sm text-gray-500">
                再完成 <span className="text-purple-600 font-semibold">{nextTier.remainingCourses}</span> 门课程升级
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('LEARNING')}
            className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <BookOpen size={20} />
          </button>
        </div>
        
        <MembershipProgress 
          current={nextTier.completedCourses} 
          target={nextTier.requiredCourses}
          tier={user.membershipTier}
          size="md"
        />
        
        <div className="mt-4 flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${MEMBERSHIP_CONFIG[nextTier.tier].gradient} flex items-center justify-center`}>
            <Target size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{nextTier.name}</p>
            <p className="text-xs text-gray-500">
              解锁{nextTier.tier === 'pro' ? '工具实验室' : '实战模拟中心'}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    );
  }
  
  // 默认显示
  return (
    <div 
      onClick={() => onNavigate('MEMBERSHIP')}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MembershipBadge tier="free" size="lg" />
          <div>
            <h3 className="font-bold text-gray-900">免费会员</h3>
            <p className="text-sm text-gray-500">点击升级解锁更多功能</p>
          </div>
        </div>
        <Sparkles size={20} className="text-amber-400" />
      </div>
    </div>
  );
};

export default MembershipCard;
