import React, { useState } from 'react';
import { Page } from '../types';
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react';

interface LoginProps {
  setPage: (page: Page) => void;
}

const Login: React.FC<LoginProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(Page.DASHBOARD);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 mesh-gradient opacity-60 animate-pulse duration-[5000ms]"></div>
      
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-10 glass-card rounded-[2.5rem] animate-fade-in-up shadow-2xl">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/30 flex items-center justify-center mb-6 transform hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-white">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">欢迎回来</h1>
          <p className="text-gray-500 font-medium">ProjectFlow 企业项目管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-1">
            <div 
              className={`relative group transition-all duration-300 rounded-2xl p-1 ${
                focused === 'email' ? 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-lg shadow-blue-500/20' : 'bg-transparent'
              }`}
            >
              <div className="relative flex items-center bg-white/80 backdrop-blur-md rounded-[14px] px-4 py-4 transition-all">
                <Mail size={20} className={`mr-3 ${focused === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  placeholder="电子邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div 
              className={`relative group transition-all duration-300 rounded-2xl p-1 ${
                focused === 'password' ? 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-lg shadow-blue-500/20' : 'bg-transparent'
              }`}
            >
              <div className="relative flex items-center bg-white/80 backdrop-blur-md rounded-[14px] px-4 py-4 transition-all">
                <Lock size={20} className={`mr-3 ${focused === 'password' ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all duration-300 shadow-xl shadow-gray-400/20 flex items-center justify-center gap-2 mt-4"
          >
            进入系统
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm font-medium">
          <p className="text-gray-400">
            还没有账号? <span className="text-blue-600 font-bold cursor-pointer hover:underline">立即注册</span>
          </p>
          
          {/* Admin Entry Point */}
          <button 
            onClick={() => setPage(Page.ADMIN_DASHBOARD)}
            className="flex items-center gap-1 text-gray-300 hover:text-gray-600 transition-colors"
          >
            <Shield size={14} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;