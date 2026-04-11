
import React, { useState, useEffect } from 'react';
import { 
  Crown, Check, X, Sparkles, Gift, Zap, BookOpen, 
  Target, MessageSquare, FileText, Bot, Calculator,
  TrendingUp, Shield, Users, Loader2, AlertCircle,
  Ticket, Star, Loader
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
  MembershipPlanConfig, 
  getMembershipConfig, 
  getNextTierInfoAsync,
  clearMembershipConfigCache
} from '../lib/membership';
import { MembershipTier } from '../types';

// 图标映射
const iconMap: Record<string, React.ElementType> = {
  Star,
  Crown,
  Sparkles,
  Gift,
  Zap,
  BookOpen,
  Target,
  MessageSquare,
  FileText,
  Bot,
  Calculator,
  TrendingUp,
  Shield,
  Users,
  Check,
  X
};

// 获取图标组件
const getIconComponent = (iconName: string): React.ElementType => {
  return iconMap[iconName] || Star;
};

interface MembershipProps {
  currentUser?: UserProfile | null;
  onNavigate: (page: Page, param?: string) => void;
}

const Membership: React.FC<MembershipProps> = ({ currentUser, onNavigate }) => {
  const [codeInput, setCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [stats, setStats] = useState({
    completedCourses: 0,
    nextTierProgress: 0,
    nextTierRequired: 5
  });
  
  // 动态会员配置
  const [membershipConfig, setMembershipConfig] = useState<Record<MembershipTier, MembershipPlanConfig> | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [nextTierInfo, setNextTierInfo] = useState<{
    tier: MembershipTier;
    name: string;
    badge: string;
    requiredCourses: number;
    completedCourses: number;
    remainingCourses: number;
    progress: number;
  } | null>(null);

  const currentTier = currentUser?.membershipTier || 'free';

  // 加载会员配置
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const config = await getMembershipConfig();
        setMembershipConfig(config);
      } catch (error) {
        console.error('Failed to load membership config:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    
    loadConfig();
  }, []);

  // 获取用户课程完成统计和下一等级信息
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      // 获取课程完成统计
      const { data } = await supabase
        .from('app_user_progress')
        .select('progress')
        .eq('user_id', currentUser.id);
      
      if (data) {
        const completed = data.filter(d => d.progress >= 100).length;
        
        // 获取下一等级信息（使用动态配置）
        const nextTier = await getNextTierInfoAsync(currentUser);
        setNextTierInfo(nextTier);
        
        if (nextTier) {
          setStats({
            completedCourses: completed,
            nextTierProgress: Math.min(completed, nextTier.requiredCourses),
            nextTierRequired: nextTier.requiredCourses
          });
        } else {
          setStats({
            completedCourses: completed,
            nextTierProgress: completed,
            nextTierRequired: completed
          });
        }
      }
    };
    
    fetchStats();
  }, [currentUser]);

  // 兑换码
  const handleRedeemCode = async () => {
    if (!codeInput.trim() || !currentUser) return;
    
    setIsRedeeming(true);
    setRedeemMessage(null);
    
    try {
      // 查询兑换码
      const { data: codeData, error: codeError } = await supabase
        .from('membership_codes')
        .select('*')
        .eq('code', codeInput.trim().toUpperCase())
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        throw new Error('兑换码无效或已被使用');
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        throw new Error('兑换码已过期');
      }

      // 更新用户会员等级
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          subscription_tier: codeData.tier,
          membership_expires_at: codeData.duration_days === 36500 
            ? null // 永久
            : new Date(Date.now() + codeData.duration_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // 标记兑换码为已使用
      const { error: codeUpdateError } = await supabase
        .from('membership_codes')
        .update({
          is_used: true,
          used_by: currentUser.id,
          used_at: new Date().toISOString()
        })
        .eq('id', codeData.id);

      if (codeUpdateError) throw codeUpdateError;

      // 插入订阅记录
      await supabase.from('membership_subscriptions').insert({
        user_id: currentUser.id,
        tier: codeData.tier,
        payment_method: 'code',
        started_at: new Date().toISOString(),
        expires_at: codeData.duration_days === 36500 
          ? null 
          : new Date(Date.now() + codeData.duration_days * 24 * 60 * 60 * 1000).toISOString()
      });
      
      // 清除配置缓存
      clearMembershipConfigCache();
      
      setRedeemMessage({
        type: 'success',
        text: `🎉 兑换成功！您已获得 ${codeData.tier === 'pro' ? 'Pro' : 'Pro+'} 会员${codeData.duration_days === 36500 ? '（永久）' : `（${codeData.duration_days}天）`}`
      });
      setCodeInput('');
      
      // 刷新页面
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setRedeemMessage({
        type: 'error',
        text: err.message || '兑换失败，请检查兑换码'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <Crown size={64} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">请先登录</h2>
          <p className="text-gray-500 mb-8 text-lg">登录后查看您的会员状态和权益</p>
          <button 
            onClick={() => onNavigate(Page.LOGIN)}
            className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (isLoadingConfig || !membershipConfig) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm">
          <Loader size={48} className="mx-auto text-purple-600 mb-4 animate-spin" />
          <p className="text-gray-500">加载会员配置中...</p>
        </div>
      </div>
    );
  }

  const freeConfig = membershipConfig.free;
  const proConfig = membershipConfig.pro;
  const proPlusConfig = membershipConfig.pro_plus;

  // 会员权益详细对比数据
  const comparisonData = [
    { category: '课程学习', items: [
      { name: 'Foundation 基础课程', free: true, pro: true, pro_plus: true, desc: '6门基础课程完整学习' },
      { name: 'Advanced 进阶课程', free: true, pro: true, pro_plus: true, desc: '6门进阶课程完整学习' },
      { name: 'Implementation 实战课程', free: 'limited', pro: true, pro_plus: true, desc: 'Free限前3章，Pro/Pro+完整' },
    ]},
    { category: '工具实验室', items: [
      { name: '基础工具（12个）', free: '3个', pro: '全部', pro_plus: '全部', desc: 'CPM、EVM、PERT、WBS等' },
      { name: '高级工具（5个）', free: false, pro: true, pro_plus: true, desc: '蒙特卡洛、估算扑克、Kanban流等' },
      { name: '专家工具（5个）', free: false, pro: false, pro_plus: true, desc: 'FMEA、CCPM、鱼骨图、质量成本等' },
    ]},
    { category: 'AI 助手', items: [
      { name: 'AI 日调用次数', free: '5次', pro: '20次', pro_plus: '50次', desc: '每日AI助手使用次数' },
      { name: 'AI 模型', free: 'DeepSeek Chat', pro: 'DeepSeek Chat', pro_plus: 'DeepSeek Chat', desc: '可用AI模型' },
      { name: '高级分析', free: false, pro: false, pro_plus: true, desc: '深度项目分析报告' },
    ]},
    { category: '实战模拟', items: [
      { name: '案例学习', free: '阅读', pro: '互动', pro_plus: '互动', desc: '经典项目案例' },
      { name: '分支剧情模拟', free: false, pro: false, pro_plus: true, desc: '沉浸式决策模拟体验' },
      { name: '评分报告 + PDF导出', free: false, pro: false, pro_plus: true, desc: '详细分析报告可导出' },
    ]},
    { category: '社区特权', items: [
      { name: '发帖权限', free: true, pro: true, pro_plus: true, desc: '在社区发布内容' },
      { name: '精华帖标识', free: false, pro: true, pro_plus: true, desc: '优质内容标识' },
      { name: '专家认证', free: false, pro: false, pro_plus: true, desc: 'Pro+专属认证标识' },
    ]},
    { category: '其他权益', items: [
      { name: '证书下载', free: '基础版', pro: '完整版', pro_plus: '完整版', desc: '课程完成证书' },
      { name: '客服支持', free: '社区', pro: '邮件支持', pro_plus: '1对1专属客服', desc: '技术支持渠道' },
      { name: '知识图谱', free: true, pro: true, pro_plus: true, desc: '可视化知识节点' },
    ]},
  ];

  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check size={20} className="text-green-500 mx-auto" />;
    if (value === false) return <X size={20} className="text-gray-300 mx-auto" />;
    return <span className="text-sm text-gray-600">{value}</span>;
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">选择您的会员计划</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          解锁更多高级功能和工具，加速您的项目管理成长之路
        </p>
      </header>

      {/* Current Status Banner */}
      {currentTier !== 'free' && (
        <div className={`mb-10 rounded-3xl p-6 bg-gradient-to-r ${membershipConfig[currentTier].gradient} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Crown size={32} />
              </div>
              <div>
                <p className="text-white/80 text-sm">当前会员</p>
                <h2 className="text-2xl font-bold">{membershipConfig[currentTier].name}</h2>
                {currentUser.membershipExpiresAt && (
                  <p className="text-white/80 text-sm">
                    有效期至: {new Date(currentUser.membershipExpiresAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.completedCourses}</div>
              <div className="text-white/80 text-sm">已完成课程</div>
            </div>
          </div>
          
          {nextTierInfo && (
            <div className="mt-4 bg-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">距离 {nextTierInfo.name} 还差 {nextTierInfo.remainingCourses} 门课程</span>
                <span className="text-sm font-bold">{stats.nextTierProgress}/{stats.nextTierRequired}</span>
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
      )}

      {/* Three Column Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Free Plan */}
        <div className={`rounded-3xl p-8 border-2 relative ${currentTier === 'free' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
          {currentTier === 'free' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">当前计划</span>
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {React.createElement(getIconComponent(freeConfig.icon), { size: 32, className: 'text-gray-600' })}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{freeConfig.badge}</h3>
            <p className="text-gray-500 text-sm mb-4">{freeConfig.name}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">
                {freeConfig.priceMonthly === 0 ? '免费' : `¥${freeConfig.priceMonthly}`}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2">注册即可获得</p>
          </div>

          <ul className="space-y-4 mb-8">
            {freeConfig.features.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-600">
                <Check size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={() => onNavigate(Page.LEARNING)}
            className={`w-full py-4 rounded-2xl font-bold transition-all ${
              currentTier === 'free'
                ? 'bg-gray-200 text-gray-700 cursor-default'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={currentTier === 'free'}
          >
            {currentTier === 'free' ? '当前计划' : '开始学习'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`rounded-3xl p-8 border-2 relative ${currentTier === 'pro' ? 'border-blue-500 bg-blue-50/50' : 'border-blue-200 bg-gradient-to-b from-blue-50/30 to-white'}`}>
          {currentTier === 'pro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">当前计划</span>
            </div>
          )}
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {React.createElement(getIconComponent(proConfig.icon), { size: 32, className: 'text-blue-600' })}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{proConfig.badge}</h3>
            <p className="text-blue-600 text-sm font-medium mb-4">{proConfig.name}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">¥{proConfig.priceMonthly}</span>
              <span className="text-gray-500">/月</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">或完成 {proConfig.requiredCourses} 门课程解锁</p>
          </div>

          <ul className="space-y-4 mb-8">
            {proConfig.features.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-600">
                <Check size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          <button 
            className={`w-full py-4 rounded-2xl font-bold transition-all ${
              currentTier === 'pro'
                ? 'bg-blue-100 text-blue-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
            disabled={currentTier === 'pro'}
            onClick={() => currentTier !== 'pro' && onNavigate(Page.PAYMENT, 'pro')}
          >
            {currentTier === 'pro' ? '当前计划' : currentTier === 'pro_plus' ? '已拥有' : '立即升级'}
          </button>
        </div>

        {/* Pro+ Plan */}
        <div className={`rounded-3xl p-8 border-2 relative ${currentTier === 'pro_plus' ? 'border-amber-500 bg-amber-50/50' : 'border-amber-200 bg-gradient-to-b from-amber-50/30 to-white'}`}>
          {/* 推荐标签 */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className={`px-4 py-1 text-white text-sm font-bold rounded-full ${
              currentTier === 'pro_plus' ? 'bg-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}>
              {currentTier === 'pro_plus' ? '当前计划' : '强烈推荐'}
            </span>
          </div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{proPlusConfig.badge}</h3>
            <p className="text-amber-600 text-sm font-medium mb-4">{proPlusConfig.name}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">¥{proPlusConfig.priceMonthly}</span>
              <span className="text-gray-500">/月</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">或完成 {proPlusConfig.requiredCourses} 门课程解锁</p>
          </div>

          <ul className="space-y-4 mb-8">
            {proPlusConfig.features.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-600">
                <Check size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          <button 
            className={`w-full py-4 rounded-2xl font-bold transition-all ${
              currentTier === 'pro_plus'
                ? 'bg-amber-100 text-amber-700 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl hover:shadow-amber-200'
            }`}
            disabled={currentTier === 'pro_plus'}
            onClick={() => currentTier !== 'pro_plus' && onNavigate(Page.PAYMENT, 'pro_plus')}
          >
            {currentTier === 'pro_plus' ? '当前计划' : '立即升级'}
          </button>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-12">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">详细权益对比</h3>
          <div className="flex gap-2 text-sm">
            <span className="flex items-center gap-1"><Check size={14} className="text-green-500"/> 支持</span>
            <span className="flex items-center gap-1"><X size={14} className="text-gray-300"/> 不支持</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left p-4 font-bold text-gray-700 w-1/3">功能</th>
                <th className="text-center p-4 font-bold text-gray-600 w-48">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">🆓</span>
                    <span>{freeConfig.badge}</span>
                  </div>
                </th>
                <th className="text-center p-4 font-bold text-blue-600 w-48 bg-blue-50/50">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">💎</span>
                    <span>{proConfig.badge}</span>
                  </div>
                </th>
                <th className="text-center p-4 font-bold text-amber-600 w-48 bg-amber-50/50">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">👑</span>
                    <span>{proPlusConfig.badge}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category, catIdx) => (
                <React.Fragment key={catIdx}>
                  <tr className="bg-gray-50/50">
                    <td colSpan={4} className="p-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIdx) => (
                    <tr key={itemIdx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                      </td>
                      <td className="text-center p-4 border-l border-gray-100">
                        {renderValue(item.free)}
                      </td>
                      <td className="text-center p-4 border-l border-gray-100 bg-blue-50/30">
                        {renderValue(item.pro)}
                      </td>
                      <td className="text-center p-4 border-l border-gray-100 bg-amber-50/30">
                        {renderValue(item.pro_plus)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Code Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Ticket size={32} className="text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">有兑换码？</h3>
            <p className="text-gray-500">输入兑换码立即激活会员权益</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex gap-3">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="输入兑换码，如 PF-PRO-XXXXXX"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl uppercase tracking-wider font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleRedeemCode}
                disabled={!codeInput.trim() || isRedeeming}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isRedeeming && <Loader2 size={18} className="animate-spin" />}
                {isRedeeming ? '兑换中' : '激活'}
              </button>
            </div>
            
            {redeemMessage && (
              <div className={`mt-4 p-4 rounded-xl text-sm flex items-center gap-2 ${
                redeemMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {redeemMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {redeemMessage.text}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              兑换码区分大小写，可通过企业培训、活动或合作伙伴获取
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-gray-900 text-center mb-8">常见问题</h3>
        <div className="space-y-4">
          {[
            { q: '如何免费升级会员？', a: `完成课程学习即可自动升级。完成${proConfig.requiredCourses}门课程升级为Pro会员，完成${proPlusConfig.requiredCourses}门课程升级为Pro+会员。` },
            { q: '会员到期后会怎样？', a: '会员到期后，您将回到Free等级，但已完成的课程进度和成就不会丢失。' },
            { q: '可以退款吗？', a: '购买后7天内，如果使用不满意，可以申请全额退款。' },
            { q: '兑换码如何使用？', a: '在上方输入框中输入兑换码，点击"激活"即可立即获得对应会员权益。' },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
              <p className="text-gray-500 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Membership;
