
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Mail, User, Loader2, AlertCircle, CheckCircle2, Database, Upload, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { normalizeMembershipTier } from '../lib/membership';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Student' | 'Teacher'>('Student');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
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
                    xp: data.xp || 0,
                    streak: data.streak || 0,
                    membershipTier: normalizeMembershipTier(data.subscription_tier),
                    completedCoursesCount: data.completed_courses_count || 0,
                    isLifetimeMember: data.is_lifetime_member || false,
                    aiTier: data.ai_tier || 'none',
                    aiDailyResetAt: data.ai_daily_reset_at,
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
      
      // 教师必须上传企业许可
      if (role === 'Teacher' && !licenseFile) {
          setError("教师身份需要上传企业许可证明");
          return;
      }
      
      setIsLoading(true);

      let licenseUrl = null;
      
      // 上传企业许可文件（如果是教师）
      if (role === 'Teacher' && licenseFile) {
          try {
              const fileExt = licenseFile.name.split('.').pop();
              const filePath = `teacher-licenses/${email}-${Date.now()}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('documents')
                  .upload(filePath, licenseFile);
              
              if (uploadError) throw uploadError;
              
              licenseUrl = filePath;
          } catch (err: any) {
              setError("企业许可上传失败: " + err.message);
              setIsLoading(false);
              return;
          }
      }

      const newUser = {
          id: `u-${Date.now()}`,
          email,
          name,
          role: role,
          status: role === 'Teacher' ? 'pending' : '正常', // 教师需要审核
          teacher_license_url: licenseUrl,
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
              role: role as any,
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

  // 处理文件选择
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // 验证文件类型
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
              setError("请上传 PDF 或图片格式的文件");
              return;
          }
          // 验证文件大小（最大 10MB）
          if (file.size > 10 * 1024 * 1024) {
              setError("文件大小不能超过 10MB");
              return;
          }
          setLicenseFile(file);
          setError(null);
      }
  };

  // Demo Login with different tiers - 使用与数据库匹配的ID
  const handleDemoLogin = async (tier: 'free' | 'pro' | 'pro_plus' | 'admin' | 'teacher' = 'free') => {
      // 使用与数据库 db_final_setup.sql 中匹配的测试账号
      const demoUsers = {
          free: {
              id: 'test-free-001',
              email: 'free@test.com',
              name: 'Free用户',
              role: 'Student',
              avatar: 'https://i.pravatar.cc/150?u=free001',
              streak: 3,
              xp: 350,
              completedCourses: 1
          },
          pro: {
              id: 'test-pro-001',
              email: 'pro@test.com',
              name: 'Pro用户',
              role: 'Student',
              avatar: 'https://i.pravatar.cc/150?u=pro001',
              streak: 15,
              xp: 1200,
              completedCourses: 5
          },
          pro_plus: {
              id: 'test-pp-001',
              email: 'pp@test.com',
              name: 'ProPlus用户',
              role: 'Student',
              avatar: 'https://i.pravatar.cc/150?u=pp001',
              streak: 30,
              xp: 2800,
              completedCourses: 10
          },
          admin: {
              id: 'test-admin-001',
              email: 'admin@test.com',
              name: '管理员',
              role: 'SuperAdmin',
              avatar: 'https://i.pravatar.cc/150?u=admin001',
              streak: 0,
              xp: 0,
              completedCourses: 0
          },
          teacher: {
              id: 'test-teacher-001',
              email: 'teacher@test.com',
              name: '张老师',
              role: 'Editor',
              avatar: 'https://i.pravatar.cc/150?u=teacher001',
              streak: 45,
              xp: 3500,
              completedCourses: 8
          }
      };

      const user = demoUsers[tier];
      const dbUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: '正常',
          department: 'Project Management Office',
          avatar: user.avatar,
          streak: user.streak,
          xp: user.xp,
          created_at: new Date().toISOString()
      };

      // Try to sync to DB (may fail if offline)
      try {
          await supabase.from('app_users').upsert(dbUser);
      } catch (err) {
          console.warn("Could not sync demo user to DB", err);
      }

      onLogin({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as any,
          avatar: user.avatar,
          department: 'Project Management Office',
          joined_at: dbUser.created_at,
          xp: user.xp,
          streak: user.streak,
          membershipTier: tier === 'admin' || tier === 'teacher' ? 'pro_plus' : tier,
          completedCoursesCount: user.completedCourses,
          isLifetimeMember: tier === 'admin',
          aiTier: tier === 'pro_plus' || tier === 'admin' ? 'pro' : tier === 'pro' ? 'basic' : 'none',
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

          {/* Registration Details (Step 2) */}
          {step === 'details' && (
             <div className="space-y-4 animate-fade-in-up">
                {/* Name Input */}
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

                {/* Role Selection */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 px-2">选择身份</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole('Student')}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                role === 'Student' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                role === 'Student' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                                <BookOpen size={20} />
                            </div>
                            <div className="text-left">
                                <p className={`font-medium ${role === 'Student' ? 'text-blue-900' : 'text-gray-900'}`}>学生</p>
                                <p className="text-xs text-gray-500">学习课程、参与讨论</p>
                            </div>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setRole('Teacher')}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                role === 'Teacher' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                role === 'Teacher' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                                <GraduationCap size={20} />
                            </div>
                            <div className="text-left">
                                <p className={`font-medium ${role === 'Teacher' ? 'text-green-900' : 'text-gray-900'}`}>教师</p>
                                <p className="text-xs text-gray-500">创建课程、管理学生</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Teacher License Upload */}
                {role === 'Teacher' && (
                    <div className="space-y-2 animate-fade-in-up">
                        <p className="text-sm font-medium text-gray-700 px-2">
                            企业许可证明 <span className="text-red-500">*</span>
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleLicenseUpload}
                                className="hidden"
                                id="license-upload"
                            />
                            <label
                                htmlFor="license-upload"
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                                    licenseFile 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {licenseFile ? (
                                    <>
                                        <CheckCircle2 size={24} className="text-green-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-green-900 truncate">{licenseFile.name}</p>
                                            <p className="text-xs text-green-600">点击更换文件</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-gray-400" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-700">上传企业许可</p>
                                            <p className="text-xs text-gray-500">支持 PDF、JPG、PNG，最大 10MB</p>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                        <p className="text-xs text-amber-600 px-2">
                            ⚠️ 教师账号需要审核，审核通过后方可使用教师功能
                        </p>
                    </div>
                )}

                <p className="text-xs text-blue-600 font-medium px-2 pt-1">✨ 看起来您是新用户，请完善信息。</p>
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
          
          {/* Demo Accounts Section */}
          <div className="w-full border-t border-gray-100 pt-6 mt-2">
            <p className="text-xs font-medium text-gray-400 text-center mb-3">快速体验 - 演示账号</p>
            <div className="grid grid-cols-5 gap-2">
              <button 
                onClick={() => handleDemoLogin('free')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <span className="text-lg">🆓</span>
                <span className="text-xs font-bold text-gray-600">Free</span>
              </button>
              <button 
                onClick={() => handleDemoLogin('pro')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <span className="text-lg">💎</span>
                <span className="text-xs font-bold text-blue-600">Pro</span>
              </button>
              <button 
                onClick={() => handleDemoLogin('pro_plus')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <span className="text-lg">👑</span>
                <span className="text-xs font-bold text-amber-600">Pro+</span>
              </button>
              <button 
                onClick={() => handleDemoLogin('teacher')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
              >
                <span className="text-lg">👨‍🏫</span>
                <span className="text-xs font-bold text-green-600">教师</span>
              </button>
              <button 
                onClick={() => handleDemoLogin('admin')}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <span className="text-lg">🛡️</span>
                <span className="text-xs font-bold text-purple-600">Admin</span>
              </button>
            </div>
            {error && (
              <p className="text-xs text-center text-gray-400 mt-2">
                <Database size={10} className="inline mr-1"/>数据库连接失败，演示数据仅在本地有效
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
