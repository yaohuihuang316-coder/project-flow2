
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Award, Download, X, Zap, Flame, Crown, Medal, Lock, Target, Trophy, LogOut, Mail, Calendar, Shield, Loader2, Info, FileSignature, Star, Sunrise, MessageSquare, Wrench, BookOpen, Play, GitBranch, Heart } from 'lucide-react';
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
  const [, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Real Certificate Data
  const [certificates, setCertificates] = useState<any[]>([]);

  // User skills for radar chart
  const [userSkills, setUserSkills] = useState({
    plan_score: 0, exec_score: 0, cost_score: 0,
    risk_score: 0, lead_score: 0, agile_score: 0
  });
  
  // Achievements data
  const [achievementsDef, setAchievementsDef] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  
  // Activity data with types
  const [activityData, setActivityData] = useState<any[]>([]);

  // Print Ref for capturing the certificate
  const printRef = useRef<HTMLDivElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
      const fetchData = async () => {
          if (!currentUser) return;
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          // 1. Logs
          const { data: logsData } = await supabase
              .from('app_activity_logs')
              .select('*')
              .eq('user_id', currentUser.id)
              .gte('created_at', oneYearAgo.toISOString());
          
          if (logsData) setActivityLogs(logsData);

          // 2. Completed Courses (Certificates)
          // We fetch courses where progress is 100
          const { data: progressData } = await supabase
              .from('app_user_progress')
              .select(`
                  course_id,
                  last_accessed,
                  progress,
                  app_courses (title, image)
              `)
              .eq('user_id', currentUser.id)
              .eq('progress', 100);

          if (progressData && progressData.length > 0) {
              const mappedCerts = progressData.map((p: any) => ({
                  id: `CERT-${p.course_id}`,
                  title: p.app_courses?.title || 'Unknown Course',
                  titleEn: 'Certificate of Completion',
                  date: new Date(p.last_accessed).toLocaleDateString(),
                  issuer: 'ProjectFlow Academy',
                  image: p.app_courses?.image,
                  courseName: p.app_courses?.title
              }));
              setCertificates(mappedCerts);
          } else {
              setCertificates([]); // No completed courses yet
          }
      };
      fetchData();
  }, [currentUser]);

  // Fetch user skills, achievements, and activity
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;
      
      // 1. Fetch user skills
      const { data: skillsData } = await supabase
        .from('app_user_skills')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (skillsData) {
        setUserSkills(skillsData);
      }
      
      // 2. Fetch achievements definition
      const { data: achievementsData } = await supabase
        .from('app_achievements')
        .select('*')
        .order('rarity', { ascending: false });
      
      if (achievementsData) {
        setAchievementsDef(achievementsData);
      }
      
      // 3. Fetch user unlocked achievements
      const { data: userAchData } = await supabase
        .from('app_user_achievements')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (userAchData) {
        setUserAchievements(userAchData);
      }
      
      // 4. Fetch learning activity for heatmap
      const { data: activityRaw } = await supabase
        .from('app_learning_activity')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('activity_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (activityRaw) {
        setActivityData(activityRaw);
      }
    };
    
    fetchProfileData();
  }, [currentUser]);

  // --- Heatmap Logic with Activity Types ---
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    const activityMap: Record<string, { count: number, types: Set<string> }> = {};
    
    activityData.forEach(act => {
      const dateStr = act.activity_date;
      if (!activityMap[dateStr]) {
        activityMap[dateStr] = { count: 0, types: new Set() };
      }
      activityMap[dateStr].count += act.xp_earned || 1;
      activityMap[dateStr].types.add(act.activity_type);
    });
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = activityMap[dateStr];
      const count = activity?.count || 0;
      let level = 0;
      if (count === 0) level = 0;
      else if (count <= 10) level = 1;
      else if (count <= 30) level = 2;
      else if (count <= 60) level = 3;
      else level = 4;
      
      // Determine primary activity type for color
      const types = activity?.types || new Set();
      let type = 'none';
      if (types.has('course')) type = 'course';
      else if (types.has('simulation')) type = 'simulation';
      else if (types.has('tool')) type = 'tool';
      else if (types.has('login')) type = 'login';
      
      days.push({ date: dateStr, count, level, type });
    }
    return days;
  }, [activityData]);

  const getHeatmapColor = (level: number, type: string) => {
    if (level === 0) return 'bg-[#ebedf0]';
    
    // Color based on activity type
    switch (type) {
      case 'course': // Green shades
        return ['bg-[#dcfce7]', 'bg-[#86efac]', 'bg-[#22c55e]', 'bg-[#166534]'][level - 1];
      case 'simulation': // Blue shades
        return ['bg-[#dbeafe]', 'bg-[#93c5fd]', 'bg-[#3b82f6]', 'bg-[#1e40af]'][level - 1];
      case 'tool': // Purple shades
        return ['bg-[#f3e8ff]', 'bg-[#d8b4fe]', 'bg-[#a855f7]', 'bg-[#6b21a8]'][level - 1];
      case 'login': // Yellow shades
        return ['bg-[#fef9c3]', 'bg-[#fde047]', 'bg-[#eab308]', 'bg-[#854d0e]'][level - 1];
      default:
        return ['bg-[#9be9a8]', 'bg-[#40c463]', 'bg-[#30a14e]', 'bg-[#216e39]'][level - 1];
    }
  };

  // --- Skills Data from Database ---
  const skillsData = [
    { subject: '规划 (Plan)', A: userSkills.plan_score, fullMark: 100 },
    { subject: '执行 (Exec)', A: userSkills.exec_score, fullMark: 100 },
    { subject: '预算 (Cost)', A: userSkills.cost_score, fullMark: 100 },
    { subject: '风险 (Risk)', A: userSkills.risk_score, fullMark: 100 },
    { subject: '领导力 (Lead)', A: userSkills.lead_score, fullMark: 100 },
    { subject: '敏捷 (Agile)', A: userSkills.agile_score, fullMark: 100 },
  ];

  // Prepare badges with unlock status
  const badgesWithStatus = useMemo(() => {
    const iconMap: Record<string, any> = {
      'Trophy': Trophy,
      'BookOpen': BookOpen,
      'Target': Target,
      'Play': Play,
      'Sunrise': Sunrise,
      'Flame': Flame,
      'Zap': Zap,
      'Crown': Crown,
      'Star': Star,
      'Wrench': Wrench,
      'GitBranch': GitBranch,
      'MessageSquare': MessageSquare,
      'Heart': Heart,
    };
    
    return achievementsDef.map(ach => {
      const userAch = userAchievements.find(ua => ua.achievement_id === ach.id);
      const Icon = iconMap[ach.icon] || Trophy;
      const rarityColors = {
        'common': { color: 'text-gray-600', bg: 'bg-gray-100' },
        'rare': { color: 'text-blue-600', bg: 'bg-blue-100' },
        'epic': { color: 'text-purple-600', bg: 'bg-purple-100' },
        'legendary': { color: 'text-yellow-600', bg: 'bg-yellow-100' },
      };
      const colors = rarityColors[ach.rarity as keyof typeof rarityColors] || rarityColors.common;
      
      return {
        id: ach.id,
        name: ach.name,
        condition: ach.description,
        icon: Icon,
        unlocked: !!userAch,
        progress: userAch?.progress || 0,
        color: colors.color,
        bg: colors.bg,
        rarity: ach.rarity,
        isNew: userAch?.is_new || false,
      };
    });
  }, [achievementsDef, userAchievements]);

  // --- Download Handler ---
  const handleDownload = async (certTitle: string) => {
      if (isGeneratingPdf || !printRef.current) return;
      setIsGeneratingPdf(true);

      try {
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
                                className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:ring-2 hover:ring-gray-400 ${getHeatmapColor(day.level, day.type)}`}
                                title={`${day.count} points on ${day.date}`}
                            ></div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#22c55e]"></div>
                    <span>课程</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#3b82f6]"></div>
                    <span>模拟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#a855f7]"></div>
                    <span>工具</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#eab308]"></div>
                    <span>登录</span>
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
                    <p className="text-sm text-gray-500">已解锁 {badgesWithStatus.filter(b => b.unlocked).length} / {badgesWithStatus.length} 个成就</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {badgesWithStatus.map((badge) => (
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
                         
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                             <div className="bg-black/90 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl text-center leading-relaxed">
                                 <p className="font-bold text-yellow-400 mb-1">获取条件</p>
                                 {badge.condition}
                                 {!badge.unlocked && badge.progress > 0 && (
                                   <div className="mt-2">
                                     <div className="w-full bg-gray-700 rounded-full h-1.5">
                                       <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${Math.min(badge.progress, 100)}%` }}></div>
                                     </div>
                                     <p className="text-[10px] text-gray-400 mt-1">进度: {badge.progress}%</p>
                                   </div>
                                 )}
                                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* --- 3. Certificates Wall (Dynamic) --- */}
        <div className="bg-[#1c1c1e] rounded-[2.5rem] p-8 shadow-xl text-white animate-fade-in-up delay-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <FileSignature size={24} className="text-black" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">荣誉证书墙</h2>
                        <p className="text-sm text-gray-400">完成课程进度 100% 自动颁发</p>
                    </div>
                </div>
             </div>

             {certificates.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                     {certificates.map((cert) => (
                         <div 
                            key={cert.id}
                            onClick={() => setSelectedCert({ ...cert, user: currentUser?.name || 'User' })}
                            className="group relative aspect-[1.414/1] bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-yellow-500/50 transition-all shadow-2xl transform hover:scale-[1.02]"
                         >
                             <img src={cert.image} alt={cert.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                             
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                 <h3 className="text-lg font-bold text-white leading-tight">{cert.title}</h3>
                                 <p className="text-xs text-gray-300 mt-1">{cert.titleEn}</p>
                                 <div className="flex items-center gap-2 mt-3">
                                     <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">CLICK TO VIEW</span>
                                     <span className="text-[10px] text-gray-400">{cert.date}</span>
                                 </div>
                             </div>

                             <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                                 <Award size={14} className="text-yellow-400" />
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="py-20 text-center text-gray-500">
                     <p>尚未获得证书，快去完成课程吧！</p>
                 </div>
             )}
        </div>

        {/* --- Certificate Preview Modal (Centered & Downloadable) --- */}
        {selectedCert && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-fade-in" onClick={() => setSelectedCert(null)}></div>
                
                <div className="relative w-full max-w-6xl h-[90vh] flex flex-col animate-bounce-in z-50">
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

                    <div className="flex-1 bg-[#2C2C2E]/50 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl">
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
