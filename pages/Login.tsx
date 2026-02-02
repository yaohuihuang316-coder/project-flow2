
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Mail, User, Loader2, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { normalizeMembershipTier } from '../lib/membership';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Step 1: Check if user exists
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
        setError("请输入有效的邮箱地址");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const { data } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', email)
            .single();

        if (data) {
            // User exists -> Login immediately
            setTimeout(() => {
                onLogin({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role as any,
                    avatar: data.avatar,
                    department: data.department,
                    joined_at: data.created_at,
                    membershipTier: normalizeMembershipTier(data.subscription_tier),
                    completedCoursesCount: data.completed_courses_count || 0,
                    isLifetimeMember: data.is_lifetime_member || false,
                    aiTier: data.ai_tier || 'none',
                    aiDailyUsed: data.ai_daily_used || 0
                });
            }, 800);
        } else {
            // User does not exist (or error finding them) -> Go to Step 2 (Register)
            setIsNewUser(true);
            setStep('details');
            setIsLoading(false);
        }
    } catch (err: any) {
        console.error(err);
        // If table doesn't exist or network error, let user register anyway (handled in step 2)
        if (err.code === 'PGRST116' || (err.details && err.details.includes('0 rows'))) {
             setIsNewUser(true);
             setStep('details');
        } else {
             setError("连接数据库失败。请检查 Supabase 配置。");
        }
        setIsLoading(false);
    }
  };

  // Step 2: Create new user
  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name) {
          setError("请输入您的姓名");
          return;
      }
      setIsLoading(true);

      const newUser = {
          id: `u-${Date.now()}`,
          email,
          name,
          role: 'Student', // Default role
          status: '正常',
          created_at: new Date().toISOString()
      };

      try {
          const { error } = await supabase.from('app_users').insert(newUser);
          
          if (error) {
              throw error;
          }

          // Success
          onLogin({
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: 'Student',
              joined_at: newUser.created_at,
              membershipTier: 'free',
              completedCoursesCount: 0,
              isLifetimeMember: false,
              aiTier: 'none',
              aiDailyUsed: 0
          });

      } catch (err: any) {
          console.error(err);
          setError(err.message || "注册失败，请检查数据库表结构。");
          setIsLoading(false);
      }
  };

  // Fallback: Demo Login (Auto-syncs to DB)
  const handleDemoLogin = async () => {
      const demoUser = {
          id: 'u-777', // Fixed ID for stability
          email: '777@projectflow.com',
          name: 'Alex Chen',
          role: 'Manager',
          status: '正常',
          department: 'Project Management Office',
          avatar: 'https://i.pravatar.cc/150?u=777',
          created_at: new Date().toISOString()
      };

      // Proactively try to ensure demo user exists in DB to prevent Foreign Key errors
      try {
          await supabase.from('app_users').upsert(demoUser);
      } catch (err) {
          console.warn("Could not sync demo user to DB (might be offline or table missing)", err);
      }

      onLogin({
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role as any,
          avatar: demoUser.avatar,
          department: demoUser.department,
          joined_at: demoUser.created_at,
          membershipTier: 'free',
          completedCoursesCount: 0,
          isLifetimeMember: false,
          aiTier: 'none',
          aiDailyUsed: 0
      });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 mesh-gradient opacity-60 animate-pulse duration-[5000ms]"></div>
      
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-10 glass-card rounded-[2.5rem] animate-fade-in-up shadow-2xl transition-all duration-500">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/30 flex items-center justify-center mb-6 transform hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-white">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {isNewUser ? '创建账号' : '欢迎回来'}
          </h1>
          <p className="text-gray-500 font-medium">ProjectFlow 企业项目管理系统</p>
        </div>

        <form onSubmit={step === 'email' ? handleCheckEmail : handleRegister} className="space-y-6">
          
          {/* Email Input */}
          <div className="space-y-1">
            <div className={`relative group transition-all duration-300 rounded-2xl p-1 bg-gradient-to-r from-blue-400/0 to-indigo-400/0 ${step === 'email' ? 'focus-within:from-blue-400 focus-within:to-indigo-400 focus-within:shadow-lg focus-within:shadow-blue-500/20' : ''}`}>
              <div className="relative flex items-center bg-white/80 backdrop-blur-md rounded-[14px] px-4 py-4 transition-all border border-transparent">
                <Mail size={20} className={`mr-3 ${email ? 'text-blue-600' : 'text-gray-400'}`} />
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={step === 'details'}
                  autoFocus
                  className={`w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium ${step === 'details' ? 'text-gray-500 cursor-not-allowed' : ''}`}
                />
                {step === 'details' && <CheckCircle2 size={18} className="text-green-500 ml-2 animate-bounce-in"/>}
              </div>
            </div>
          </div>

          {/* Name Input (Step 2) */}
          {step === 'details' && (
             <div className="space-y-1 animate-fade-in-up">
                <div className="relative group transition-all duration-300 rounded-2xl p-1 bg-gradient-to-r from-blue-400/0 to-indigo-400/0 focus-within:from-blue-400 focus-within:to-indigo-400 focus-within:shadow-lg focus-within:shadow-blue-500/20">
                    <div className="relative flex items-center bg-white/80 backdrop-blur-md rounded-[14px] px-4 py-4 transition-all">
                        <User size={20} className="mr-3 text-gray-400 focus-within:text-blue-500" />
                        <input
                        type="text"
                        placeholder="怎么称呼您？(姓名)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                        />
                    </div>
                </div>
                <p className="text-xs text-blue-600 font-medium px-2 pt-1">✨ 看起来您是新用户，请设置昵称。</p>
             </div>
          )}

          {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl animate-bounce-in">
                  <AlertCircle size={16} />
                  {error}
              </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all duration-300 shadow-xl shadow-gray-400/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                    {step === 'email' ? '继续' : '完成注册'}
                    <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-gray-400">
            {step === 'email' ? 'Protected by ProjectFlow Security' : <button onClick={() => setStep('email')} className="text-blue-600 hover:underline">返回修改邮箱</button>}
          </p>
          
          {/* Demo Login Button */}
          {error && (
              <button 
                onClick={handleDemoLogin}
                className="text-xs font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                  <Database size={12}/> 数据库未连接？试用演示账号 (Alex Chen)
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
