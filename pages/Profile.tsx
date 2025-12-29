import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Award, Download, Share2, X, CheckCircle, Zap, Flame, Crown, Medal, Lock, Star, Target, Bug, Trophy } from 'lucide-react';

const Profile: React.FC = () => {
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  // --- Mock Data: Contribution Heatmap ---
  const heatmapData = useMemo(() => {
    // Generate 52 weeks * 7 days of data
    return Array.from({ length: 364 }, (_, i) => {
        const random = Math.random();
        let level = 0;
        if (random > 0.8) level = 4; // High
        else if (random > 0.6) level = 3;
        else if (random > 0.4) level = 2;
        else if (random > 0.2) level = 1;
        return { date: i, level };
    });
  }, []);

  // --- Mock Data: Skills Radar ---
  const skillsData = [
    { subject: '规划', A: 120, fullMark: 150 },
    { subject: '执行', A: 98, fullMark: 150 },
    { subject: '预算', A: 110, fullMark: 150 },
    { subject: '风险', A: 99, fullMark: 150 },
    { subject: '领导力', A: 130, fullMark: 150 },
    { subject: '敏捷', A: 85, fullMark: 150 },
  ];

  // --- Mock Data: Leaderboard ---
  const leaderboard = [
      { rank: 1, name: 'Sarah Chen', xp: '12,450', avatar: 'https://i.pravatar.cc/150?u=1' },
      { rank: 2, name: 'Mike Ross', xp: '11,200', avatar: 'https://i.pravatar.cc/150?u=2' },
      { rank: 3, name: 'Alex Chen (Me)', xp: '9,850', avatar: 'https://i.pravatar.cc/150?u=3', isMe: true }, // Current User
      { rank: 4, name: 'Jennie Kim', xp: '8,400', avatar: 'https://i.pravatar.cc/150?u=4' },
      { rank: 5, name: 'David Zhang', xp: '7,230', avatar: 'https://i.pravatar.cc/150?u=5' },
  ];

  // --- Mock Data: Badges ---
  const badges = [
      { id: 1, name: '早起鸟', desc: '连续7天在8点前打卡', icon: Zap, unlocked: true, color: 'text-yellow-500', bg: 'bg-yellow-100' },
      { id: 2, name: '全能王', desc: '完成所有基础课程', icon: Crown, unlocked: true, color: 'text-purple-500', bg: 'bg-purple-100' },
      { id: 3, name: '连胜大师', desc: '连续学习30天', icon: Flame, unlocked: true, color: 'text-orange-500', bg: 'bg-orange-100' },
      { id: 4, name: 'Bug猎手', desc: '在实战中修复10个Bug', icon: Bug, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
      { id: 5, name: '完美主义', desc: '单个测验获得100分', icon: Target, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
      { id: 6, name: '高产似母猪', desc: '一周提交20次代码', icon: Star, unlocked: false, color: 'text-gray-400', bg: 'bg-gray-100' },
  ];

  // --- Mock Data: Certificates ---
  const certificates = [
    { 
        id: 'CSM-2023', 
        title: '敏捷 Scrum Master 认证', 
        titleEn: 'Certified Scrum Master',
        issuer: 'Scrum Alliance', 
        date: '2023-05-12', 
        bgGradient: 'bg-gradient-to-br from-[#FF9966] to-[#FF5E62]', 
        sealColor: 'border-yellow-200 text-yellow-100',
        user: 'Alex Chen'
    },
    { 
        id: 'PMP-2022', 
        title: 'PMP 项目管理专业人士', 
        titleEn: 'Project Management Professional',
        issuer: 'PMI Institute', 
        date: '2022-11-20', 
        bgGradient: 'bg-gradient-to-br from-[#4facfe] to-[#00f2fe]',
        sealColor: 'border-blue-200 text-blue-100',
        user: 'Alex Chen'
    },
    { 
        id: 'GPM-2021', 
        title: 'Google 项目管理证书', 
        titleEn: 'Google Project Management Cert',
        issuer: 'Coursera', 
        date: '2021-08-15', 
        bgGradient: 'bg-gradient-to-br from-[#43e97b] to-[#38f9d7]',
        sealColor: 'border-green-200 text-green-100',
        user: 'Alex Chen'
    },
  ];

  const handleDownload = (certTitle: string) => {
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,Certificate Placeholder';
      link.download = `${certTitle}.pdf`;
      link.click();
      alert(`正在下载 ${certTitle} 高清 PDF...`);
  };

  const getHeatmapColor = (level: number) => {
      switch(level) {
          case 0: return 'bg-gray-100';
          case 1: return 'bg-emerald-200';
          case 2: return 'bg-emerald-300';
          case 3: return 'bg-emerald-400';
          case 4: return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
          default: return 'bg-gray-100';
      }
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen space-y-6">
        
        {/* --- 1. Top Section: Contribution Heatmap --- */}
        <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">学习活跃度 (Activity)</h2>
                    <p className="text-xs text-gray-500">过去一年</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600 tracking-tight">324 <span className="text-sm font-medium text-gray-400">天</span></p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">年度活跃</p>
                </div>
            </div>
            
            {/* Grid Container */}
            <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-fit min-w-full">
                    {heatmapData.map((day, i) => (
                        <div 
                            key={i} 
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-all hover:scale-125 hover:z-10 cursor-default ${getHeatmapColor(day.level)}`}
                            title={`Activity Level: ${day.level}`}
                        ></div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 justify-end">
                <span>Less</span>
                <div className="w-2.5 h-2.5 bg-gray-100 rounded-[2px]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-200 rounded-[2px]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-300 rounded-[2px]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-[2px]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[2px]"></div>
                <span>More</span>
            </div>
        </div>

        {/* --- 2. Middle Section: Radar & Leaderboard --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Capability Radar (Col Span 8) */}
            <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-6 relative flex flex-col justify-between">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">能力雷达</h2>
                    <p className="text-sm text-gray-500">基于实战演练与课程测验数据的综合评估</p>
                </div>
                <div className="h-[300px] w-full relative z-10">
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
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                    {/* Floating Badge */}
                    <div className="absolute top-0 right-0 bg-blue-50/80 backdrop-blur border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        Total Score: 642
                    </div>
                </div>
            </div>

            {/* Right: Leaderboard (Col Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
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
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/20" />
                                <div>
                                    <p className="text-sm font-bold leading-none">{user.name}</p>
                                    <p className={`text-[10px] mt-0.5 font-medium opacity-70`}>{user.isMe ? 'Current User' : 'Senior PM'}</p>
                                </div>
                            </div>
                            <div className="text-xs font-mono font-bold opacity-90">{user.xp} XP</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- 3. Bottom Section: Certificates & Badges --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Certificate Stack (Col Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-gray-900">荣誉证书</h2>
                    <button className="text-xs text-blue-600 font-bold hover:underline">查看全部</button>
                 </div>
                 
                 <div className="relative h-[320px] w-full flex justify-center pt-6 perspective-1000 group">
                    {certificates.map((cert, index) => (
                        <div
                            key={cert.id}
                            onClick={() => setSelectedCert(cert)}
                            className={`absolute w-full max-w-[90%] h-48 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] p-6 text-white flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group-hover:shadow-2xl ${cert.bgGradient}`}
                            style={{
                                top: `${index * 50}px`,
                                transform: `scale(${1 - index * 0.05}) translateZ(${index * -10}px)`,
                                zIndex: certificates.length - index,
                                opacity: 1 - index * 0.1,
                            }}
                        >
                             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                             <div className="relative z-10 flex justify-between items-start">
                                <Award className="opacity-80"/>
                                <span className="text-[10px] font-mono opacity-60 border border-white/30 px-1 rounded">{cert.id}</span>
                             </div>
                             <div className="relative z-10">
                                 <h3 className="font-bold text-lg leading-tight">{cert.title}</h3>
                                 <p className="text-[10px] opacity-80">{cert.issuer}</p>
                             </div>
                        </div>
                    ))}
                 </div>
            </div>

            {/* Right: Badge Wall (Col Span 8) */}
            <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-8">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">徽章收藏馆</h2>
                        <p className="text-sm text-gray-500">已解锁 {badges.filter(b => b.unlocked).length} / {badges.length} 个成就</p>
                    </div>
                    <div className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2">
                        <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                        <span className="text-xs font-bold text-gray-600">总成就点: 450</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {badges.map((badge) => (
                         <div 
                            key={badge.id} 
                            className={`relative group rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-all border ${
                                badge.unlocked 
                                ? 'bg-white/60 border-white/50 hover:bg-white hover:shadow-lg' 
                                : 'bg-gray-100/50 border-transparent opacity-60 grayscale'
                            }`}
                         >
                             <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-inner ${badge.unlocked ? badge.bg : 'bg-gray-200'} ${badge.color}`}>
                                 <badge.icon size={28} />
                             </div>
                             <div>
                                 <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{badge.name}</h4>
                                 <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{badge.desc}</p>
                             </div>
                             
                             {!badge.unlocked && (
                                 <div className="absolute top-2 right-2 text-gray-400">
                                     <Lock size={12} />
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
            </div>

        </div>

      {/* Certificate Preview Modal (Existing Logic) */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedCert(null)}
            ></div>
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up">
                {/* Toolbar */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">证书预览</h3>
                        <p className="text-xs text-gray-500">验证编号: {selectedCert.id}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleDownload(selectedCert.title)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                        >
                            <Download size={16} /> 下载 PDF
                        </button>
                        <button 
                            onClick={() => setSelectedCert(null)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Realistic Certificate Paper View */}
                <div className="p-10 md:p-16 bg-[#FDFBF7] flex justify-center overflow-y-auto max-h-[70vh]">
                    <div className="relative w-full max-w-3xl aspect-[1.414/1] bg-white border-[20px] border-double border-[#E5E0D8] shadow-lg p-12 flex flex-col items-center text-center justify-between">
                        {/* Decorative Corners */}
                        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-600/20"></div>
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-600/20"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-600/20"></div>
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-600/20"></div>
                        
                        {/* Content */}
                        <div className="space-y-6">
                            <div className="flex justify-center mb-4 text-yellow-600">
                                <Award size={64} />
                            </div>
                            
                            <h2 className="text-4xl font-serif font-bold text-gray-900 tracking-wide uppercase">Certificate of Completion</h2>
                            
                            <p className="text-gray-500 font-serif italic text-lg">This is to certify that</p>
                            
                            <h1 className="text-5xl font-cursive text-blue-900 py-4 font-bold border-b-2 border-gray-100 inline-block px-12">
                                {selectedCert.user}
                            </h1>
                            
                            <p className="text-gray-500 font-serif italic text-lg">has successfully completed the course</p>
                            
                            <h3 className="text-3xl font-bold text-gray-800">{selectedCert.title}</h3>
                            <p className="text-gray-400 font-medium">({selectedCert.titleEn})</p>
                        </div>

                        {/* Footer */}
                        <div className="w-full flex justify-between items-end mt-12 px-8">
                            <div className="text-center">
                                <div className="h-px w-40 bg-gray-400 mb-2"></div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Date Issued</p>
                                <p className="font-mono text-sm">{selectedCert.date}</p>
                            </div>

                            {/* Seal */}
                            <div className="relative group cursor-pointer">
                                <div className={`w-24 h-24 rounded-full border-4 border-double ${selectedCert.sealColor} flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 bg-white`}>
                                    <div className={`w-20 h-20 rounded-full border border-dashed ${selectedCert.sealColor} flex items-center justify-center p-2 text-center`}>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 leading-tight">
                                            Verified<br/>ProjectFlow<br/>System
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                    <CheckCircle size={10} /> Valid
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="h-px w-40 bg-gray-400 mb-2"></div>
                                <p className="text-xs font-bold text-gray-500 uppercase">{selectedCert.issuer}</p>
                                <p className="font-serif italic text-sm">Director of Education</p>
                            </div>
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