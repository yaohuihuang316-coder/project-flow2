
import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, Star, BookOpen, ChevronLeft, 
  Activity, Zap, Code, Terminal, Play, FileJson, 
  Network, BarChart3, TrendingUp,
  GitMerge, Layers, Database, Globe, Smartphone, Server, Shield, Loader2,
  Layout, Cpu, Briefcase, Calculator, Users, FileText, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Types ---
type MainCategory = 'Foundation' | 'Advanced' | 'Implementation';
type SubCategory = 'Course' | 'Cert' | 'Official';
type LabCategory = 'Quantitative' | 'Strategic' | 'Toolkit';

interface LearningHubProps {
    onNavigate: (page: Page, id?: string) => void;
    currentUser?: UserProfile | null;
}

// --- Data: 2. 进阶实验室 Tools ---
const LAB_TOOLS = {
    Quantitative: [
        { id: 'evm', name: 'EVM 挣值计算器', desc: '成本/进度绩效综合诊断', icon: BarChart3 },
        { id: 'cpm', name: 'CPM 关键路径', desc: '工期推演与浮动时间计算', icon: Network },
        { id: 'pert', name: 'PERT 三点估算', desc: '加权平均工期评估', icon: Activity },
    ],
    Strategic: [
        { id: 'stakeholder', name: '相关方博弈', desc: '冲突解决与沟通模拟', icon: Users },
        { id: 'risk', name: '风险决策树', desc: 'EMV 预期货币价值分析', icon: GitMerge },
    ],
    Toolkit: [
        { id: 'wbs', name: 'WBS 拆解助手', desc: '结构化工作分解结构生成', icon: Layers },
        { id: 'charter', name: '章程生成器', desc: '项目启动核心文档模板', icon: FileText },
    ]
};

// --- Data: 3. 实战演练 (Projects) ---
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

const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  // Navigation State
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Courses & Progress from Supabase
  useEffect(() => {
    const fetchCoursesAndProgress = async () => {
        if (mainTab !== 'Foundation') return;

        setIsLoading(true);
        setCourses([]); 

        // 1. Fetch Courses
        const { data: coursesData, error: courseError } = await supabase
            .from('app_courses')
            .select('*')
            .eq('category', subTab) 
            .eq('status', 'Published')
            .order('created_at', { ascending: false });

        if (coursesData) {
            let mergedCourses = coursesData;

            // 2. Fetch Progress if user is logged in
            if (currentUser) {
                const { data: progressData } = await supabase
                    .from('app_user_progress')
                    .select('course_id, progress')
                    .eq('user_id', currentUser.id);
                
                if (progressData) {
                    mergedCourses = coursesData.map(c => {
                        const userProg = progressData.find(p => p.course_id === c.id);
                        return {
                            ...c,
                            user_progress: userProg ? userProg.progress : 0
                        };
                    });
                }
            }

            setCourses(mergedCourses.map(c => {
                let chapterCount = 0;
                if (Array.isArray(c.chapters)) chapterCount = c.chapters.length;
                else if (typeof c.chapters === 'string') {
                    try { chapterCount = JSON.parse(c.chapters).length; } catch(e) {}
                }
                return { ...c, chapters: chapterCount };
            }));
        } else {
            console.log("Error loading courses:", courseError);
        }
        setIsLoading(false);
    };

    fetchCoursesAndProgress();
  }, [mainTab, subTab, currentUser]);

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
                    { id: 'Advanced', label: 'PM实验室 (Labs)', icon: Cpu },
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
                     <p>正在加载内容...</p>
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
                                    <PlayCircle size={18} /> 继续学习
                                </button>
                        </div>
                        </div>
                        <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 truncate" title={item.title}>{item.title}</h3>
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-gray-200 block"></span>
                            {item.author}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Clock size={14} /> {item.duration || 'N/A'}</span>
                                <span className="flex items-center gap-1"><BookOpen size={14} /> {item.chapters} 章节</span>
                            </div>
                            {item.user_progress > 0 && (
                                <span className="text-xs font-bold text-blue-600">{item.user_progress}%</span>
                            )}
                        </div>
                        
                        {/* Real Progress Line */}
                        <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{width: `${item.user_progress || 0}%`}}
                                ></div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                     <Database size={32} className="mb-4 opacity-50" />
                     <p className="font-bold">暂无 "{subTab}" 内容</p>
                     <p className="text-xs mt-1">请在数据库中添加 app_courses 数据</p>
                     <p className="text-[10px] text-gray-300 mt-2 font-mono">Category: {subTab}</p>
                 </div>
             )}
           </div>
         )}
         
         {/* --- View 2: Advanced (Interactive PM Labs) --- */}
         {mainTab === 'Advanced' && !selectedItem && (
            <AdvancedLabView />
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
                  
                  {selectedItem.type === 'ide' && <IdeView title={selectedItem.title} />}
             </div>
         )}
      </div>
    </div>
  );
};

// --- Refactored: Advanced Lab View ---
const AdvancedLabView = () => {
    const [labCategory, setLabCategory] = useState<LabCategory>('Quantitative');
    const [currentToolId, setCurrentToolId] = useState('evm');

    return (
        <div className="flex flex-col lg:flex-row min-h-[700px] gap-6 animate-fade-in pb-10">
            {/* Left: Tool Navigator */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                
                {/* Category Switcher */}
                <div className="bg-gray-100 p-1.5 rounded-2xl flex">
                    {[
                        { id: 'Quantitative', icon: Calculator },
                        { id: 'Strategic', icon: Users },
                        { id: 'Toolkit', icon: FileText },
                    ].map(cat => (
                         <button
                            key={cat.id}
                            onClick={() => {
                                setLabCategory(cat.id as LabCategory);
                                setCurrentToolId(LAB_TOOLS[cat.id as LabCategory][0].id);
                            }}
                            className={`flex-1 py-2 rounded-xl flex items-center justify-center transition-all ${
                                labCategory === cat.id ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <cat.icon size={18} />
                        </button>
                    ))}
                </div>

                {/* Tool List */}
                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col flex-1">
                    <div className="px-4 py-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                            {labCategory === 'Quantitative' ? '量化模型' : labCategory === 'Strategic' ? '决策沙盘' : '文档工坊'}
                        </h3>
                        <p className="text-xs text-gray-400">Select a tool to start</p>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {LAB_TOOLS[labCategory].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setCurrentToolId(tool.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-start gap-3 ${
                                    currentToolId === tool.id 
                                    ? 'bg-black text-white shadow-lg scale-[1.02]' 
                                    : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <tool.icon size={20} className={`shrink-0 ${currentToolId === tool.id ? 'text-blue-400' : 'text-gray-400'}`} />
                                <div>
                                    <div className="font-bold text-sm leading-tight">{tool.name}</div>
                                    <div className={`text-[10px] mt-1 leading-tight ${currentToolId === tool.id ? 'text-gray-400' : 'text-gray-400'}`}>{tool.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Interactive Workspace */}
            <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                {currentToolId === 'evm' ? (
                    <EvmCalculator />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <Cpu size={48} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-gray-500">
                            {LAB_TOOLS[labCategory].find(t => t.id === currentToolId)?.name}
                        </h3>
                        <p className="text-sm">该模块正在开发中...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- EVM Calculator Component ---
const EvmCalculator = () => {
    const [inputs, setInputs] = useState({
        pv: 1000, // Planned Value
        ev: 850,  // Earned Value
        ac: 920,  // Actual Cost
        bac: 5000 // Budget at Completion
    });

    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        // Calculate EVM metrics
        const sv = inputs.ev - inputs.pv;
        const cv = inputs.ev - inputs.ac;
        const spi = inputs.pv === 0 ? 0 : Number((inputs.ev / inputs.pv).toFixed(2));
        const cpi = inputs.ac === 0 ? 0 : Number((inputs.ev / inputs.ac).toFixed(2));
        
        // Predictions
        const eac = cpi === 0 ? 0 : Math.round(inputs.bac / cpi); // Estimate at Completion
        const etc = eac - inputs.ac; // Estimate to Complete
        const vac = inputs.bac - eac; // Variance at Completion

        setResults({ sv, cv, spi, cpi, eac, etc, vac });
    }, [inputs]);

    const getStatusColor = (val: number, type: 'idx' | 'var') => {
        if (type === 'idx') return val >= 1 ? 'text-green-600' : 'text-red-500';
        return val >= 0 ? 'text-green-600' : 'text-red-500';
    };

    const getStatusBadge = (idx: number) => {
        if (idx >= 1) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Healthy</span>;
        if (idx >= 0.8) return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold">Warning</span>;
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Critical</span>;
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-blue-600"/> 挣值管理 (EVM)
                    </h2>
                    <p className="text-xs text-gray-500">输入项目当前快照数据，自动生成绩效诊断。</p>
                </div>
                <button 
                    onClick={() => setInputs({ pv: 1000, ev: 850, ac: 920, bac: 5000 })}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
                    title="Reset Defaults"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Left: Input Panel */}
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-3xl border border-gray-100 h-fit">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Terminal size={14}/> 输入参数 (Input)
                    </h3>
                    <div className="space-y-4">
                        {[
                            { id: 'pv', label: '计划价值 (PV)', desc: '计划完成工作的预算价值' },
                            { id: 'ev', label: '挣值 (EV)', desc: '实际完成工作的预算价值' },
                            { id: 'ac', label: '实际成本 (AC)', desc: '已完成工作的实际花费' },
                            { id: 'bac', label: '完工预算 (BAC)', desc: '项目总预算' },
                        ].map(field => (
                            <div key={field.id}>
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-bold text-gray-600">{field.label}</label>
                                    <span className="text-[10px] text-gray-400 cursor-help" title={field.desc}>?</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input 
                                        type="number"
                                        value={(inputs as any)[field.id]}
                                        onChange={e => setInputs({...inputs, [field.id]: Number(e.target.value)})}
                                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Top KPIs */}
                    <div className="grid grid-cols-2 gap-4">
                         {/* SPI Card */}
                         <div className="bg-white border border-gray-100 shadow-lg shadow-blue-500/5 rounded-2xl p-5 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Activity size={60} />
                             </div>
                             <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs text-gray-500 font-bold uppercase">进度绩效 (SPI)</span>
                                 {getStatusBadge(results?.spi)}
                             </div>
                             <div className={`text-4xl font-bold ${getStatusColor(results?.spi, 'idx')}`}>
                                 {results?.spi}
                             </div>
                             <p className="text-xs text-gray-400 mt-2">
                                 {results?.spi >= 1 ? '项目进度提前' : '项目进度滞后'}
                             </p>
                             {/* Progress Bar */}
                             <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                 <div className={`h-full rounded-full transition-all duration-700 ${results?.spi >= 1 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${Math.min(results?.spi * 100, 100)}%`}}></div>
                             </div>
                         </div>

                         {/* CPI Card */}
                         <div className="bg-white border border-gray-100 shadow-lg shadow-purple-500/5 rounded-2xl p-5 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Database size={60} />
                             </div>
                             <div className="flex justify-between items-start mb-2">
                                 <span className="text-xs text-gray-500 font-bold uppercase">成本绩效 (CPI)</span>
                                 {getStatusBadge(results?.cpi)}
                             </div>
                             <div className={`text-4xl font-bold ${getStatusColor(results?.cpi, 'idx')}`}>
                                 {results?.cpi}
                             </div>
                             <p className="text-xs text-gray-400 mt-2">
                                 {results?.cpi >= 1 ? '成本低于预算 (节约)' : '成本超出预算 (超支)'}
                             </p>
                             {/* Progress Bar */}
                             <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                 <div className={`h-full rounded-full transition-all duration-700 ${results?.cpi >= 1 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${Math.min(results?.cpi * 100, 100)}%`}}></div>
                             </div>
                         </div>
                    </div>

                    {/* Variances Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block">进度偏差 (SV)</span>
                                <span className={`text-lg font-bold ${getStatusColor(results?.sv, 'var')}`}>
                                    {results?.sv > 0 ? '+' : ''}{results?.sv}
                                </span>
                            </div>
                            <div className={`p-2 rounded-full ${results?.sv >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                {results?.sv >= 0 ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block">成本偏差 (CV)</span>
                                <span className={`text-lg font-bold ${getStatusColor(results?.cv, 'var')}`}>
                                    {results?.cv > 0 ? '+' : ''}{results?.cv}
                                </span>
                            </div>
                            <div className={`p-2 rounded-full ${results?.cv >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                {results?.cv >= 0 ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
                            </div>
                        </div>
                    </div>

                    {/* Predictions Area */}
                    <div className="bg-black text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">预测 (Forecast)</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                基于当前的绩效指标 CPI {results?.cpi}，项目预计完工时的总成本将达到：
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div className="text-right">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">完工估算 (EAC)</span>
                                <span className="text-2xl font-mono font-bold text-blue-400">${results?.eac.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">完工偏差 (VAC)</span>
                                <span className={`text-2xl font-mono font-bold ${results?.vac >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {results?.vac > 0 ? '+' : ''}{results?.vac.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const IdeView = ({ title }: { title: string }) => {
    return (
        <div className="bg-[#1e1e1e] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[700px] text-gray-300 font-mono animate-fade-in-up">
            <div className="h-12 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black">
                <span className="text-sm opacity-60">ProjectFlow IDE - {title}</span>
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    <Play size={12} fill="currentColor"/> Run Build
                </button>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-6 overflow-auto">
                <div className="text-green-400 mb-2">➜  ~ project-init {title}</div>
                <div className="text-gray-500">Initializing environment...</div>
                <div className="text-gray-500">Loading dependencies...</div>
                <div className="text-blue-400 mt-2">✔ Environment Ready.</div>
                <div className="mt-4 opacity-50 text-sm">
                    // Editor placeholder...
                </div>
            </div>
        </div>
    );
};

export default LearningHub;
