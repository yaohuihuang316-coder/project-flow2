import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, Star, BookOpen, ChevronLeft, 
  Activity, Zap, Code, Terminal, Play, FileJson, 
  Network, BarChart3, TrendingUp,
  PieChart, GitMerge, Layers, Database, Globe, Smartphone, Server, Shield, Loader2,
  Layout, Cpu, Briefcase
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Legend, Cell,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { Page } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Types ---
// Main Categories: Foundation (Basic), Advanced (Labs), Implementation (Projects)
type MainCategory = 'Foundation' | 'Advanced' | 'Implementation';
// Sub Categories for Foundation
type SubCategory = 'Course' | 'Cert' | 'Official';

interface LearningHubProps {
    onNavigate: (page: Page, id?: string) => void;
}

// --- Data: 2. 进阶实验室 (Keep Static for UI Demo) ---
const ALGORITHMS = [
    { id: 'cpm', name: '关键路径法 (CPM)', desc: '识别最长任务序列，确定最短工期', icon: Network },
    { id: 'evm', name: '挣值管理 (EVM)', desc: '综合测量范围、进度、成本绩效', icon: BarChart3 },
    { id: 'monte', name: '蒙特卡洛模拟', desc: '随机抽样评估风险概率分布', icon: TrendingUp },
    { id: 'pert', name: 'PERT 估算技术', desc: '三点估算法(悲观/乐观/最可能)', icon: Activity },
    { id: 'leveling', name: '资源平衡 (Leveling)', desc: '解决资源过度分配，优化利用率', icon: Layers },
    { id: 'crashing', name: '赶工 (Crashing)', desc: '增加资源以最小成本压缩进度', icon: Zap },
    { id: 'pareto', name: '帕累托图 (80/20)', desc: '识别造成大多数问题的少数原因', icon: PieChart },
    { id: 'fishbone', name: '因果图 (鱼骨图)', desc: '根本原因分析 (RCA) 工具', icon: GitMerge },
    { id: 'emv', name: '预期货币价值 (EMV)', desc: '决策树分析中的风险量化', icon: Database },
    { id: 'burn', name: '燃尽图 (Burndown)', desc: '敏捷开发中剩余工作量可视化', icon: TrendingUp },
];

// --- Data: 3. 实战演练 (Keep Static for UI Demo) ---
const PROJECTS = [
    { id: 'p1', title: '企业级 ERP 重构', tech: ['Java', 'Spring Cloud', 'Docker'], desc: '遗留单体系统微服务化拆分与容器化部署。', color: 'from-blue-500 to-indigo-600', icon: Server },
    { id: 'p2', title: '跨境电商中台', tech: ['Vue 3', 'Node.js', 'Redis'], desc: '高并发秒杀系统设计与库存一致性解决方案。', color: 'from-orange-400 to-red-500', icon: Globe },
    { id: 'p3', title: '智能 CRM 系统', tech: ['Python', 'React', 'AI'], desc: '集成客户画像分析与自动化销售漏斗管理。', color: 'from-purple-500 to-pink-500', icon: Database },
    { id: 'p4', title: '物联网监控平台', tech: ['Go', 'MQTT', 'InfluxDB'], desc: '百万级设备接入与实时数据可视化大屏。', color: 'from-cyan-400 to-blue-500', icon: Zap },
    { id: 'p5', title: '低代码开发引擎', tech: ['TypeScript', 'AST', 'Render'], desc: '可视化拖拽生成企业级 CRUD 后台系统。', color: 'from-emerald-400 to-green-600', icon: Code },
    { id: 'p6', title: '区块链供应链溯源', tech: ['Solidity', 'Web3', 'Next.js'], desc: '基于智能合约的物流透明化与防伪追踪。', color: 'from-slate-600 to-slate-800', icon: Layers },
    { id: 'p7', title: '金融风控中台', tech: ['Scala', 'Spark', 'Kafka'], desc: '实时反欺诈交易流处理与规则引擎。', color: 'from-red-500 to-rose-600', icon: Shield },
    { id: 'p8', title: '移动端协作 App', tech: ['Flutter', 'Dart', 'Firebase'], desc: '跨平台即时通讯与任务管理应用实战。', color: 'from-indigo-400 to-purple-500', icon: Smartphone },
    { id: 'p9', title: 'DevOps 自动化平台', tech: ['K8s', 'Jenkins', 'Ansible'], desc: 'CI/CD 流水线搭建与多环境自动发布。', color: 'from-blue-600 to-cyan-600', icon: Terminal },
    { id: 'p10', title: 'AI 知识库问答', tech: ['LangChain', 'OpenAI', 'VectorDB'], desc: '基于 RAG 架构的企业私有数据问答助手。', color: 'from-teal-400 to-emerald-500', icon: FileJson },
];

const LearningHub: React.FC<LearningHubProps> = ({ onNavigate }) => {
  // Navigation State
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Courses from Supabase dynamically
  // Trigger when mainTab is Foundation (and subTab changes) 
  useEffect(() => {
    const fetchCourses = async () => {
        if (mainTab !== 'Foundation') return;

        setIsLoading(true);
        const { data, error } = await supabase
            .from('app_courses')
            .select('*')
            .eq('category', subTab) // Use subTab to filter DB categories (Course, Cert, Official)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCourses(data.map(c => {
                let chapterCount = 0;
                if (Array.isArray(c.chapters)) chapterCount = c.chapters.length;
                else if (typeof c.chapters === 'string') {
                    try { chapterCount = JSON.parse(c.chapters).length; } catch(e) {}
                }
                return { ...c, chapters: chapterCount };
            }));
        } else {
            console.error(error);
            setCourses([]);
        }
        setIsLoading(false);
    };

    fetchCourses();
  }, [mainTab, subTab]);

  // Reset detail view when tab changes
  useEffect(() => {
    setSelectedItem(null);
  }, [mainTab, subTab]);

  return (
    <div className="pt-28 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen">
      {/* Header & Tabs */}
      <div className={`flex flex-col gap-6 mb-10 transition-all duration-500 ${selectedItem ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">学海无涯</h1>
                <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">书山有路勤为径</p>
            </div>

            {/* Level 1 Tabs (Main Categories) */}
            <div className="bg-gray-200/50 p-1.5 rounded-full flex relative backdrop-blur-md shadow-inner">
                {[
                    { id: 'Foundation', label: '基础 (Foundation)', icon: Layout },
                    { id: 'Advanced', label: '进阶 (Advanced)', icon: Cpu },
                    { id: 'Implementation', label: '实战 (Projects)', icon: Briefcase }
                ].map((tab) => (
                    <button
                    key={tab.id}
                    onClick={() => setMainTab(tab.id as MainCategory)}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
                        mainTab === tab.id
                        ? 'bg-white text-black shadow-md scale-100'
                        : 'text-gray-500 hover:text-gray-800 scale-95'
                    }`}
                    >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Level 2 Tabs (Only for Foundation) */}
        {mainTab === 'Foundation' && (
            <div className="flex gap-4 animate-fade-in pl-1">
                {[
                    { id: 'Course', label: '体系课程' },
                    { id: 'Cert', label: '认证冲刺' },
                    { id: 'Official', label: '官方必修' }
                ].map((sub) => (
                    <button
                        key={sub.id}
                        onClick={() => setSubTab(sub.id as SubCategory)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            subTab === sub.id 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="animate-fade-in-up">
         
         {/* --- View 1: Foundation (Course List) --- */}
         {mainTab === 'Foundation' && !selectedItem && (
           <div className="min-h-[300px]">
             {isLoading ? (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                     <Loader2 size={32} className="animate-spin mb-4" />
                     <p>Loading Content...</p>
                 </div>
             ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                    {courses.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => onNavigate(Page.CLASSROOM, item.id)}
                        className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border border-gray-100/50"
                    >
                        <div className="aspect-[4/3] overflow-hidden relative">
                        <img 
                            src={item.image || `https://source.unsplash.com/random/800x600?tech,${item.id}`} 
                            alt={item.title} 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 text-white text-xs font-bold shadow-lg">
                            <Star size={12} fill="white" />
                            <span>{item.rating || '4.8'}</span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                <button className="w-full bg-white/90 backdrop-blur text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
                                    <PlayCircle size={18} /> 开始学习
                                </button>
                        </div>
                        </div>
                        <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 truncate" title={item.title}>{item.title}</h3>
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-gray-200 block"></span>
                            {item.author}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Clock size={14} /> {item.duration || '2h 15m'}</span>
                            <span className="flex items-center gap-1"><BookOpen size={14} /> {item.chapters} 章节</span>
                        </div>
                        {/* Progress Line */}
                        <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.random() * 100}%`}}></div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                     <Database size={32} className="mb-4 opacity-50" />
                     <p className="font-bold">暂无 "{subTab}" 类别的内容</p>
                     <p className="text-xs mt-1">请前往管理后台 (Admin) 添加此类别的课程</p>
                 </div>
             )}
           </div>
         )}
         
         {/* --- View 2: Advanced (Labs) --- */}
         {mainTab === 'Advanced' && !selectedItem && (
            <AdvancedAlgorithmLab />
         )}

         {/* --- View 3: Implementation (Projects) --- */}
         {mainTab === 'Implementation' && !selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                {PROJECTS.map(project => (
                  <div 
                      key={project.id}
                      onClick={() => setSelectedItem({ type: 'ide', id: project.id, title: project.title })}
                      className="group bg-[#1e1e1e] p-0 rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-800 flex flex-col h-[280px]"
                  >
                      <div className="h-10 bg-[#2d2d2d] flex items-center gap-2 px-6 border-b border-black/50 shrink-0">
                          <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500"/>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                              <div className="w-3 h-3 rounded-full bg-green-500"/>
                          </div>
                      </div>
                      <div className="p-8 flex flex-col justify-between flex-1 relative overflow-hidden">
                          <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br ${project.color} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                          
                          <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.tech.map(t => (
                                  <span key={t} className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-1 rounded border border-white/5">{t}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${project.color} text-white`}>
                                   <project.icon size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{project.title}</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{project.desc}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs font-mono text-green-400 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Terminal size={12} />
                              <span>Click to deploy...</span>
                          </div>
                      </div>
                  </div>
                ))}
            </div>
         )}

         {/* --- Detail Views (If selected) --- */}
         {selectedItem && (
             <div className="animate-fade-in">
                 <button 
                    onClick={() => setSelectedItem(null)}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition-colors group font-medium"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChevronLeft size={18} />
                    </div>
                    <span>返回列表</span>
                  </button>
                  
                  {selectedItem.type === 'ide' && <IdeView id={selectedItem.id} title={selectedItem.title} />}
             </div>
         )}
      </div>
    </div>
  );
};

// --- Advanced Algorithm Lab Component ---
const AdvancedAlgorithmLab = () => {
    const [currentAlgoId, setCurrentAlgoId] = useState('cpm');
    const [isCalculating, setIsCalculating] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Mock Data Sets (Visualizations) - Kept static for demo purposes as they are UI specific
    const evmData = [
        { month: 'Jan', pv: 100, ev: 100, ac: 90 },
        { month: 'Feb', pv: 200, ev: 180, ac: 180 },
        { month: 'Mar', pv: 300, ev: 250, ac: 280 },
        { month: 'Apr', pv: 400, ev: 320, ac: 380 },
        { month: 'May', pv: 500, ev: 450, ac: 500 },
    ];
    
    const paretoData = [
        { name: 'Docs', count: 80, cum: 40 },
        { name: 'Reqs', count: 50, cum: 65 },
        { name: 'Tests', count: 30, cum: 80 },
        { name: 'Code', count: 20, cum: 90 },
        { name: 'Design', count: 10, cum: 100 },
    ];

    const burnDownData = [
        { day: 'Day 1', ideal: 100, actual: 100 },
        { day: 'Day 2', ideal: 80, actual: 85 },
        { day: 'Day 3', ideal: 60, actual: 55 },
        { day: 'Day 4', ideal: 40, actual: 30 },
        { day: 'Day 5', ideal: 20, actual: 20 },
        { day: 'Day 6', ideal: 0, actual: 5 },
    ];

    const levelingData = [
        { day: 'Mon', usage: 120 },
        { day: 'Tue', usage: 90 },
        { day: 'Wed', usage: 160 }, // Overload
        { day: 'Thu', usage: 80 },
        { day: 'Fri', usage: 100 },
    ];

    const crashingData = [
        { time: 10, cost: 5000 },
        { time: 8, cost: 7000 },
        { time: 6, cost: 10000 }, // Crashed
        { time: 5, cost: 15000 },
    ];

    const executeCalculation = () => {
        setIsCalculating(true);
        setResult(null);
        setTimeout(() => {
            setIsCalculating(false);
            setResult({
                cpm: { duration: 45, path: 'Start -> B -> C -> End' },
                evm: { cpi: 0.9, spi: 0.85, status: 'Behind Schedule' },
                monte: { confidence: '85%', risk: 'Medium' },
                generic: { output: 'Optimization Complete', metric: '98.5%' }
            });
        }, 800);
    };

    const currentAlgo = ALGORITHMS.find(a => a.id === currentAlgoId);

    // Dynamic Visualization Rendering
    const renderVisualization = () => {
        switch(currentAlgoId) {
            case 'cpm':
            case 'pert': // Network Diagrams
                return (
                     <div className="relative w-[500px] h-[300px] mx-auto select-none">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            <line x1="50" y1="150" x2="200" y2="50" stroke="#cbd5e1" strokeWidth="4" />
                            <line x1="50" y1="150" x2="200" y2="250" stroke={result ? "#ef4444" : "#cbd5e1"} strokeWidth="4" className="transition-colors duration-1000" />
                            <line x1="200" y1="50" x2="450" y2="150" stroke="#cbd5e1" strokeWidth="4" />
                            <line x1="200" y1="250" x2="325" y2="150" stroke={result ? "#ef4444" : "#cbd5e1"} strokeWidth="4" className="transition-colors duration-1000 delay-300" />
                            <line x1="325" y1="150" x2="450" y2="150" stroke={result ? "#ef4444" : "#cbd5e1"} strokeWidth="4" className="transition-colors duration-1000 delay-500" />
                        </svg>
                        <div className="absolute left-[20px] top-[120px] w-14 h-14 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center font-bold shadow-sm z-10">Start</div>
                        <div className="absolute left-[170px] top-[20px] w-14 h-14 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center font-bold shadow-sm z-10">A (5)</div>
                        <div className={`absolute left-[170px] top-[220px] w-14 h-14 bg-white border-2 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors duration-500 ${result ? 'border-red-500 text-red-500 bg-red-50' : 'border-slate-300'}`}>B (7)</div>
                        <div className={`absolute left-[295px] top-[120px] w-14 h-14 bg-white border-2 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors duration-500 delay-300 ${result ? 'border-red-500 text-red-500 bg-red-50' : 'border-slate-300'}`}>C (3)</div>
                        <div className={`absolute right-[20px] top-[120px] w-14 h-14 bg-white border-2 rounded-full flex items-center justify-center font-bold shadow-sm z-10 transition-colors duration-500 delay-500 ${result ? 'border-green-500 text-green-600 bg-green-50' : 'border-slate-300'}`}>End</div>
                    </div>
                );
            case 'evm':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evmData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="pv" name="Planned Value (PV)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5"/>
                            <Line type="monotone" dataKey="ev" name="Earned Value (EV)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="ac" name="Actual Cost (AC)" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'burn':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burnDownData}>
                            <defs>
                                <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#94a3b8"/>
                            <YAxis stroke="#94a3b8"/>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="ideal" stroke="#94a3b8" fillOpacity={1} fill="url(#colorIdeal)" />
                            <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'leveling':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={levelingData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Legend />
                            {/* Reference Line for Max Capacity */}
                            <Bar dataKey="usage" fill="#8884d8" name="Resource Usage">
                                {levelingData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.usage > 100 ? '#ef4444' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'crashing':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="time" name="Time (Days)" stroke="#94a3b8" domain={[0, 12]}/>
                            <YAxis type="number" dataKey="cost" name="Cost ($)" stroke="#94a3b8" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Cost-Time Tradeoff" data={crashingData} fill="#8884d8">
                                <Cell fill="#3b82f6" />
                                <Cell fill="#3b82f6" />
                                <Cell fill="#ef4444" /> {/* Selected */}
                                <Cell fill="#3b82f6" />
                            </Scatter>
                            <Line dataKey="cost" data={crashingData} stroke="#cbd5e1" dot={false} activeDot={false} legendType="none" />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case 'pareto':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paretoData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 10}} />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" unit="%" />
                            <Tooltip />
                            <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Frequency" />
                            <Line yAxisId="right" type="monotone" dataKey="cum" stroke="#f59e0b" strokeWidth={2} name="Cumulative %" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'fishbone':
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 600 300" className="w-full h-full text-slate-400">
                             {/* Spine */}
                             <line x1="50" y1="150" x2="550" y2="150" stroke="currentColor" strokeWidth="4" markerEnd="url(#arrow)" />
                             {/* Head */}
                             <rect x="550" y="120" width="100" height="60" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
                             <text x="600" y="155" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">DEFECT</text>
                             {/* Ribs Top */}
                             <line x1="150" y1="150" x2="100" y2="50" stroke="currentColor" strokeWidth="2" />
                             <text x="100" y="40" textAnchor="middle" fill="#3b82f6" fontWeight="bold">People</text>
                             <line x1="300" y1="150" x2="250" y2="50" stroke="currentColor" strokeWidth="2" />
                             <text x="250" y="40" textAnchor="middle" fill="#3b82f6" fontWeight="bold">Process</text>
                             <line x1="450" y1="150" x2="400" y2="50" stroke="currentColor" strokeWidth="2" />
                             <text x="400" y="40" textAnchor="middle" fill="#3b82f6" fontWeight="bold">Equipment</text>
                             {/* Ribs Bottom */}
                             <line x1="150" y1="150" x2="100" y2="250" stroke="currentColor" strokeWidth="2" />
                             <text x="100" y="270" textAnchor="middle" fill="#3b82f6" fontWeight="bold">Material</text>
                             <line x1="300" y1="150" x2="250" y2="250" stroke="currentColor" strokeWidth="2" />
                             <text x="250" y="270" textAnchor="middle" fill="#3b82f6" fontWeight="bold">Env</text>
                             <line x1="450" y1="150" x2="400" y2="250" stroke="currentColor" strokeWidth="2" />
                             <text x="400" y="270" textAnchor="middle" fill="#3b82f6" fontWeight="bold">Mgmt</text>
                             
                             <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                  <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
                                </marker>
                             </defs>
                        </svg>
                    </div>
                );
            case 'emv':
                return (
                     <div className="w-full h-full flex items-center justify-center">
                         <svg viewBox="0 0 600 300" className="w-full h-full">
                            {/* Decision Node */}
                            <rect x="50" y="130" width="40" height="40" fill="#3b82f6" />
                            {/* Branches */}
                            <line x1="90" y1="150" x2="200" y2="80" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="90" y1="150" x2="200" y2="220" stroke="#94a3b8" strokeWidth="2" />
                            {/* Chance Nodes */}
                            <circle cx="200" cy="80" r="20" fill="#f59e0b" />
                            <circle cx="200" cy="220" r="20" fill="#f59e0b" />
                            
                            {/* Option A Labels */}
                            <text x="140" y="100" fontSize="12" fill="#64748b">Option A</text>
                            <text x="250" y="60" fontSize="12" fill="#64748b">Success (60%)</text>
                            <text x="250" y="100" fontSize="12" fill="#64748b">Fail (40%)</text>
                            <text x="350" y="60" fontSize="12" fill="#10b981" fontWeight="bold">+$50k</text>
                            <text x="350" y="100" fontSize="12" fill="#ef4444" fontWeight="bold">-$10k</text>

                             {/* Option B Labels */}
                            <text x="140" y="200" fontSize="12" fill="#64748b">Option B</text>
                            <text x="250" y="240" fontSize="12" fill="#64748b">Safe (100%)</text>
                            <text x="350" y="240" fontSize="12" fill="#3b82f6" fontWeight="bold">+$15k</text>
                         </svg>
                     </div>
                );
            case 'monte':
            default:
                const monteData = Array.from({ length: 50 }, () => ({
                    x: Math.floor(Math.random() * 100),
                    y: Math.floor(Math.random() * 100),
                    z: Math.floor(Math.random() * 100),
                }));
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" dataKey="x" name="Impact" unit="%" stroke="#94a3b8" />
                            <YAxis type="number" dataKey="y" name="Probability" stroke="#94a3b8" />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Score" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Scenarios" data={monteData} fill="#8884d8">
                                {monteData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[700px] gap-6 animate-fade-in pb-10">
            {/* Left: Algorithm Library List */}
            <div className="w-full lg:w-80 bg-white rounded-[2rem] p-4 shadow-lg border border-gray-100 flex flex-col">
                <div className="px-4 py-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">算法库 (Algorithm Lib)</h3>
                    <p className="text-xs text-gray-400">Select model to simulate</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {ALGORITHMS.map(algo => (
                        <button
                            key={algo.id}
                            onClick={() => { setCurrentAlgoId(algo.id); setResult(null); }}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-start gap-3 ${
                                currentAlgoId === algo.id 
                                ? 'bg-black text-white shadow-lg scale-[1.02]' 
                                : 'hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <algo.icon size={20} className={`shrink-0 ${currentAlgoId === algo.id ? 'text-blue-400' : 'text-gray-400'}`} />
                            <div>
                                <div className="font-bold text-sm leading-tight">{algo.name}</div>
                                <div className={`text-[10px] mt-1 leading-tight ${currentAlgoId === algo.id ? 'text-gray-400' : 'text-gray-400'}`}>{algo.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Center: Interactive Canvas */}
            <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-blue-600"/>
                        <span className="font-bold text-gray-900">
                            {currentAlgo?.name} 演示画布
                        </span>
                    </div>
                    <button 
                        onClick={executeCalculation}
                        disabled={isCalculating}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md ${
                            isCalculating 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                        }`}
                    >
                        {isCalculating ? <span className="animate-spin">⏳</span> : <Play size={16} fill="currentColor"/>}
                        {isCalculating ? '计算中...' : '执行计算'}
                    </button>
                </div>

                {/* Visualization Area */}
                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-6">
                    <div className="absolute inset-0 opacity-10" 
                        style={{backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px'}}
                    ></div>
                    {renderVisualization()}
                </div>

                {/* Bottom Result Panel */}
                <div className={`mt-4 bg-gray-900 rounded-xl p-6 text-white transition-all duration-500 transform ${result ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">模拟结果分析 (Analysis)</p>
                            <div className="flex gap-6">
                                {currentAlgoId === 'cpm' ? (
                                    <>
                                        <div><span className="text-2xl font-mono font-bold text-green-400">{result?.cpm?.duration || '--'}</span><span className="text-sm text-gray-500 ml-2">Days</span></div>
                                        <div className="text-red-400 font-mono text-sm mt-2">Critical: {result?.cpm?.path}</div>
                                    </>
                                ) : currentAlgoId === 'evm' ? (
                                    <>
                                        <div><span className="text-2xl font-mono font-bold text-blue-400">CPI: {result?.evm?.cpi || '--'}</span></div>
                                        <div><span className="text-2xl font-mono font-bold text-yellow-400">SPI: {result?.evm?.spi || '--'}</span></div>
                                    </>
                                ) : (
                                    <>
                                        <div><span className="text-2xl font-mono font-bold text-purple-400">{result?.monte?.confidence || result?.generic?.metric || '--'}</span><span className="text-sm text-gray-500 ml-2">Score</span></div>
                                        <div className="text-orange-400 font-mono text-sm mt-2">Status: Optimized</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- IDE Component Code Dictionary ---
const CODE_SNIPPETS: Record<string, any> = {
    'p1': {
        lang: 'Java',
        file: 'OrderService.java',
        code: `public class OrderService {
    @Autowired
    private OrderRepository repo;

    @Transactional
    public Order createOrder(OrderRequest req) {
        // Microservice decomposition pattern
        log.info("Creating order for user: " + req.getUserId());
        Order order = new Order(req);
        // Event sourcing publisher
        kafkaTemplate.send("order-events", order);
        return repo.save(order);
    }
}`
    },
    'p2': {
        lang: 'Vue',
        file: 'SeckillButton.vue',
        code: `<template>
  <button @click="handleSeckill" :disabled="loading">
    {{ loading ? 'Queueing...' : 'Buy Now' }}
  </button>
</template>
<script setup>
import { useRedis } from '@/composables/redis'
const handleSeckill = async () => {
    // Optimistic locking via Redis Lua script
    const result = await useRedis.decr('stock_sku_101');
    if(result >= 0) navigateTo('/payment');
}
</script>`
    },
    'p6': {
        lang: 'Solidity',
        file: 'SupplyChain.sol',
        code: `contract SupplyChain {
    struct Product {
        uint id;
        string name;
        address owner;
        bool isVerified;
    }
    mapping(uint => Product) public products;

    function transferOwnership(uint _id, address _newOwner) public {
        require(msg.sender == products[_id].owner);
        products[_id].owner = _newOwner;
        emit Transfer(_id, _newOwner);
    }
}`
    },
    'p3': {
        lang: 'Python',
        file: 'customer_segmentation.py',
        code: `import pandas as pd
from sklearn.cluster import KMeans

def analyze_segments(data):
    # RFM Analysis
    df = preprocess(data)
    kmeans = KMeans(n_clusters=5, random_state=42)
    df['Cluster'] = kmeans.fit_predict(df[['Recency', 'Frequency', 'Monetary']])
    return df.groupby('Cluster').mean()`
    },
    'default': {
        lang: 'TypeScript',
        file: 'main.ts',
        code: `// Initializing ProjectFlow Engine...
function main() {
    console.log("System Ready");
    const app = new Application();
    app.run();
}`
    }
};

// --- IDE Component (Reused) ---
const IdeView = ({ id, title }: { id: string, title: string }) => {
    const snippet = CODE_SNIPPETS[id] || CODE_SNIPPETS['default'];
    
    return (
        <div className="bg-[#1e1e1e] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[700px] text-gray-300 font-mono animate-fade-in-up">
            {/* IDE Toolbar */}
            <div className="h-12 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black">
                <span className="text-sm opacity-60">ProjectFlow IDE - {title}</span>
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    <Play size={12} fill="currentColor"/> Run Build
                </button>
            </div>
            <div className="flex-1 flex">
                <div className="w-64 bg-[#252526] border-r border-black p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2"><Code size={14}/> src</div>
                    <div className="pl-4 text-sm text-gray-400 space-y-2">
                        <div className="hover:text-white cursor-pointer text-white font-bold">{snippet.file}</div>
                        <div className="hover:text-white cursor-pointer">utils.{snippet.lang.toLowerCase()}</div>
                        <div className="flex items-center gap-2 text-yellow-400"><FileJson size={14}/> config.json</div>
                    </div>
                </div>
                <div className="flex-1 bg-[#1e1e1e] p-6 overflow-auto">
                    <pre className="text-sm font-mono leading-relaxed">
                        <code className="language-java">
                            {snippet.code}
                        </code>
                    </pre>
                </div>
            </div>
            <div className="h-32 bg-[#1e1e1e] border-t border-gray-700 p-4">
                 <div className="flex items-center gap-2 text-xs font-bold uppercase mb-2 opacity-50"><Terminal size={12}/> Terminal</div>
                 <p className="text-sm text-gray-400">$ {snippet.lang === 'Java' ? 'mvn clean install' : snippet.lang === 'Python' ? 'python3 main.py' : 'npm run build'}</p>
                 <p className="text-sm text-green-400">BUILD SUCCESS [2.458s]</p>
            </div>
        </div>
    );
};

export default LearningHub;