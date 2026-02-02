
import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Calendar, Trophy, ArrowUpRight, Activity, Share2, FileText, ChevronRight, FlaskConical } from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface DashboardProps {
  onNavigate: (page: Page, id?: string) => void;
  currentUser?: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, currentUser }) => {
  // Real Data State
  const [stats, setStats] = useState({
      avgScore: 0,
      totalTime: 0, // hours
      completed: 0, // %
      xp: 0
  });
  
  // Notes State
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  // Mock Date for Header
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  // Fetch User Progress Stats & Notes
  useEffect(() => {
    const fetchData = async () => {
        if (!currentUser) return;

        // 1. Fetch Stats
        const { data: progressData } = await supabase
            .from('app_user_progress')
            .select('progress')
            .eq('user_id', currentUser.id);

        if (progressData && progressData.length > 0) {
            const totalItems = progressData.length;
            const sumProgress = progressData.reduce((acc, curr) => acc + (curr.progress || 0), 0);
            const avg = Math.round(sumProgress / totalItems);
            
            setStats({
                avgScore: avg,
                totalTime: Math.round(progressData.length * 0.5), 
                completed: avg,
                xp: progressData.length * 10
            });
        }

        // 2. Fetch Recent Notes (Joining with Courses)
        // Note: Supabase JS join syntax requires explicit relationship setup or raw querying. 
        // Here we do a two-step fetch for simplicity if FKs aren't perfectly inferred by the client.
        const { data: notesData } = await supabase
            .from('app_user_progress')
            .select('course_id, notes, last_accessed')
            .eq('user_id', currentUser.id)
            .not('notes', 'is', null) // Only where notes exist
            .neq('notes', '')
            .order('last_accessed', { ascending: false })
            .limit(3);

        if (notesData && notesData.length > 0) {
            // Fetch Course Details for these notes
            const courseIds = notesData.map(n => n.course_id);
            const { data: coursesData } = await supabase
                .from('app_courses')
                .select('id, title, image')
                .in('id', courseIds);
            
            const mergedNotes = notesData.map(note => {
                const course = coursesData?.find(c => c.id === note.course_id);
                return {
                    courseId: note.course_id,
                    noteSnippet: note.notes,
                    date: new Date(note.last_accessed).toLocaleDateString(),
                    courseTitle: course?.title || 'Unknown Course',
                    courseImage: course?.image
                };
            });
            setRecentNotes(mergedNotes);
        }
    };

    fetchData();
  }, [currentUser]);

  const ringData = [
    { name: 'Score', value: stats.avgScore, fill: '#34C759' },    // Green
    { name: 'Progress', value: stats.completed, fill: '#007AFF' }, // Blue
    { name: 'Time', value: Math.min(100, (stats.totalTime / 10) * 100), fill: '#FF2D55' },    // Red
  ];

  return (
    // Layout Fix: pt-32 ensures content is below navbar
    <div className="pt-32 pb-12 px-6 sm:px-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col gap-2 mb-8">
        <h2 className="text-gray-500 font-medium text-lg tracking-wide uppercase">{dateStr}</h2>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            早安，{currentUser?.name || '探索者'}
        </h1>
      </header>

      {/* Main Grid: 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- Top Left: Activity Rings (Span 2) --- */}
        <div className="md:col-span-2 glass-card rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden group hover:bg-white/80 transition-colors duration-500 min-h-[320px]">
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">今日状态</h3>
                    <p className="text-gray-400 text-sm mt-1">积跬步，以至千里</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-full border border-gray-100 group-hover:scale-110 transition-transform">
                    <Activity size={24} className="text-orange-500" />
                </div>
            </div>

            {/* Chart Area */}
            <div className="absolute inset-0 flex items-center justify-center translate-y-4 pointer-events-none">
                <ResponsiveContainer width="100%" height={320}>
                    <RadialBarChart 
                        innerRadius="65%" 
                        outerRadius="100%" 
                        barSize={20} 
                        data={ringData} 
                        startAngle={90} 
                        endAngle={-270}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background={{ fill: '#F3F4F6' }} dataKey="value" cornerRadius={100} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4 z-20">
                    <span className="text-5xl font-bold text-gray-900 tracking-tighter">{stats.avgScore}%</span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">综合效能</span>
                </div>
            </div>

            {/* Bottom Metrics */}
            <div className="flex justify-between mt-auto z-10 px-4">
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF2D55] shadow-[0_0_8px_#FF2D55]"></span>
                    <span className="text-lg font-bold text-gray-800">{stats.totalTime}h</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">专注</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_#007AFF]"></span>
                    <span className="text-lg font-bold text-gray-800">{stats.completed}%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">进度</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_#34C759]"></span>
                    <span className="text-lg font-bold text-gray-800">{stats.xp}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">经验</span>
                 </div>
            </div>
        </div>

        {/* --- Top Right: Calendar & Notes (Span 1) --- */}
        <div className="md:col-span-1 flex flex-col gap-6">
            {/* Calendar Widget */}
            <div 
                onClick={() => onNavigate(Page.SCHEDULE)}
                className="h-40 bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] rounded-[2.5rem] p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                    <Calendar size={24} className="text-white/80" />
                    <span className="text-3xl font-thin tracking-tighter">{today.getDate()}</span>
                </div>
                <div className="z-10 mt-2">
                    <p className="font-semibold text-white text-md truncate">团队代码评审</p>
                    <p className="text-blue-400 text-xs font-medium">14:00 PM</p>
                </div>
            </div>

            {/* NEW: Recent Notes Widget */}
            <div className="flex-1 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[160px]">
                <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={16} className="text-blue-500"/> 学习笔记
                     </span>
                     {recentNotes.length > 0 && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{recentNotes.length}</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {recentNotes.length > 0 ? recentNotes.map((note, idx) => (
                        <div 
                            key={idx}
                            onClick={() => onNavigate(Page.CLASSROOM, note.courseId)}
                            className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{note.courseTitle}</h4>
                                <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-500"/>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                {note.noteSnippet}
                            </p>
                            <div className="mt-2 text-[8px] text-gray-400 font-medium text-right">
                                {note.date}
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <FileText size={14} className="opacity-50"/>
                            </div>
                            <span className="text-xs">暂无笔记</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- Middle Left: Knowledge Graph (Span 2) --- */}
        <div 
            onClick={() => onNavigate(Page.KNOWLEDGE_GRAPH)}
            className="md:col-span-2 h-[340px] relative rounded-[2.5rem] overflow-hidden group border border-gray-800 shadow-2xl bg-[#0f172a] cursor-pointer hover:ring-4 hover:ring-blue-500/20 transition-all"
        >
             {/* Dynamic Knowledge Graph Component */}
             <KnowledgeGraphWidget />
        </div>

        {/* --- Middle Right: Tools Lab (Span 1) --- */}
        <div 
            onClick={() => onNavigate(Page.TOOLS_LAB)}
            className="md:col-span-1 h-[340px] cursor-pointer hover:scale-[1.02] transition-transform"
        >
             <ToolsLabWidget />
        </div>

        {/* --- Bottom: Profile Banner (Span 3) --- */}
         <div 
            onClick={() => onNavigate(Page.PROFILE)}
            className="md:col-span-3 glass-card rounded-[2.5rem] p-8 flex items-center justify-between hover:bg-white transition-colors cursor-pointer group"
         >
            <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/30 flex items-center justify-center text-white text-3xl font-bold transform rotate-3 group-hover:rotate-12 transition-transform">
                    <Trophy size={32} fill="currentColor" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">荣誉成就</h3>
                    <p className="text-sm text-gray-500">查看已获得的证书、徽章以及详细的能力评估报告</p>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                <span>前往成就中心</span>
                <ArrowUpRight size={16} />
            </div>
         </div>

      </div>
    </div>
  );
};

// --- Sub-Component: Knowledge Graph Widget ---
const KnowledgeGraphWidget = () => {
    // Simulated Nodes Data
    const nodes = [
        { id: 1, x: '50%', y: '50%', r: 40, label: 'PMBOK', color: 'bg-blue-500' },
        { id: 2, x: '20%', y: '30%', r: 30, label: 'Risk', color: 'bg-red-500' },
        { id: 3, x: '80%', y: '30%', r: 35, label: 'Agile', color: 'bg-green-500' },
        { id: 4, x: '30%', y: '75%', r: 25, label: 'Cost', color: 'bg-purple-500' },
        { id: 5, x: '70%', y: '70%', r: 28, label: 'Scope', color: 'bg-orange-500' },
        { id: 6, x: '50%', y: '20%', r: 20, label: 'Quality', color: 'bg-teal-500' },
    ];

    return (
        <div className="w-full h-full relative">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
            
            <div className="absolute top-6 left-6 z-10">
                <div className="flex items-center gap-2 text-white/90">
                    <Share2 size={18} />
                    <h3 className="text-lg font-bold">知识图谱</h3>
                </div>
                <p className="text-xs text-gray-400 mt-1">动态关联 · 深度学习</p>
            </div>
            
            <div className="absolute top-6 right-6 z-10">
                <div className="bg-white/10 backdrop-blur px-2 py-1 rounded text-[10px] text-white/70 font-mono border border-white/10">
                    Click to Explore
                </div>
            </div>

            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="30%" y2="75%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="70%" y2="70%" stroke="white" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="50%" y2="20%" stroke="white" strokeWidth="1" />
                <line x1="20%" y1="30%" x2="50%" y2="20%" stroke="white" strokeWidth="1" />
                <line x1="80%" y1="30%" x2="70%" y2="70%" stroke="white" strokeWidth="1" />
            </svg>

            {/* Floating Nodes */}
            {nodes.map((node, i) => (
                <div 
                    key={node.id}
                    className={`absolute flex items-center justify-center rounded-full text-white text-xs font-bold shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-md cursor-pointer hover:scale-125 transition-all duration-300 ${node.color}`}
                    style={{
                        left: node.x,
                        top: node.y,
                        width: node.r * 2,
                        height: node.r * 2,
                        transform: 'translate(-50%, -50%)',
                        animation: `float ${3 + i}s ease-in-out infinite alternate`
                    }}
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                    <span className="relative z-10">{node.label}</span>
                </div>
            ))}

            <div className="absolute bottom-4 right-6 text-[10px] text-gray-500 font-mono">
                ECharts Visualization Engine
            </div>
            
            <style>{`
                @keyframes float {
                    0% { margin-top: 0px; }
                    100% { margin-top: 15px; }
                }
            `}</style>
        </div>
    );
};

// --- Sub-Component: Tools Lab Widget ---
const ToolsLabWidget = () => {
    const tools = [
        { name: '蒙特卡洛', color: 'bg-blue-500', icon: '🎲' },
        { name: '估算扑克', color: 'bg-orange-500', icon: '🃏' },
        { name: 'Kanban', color: 'bg-green-500', icon: '📊' },
    ];

    return (
        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-inner border border-purple-100">
            {/* Header */}
            <div className="h-12 w-full flex items-center justify-center border-b border-purple-100/50 bg-white/50 backdrop-blur-md z-10">
                <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                    <FlaskConical size={12} />
                    工具实验室
                </span>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center relative">
                <div className="space-y-3">
                    {tools.map((tool, idx) => (
                        <div 
                            key={tool.name}
                            className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-purple-100/50"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className={`w-8 h-8 ${tool.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                                {tool.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{tool.name}</span>
                            <ChevronRight size={14} className="ml-auto text-gray-400" />
                        </div>
                    ))}
                </div>
                
                {/* CTA */}
                <div className="mt-4 text-center">
                    <span className="text-xs text-purple-500 font-medium bg-purple-100 px-3 py-1.5 rounded-full">
                        3个工具可用
                    </span>
                </div>
                
                {/* CTA Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/0 group-hover:bg-white/10 transition-colors">
                     <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                         进入实验室
                     </div>
                </div>
            </div>
        </div>
    );
 };

export default Dashboard;
