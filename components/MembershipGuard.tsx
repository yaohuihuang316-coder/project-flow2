
import React from 'react';
import { Lock, Award, BookOpen, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Page, UserProfile } from '../types';
import { checkAccess, MEMBERSHIP_REQUIREMENTS, getMembershipDisplay } from '../lib/membership';
import MembershipBadge from './MembershipBadge';

interface MembershipGuardProps {
  user: UserProfile | null;
  targetPage: Page;
  children: React.ReactNode;
  onNavigate: (page: Page) => void;
}

const MembershipGuard: React.FC<MembershipGuardProps> = ({ 
  user, targetPage, children, onNavigate 
}) => {
  const access = checkAccess(user, targetPage);
  
  if (access.allowed) return <>{children}</>;
  
  const req = MEMBERSHIP_REQUIREMENTS[targetPage];
  if (!req) return <>{children}</>; // 无限制页面
  
  const completed = user?.completedCoursesCount || 0;
  const required = req.requiredCourses;
  const progress = access.progress || 0;
  const remaining = access.remainingCourses || 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* 顶部锁定提示 */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-8 text-white text-center relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{req.title}</h2>
            <p className="text-white/80 text-lg">解锁后可使用全部功能</p>
          </div>
        </div>
        
        <div className="p-8">
          {/* 当前等级显示 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">当前等级</p>
              <MembershipBadge tier={user?.membershipTier || 'free'} size="md" />
            </div>
            <ArrowRight className="text-gray-300" size={24} />
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">目标等级</p>
              <MembershipBadge tier={req.minTier} size="md" />
            </div>
          </div>
          
          {/* 进度展示 */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">课程完成进度</span>
              <span className="text-lg font-bold text-purple-600">
                {completed} / {required} 门
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>已完成 {completed} 门</span>
              <span>还需 {remaining} 门</span>
            </div>
          </div>
          
          {/* 功能权益 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              解锁后你将获得
            </h3>
            <p className="text-gray-600 text-sm mb-4">{req.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {req.benefits.slice(0, 6).map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  <span className="truncate">{benefit}</span>
                </div>
              ))}
            </div>
            {req.benefits.length > 6 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                还有 {req.benefits.length - 6} 项权益...
              </p>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-3">
            <button 
              onClick={() => onNavigate(Page.LEARNING)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <BookOpen size={20} />
              {remaining > 0 ? `继续学习课程（还差${remaining}门）` : '前往学习中心'}
              <ArrowRight size={20} />
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate(Page.PROFILE)}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                查看会员中心
              </button>
              <button 
                onClick={() => onNavigate(Page.DASHBOARD)}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
          
          {/* 提示信息 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              💡 提示：完成课程后系统会自动升级你的会员等级
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipGuard;
