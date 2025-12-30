
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Award, Download, X, Zap, Flame, Crown, Medal, Lock, Target, Bug, Trophy, LogOut, Mail, Calendar, Shield, Loader2, Info, User, Eye } from 'lucide-react';
import { UserProfile, ActivityLog } from '../types';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface ProfileProps {
    currentUser?: UserProfile | null;
    onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, onLogout }) => {
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [viewingUser, setViewingUser] = useState<any | null>(null); // For Social Modal

  // We use two refs: one for the scaled preview, one for the invisible full-res print version
  const printRef = useRef<HTMLDivElement>(null);

  // --- Fetch Achievements & Activity Logs ---
  useEffect(() => {
      const fetchData = async () => {
          if (!currentUser) return;

          // 2. Fetch Activity Logs for Heatmap
          // Get logs for the last year
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const { data: logsData } = await supabase
              .from('app_activity_logs')
              .select('*')
              .eq('user_id', currentUser.id)
              .gte('created_at', oneYearAgo.toISOString());
          
          if (logsData) {
              setActivityLogs(logsData);
          }
      };

      fetchData();
  }, [currentUser]);

  // --- GitHub-style Heatmap Data Calculation ---
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    
    // Create a map of date -> count from real logs
    const logMap: Record<string, number> = {};
    activityLogs.forEach(log => {
        const dateStr = log.created_at.split('T')[0];
        logMap[dateStr] = (logMap[dateStr] || 0) + log.points; // Weight by points
    });

    // Generate last 365 days
    for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let count = logMap[dateStr] || 0;
        
        // If no real data (e.g. new user), fallback to mock pattern for demo visualization 
        // ONLY if user has absolutely no logs to avoid empty chart
        if (activityLogs.length === 0) {
             const randomSeed = date.getDate() + date.getMonth() * 3;
             if (date.getDay() !== 0 && date.getDay() !== 6 && Math.random() > 0.7) {
                 count = randomSeed % 5;
             }
        }

        let level = 0;
        if (count === 0) level = 0;
        else if (count <= 2) level = 1;
        else if (count <= 5) level = 2;
        else if (count <= 10) level = 3;
        else level = 4;

        days.push({ date: dateStr, count, level });
    }
    return days;
  }, [activityLogs]);

  // GitHub Green Scale Colors
  const getHeatmapColor = (level: number) => {
      switch (level) {
          case 0: return 'bg-[#ebedf0]'; // Gray
          case 1: return 'bg-[#9be9a8]'; // Light Green
          case 2: return 'bg-[#40c463]'; // Medium Green
          case 3: return 'bg-[#30a14e]'; // Dark Green
          case 4: return 'bg-[#216e39]'; // Darkest Green
          default: return 'bg-[#ebedf0]';
      }
  };

  // --- Mock Data: Skills Radar ---
  const skillsData = [
    { subject: '规划 (Plan)', A: 145, fullMark: 150 },
    { subject: '执行 (Exec)', A: 125, fullMark: 150 },
    { subject: '预算 (Cost)', A: 135, fullMark: 150 },
    { subject: '风险 (Risk)', A: 148, fullMark: 150 },
    { subject: '领导力 (Lead)', A: 140, fullMark: 150 },
    { subject: '敏捷 (Agile)', A: 130, fullMark: 150 },
  ];

  // --- Mock Data: Leaderboard ---
  const leaderboard = [
      { rank: 1, name: currentUser?.name || 'Alex Chen', xp: '18,450', avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=777', isMe: true, title: '全栈架构师' },
      { rank: 2, name: 'Sarah Chen', xp: '15,450', avatar: 'https://i.pravatar.cc/150?u=1', title: '敏捷教练' },
      { rank: 3, name: 'Mike Ross', xp: '14,200', avatar: 'https://i.pravatar.cc/150?u=2', title: '高级 PM' }, 
      { rank: 4, name: 'Jennie Kim', xp: '12,400', avatar: 'https://i.pravatar.cc/150?u=4', title: '产品经理' },
      { rank: 5, name: 'David Zhang', xp: '11,230', avatar: 'https://i.pravatar.cc/150?u=5', title: 'DevOps' },
  ];

  // --- Mock Data: Badges ---
  const badges = [
      { id: 1, name: 'PMP大师', desc: '通过 PMP 认证考试，获得 500 经验值', icon: Crown, unlocked: true, color: 'text-yellow-600', bg: 'bg-yellow-100', en: 'Master of PMP' },
      { id: 2, name: '早起鸟', desc: '连续7天在8点前打卡学习，获得 200 经验值', icon: Zap, unlocked: true, color: 'text-yellow-500', bg: 'bg-yellow-50', en: 'Early Bird Achiever' },
      { id: 3, name: '全能王', desc: '完成所有基础课程章节', icon: Trophy, unlocked: true, color: 'text-purple-500', bg: 'bg-purple-100', en: 'All-Rounder' },
      { id: 4, name: '连胜大师', desc: '连续学习30天未中断', icon: Flame, unlocked: true, color: 'text-orange-500', bg: 'bg-orange-100', en: 'Streak Master' },
      { id: 5, name: 'Bug猎手', desc: '在实战中成功修复10个Bug', icon: Bug, unlocked: true, color: 'text-green-500', bg: 'bg-green-100', en: 'Bug Hunter' },
      { id: 6, name: '完美主义', desc: '在单个测验中获得100分满分', icon: Target, unlocked: true, color: 'text-red-500', bg: 'bg-red-100', en: 'Perfectionist' },
  ];

  const handleDownload = async (certTitle: string) => {
      if (isGeneratingPdf || !printRef.current) return;
      setIsGeneratingPdf(true);

      try {
          const canvas = await html2canvas(printRef.current, {
              scale: 2, // Higher scale for better PDF quality
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              width: 1123,
              height: 794,
              windowWidth: 1200,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('l', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${certTitle.replace(/\s+/g, '_')}_Certificate.pdf`);

      } catch (err) {
          console.error("PDF generation failed:", err);
          alert("证书生成失败，请稍后重试。");
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const CertificateTemplate = ({ data }: { data: any }) => (
    <div 
        className="w-[1123px] h-[794px] bg-white relative flex flex-col items-center text-center justify-between p-24 text-slate-900"
        style={{
            backgroundImage: 'radial-gradient(circle at center, #fff 60%, #f3f4f6 100%)',
            fontFamily: '"Times New Roman", serif',
            boxSizing: 'border-box'
        }}
    >
        <div className="absolute inset-5 border-[3px] border-double border-[#CA8A04]/30 pointer-events-none"></div>
        <div className="absolute inset-7 border border-[#CA8A04]/10 pointer-events-none"></div>
        
        <div className="absolute top-10 left-10 w-24 h-24 border-t-4 border-l-4 border-[#CA8A04]/40 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-24 h-24 border-t-4 border-r-4 border-[#CA8A04]/40 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 border-b-4 border-l-4 border-[#CA8A04]/40 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-b-4 border-r-4 border-[#CA8A04]/40 rounded-br-lg pointer-events-none"></div>

        <div className="z-10 mt-6 w-full flex flex-col items-center">
            <div className="mb-6 relative">
               <Award size={90} className="text-[#CA8A04] drop-shadow-sm opacity-90" strokeWidth={1} />
               <div className="absolute inset-0 bg-[#CA8A04]/10 blur-xl rounded-full"></div>
            </div>
            <h1 className="text-6xl font-serif font-bold text-slate-900 tracking-[0.15em] uppercase mb-4 drop-shadow-sm">Certificate</h1>
            <div className="flex items-center gap-4 w-full justify-center">
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#CA8A04]"></div>
                <p className="text-2xl font-serif text-[#CA8A04] tracking-[0.3em] uppercase font-light">Of Completion</p>
                <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#CA8A04]"></div>
            </div>
        </div>

        <div className="z-10 w-full flex-1 flex flex-col justify-center items-center">
            <p className="text-xl text-slate-500 italic mb-8 font-serif">This is to certify that</p>
            
            <h2 className="text-7xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 inline-block px-12 pb-4 font-sans tracking-tight">
                {data.user}
            </h2>
            
            <p className="text-xl text-slate-500 italic mt-4 mb-2 font-serif">has successfully unlocked the achievement</p>
            <h3 className="text-4xl font-bold text-slate-800 font-sans tracking-wide max-w-4xl leading-tight">{data.title}</h3>
            <p className="text-lg text-slate-400 mt-2 font-sans tracking-wider uppercase font-medium">({data.titleEn})</p>
        </div>

        <div className="w-full flex justify-between items-end px-12 z-10 mb-6">
            <div className="text-center w-64">
                <div className="border-b border-slate-300 mb-3 pb-1">
                    <p className="font-mono text-xl text-slate-600">{data.date}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
            </div>

            <div className="relative -mb-2 mx-8">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#A16207] shadow-xl flex items-center justify-center p-1.5 ring-4 ring-[#FEF08A]/50">
                    <div className="w-full h-full rounded-full border-[2px] border-dashed border-white/40 flex items-center justify-center bg-[#CA8A04]/10">
                        <div className="text-center text-white drop-shadow-md">
                                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90">ProjectFlow</div>
                                <div className="text-3xl font-serif font-bold">Verified</div>
                                <div className="text-[10px] font-bold uppercase mt-1 opacity-80 tracking-widest">Certification</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center w-64">
                <div className="border-b border-slate-300 mb-3 pb-1 flex justify-center items-end h-10">
                    <span className="font-serif italic text-3xl text-slate-800 opacity-80 -rotate-2 transform translate-y-1">Alex P.</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Director of Education</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen space-y-6">
        
        {/* --- 0. User Info Card --- */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
            <div className="flex items-center gap-6 w-full">
                <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold shadow-2xl overflow-hidden">
                    {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900">{currentUser?.name || 'Guest User'}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500 font-medium">
                         <span className="flex items-center gap-1.5"><Mail size={16}/> {currentUser?.email || 'guest@example.com'}</span>
                         <span className="flex items-center gap-1.5"><Shield size={16}/> {currentUser?.role || 'Student'}</span>
                         <span className="flex items-center gap-1.5"><Calendar size={16}/> Joined 2024</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="w-full md:w-auto px-6 py-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
                <LogOut size={16}/> 退出登录
            </button>
        </div>

        {/* --- 1. GitHub-Style Heatmap (Real Data) --- */}
        <div className="glass-card rounded-[2rem] p-8 animate-fade-in-up delay-100 hidden md:block">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        学习贡献图 (Activity Heatmap) <Info size={16} className="text-gray-400 cursor-help" />
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">记录你每一天的学习与实战投入（基于真实活动日志）</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-[#ebedf0] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#9be9a8] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#40c463] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#30a14e] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#216e39] rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-fit min-w-full">
                    {heatmapData.map((day, i) => (
                        <div 
                            key={i} 
                            className={`w-3.5 h-3.5 rounded-[2px] transition-all hover:ring-2 hover:ring-gray-400 hover:z-10 relative group ${getHeatmapColor(day.level)}`}
                            title={`${day.count} contributions on ${day.date}`}
                        >
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- 2. Radar & Leaderboard --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up delay-200">
            {/* Left: Capability Radar */}
            <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-6 relative flex flex-col justify-between min-h-[400px]">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">能力雷达</h2>
                    <p className="text-sm text-gray-500">综合能力评估</p>
                </div>
                <div className="flex-1 w-full relative z-10">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                            <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3"/>
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }} />
                            <Radar
                                name="My Stats"
                                dataKey="A"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="#3b82f6"
                                fillOpacity={0.2}
                            />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-0 right-0 bg-blue-50/80 backdrop-blur border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        Score: 828
                    </div>
                </div>
            </div>

            {/* Right: Leaderboard (Social Interactive) */}
            <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Trophy size={20} className="text-yellow-500"/> 排行榜
                    </h2>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">本周</span>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {leaderboard.map((user) => (
                        <div 
                            key={user.rank} 
                            onClick={() => !user.isMe && setViewingUser(user)}
                            className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                                user.isMe 
                                ? 'bg-black text-white shadow-lg scale-[1.02]' 
                                : 'hover:bg-gray-50 text-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded-full ${
                                    user.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                    user.rank === 2 ? 'bg-gray-100 text-gray-500' :
                                    user.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                    'text-gray-400'
                                }`}>
                                    {user.rank <= 3 ? <Medal size={14}/> : user.rank}
                                </div>
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold leading-none">{user.name}</p>
                                    <p className={`text-[10px] mt-0.5 font-medium opacity-70`}>{user.isMe ? '我' : user.title}</p>
                                </div>
                            </div>
                            <div className="text-xs font-mono font-bold opacity-90">{user.xp}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- 3. Badges --- */}
        <div className="glass-card rounded-[2.5rem] p-8 animate-fade-in-up delay-300">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">徽章收藏馆</h2>
                    <p className="text-sm text-gray-500">已解锁 {badges.filter(b => b.unlocked).length} / {badges.length} 个成就</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {badges.map((badge) => (
                     <div 
                        key={badge.id}
                        onClick={() => {
                            if (badge.unlocked) {
                                setSelectedCert({
                                    id: `CRT-${badge.id}-${Date.now().toString().slice(-4)}`,
                                    title: badge.name,
                                    titleEn: badge.en || 'Mastery Achievement',
                                    user: currentUser?.name || 'User',
                                    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                });
                            }
                        }}
                        className={`relative group rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all border ${
                            badge.unlocked 
                            ? 'bg-white/60 border-white/50 hover:bg-white hover:shadow-lg cursor-pointer hover:scale-105' 
                            : 'bg-gray-100/50 border-transparent opacity-60 grayscale cursor-not-allowed'
                        }`}
                     >
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${badge.unlocked ? badge.bg : 'bg-gray-200'} ${badge.color}`}>
                             <badge.icon size={20} />
                         </div>
                         <div>
                             <h4 className={`text-xs font-bold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</h4>
                         </div>
                         {!badge.unlocked ? (
                             <div className="absolute top-1 right-1 text-gray-400">
                                 <Lock size={10} />
                             </div>
                         ) : (
                             <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                 <Eye size={10} /> 证书
                             </div>
                         )}
                     </div>
                 ))}
             </div>
        </div>

        {/* --- Social User Modal --- */}
        {viewingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setViewingUser(null)}></div>
                 <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-bounce-in z-50 text-center">
                     <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
                     
                     <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-lg">
                         <img src={viewingUser.avatar} className="w-full h-full object-cover" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900">{viewingUser.name}</h2>
                     <p className="text-gray-500 text-sm mb-6">{viewingUser.title}</p>
                     
                     <div className="grid grid-cols-3 gap-4 mb-6">
                         <div className="bg-gray-50 p-3 rounded-2xl">
                             <div className="text-lg font-bold text-gray-900">{viewingUser.xp}</div>
                             <div className="text-[10px] text-gray-400 uppercase font-bold">XP</div>
                         </div>
                         <div className="bg-gray-50 p-3 rounded-2xl">
                             <div className="text-lg font-bold text-gray-900">12</div>
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Badges</div>
                         </div>
                         <div className="bg-gray-50 p-3 rounded-2xl">
                             <div className="text-lg font-bold text-gray-900">45</div>
                             <div className="text-[10px] text-gray-400 uppercase font-bold">Streak</div>
                         </div>
                     </div>

                     <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                         <User size={16}/> 加为好友
                     </button>
                 </div>
            </div>
        )}

        {/* --- Certificate Preview Modal --- */}
      {selectedCert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in" onClick={() => setSelectedCert(null)}></div>
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-bounce-in z-50">
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">证书预览</h3>
                        <p className="text-xs text-gray-500">验证 ID: {selectedCert.id}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleDownload(selectedCert.title)}
                            disabled={isGeneratingPdf}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />} 
                            {isGeneratingPdf ? '生成 PDF...' : '下载高清证书'}
                        </button>
                        <button onClick={() => setSelectedCert(null)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Viewport */}
                <div className="flex-1 bg-[#2C2C2E] p-4 md:p-8 flex items-center justify-center overflow-auto relative">
                    
                    {/* The Scale Wrapper for Visual Preview */}
                    <div 
                        className="shadow-2xl origin-center transition-transform"
                        style={{
                            // Responsive visual scaling (does not affect capture)
                            transform: 'scale(0.6)', 
                            width: '1123px', 
                            height: '794px' 
                        }}
                    >
                        <CertificateTemplate data={selectedCert} />
                    </div>

                    {/* 
                        HIDDEN CAPTURE CONTAINER
                        This is physically in the DOM but hidden from view.
                        html2canvas will capture THIS element at full resolution.
                        Position absolute off-screen to avoid scrollbars but ensure rendering.
                    */}
                    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                        <div ref={printRef}>
                            <CertificateTemplate data={selectedCert} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
