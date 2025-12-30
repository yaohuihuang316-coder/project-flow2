
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Award, Download, X, Zap, Flame, Crown, Medal, Lock, Star, Target, Bug, Trophy, LogOut, Mail, Calendar, Shield, Loader2, Feather, Hexagon } from 'lucide-react';
import { UserProfile } from '../types';
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
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // We use two refs: one for the scaled preview, one for the invisible full-res print version
  const printRef = useRef<HTMLDivElement>(null);

  // --- Fetch Achievements ---
  useEffect(() => {
      const fetchAchievements = async () => {
          if (!currentUser) {
              // Mock for guest/demo if DB empty
              setCertificates([
                  {
                      id: 'cert-001',
                      title: 'PMP 项目管理专业人士',
                      titleEn: 'Project Management Professional',
                      issuer: 'PMI Institute',
                      date: '2023-12-10',
                      user: 'Alex Chen', // Demo user name
                      bgGradient: 'bg-gradient-to-br from-gray-900 to-black',
                      sealColor: 'border-yellow-500 text-yellow-500'
                  },
                  {
                      id: 'cert-002',
                      title: 'ACP 敏捷认证从业者',
                      titleEn: 'Agile Certified Practitioner',
                      issuer: 'PMI Institute',
                      date: '2024-03-15',
                      user: 'Alex Chen',
                      bgGradient: 'bg-gradient-to-br from-blue-600 to-indigo-700',
                      sealColor: 'border-white text-white'
                  },
                  {
                      id: 'cert-003',
                      title: 'Scrum Master 认证',
                      titleEn: 'Certified ScrumMaster (CSM)',
                      issuer: 'Scrum Alliance',
                      date: '2024-05-20',
                      user: 'Alex Chen',
                      bgGradient: 'bg-gradient-to-br from-orange-500 to-red-600',
                      sealColor: 'border-white text-white'
                  }
              ]);
              return;
          }

          const { data } = await supabase
              .from('app_achievements')
              .select('*')
              .eq('user_id', currentUser.id)
              .order('date_awarded', { ascending: false });
          
          if (data && data.length > 0) {
              const mappedCerts = data.map(item => ({
                  id: item.id.toString(),
                  title: item.title,
                  titleEn: item.title_en || 'Professional Certificate',
                  issuer: item.issuer || 'ProjectFlow Institute',
                  date: new Date(item.date_awarded).toLocaleDateString(),
                  user: currentUser.name,
                  bgGradient: item.meta_data?.bg || 'bg-gradient-to-br from-gray-900 to-black',
                  sealColor: item.meta_data?.seal || 'border-yellow-500 text-yellow-500'
              }));
              setCertificates(mappedCerts);
          } else {
              // Fallback to demo certs if DB empty for current user (even if logged in as 777)
              if (currentUser.email === '777@projectflow.com') {
                   setCertificates([
                      {
                          id: 'cert-pmp',
                          title: 'PMP 项目管理专业人士',
                          titleEn: 'Project Management Professional',
                          issuer: 'PMI Institute',
                          date: '2023-12-10',
                          user: currentUser.name,
                          bgGradient: 'bg-gradient-to-br from-gray-900 to-black',
                          sealColor: 'border-yellow-500 text-yellow-500'
                      },
                      {
                          id: 'cert-acp',
                          title: 'ACP 敏捷认证从业者',
                          titleEn: 'Agile Certified Practitioner',
                          issuer: 'PMI Institute',
                          date: '2024-01-20',
                          user: currentUser.name,
                          bgGradient: 'bg-gradient-to-br from-blue-600 to-indigo-700',
                          sealColor: 'border-white text-white'
                      }
                   ]);
              } else {
                  setCertificates([]);
              }
          }
      };

      fetchAchievements();
  }, [currentUser]);

  // --- Mock Data: Contribution Heatmap ---
  const heatmapData = useMemo(() => {
    return Array.from({ length: 364 }, (_, i) => {
        const random = Math.random();
        let level = 0;
        if (random > 0.8) level = 4;
        else if (random > 0.6) level = 3;
        else if (random > 0.4) level = 2;
        else if (random > 0.2) level = 1;
        return { date: i, level };
    });
  }, []);

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
      { rank: 1, name: currentUser?.name || 'Alex Chen', xp: '18,450', avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=777', isMe: true },
      { rank: 2, name: 'Sarah Chen', xp: '15,450', avatar: 'https://i.pravatar.cc/150?u=1' },
      { rank: 3, name: 'Mike Ross', xp: '14,200', avatar: 'https://i.pravatar.cc/150?u=2' }, 
      { rank: 4, name: 'Jennie Kim', xp: '12,400', avatar: 'https://i.pravatar.cc/150?u=4' },
      { rank: 5, name: 'David Zhang', xp: '11,230', avatar: 'https://i.pravatar.cc/150?u=5' },
      { rank: 6, name: 'Alex Wong', xp: '9,900', avatar: 'https://i.pravatar.cc/150?u=6' },
      { rank: 7, name: 'Lisa Ray', xp: '8,500', avatar: 'https://i.pravatar.cc/150?u=7' },
      { rank: 8, name: 'Tom Hiddleston', xp: '7,200', avatar: 'https://i.pravatar.cc/150?u=8' },
      { rank: 9, name: 'Emma Stone', xp: '6,800', avatar: 'https://i.pravatar.cc/150?u=9' },
      { rank: 10, name: 'Ryan Gosling', xp: '5,400', avatar: 'https://i.pravatar.cc/150?u=10' },
      { rank: 11, name: 'Scarlett J', xp: '4,900', avatar: 'https://i.pravatar.cc/150?u=11' },
      { rank: 12, name: 'Chris Evans', xp: '4,500', avatar: 'https://i.pravatar.cc/150?u=12' },
  ];

  // --- Mock Data: Badges ---
  const badges = [
      { id: 1, name: 'PMP大师', desc: '通过 PMP 认证考试，获得 500 经验值', icon: Crown, unlocked: true, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { id: 2, name: '早起鸟', desc: '连续7天在8点前打卡学习，获得 200 经验值', icon: Zap, unlocked: true, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      { id: 3, name: '全能王', desc: '完成所有基础课程章节', icon: Trophy, unlocked: true, color: 'text-purple-500', bg: 'bg-purple-100' },
      { id: 4, name: '连胜大师', desc: '连续学习30天未中断', icon: Flame, unlocked: true, color: 'text-orange-500', bg: 'bg-orange-100' },
      { id: 5, name: 'Bug猎手', desc: '在实战中成功修复10个Bug', icon: Bug, unlocked: true, color: 'text-green-500', bg: 'bg-green-100' },
      { id: 6, name: '完美主义', desc: '在单个测验中获得100分满分', icon: Target, unlocked: true, color: 'text-red-500', bg: 'bg-red-100' },
      { id: 7, name: '高产似母猪', desc: '一周内提交20次代码或作业', icon: Star, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
      { id: 8, name: '文档专家', desc: '编写超过 5000 字的项目文档', icon: Feather, unlocked: true, color: 'text-blue-600', bg: 'bg-blue-100' },
      { id: 9, name: '社区之星', desc: '单篇帖子获得 100 个赞', icon: Hexagon, unlocked: true, color: 'text-indigo-500', bg: 'bg-indigo-100' },
      { id: 10, name: '夜猫子', desc: '在凌晨 2 点提交作业', icon: Lock, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
      { id: 11, name: '团队核心', desc: '在协作项目中贡献度排名第一', icon: Trophy, unlocked: true, color: 'text-teal-500', bg: 'bg-teal-100' },
      { id: 12, name: '敏捷先锋', desc: '完成所有敏捷开发实战模块', icon: Zap, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
      { id: 13, name: '终身学习', desc: '累计学习时长超过 100 小时', icon: Calendar, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
  ];

  const handleDownload = async (certTitle: string) => {
      if (isGeneratingPdf || !printRef.current) return;
      setIsGeneratingPdf(true);

      try {
          // Capture the "Phantom" full-resolution element
          const canvas = await html2canvas(printRef.current, {
              scale: 1, // Already full size
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              width: 1123,
              height: 794,
              windowWidth: 1200, // Ensure context considers a large window
          });

          const imgData = canvas.toDataURL('image/png');
          // A4 Landscape: 297mm x 210mm
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

  // Shared Certificate Component for both Preview and Print
  const CertificateTemplate = ({ data }: { data: any }) => (
    <div 
        className="w-[1123px] h-[794px] bg-white relative flex flex-col items-center text-center justify-between p-24 text-slate-900"
        style={{
            backgroundImage: 'radial-gradient(circle at center, #fff 60%, #f3f4f6 100%)',
            fontFamily: '"Times New Roman", serif',
            boxSizing: 'border-box'
        }}
    >
        {/* Ornamental Borders */}
        <div className="absolute inset-5 border-[3px] border-double border-[#CA8A04]/30 pointer-events-none"></div>
        <div className="absolute inset-7 border border-[#CA8A04]/10 pointer-events-none"></div>
        
        {/* Corner Decors */}
        <div className="absolute top-10 left-10 w-24 h-24 border-t-4 border-l-4 border-[#CA8A04]/40 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-24 h-24 border-t-4 border-r-4 border-[#CA8A04]/40 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 border-b-4 border-l-4 border-[#CA8A04]/40 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-b-4 border-r-4 border-[#CA8A04]/40 rounded-br-lg pointer-events-none"></div>

        {/* Header */}
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

        {/* Body */}
        <div className="z-10 w-full flex-1 flex flex-col justify-center items-center">
            <p className="text-xl text-slate-500 italic mb-8 font-serif">This is to certify that</p>
            
            <h2 className="text-7xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 inline-block px-12 pb-4 font-sans tracking-tight">
                {data.user}
            </h2>
            
            <p className="text-xl text-slate-500 italic mt-4 mb-2 font-serif">has successfully completed the comprehensive course</p>
            <h3 className="text-4xl font-bold text-slate-800 font-sans tracking-wide max-w-4xl leading-tight">{data.title}</h3>
            <p className="text-lg text-slate-400 mt-2 font-sans tracking-wider uppercase font-medium">({data.titleEn})</p>
        </div>

        {/* Footer */}
        <div className="w-full flex justify-between items-end px-12 z-10 mb-6">
            <div className="text-center w-64">
                <div className="border-b border-slate-300 mb-3 pb-1">
                    <p className="font-mono text-xl text-slate-600">{data.date}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
            </div>

            {/* Seal */}
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

        {/* --- 1. Heatmap --- */}
        <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up delay-100 hidden md:block">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">学习活跃度</h2>
                    <p className="text-xs text-gray-500">过去一年</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600 tracking-tight">324 <span className="text-sm font-medium text-gray-400">天</span></p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">年度活跃</p>
                </div>
            </div>
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-fit min-w-full">
                    {heatmapData.map((day, i) => (
                        <div 
                            key={i} 
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-all hover:scale-125 hover:z-10 cursor-default ${
                                day.level === 0 ? 'bg-gray-100' :
                                day.level === 1 ? 'bg-emerald-200' :
                                day.level === 2 ? 'bg-emerald-300' :
                                day.level === 3 ? 'bg-emerald-400' :
                                'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            }`}
                            title={`Activity Level: ${day.level}`}
                        ></div>
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
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-0 right-0 bg-blue-50/80 backdrop-blur border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        Score: 828
                    </div>
                </div>
            </div>

            {/* Right: Leaderboard */}
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
                            className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
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
                                    <p className={`text-[10px] mt-0.5 font-medium opacity-70`}>{user.isMe ? '我' : 'Level ' + Math.floor(parseInt(user.xp.replace(',',''))/1000)}</p>
                                </div>
                            </div>
                            <div className="text-xs font-mono font-bold opacity-90">{user.xp}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- 3. Certificates & Badges --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up delay-300">
            
            {/* Left: Certificate Stack */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-gray-900">荣誉证书</h2>
                    <button className="text-xs text-blue-600 font-bold hover:underline">查看全部</button>
                 </div>
                 
                 {certificates.length > 0 ? (
                     <div className="relative h-[320px] w-full flex justify-center pt-6 perspective-1000 group">
                        {certificates.map((cert, index) => (
                            <div
                                key={cert.id}
                                onClick={() => setSelectedCert(cert)}
                                className={`absolute w-full max-w-[90%] h-48 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] p-6 text-white flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group-hover:shadow-2xl ${cert.bgGradient}`}
                                style={{
                                    top: `${index * 60}px`,
                                    transform: `scale(${1 - index * 0.05}) translateZ(${index * -20}px)`,
                                    zIndex: certificates.length - index,
                                    opacity: index > 2 ? 0 : 1 - index * 0.1,
                                }}
                            >
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] rounded-3xl"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <Award className="opacity-80"/>
                                    <span className="text-[10px] font-mono opacity-60 border border-white/30 px-1 rounded">No. {cert.id}</span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2">{cert.title}</h3>
                                    <p className="text-[10px] opacity-80 mt-1">{cert.issuer} • {cert.date}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                         <Award size={32} className="opacity-50 mb-2"/>
                         <p className="text-xs font-bold">暂无证书</p>
                     </div>
                 )}
            </div>

            {/* Right: Badge Wall */}
            <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-8">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">徽章收藏馆</h2>
                        <p className="text-sm text-gray-500">已解锁 {badges.filter(b => b.unlocked).length} / {badges.length} 个成就</p>
                    </div>
                    <div className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2">
                        <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                        <span className="text-xs font-bold text-gray-600">点数: 850</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {badges.map((badge) => (
                         <div 
                            key={badge.id} 
                            className={`relative group rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all border cursor-pointer ${
                                badge.unlocked 
                                ? 'bg-white/60 border-white/50 hover:bg-white hover:shadow-lg' 
                                : 'bg-gray-100/50 border-transparent opacity-60 grayscale'
                            }`}
                         >
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${badge.unlocked ? badge.bg : 'bg-gray-200'} ${badge.color}`}>
                                 <badge.icon size={20} />
                             </div>
                             <div>
                                 <h4 className={`text-xs font-bold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</h4>
                             </div>
                             {!badge.unlocked && (
                                 <div className="absolute top-1 right-1 text-gray-400">
                                     <Lock size={10} />
                                 </div>
                             )}
                             
                             {/* --- Tooltip --- */}
                             <div className="absolute bottom-full mb-3 hidden group-hover:block w-40 z-20 animate-fade-in">
                                 <div className="bg-black/90 backdrop-blur text-white text-[10px] p-3 rounded-xl shadow-xl text-left border border-white/10 relative">
                                     <div className="font-bold mb-1 text-yellow-400">{badge.name}</div>
                                     <div className="opacity-80 leading-relaxed">{badge.desc}</div>
                                     {/* Arrow */}
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>

        {/* --- Certificate Preview Modal --- */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
