
import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, ArrowLeft, 
  Zap, Gem, Loader2, Clock
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface PaymentProps {
  currentUser?: UserProfile | null;
  onNavigate: (page: Page, param?: string) => void;
  targetTier?: 'pro' | 'pro_plus';
}

type PaymentMethod = 'alipay' | 'wechat' | null;
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface PlanOption {
  id: 'pro' | 'pro_plus';
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  savePercent: number;
  features: string[];
  gradient: string;
  icon: React.ElementType;
}

const Payment: React.FC<PaymentProps> = ({ currentUser, onNavigate, targetTier = 'pro' }) => {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'pro_plus'>(targetTier);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5分钟支付倒计时

  const plans: PlanOption[] = [
    {
      id: 'pro',
      name: 'Pro 专业版',
      badge: 'PRO',
      description: '适合想要系统学习项目管理的个人',
      monthlyPrice: 99,
      yearlyPrice: 999,
      savePercent: 15,
      features: [
        '全部 18 门课程',
        '12 个高级工具',
        'AI 助手 20次/天',
        '完整版证书',
        '精华帖标识'
      ],
      gradient: 'from-blue-500 to-cyan-500',
      icon: Zap
    },
    {
      id: 'pro_plus',
      name: 'Pro+ 高级版',
      badge: 'PRO+',
      description: '适合追求卓越的资深项目经理',
      monthlyPrice: 199,
      yearlyPrice: 1999,
      savePercent: 16,
      features: [
        '全部 Pro 权益',
        '5 个专家级工具',
        '实战模拟中心',
        'PDF 评分报告导出',
        'AI 助手 50次/天',
        '专家认证标识',
        '1对1专属客服'
      ],
      gradient: 'from-amber-500 to-orange-500',
      icon: Gem
    }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const currentPrice = billingCycle === 'monthly' ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;

  // 倒计时
  useEffect(() => {
    if (paymentStatus === 'processing' && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [paymentStatus, countdown]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 创建订单
  const createOrder = async () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    setPaymentStatus('processing');
    
    // 创建订单记录
    const orderData = {
      user_id: currentUser.id,
      plan_id: selectedPlan,
      billing_cycle: billingCycle,
      amount: currentPrice,
      payment_method: paymentMethod,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('payment_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('创建订单失败:', error);
      setPaymentStatus('failed');
      return;
    }

    setOrderId(data.id);
    
    // 模拟生成二维码
    setTimeout(() => {
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentMethod}_order_${data.id}`);
    }, 500);

    // 模拟支付成功（3秒后）
    setTimeout(async () => {
      await handlePaymentSuccess(data.id);
    }, 5000);
  };

  // 支付成功处理
  const handlePaymentSuccess = async (orderId: string) => {
    // 更新订单状态
    await supabase
      .from('payment_orders')
      .update({ status: 'completed', paid_at: new Date().toISOString() })
      .eq('id', orderId);

    // 更新用户会员等级
    const expiryDate = billingCycle === 'yearly' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('app_users')
      .update({
        subscription_tier: selectedPlan,
        membership_expires_at: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser?.id);

    setPaymentStatus('success');
  };

  // 渲染支付成功页面
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h2>
          <p className="text-gray-500 mb-6">
            您已成功升级到 {currentPlan.name}，所有权益已解锁
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">订单编号</span>
              <span className="font-medium">{orderId?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">支付金额</span>
              <span className="font-medium">¥{currentPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">有效期至</span>
              <span className="font-medium">
                {billingCycle === 'yearly' ? '一年后' : '30天后'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate(Page.DASHBOARD)}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            开始使用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate(Page.MEMBERSHIP)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          <h1 className="text-lg font-semibold">确认订单</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：选择方案 */}
          <div className="space-y-6">
            {/* 方案选择 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">选择会员方案</h2>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? `border-${plan.id === 'pro' ? 'blue' : 'amber'}-500 bg-${plan.id === 'pro' ? 'blue' : 'amber'}-50` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">{plan.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                plan.id === 'pro' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                {plan.badge}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ¥{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                          </div>
                          <div className="text-xs text-gray-400">
                            /{billingCycle === 'monthly' ? '月' : '年'}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle size={14} className="text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 计费周期 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">计费周期</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    billingCycle === 'monthly'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">月付</div>
                  <div className="text-sm text-gray-500">¥{currentPlan.monthlyPrice}/月</div>
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    省{currentPlan.savePercent}%
                  </div>
                  <div className="font-semibold mb-1">年付</div>
                  <div className="text-sm text-gray-500">¥{currentPlan.yearlyPrice}/年</div>
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：支付 */}
          <div className="space-y-6">
            {/* 支付方式 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">选择支付方式</h2>
              <div className="space-y-3">
                {/* 支付宝 */}
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  disabled={paymentStatus === 'processing'}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    paymentMethod === 'alipay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      支
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">支付宝</div>
                      <div className="text-xs text-gray-500">推荐使用</div>
                    </div>
                  </div>
                  {paymentMethod === 'alipay' && <CheckCircle size={20} className="text-blue-500" />}
                </button>

                {/* 微信支付 */}
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  disabled={paymentStatus === 'processing'}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    paymentMethod === 'wechat'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      微
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">微信支付</div>
                      <div className="text-xs text-gray-500">亿万用户的选择</div>
                    </div>
                  </div>
                  {paymentMethod === 'wechat' && <CheckCircle size={20} className="text-green-500" />}
                </button>
              </div>
            </div>

            {/* 订单摘要 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">订单摘要</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">方案</span>
                  <span className="font-medium">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">周期</span>
                  <span className="font-medium">{billingCycle === 'monthly' ? '月付' : '年付'}</span>
                </div>
                <div className="h-px bg-gray-200 my-3" />
                <div className="flex justify-between text-lg font-bold">
                  <span>应付金额</span>
                  <span className="text-red-500">¥{currentPrice}</span>
                </div>
              </div>
            </div>

            {/* 支付按钮 / 二维码 */}
            {!qrCode ? (
              <button
                onClick={createOrder}
                disabled={!paymentMethod || paymentStatus === 'processing'}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  paymentMethod && paymentStatus !== 'processing'
                    ? 'bg-black hover:bg-gray-800'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {paymentStatus === 'processing' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    创建订单中...
                  </span>
                ) : (
                  '确认支付'
                )}
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <h3 className="font-semibold mb-4">
                  {paymentMethod === 'alipay' ? '支付宝' : '微信'}扫码支付
                </h3>
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  {qrCode ? (
                    <img src={qrCode} alt="支付二维码" className="w-full h-full object-contain" />
                  ) : (
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock size={16} />
                  支付剩余时间：{formatCountdown(countdown)}
                </div>
                <p className="text-xs text-gray-400">
                  请使用{paymentMethod === 'alipay' ? '支付宝' : '微信'}扫描二维码完成支付
                </p>
              </div>
            )}

            {/* 安全提示 */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield size={14} />
              <span>安全支付保障 · 7天无理由退款</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
