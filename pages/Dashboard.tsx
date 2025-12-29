import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Play, Calendar, Trophy, ArrowUpRight, Clock, Activity, Share2, MessageCircle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Page } from '../types';

interface DashboardProps {
  onNavigate: (page: Page, id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Mock Data for Activity Rings
  const ringData = [
    { name: 'Score', value: 85, fill: '#34C759' },    // Green
    { name: 'Progress', value: 65, fill: '#007AFF' }, // Blue
    { name: 'Time', value: 50, fill: '#FF2D55' },    // Red
  ];

  return (
    // Layout Fix: pt-32 ensures content is below navbar
    <div className="pt-32 pb-12 px-6 sm:px-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col gap-2 mb-8">
        <h2 className="text-gray-500 font-medium text-lg tracking-wide uppercase">甲辰年 十月廿四 · 霜降</h2>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">早安，探索者</h1>
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
                    <span className="text-5xl font-bold text-gray-900 tracking-tighter">85%</span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">综合效能</span>
                </div>
            </div>

            {/* Bottom Metrics */}
            <div className="flex justify-between mt-auto z-10 px-4">
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF2D55] shadow-[0_0_8px_#FF2D55]"></span>
                    <span className="text-lg font-bold text-gray-800">2.5h</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">专注</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_#007AFF]"></span>
                    <span className="text-lg font-bold text-gray-800">65%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">进度</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_#34C759]"></span>
                    <span className="text-lg font-bold text-gray-800">920</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">经验</span>
                 </div>
            </div>
        </div>

        {/* --- Top Right: Calendar & Daily Pick (Span 1) --- */}
        <div className="md:col-span-1 flex flex-col gap-6">
            {/* Calendar Widget */}
            <div 
                onClick={() => onNavigate(Page.SCHEDULE)}
                className="flex-1 bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] rounded-[2.5rem] p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex justify-between items-start z-10">
                    <Calendar size={24} className="text-white/80" />
                    <span className="text-3xl font-thin tracking-tighter">24</span>
                </div>
                <div className="z-10 mt-4">
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">NEXT EVENT</p>
                    <p className="font-semibold text-white mt-1 text-md truncate">团队代码评审</p>
                    <p className="text-blue-400 text-xs font-medium">14:00 PM</p>
                </div>
            </div>

            {/* Daily Pick Widget */}
            <div 
                onClick={() => onNavigate(Page.SIMULATION)}
                className="h-32 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">实战挑战</span>
                    <ArrowUpRight size={18} className="text-gray-400 group-hover:text-black transition-colors"/>
                </div>
                <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">Sprint 4: 支付集成</h4>
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

        {/* --- Middle Right: Scenario Simulation (Span 1) --- */}
        <div 
            onClick={() => onNavigate(Page.SIMULATION)}
            className="md:col-span-1 h-[340px] cursor-pointer hover:scale-[1.02] transition-transform"
        >
             <ScenarioWidget />
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
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">12 项证书</h3>
                    <p className="text-sm text-gray-500">已获得 PMP, ACP, 及高级架构师认证</p>
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

// --- Sub-Component: Scenario Simulation Widget ---
const ScenarioWidget = () => {
    return (
        <div className="w-full h-full bg-[#f2f2f7] rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-inner border border-white/50">
            {/* Header / Notch Area */}
            <div className="h-12 w-full flex items-center justify-center border-b border-gray-200/50 bg-white/50 backdrop-blur-md z-10">
                <span className="text-xs font-semibold text-gray-500">职场急救 (Scenario)</span>
            </div>

            <div className="flex-1 p-5 flex flex-col items-center justify-center relative">
                <div className="w-full space-y-4">
                    {/* Boss Message Bubble */}
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 relative ml-2 group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute -top-3 -left-2 bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold">BOSS</div>
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                            🚨 紧急：客户刚改了需求，但下周一必须上线！项目要延期了，怎么办？
                        </p>
                    </div>
                    
                    {/* Fake Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4 opacity-80 pointer-events-none">
                        <button className="bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-xs font-bold shadow-sm">
                            申请全员加班
                        </button>
                        <button className="bg-black text-white py-3 rounded-xl text-xs font-bold shadow-lg">
                            协商削减范围
                        </button>
                    </div>
                </div>
                
                {/* CTA Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/0 group-hover:bg-white/10 transition-colors">
                     <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                         开始挑战
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;