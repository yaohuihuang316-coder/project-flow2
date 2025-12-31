
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Award, Download, X, Zap, Flame, Crown, Medal, Lock, Target, Bug, Trophy, LogOut, Mail, Calendar, Shield, Loader2, Info, FileSignature, Star, HelpCircle } from 'lucide-react';
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

  // Print Ref for capturing the certificate
  const printRef = useRef<HTMLDivElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
      const fetchData = async () => {
          if (!currentUser) return;
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const { data: logsData } = await supabase
              .from('app_activity_logs')
              .select('*')
              .eq('user_id', currentUser.id)
              .gte('created_at', oneYearAgo.toISOString());
          
          if (logsData) setActivityLogs(logsData);
      };
      fetchData();
  }, [currentUser]);

  // --- Heatmap Logic ---
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    const logMap: Record<string, number> = {};
    activityLogs.forEach(log => {
        const dateStr = log.created_at.split('T')[0];
        logMap[dateStr] = (logMap[dateStr] || 0) + log.points;
    });
    for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        let count = logMap[dateStr] || 0;
        if (activityLogs.length === 0) { // Mock for demo
             const randomSeed = date.getDate() + date.getMonth() * 3;
             if (date.getDay() !== 0 && date.getDay() !== 6 && Math.random() > 0.7) count = randomSeed % 5;
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

  const getHeatmapColor = (level: number) => {
      switch (level) {
          case 0: return 'bg-[#ebedf0]';
          case 1: return 'bg-[#9be9a8]';
          case 2: return 'bg-[#40c463]';
          case 3: return 'bg-[#30a14e]';
          case 4: return 'bg-[#216e39]';
          default: return 'bg-[#ebedf0]';
      }
  };

  // --- Mock Data ---
  const skillsData = [
    { subject: '规划 (Plan)', A: 145, fullMark: 150 },
    { subject: '执行 (Exec)', A: 125, fullMark: 150 },
    { subject: '预算 (Cost)', A: 135, fullMark: 150 },
    { subject: '风险 (Risk)', A: 148, fullMark: 150 },
    { subject: '领导力 (Lead)', A: 140, fullMark: 150 },
    { subject: '敏捷 (Agile)', A: 130, fullMark: 150 },
  ];

  // Badges (Achievement Icons)
  const badges = [
      { id: 1, name: 'PMP大师', condition: '通过 PMP 模拟考试且分数 > 85', icon: Crown, unlocked: true, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      { id: 2, name: '早起鸟', condition: '连续 7 天在早上 8 点前登录学习', icon: Zap, unlocked: true, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      { id: 3, name: '全能王', condition: '完成所有基础课程章节', icon: Trophy, unlocked: true, color: 'text-purple-500', bg: 'bg-purple-100' },
      { id: 4, name: '连胜大师', condition: '连续学习 30 天未中断', icon: Flame, unlocked: true, color: 'text-orange-500', bg: 'bg-orange-100' },
      { id: 5, name: 'Bug猎手', condition: '在实战项目中修复 10 个以上 Bug', icon: Bug, unlocked: true, color: 'text-green-500', bg: 'bg-green-100' },
      { id: 6, name: '完美主义', condition: '在任意测验中获得 100 分', icon: Target, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
  ];

  // Certificates (Documents)
  const certificates = [
      { 
          id: 'CERT-001', 
          title: '敏捷项目管理专家认证', 
          titleEn: 'Agile Project Management Expert',
          date: '2023-10-15', 
          issuer: 'ProjectFlow Academy',
          image: 'https://images.unsplash.com/photo-1589330694653-4a8b243aafa0?auto=format&fit=crop&w=400&q=80',
          courseName: '敏捷实战高阶课'
      },
      { 
          id: 'CERT-002', 
          title: '企业级风险控制专员', 
          titleEn: 'Enterprise Risk Control Specialist',
          date: '2024-01-20', 
          issuer: 'ProjectFlow Academy',
          image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=400&q=80',
          courseName: '风险管理与合规'
      },
      {
          id: 'CERT-003',
          title: 'DevOps 流程架构师',
          titleEn: 'DevOps Process Architect',
          date: '2024-03-10',
          issuer: 'ProjectFlow Academy',
          image: 'https://images.unsplash.com/photo-1546955121-d0ba6a58f9e7?auto=format&fit=crop&w=400&q=80',
          courseName: 'DevOps 工程实践'
      }
  ];

  // --- Download Handler ---
  const handleDownload = async (certTitle: string) => {
      if (isGeneratingPdf || !printRef.current) return;
      setIsGeneratingPdf(true);

      try {
          // Increase scale for better clarity
          const canvas = await html2canvas(printRef.current, {
              scale: 3, 
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

  // --- Certificate Template (Hidden & Preview) ---
  const CertificateTemplate = ({ data }: { data: any }) => (
    <div 
        className="w-[1123px] h-[794px] bg-white relative flex flex-col items-center text-center justify-between p-24 text-slate-900"
        style={{
            backgroundImage: 'radial-gradient(circle at center, #fff 60%, #f8fafc 100%)',
            fontFamily: '"Times New Roman", serif',
            boxSizing: 'border-box'
        }}
    >
        {/* Decorative Border */}
        <div className="absolute inset-6 border-[8px] border-double border-[#CA8A04]/20 pointer-events-none"></div>
        <div className="absolute inset-9 border border-[#CA8A04]/40 pointer-events-none"></div>
        
        {/* Corner Ornaments */}
        <div className="absolute top-6 left-6 w-32 h-32 border-t-[8px] border-l-[8px] border-[#CA8A04]/30 rounded-tl-sm pointer-events-none"></div>
        <div className="absolute top-6 right-6 w-32 h-32 border-t-[8px] border-r-[8px] border-[#CA8A04]/30 rounded-tr-sm pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 w-32 h-32 border-b-[8px] border-l-[8px] border-[#CA8A04]/30 rounded-bl-sm pointer-events-none"></div>
        <div className="absolute bottom-6 right-6 w-32 h-32 border-b-[8px] border-r-[8px] border-[#CA8A04]/30 rounded-br-sm pointer-events-none"></div>

        {/* Header */}
        <div className="z-10 mt-4 w-full flex flex-col items-center">
            <div className="mb-4 relative">
               <Award size={100} className="text-[#CA8A04] drop-shadow-sm opacity-90" strokeWidth={1} />
            </div>
            <h1 className="text-7xl font-serif font-bold text-slate-900 tracking-[0.1em] uppercase mb-2 drop-shadow-sm">Certificate</h1>
            <p className="text-2xl font-serif text-[#CA8A04] tracking-[0.3em] uppercase font-light">Of Achievement</p>
        </div>

        {/* Content */}
        <div className="z-10 w-full flex-1 flex flex-col justify-center items-center">
            <p className="text-xl text-slate-500 italic mb-6 font-serif">This certifies that</p>
            
            <h2 className="text-7xl font-bold text-slate-900 mb-6 border-b border-slate-300 inline-block px-12 pb-4 font-sans tracking-tight min-w-[500px]">
                {data.user || 'Student Name'}
            </h2>
            
            <p className="text-xl text-slate-500 italic mt-4 mb-2 font-serif">has successfully completed the course</p>
            <h3 className="text-5xl font-bold text-[#CA8A04] font-serif tracking-wide max-w-4xl leading-tight my-4">
                {data.title}
            </h3>
            <p className="text-lg text-slate-400 mt-1 font-sans tracking-widest uppercase font-medium">
                {data.titleEn}
            </p>
        </div>

        {/* Footer */}
        <div className="w-full flex justify-between items-end px-16 z-10 mb-8">
            <div className="text-center w-64">
                <div className="border-b border-slate-400 mb-3 pb-1">
                    <p className="font-mono text-xl text-slate-700">{data.date}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
            </div>

            {/* Gold Seal */}
            <div className="relative -mb-4 mx-8">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#A16207] shadow-xl flex items-center justify-center p-2 ring-4 ring-[#FEF08A]/50">
                    <div className="w-full h-full rounded-full border-[2px] border-dashed border-white/40 flex flex-col items-center justify-center bg-[#CA8A04]/10 text-white drop-shadow-md">
                        <Star size={24} fill="white" className="mb-1"/>
                        <div className="text-[10px] font-bold uppercase tracking-widest">ProjectFlow</div>
                        <div className="text-2xl font-serif font-bold">Verified</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">Certification</div>
                    </div>
                </div>
            </div>

            <div className="text-center w-64">
                <div className="border-b border-slate-400 mb-3 pb-1 flex justify-center items-end h-10">
                    <span className="font-serif italic text-3xl text-slate-800 opacity-80 -rotate-6 transform translate-y-2">Alex P.</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Director of Education</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen space-y-8">
        
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

        {/* --- 1. Stats Heatmap & Radar --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up delay-100">
            {/* Heatmap */}
            <div className="lg:col-span-7 glass-card rounded-[2rem] p-8 flex flex-col">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            学习贡献 (Contribution) <Info size={16} className="text-gray-400 cursor-help" />
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">持续学习是最好的投资</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center overflow-x-auto pb-2 custom-scrollbar">
                    <div className="grid grid-rows-7 grid-flow-col gap-[4px] w-fit">
                        {heatmapData.map((day, i) => (
                            <div 
                                key={i} 
                                className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:ring-2 hover:ring-gray-400 ${getHeatmapColor(day.level)}`}
                                title={`${day.count} points on ${day.date}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Radar */}
            <div className="lg:col-span-5 glass-card rounded-[2rem] p-6 min-h-[300px] flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 mb-2">能力雷达</h2>
                <div className="flex-1 w-full -ml-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                            <Radar name="Stats" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.2} />
                            <RechartsTooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* --- 2. Badges Collection (Hover Only) --- */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-fade-in-up delay-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Medal size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">徽章收藏馆</h2>
                    <p className="text-sm text-gray-500">已解锁 {badges.filter(b => b.unlocked).length} / {badges.length} 个成就</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {badges.map((badge) => (
                     <div 
                        key={badge.id}
                        className={`relative group rounded-2xl p-4 flex flex-col items-center text-center gap-3 border transition-all ${
                            badge.unlocked 
                            ? 'bg-gradient-to-b from-white to-gray-50 border-gray-200 hover:shadow-lg hover:-translate-y-1' 
                            : 'bg-gray-100/50 border-transparent opacity-60 grayscale'
                        }`}
                     >
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-inner ${badge.unlocked ? badge.bg : 'bg-gray-200'} ${badge.color}`}>
                             <badge.icon size={24} />
                         </div>
                         <div>
                             <h4 className={`text-xs font-bold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</h4>
                         </div>
                         {!badge.unlocked && <div className="absolute top-2 right-2 text-gray-400"><Lock size={12} /></div>}
                         
                         {/* Hover Tooltip for Condition */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                             <div className="bg-black/90 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl text-center leading-relaxed">
                                 <p className="font-bold text-yellow-400 mb-1">获取条件</p>
                                 {badge.condition}
                                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* --- 3. Certificates Wall (New Feature) --- */}
        <div className="bg-[#1c1c1e] rounded-[2.5rem] p-8 shadow-xl text-white animate-fade-in-up delay-300 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <FileSignature size={24} className="text-black" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">荣誉证书墙</h2>
                        <p className="text-sm text-gray-400">官方认证的专业能力证明</p>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                 {certificates.map((cert) => (
                     <div 
                        key={cert.id}
                        onClick={() => setSelectedCert({ ...cert, user: currentUser?.name || 'User' })}
                        className="group relative aspect-[1.414/1] bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-yellow-500/50 transition-all shadow-2xl transform hover:scale-[1.02]"
                     >
                         {/* Preview Image */}
                         <img src={cert.image} alt={cert.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                         
                         {/* Top Left Tooltip Icon */}
                         <div className="absolute top-3 left-3 z-20 group/icon">
                             <div className="p-1.5 bg-black/30 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors">
                                 <HelpCircle size={16} />
                             </div>
                             {/* Tooltip Content */}
                             <div className="absolute top-full left-0 mt-2 w-48 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-black/90 backdrop-blur text-white text-[10px] p-2 rounded-lg shadow-xl">
                                    完成 <span className="text-yellow-400 font-bold">{cert.courseName}</span> 后颁发
                                </div>
                             </div>
                         </div>

                         {/* Overlay Info */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                             <h3 className="text-lg font-bold text-white leading-tight">{cert.title}</h3>
                             <p className="text-xs text-gray-300 mt-1">{cert.titleEn}</p>
                             <div className="flex items-center gap-2 mt-3">
                                 <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">CLICK TO VIEW</span>
                                 <span className="text-[10px] text-gray-400">{cert.date}</span>
                             </div>
                         </div>

                         {/* Verified Badge */}
                         <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                             <Award size={14} className="text-yellow-400" />
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* --- Certificate Preview Modal (Centered & Downloadable) --- */}
        {selectedCert && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-fade-in" onClick={() => setSelectedCert(null)}></div>
                
                <div className="relative w-full max-w-6xl h-[90vh] flex flex-col animate-bounce-in z-50">
                    
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="text-white">
                            <h3 className="text-xl font-bold">{selectedCert.title}</h3>
                            <p className="text-sm text-gray-400 opacity-80">Issued on {selectedCert.date}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleDownload(selectedCert.title)}
                                disabled={isGeneratingPdf}
                                className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 text-black rounded-full text-sm font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                            >
                                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />} 
                                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                            </button>
                            <button onClick={() => setSelectedCert(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Preview Viewport */}
                    <div className="flex-1 bg-[#2C2C2E]/50 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl">
                        {/* Visual Scaled Preview */}
                        <div className="origin-center transition-transform duration-500" style={{ transform: 'scale(0.65)' }}>
                            <CertificateTemplate data={selectedCert} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Hidden Capture Container (Off-screen) */}
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0 }}>
            <div ref={printRef}>
                {selectedCert && <CertificateTemplate data={selectedCert} />}
            </div>
        </div>

    </div>
  );
};

export default Profile;
