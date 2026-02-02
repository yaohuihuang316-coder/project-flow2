
import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, Check, X, ChevronRight, 
  BookOpen, Zap, Target, Gift, Clock,
  Loader2, AlertCircle
} from 'lucide-react';
import { Page, UserProfile, MembershipTier } from '../types';
import { supabase } from '../lib/supabaseClient';
import { MEMBERSHIP_CONFIG, getNextTierInfo } from '../lib/membership';

interface MembershipProps {
  currentUser?: UserProfile | null;
  onNavigate: (page: Page, param?: string) => void;
}

interface MembershipCode {
  id: string;
  code: string;
  tier: MembershipTier;
  durationDays: number;
}

const Membership: React.FC<MembershipProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'codes'>('overview');
  const [codeInput, setCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [stats, setStats] = useState({
    completedCourses: 0,
    nextTierProgress: 0,
    nextTierRequired: 5
  });

  const currentTier = currentUser?.membershipTier || 'free';
  const nextTierInfo = getNextTierInfo(currentUser);

  // 获取用户课程完成统计
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      const { data } = await supabase
        .from('app_user_progress')
        .select('progress')
        .eq('user_id', currentUser.id);
      
      if (data) {
        const completed = data.filter(d => d.progress >= 100).length;
        const nextRequired = currentTier === 'free' ? 5 : currentTier === 'basic' ? 10 : 0;
        setStats({
          completedCourses: completed,
          nextTierProgress: Math.min(completed, nextRequired),
          nextTierRequired: nextRequired
        });
      }
    };
    
    fetchStats();
  }, [currentUser, currentTier]);

  // 兑换码
  const handleRedeemCode = async () => {
    if (!codeInput.trim() || !currentUser) return;
    
    setIsRedeeming(true);
    setRedeemMessage(null);
    
    try {
      // 调用兑换API
      const { data, error } = await supabase
        .rpc('redeem_membership_code', {
          p_code: codeInput.trim().toUpperCase(),
          p_user_id: currentUser.id
        });
      
      if (error) throw error;
      
      setRedeemMessage({
        type: 'success',
        text: `兑换成功！您已获得 ${data.tier} 会员资格`
      });
      setCodeInput('');
      
      // 刷新页面或更新用户信息
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setRedeemMessage({
        type: 'error',
        text: err.message || '兑换失败，请检查兑换码'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // 会员权益对比
  const benefits = [
    { name: '基础课程学习', free: true, basic: true, pro: true, pro_plus: true },
    { name: '社区互动', free: true, basic: true, pro: true, pro_plus: true },
    { name: '知识图谱浏览', free: true, basic: true, pro: true, pro_plus: true },
    { name: 'AI助手 (基础版)', free: false, basic: true, pro: true, pro_plus: true },
    { name: '工具实验室', free: false, basic: true, pro: true, pro_plus: true },
    { name: 'AI助手 (进阶版)', free: false, basic: false, pro: false, pro_plus: true },
    { name: '实战模拟中心', free: false, basic: false, pro: false, pro_plus: true },
    { name: '证书下载', free: false, basic: true, pro: true, pro_plus: true },
    { name: '专属客服', free: false, basic: false, pro: true, pro_plus: true },
  ];

  if (!currentUser) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <Crown size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看您的会员状态</p>
          <button 
            onClick={() => onNavigate(Page.LOGIN)}
            className="px-6 py-3 bg-black text-white rounded-full font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 max-w-5xl mx-auto min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">会员中心</h1>
        <p className="text-gray-500 mt-2">管理您的会员权益和升级选项</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'overview', label: '总览' },
          { id: 'upgrade', label: '升级' },
          { id: 'codes', label: '兑换码' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Status Card */}
          <div className={`rounded-3xl p-8 ${MEMBERSHIP_CONFIG[currentTier].gradient} text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={24} />
                  <span className="text-white/80 font-medium">
                    {MEMBERSHIP_CONFIG[currentTier].name}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  {currentTier === 'pro_plus' ? '尊享全部权益' : '升级解锁更多功能'}
                </h2>
                {currentUser.membershipExpiresAt && (
                  <p className="text-white/80 text-sm">
                    有效期至: {new Date(currentUser.membershipExpiresAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{stats.completedCourses}</div>
                <div className="text-white/80 text-sm">已完成课程</div>
              </div>
            </div>

            {nextTierInfo && (
              <div className="mt-6 bg-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">距离 {nextTierInfo.name} 还差</span>
                  <span className="text-sm font-bold">{nextTierInfo.remainingCourses} 门课程</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(stats.nextTierProgress / stats.nextTierRequired) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: '在学课程', value: '3门' },
              { icon: Zap, label: 'AI调用', value: `${currentUser.aiDailyUsed}/50` },
              { icon: Target, label: '掌握度', value: '68%' },
              { icon: Clock, label: '学习时长', value: '24h' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
                <stat.icon size={20} className="text-gray-400 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Benefits Table */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">权益对比</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-600">功能</th>
                    <th className="text-center p-4 font-medium text-gray-600">Free</th>
                    <th className="text-center p-4 font-medium text-blue-600">Basic</th>
                    <th className="text-center p-4 font-medium text-purple-600">Pro</th>
                    <th className="text-center p-4 font-medium text-amber-600">Pro+</th>
                  </tr>
                </thead>
                <tbody>
                  {benefits.map((benefit, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="p-4 text-gray-700">{benefit.name}</td>
                      <td className="text-center p-4">
                        {benefit.free ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />}
                      </td>
                      <td className="text-center p-4">
                        {benefit.basic ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />}
                      </td>
                      <td className="text-center p-4">
                        {benefit.pro ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />}
                      </td>
                      <td className="text-center p-4">
                        {benefit.pro_plus ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Tab */}
      {activeTab === 'upgrade' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <div className={`rounded-3xl p-6 border-2 ${currentTier === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Basic</h3>
                <p className="text-gray-500 text-sm mt-1">基础会员</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-gray-900">免费</span>
                <span className="text-gray-500"> / 完成5门课</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['AI助手基础版', '工具实验室', '证书下载'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              {currentTier === 'basic' ? (
                <button disabled className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium">
                  当前等级
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate(Page.LEARNING)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  去学习
                </button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`rounded-3xl p-6 border-2 ${currentTier === 'pro' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white'}`}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Crown size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                <p className="text-gray-500 text-sm mt-1">专业会员</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-gray-900">¥99</span>
                <span className="text-gray-500"> / 月</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['全部Basic权益', '专属客服', '优先支持', '更多AI调用'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              {currentTier === 'pro' ? (
                <button disabled className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium">
                  当前等级
                </button>
              ) : (
                <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
                  立即升级
                </button>
              )}
            </div>

            {/* Pro+ Plan */}
            <div className={`rounded-3xl p-6 border-2 ${currentTier === 'pro_plus' ? 'border-amber-500 bg-amber-50' : 'border-amber-200 bg-gradient-to-b from-amber-50/50'}`}>
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">推荐</span>
              </div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Gift size={24} className="text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Pro+</h3>
                <p className="text-gray-500 text-sm mt-1">高级会员</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-3xl font-bold text-gray-900">¥199</span>
                <span className="text-gray-500"> / 月</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['全部Pro权益', 'AI助手进阶版', '实战模拟中心', '无限AI调用'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              {currentTier === 'pro_plus' ? (
                <button disabled className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium">
                  当前等级
                </button>
              ) : (
                <button className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600">
                  立即升级
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
            <Gift size={48} className="mx-auto text-purple-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">兑换会员码</h3>
            <p className="text-gray-500 mb-6">输入您的兑换码，解锁会员权益</p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="输入兑换码"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              {redeemMessage && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  redeemMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {redeemMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  {redeemMessage.text}
                </div>
              )}
              
              <button
                onClick={handleRedeemCode}
                disabled={!codeInput.trim() || isRedeeming}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedeeming && <Loader2 size={18} className="animate-spin" />}
                {isRedeeming ? '兑换中...' : '立即兑换'}
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-4">
              兑换码区分大小写，每个兑换码只能使用一次
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membership;
