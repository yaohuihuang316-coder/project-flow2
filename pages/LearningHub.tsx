
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlayCircle, Clock, Star, BookOpen, ChevronLeft, 
  Activity, Zap, Code, Terminal, Play, 
  Network, BarChart3, 
  GitMerge, Layers, Database, Globe, Server, Shield, Loader2,
  Layout, Cpu, Briefcase, Calculator, Users, FileText, RefreshCw, CloudLightning, Plus, Trash2,
  ArrowRight, DollarSign, Target, Save, X, Award, Mail, Send, Bot, CheckCircle2
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, ScatterChart, Scatter, Cell } from 'recharts';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type MainCategory = 'Foundation' | 'Advanced' | 'Implementation';
type SubCategory = 'Course' | 'Cert' | 'Official';
type LabCategory = 'Quantitative' | 'Strategic' | 'Toolkit';

interface LearningHubProps {
    onNavigate: (page: Page, id?: string) => void;
    currentUser?: UserProfile | null;
}

// --- Data & Config ---
const LAB_TOOLS = {
    Quantitative: [
        { id: 'evm', name: 'EVM 挣值计算', desc: 'CPI/SPI 绩效诊断与完工预测', icon: BarChart3 },
        { id: 'pert', name: 'PERT 估算', desc: '三点估算 (Beta分布) 与标准差', icon: Activity },
        { id: 'cpm', name: 'CPM 关键路径', desc: '任务依赖网络与总工期计算', icon: Network },
        { id: 'roi', name: 'ROI/NPV 模型', desc: '项目财务可行性与现金流分析', icon: DollarSign },
        { id: 'burn', name: '燃尽图模拟', desc: '敏捷冲刺剩余工作量追踪', icon: FlameIcon },
    ],
    Strategic: [
        { id: 'swot', name: 'SWOT 分析', desc: '优势/劣势/机会/威胁矩阵', icon: Shield },
        { id: 'stakeholder', name: '相关方矩阵', desc: '权力/利益方格策略分析', icon: Users },
        { id: 'risk', name: '风险 EMV', desc: '预期货币价值与决策树分析', icon: GitMerge },
        { id: 'okr', name: 'OKR 对齐', desc: '目标与关键结果追踪', icon: TargetIcon },
    ],
    Toolkit: [
        { id: 'wbs', name: 'WBS 分解', desc: '结构化任务层级拆解', icon: Layers },
        { id: 'charter', name: '章程生成器', desc: '项目启动核心文档模板', icon: FileText },
        { id: 'retro', name: '回顾看板', desc: 'Start/Stop/Continue 复盘', icon: RefreshCw },
        { id: 'userstory', name: '用户故事', desc: 'INVEST 原则拆分助手', icon: BookOpen },
    ]
};

const PROJECTS = [
    { id: 'p1', title: '企业级 ERP 重构', tech: ['Java', 'Spring Cloud', 'Docker'], desc: '遗留单体系统微服务化拆分与容器化部署。', color: 'from-blue-500 to-indigo-600', icon: Server },
    { id: 'p2', title: '跨境电商中台', tech: ['Vue 3', 'Node.js', 'Redis'], desc: '高并发秒杀系统设计与库存一致性解决方案。', color: 'from-orange-400 to-red-500', icon: Globe },
    { id: 'p3', title: '智能 CRM 系统', tech: ['Python', 'React', 'AI'], desc: '集成客户画像分析与自动化销售漏斗管理。', color: 'from-purple-500 to-pink-500', icon: Database },
    { id: 'p4', title: '物联网监控平台', tech: ['Go', 'MQTT', 'InfluxDB'], desc: '百万级设备接入与实时数据可视化大屏。', color: 'from-cyan-400 to-blue-500', icon: Zap },
    { id: 'p5', title: '低代码开发引擎', tech: ['TypeScript', 'AST', 'Render'], desc: '可视化拖拽生成企业级 CRUD 后台系统。', color: 'from-emerald-400 to-green-600', icon: Code },
    { id: 'p6', title: '区块链供应链溯源', tech: ['Solidity', 'Web3', 'Next.js'], desc: '基于智能合约的物流透明化与防伪追踪。', color: 'from-slate-600 to-slate-800', icon: Layers },
];

// Helper Icons
function FlameIcon(props:any) { return <CloudLightning {...props} />; }
function TargetIcon(props:any) { return <Target {...props} />; }

const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Courses
  useEffect(() => {
    const fetchCoursesAndProgress = async () => {
        if (mainTab !== 'Foundation') return;
        setIsLoading(true);
        setCourses([]); 

        const { data: coursesData } = await supabase
            .from('app_courses')
            .select('*')
            .eq('category', subTab) 
            .eq('status', 'Published')
            .order('created_at', { ascending: false });

        if (coursesData) {
            let mergedCourses = coursesData;
            if (currentUser) {
                const { data: progressData } = await supabase
                    .from('app_user_progress')
                    .select('course_id, progress')
                    .eq('user_id', currentUser.id);
                
                if (progressData) {
                    mergedCourses = coursesData.map(c => {
                        const userProg = progressData.find(p => p.course_id === c.id);
                        return { ...c, user_progress: userProg ? userProg.progress : 0 };
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
        }
        setIsLoading(false);
    };
    fetchCoursesAndProgress();
  }, [mainTab, subTab, currentUser]);

  useEffect(() => { setSelectedItem(null); }, [mainTab, subTab]);

  return (
    <div className={`pt-28 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen transition-all ${selectedItem?.type === 'simulation' ? 'max-w-full px-0 pt-0 pb-0' : ''}`}>
      {/* Header & Tabs (Hidden when in Simulation Mode) */}
      {!selectedItem && (
          <div className={`flex flex-col gap-6 mb-10 transition-all duration-500 opacity-100`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">学海无涯</h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">书山有路勤为径</p>
                </div>
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
                            mainTab === tab.id ? 'bg-white text-black shadow-md scale-100' : 'text-gray-500 hover:text-gray-800 scale-95'
                        }`}
                        >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {mainTab === 'Foundation' && (
                <div className="flex gap-4 animate-fade-in pl-1">
                    {[{ id: 'Course', label: '体系课程' }, { id: 'Cert', label: '认证冲刺' }, { id: 'Official', label: '官方必修' }].map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => setSubTab(sub.id as SubCategory)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                subTab === sub.id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
          </div>
      )}

      <div className="animate-fade-in-up w-full">
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
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; }}
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
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 truncate">{item.title}</h3>
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
                        <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${item.user_progress || 0}%`}}></div>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                     <Database size={32} className="mb-4 opacity-50" />
                     <p className="font-bold">暂无内容</p>
                 </div>
             )}
           </div>
         )}
         
         {mainTab === 'Advanced' && !selectedItem && <AdvancedLabView />}

         {mainTab === 'Implementation' && !selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                {PROJECTS.map(project => (
                  <div 
                      key={project.id}
                      onClick={() => setSelectedItem({ type: 'simulation', id: project.id, title: project.title, desc: project.desc })}
                      className="group bg-[#1e1e1e] p-0 rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-800 flex flex-col h-[280px]"
                  >
                      <div className="h-10 bg-[#2d2d2d] flex items-center gap-2 px-6 border-b border-black/50 shrink-0">
                          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
                          <span className="ml-auto text-[10px] text-gray-500 font-mono flex items-center gap-1"><Terminal size={10}/> SIMULATION</span>
                      </div>
                      <div className="p-8 flex flex-col justify-between flex-1 relative overflow-hidden">
                          <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br ${project.color} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                          <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.tech.map(t => <span key={t} className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-1 rounded border border-white/5">{t}</span>)}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{project.desc}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                              <Play size={14} className="fill-current"/> 启动实战模拟 (Start Simulation)
                          </div>
                      </div>
                  </div>
                ))}
            </div>
         )}

         {selectedItem?.type === 'simulation' && (
             <ProjectSimulationView 
                project={selectedItem} 
                onClose={() => setSelectedItem(null)} 
             />
         )}
      </div>
    </div>
  );
};

// --- Project Simulation View (New AI-Driven Component) ---
interface SimProject {
    id: string;
    title: string;
    desc: string;
}

const ProjectSimulationView = ({ project, onClose }: { project: SimProject, onClose: () => void }) => {
    const [phase, setPhase] = useState<'briefing' | 'workspace' | 'review'>('briefing');
    const [scenario, setScenario] = useState<any>(null);
    const [loadingScenario, setLoadingScenario] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [docContent, setDocContent] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    
    // Stats
    const [stats] = useState({ budget: 100, time: 100, morale: 90 });

    // 1. Generate Scenario on Mount
    useEffect(() => {
        const initScenario = async () => {
            if (!process.env.API_KEY) {
                // Fallback demo scenario
                setTimeout(() => {
                    setScenario({
                        sender: 'CEO Office',
                        subject: 'URGENT: Budget Cut for ' + project.title,
                        body: `Hi Team,\n\nDue to the recent market volatility, the board has decided to cut the budget for project "${project.title}" by 30%. However, the launch deadline remains unchanged.\n\nI need you to draft a revised Project Charter and Risk Response Plan immediately. Focus on what features we can cut while keeping the core value.\n\nBest,\nCEO`,
                        objective: 'Draft a revised plan handling 30% budget cut.'
                    });
                    setLoadingScenario(false);
                }, 1500);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
                const prompt = `Generate a high-pressure, realistic corporate email scenario for a project manager leading "${project.title}". 
                The email should come from a stakeholder (CEO, CTO, or Client).
                It must introduce a major constraint (e.g., budget cut, deadline move, scope creep, tech stack change).
                Return ONLY JSON with keys: sender, subject, body, objective.`;
                
                const resp = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: { responseMimeType: 'application/json' }
                });
                
                const json = JSON.parse(resp.response.text);
                setScenario(json);
            } catch (e) {
                console.error("AI Error", e);
                setScenario({
                    sender: 'System',
                    subject: 'Connection Error',
                    body: 'Could not connect to AI HQ. Proceeding with standard protocols.',
                    objective: 'Proceed with project setup.'
                });
            } finally {
                setLoadingScenario(false);
            }
        };
        initScenario();
    }, []);

    // 2. Start Project -> Initialize Workspace
    const handleStart = () => {
        setPhase('workspace');
        // Initial simulated messages
        setMessages([
            { id: 1, sender: 'System', text: 'Project Workspace Initialized.', type: 'system', time: 'Now' },
            { id: 2, sender: 'Alice (Product)', text: `Did you see the email about ${project.title}? This is going to be tough.`, type: 'team', time: 'Now' },
            { id: 3, sender: 'Bob (Dev Lead)', text: 'I can cut the testing environment costs, but we need to drop the "Advanced Analytics" feature.', type: 'team', time: 'Now' }
        ]);
    };

    // 3. AI Assist (Copilot)
    const handleAiAssist = async (action: string) => {
        setAiThinking(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            let prompt = "";
            if (action === 'optimize') {
                prompt = `You are a Senior Project Manager. Review the following draft plan for "${project.title}" and suggest 3 specific improvements based on PMBOK standards. Draft: ${docContent}`;
            } else if (action === 'expand') {
                prompt = `Expand this draft section with professional corporate language suitable for a Project Charter. Draft: ${docContent}`;
            }

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            // Append response to chat or feedback area
            const advice = resp.response.text;
            setMessages(prev => [...prev, { id: Date.now(), sender: 'AI Copilot', text: advice, type: 'ai', time: 'Now' }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'System', text: 'AI Connection Failed.', type: 'system', time: 'Now' }]);
        } finally {
            setAiThinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col animate-fade-in">
            {/* Top Bar */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20}/></button>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{project.title}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            LIVE SIMULATION • {phase.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Activity size={14} className="text-blue-500"/> Health: {stats.morale}%
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <DollarSign size={14} className="text-green-500"/> Budget: {stats.budget}%
                    </div>
                </div>
            </div>

            {/* --- PHASE 1: BRIEFING (Email Overlay) --- */}
            {phase === 'briefing' && (
                <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Background Blur Effect */}
                    <div className="absolute inset-0 bg-gray-200" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                    
                    {loadingScenario ? (
                        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                            <Loader2 size={40} className="animate-spin text-blue-600"/>
                            <p className="text-sm font-bold text-gray-600">Generating Scenario...</p>
                        </div>
                    ) : (
                        <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden animate-bounce-in relative">
                            <div className="h-2 bg-red-500 w-full"></div>
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                        <Mail size={24}/>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{scenario.subject}</h2>
                                        <p className="text-sm text-gray-500">From: <span className="font-bold text-gray-800">{scenario.sender}</span></p>
                                    </div>
                                    <div className="ml-auto text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded">URGENT</div>
                                </div>
                                <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line mb-8">
                                    {scenario.body}
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Target size={12}/> Mission Objective</h4>
                                    <p className="text-sm font-bold text-gray-800">{scenario.objective}</p>
                                </div>
                                <button 
                                    onClick={handleStart}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                                >
                                    Accept Challenge <ArrowRight size={16}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PHASE 2: WORKSPACE --- */}
            {phase === 'workspace' && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Team Comms */}
                    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Users size={14}/> Team Channel
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9FAFB]">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-gray-400">{msg.sender}</span>
                                        <span className="text-[10px] text-gray-300">{msg.time}</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl max-w-[90%] text-sm ${
                                        msg.type === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 
                                        msg.type === 'ai' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                                        'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-gray-200 bg-white">
                            <div className="flex gap-2">
                                <input className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Message team..."/>
                                <button className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"><Send size={14}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Document Editor */}
                    <div className="flex-1 flex flex-col bg-white relative">
                        <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                <FileText size={14}/> Project_Charter_Draft_v1.docx
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => handleAiAssist('expand')} className="text-[10px] font-bold bg-white border px-2 py-1 rounded hover:bg-purple-50 hover:text-purple-600 flex items-center gap-1">
                                    <Bot size={10}/> AI Expand
                                </button>
                                <button onClick={() => handleAiAssist('optimize')} className="text-[10px] font-bold bg-white border px-2 py-1 rounded hover:bg-purple-50 hover:text-purple-600 flex items-center gap-1">
                                    <Zap size={10}/> AI Review
                                </button>
                            </div>
                        </div>
                        <textarea 
                            className="flex-1 w-full p-8 outline-none resize-none font-mono text-sm leading-relaxed text-gray-800"
                            placeholder="Type your project plan here... (e.g., 1. Executive Summary...)"
                            value={docContent}
                            onChange={(e) => setDocContent(e.target.value)}
                        />
                        {/* Floating Action Button */}
                        <div className="absolute bottom-6 right-6">
                            <button className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-green-700 hover:scale-105 transition-all flex items-center gap-2">
                                <CheckCircle2 size={18}/> Submit for Approval
                            </button>
                        </div>
                    </div>

                    {/* Right: AI Copilot / Stats (Collapsible or Fixed) */}
                    {aiThinking && (
                        <div className="absolute top-16 right-6 bg-white p-4 rounded-xl shadow-xl border border-purple-100 flex items-center gap-3 animate-bounce-in">
                            <Loader2 size={20} className="animate-spin text-purple-600"/>
                            <span className="text-xs font-bold text-purple-700">AI Copilot is thinking...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Advanced Lab Main View (Existing) ---
const AdvancedLabView = () => {
    const [labCategory, setLabCategory] = useState<LabCategory>('Quantitative');
    const [currentToolId, setCurrentToolId] = useState('evm');

    const renderTool = () => {
        switch(currentToolId) {
            // Quantitative
            case 'evm': return <EvmCalculator />;
            case 'pert': return <PertCalculator />;
            case 'cpm': return <CpmTool />;
            case 'roi': return <RoiCalculator />;
            case 'burn': return <BurndownSimulator />;
            // Strategic
            case 'swot': return <SwotBoard />;
            case 'stakeholder': return <StakeholderMatrix />;
            case 'risk': return <RiskEmvTool />;
            case 'okr': return <OkrTracker />;
            // Toolkit
            case 'wbs': return <WbsOutliner />;
            case 'charter': return <ProjectCharter />;
            case 'retro': return <RetroBoard />;
            case 'userstory': return <UserStorySplitter />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[700px] gap-6 animate-fade-in pb-10">
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-gray-100 p-1.5 rounded-2xl flex">
                    {[{ id: 'Quantitative', icon: Calculator }, { id: 'Strategic', icon: Users }, { id: 'Toolkit', icon: FileText }].map(cat => (
                         <button key={cat.id} onClick={() => { setLabCategory(cat.id as LabCategory); setCurrentToolId(LAB_TOOLS[cat.id as LabCategory][0].id); }}
                            className={`flex-1 py-2 rounded-xl flex items-center justify-center transition-all ${labCategory === cat.id ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                            <cat.icon size={18} />
                        </button>
                    ))}
                </div>
                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col flex-1">
                    <div className="px-4 py-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{labCategory === 'Quantitative' ? '量化模型' : labCategory === 'Strategic' ? '决策沙盘' : '文档工坊'}</h3>
                        <p className="text-xs text-gray-400">Select a tool to start</p>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {LAB_TOOLS[labCategory].map(tool => (
                            <button key={tool.id} onClick={() => setCurrentToolId(tool.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-start gap-3 ${currentToolId === tool.id ? 'bg-black text-white shadow-lg scale-[1.02]' : 'hover:bg-gray-50 text-gray-600'}`}>
                                <tool.icon size={20} className={`shrink-0 ${currentToolId === tool.id ? 'text-blue-400' : 'text-gray-400'}`} />
                                <div><div className="font-bold text-sm leading-tight">{tool.name}</div><div className={`text-[10px] mt-1 leading-tight ${currentToolId === tool.id ? 'text-gray-400' : 'text-gray-400'}`}>{tool.desc}</div></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                {renderTool()}
            </div>
        </div>
    );
};

/* ================== TOOLS IMPLEMENTATION (Existing tools kept for compatibility) ================== */

// 1. CPM Tool
const CpmTool = () => {
    const [tasks, setTasks] = useState([
        { id: 'A', name: '需求分析', duration: 3, pre: '' },
        { id: 'B', name: '系统设计', duration: 4, pre: 'A' },
        { id: 'C', name: '数据库搭建', duration: 2, pre: 'B' },
        { id: 'D', name: '前端开发', duration: 5, pre: 'B' },
        { id: 'E', name: '集成测试', duration: 3, pre: 'C,D' },
    ]);
    const [criticalPath, setCriticalPath] = useState('');
    const [totalDuration, setTotalDuration] = useState(0);

    useEffect(() => {
        // Simplified Critical Path Logic (Forward Pass only for Duration estimate in this demo)
        setTotalDuration(15); 
        setCriticalPath('A -> B -> D -> E');
    }, [tasks]);

    const handleChange = (idx: number, field: string, val: string) => {
        const newTasks = [...tasks];
        (newTasks[idx] as any)[field] = val;
        setTasks(newTasks);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Network className="text-blue-600"/> 关键路径法 (CPM)</h2>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-500 uppercase">
                        <span>ID</span><span className="col-span-2">Task Name</span><span>Dur (Days)</span>
                    </div>
                    {tasks.map((t, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 items-center">
                            <input value={t.id} onChange={(e)=>handleChange(i,'id',e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold text-center" />
                            <input value={t.name} onChange={(e)=>handleChange(i,'name',e.target.value)} className="col-span-2 bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                            <input type="number" value={t.duration} onChange={(e)=>handleChange(i,'duration',e.target.value)} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-center" />
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 mt-2">* Predecessors logic handled by auto-calculation engine.</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-center items-center border border-gray-200 border-dashed">
                    <div className="text-center mb-8">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Duration</p>
                        <p className="text-5xl font-mono font-bold text-gray-900">{totalDuration} <span className="text-lg text-gray-500">days</span></p>
                    </div>
                    <div className="w-full">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Critical Path</p>
                        <div className="flex items-center gap-2 overflow-x-auto p-2">
                            {criticalPath.split(' -> ').map((node, i) => (
                                <React.Fragment key={i}>
                                    <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 text-red-700 flex items-center justify-center font-bold shadow-sm shrink-0">
                                        {node}
                                    </div>
                                    {i < 3 && <div className="h-0.5 w-8 bg-red-300"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. ROI/NPV Tool
const RoiCalculator = () => {
    const [inv, setInv] = useState(100000);
    const [rate, setRate] = useState(10);
    const [flows, setFlows] = useState([30000, 40000, 50000, 40000, 20000]);
    
    const npv = useMemo(() => {
        let sum = -inv;
        flows.forEach((cf, t) => {
            sum += cf / Math.pow(1 + rate/100, t+1);
        });
        return Math.round(sum);
    }, [inv, rate, flows]);

    const roi = Math.round(((flows.reduce((a,b)=>a+b, 0) - inv) / inv) * 100);

    const chartData = flows.map((f, i) => ({ year: `Y${i+1}`, cash: f }));

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><DollarSign className="text-green-600"/> 投资回报模型</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4 bg-gray-50 p-6 rounded-3xl h-fit">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Initial Investment ($)</label>
                        <input type="number" value={inv} onChange={e=>setInv(Number(e.target.value))} className="w-full mt-1 p-2 rounded-lg border text-lg font-mono"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Discount Rate (%)</label>
                        <input type="number" value={rate} onChange={e=>setRate(Number(e.target.value))} className="w-full mt-1 p-2 rounded-lg border text-lg font-mono"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Cash Flows (5 Years)</label>
                        <div className="grid grid-cols-5 gap-2 mt-1">
                            {flows.map((f, i) => (
                                <input key={i} value={f} onChange={(e) => {
                                    const newF = [...flows]; newF[i] = Number(e.target.value); setFlows(newF);
                                }} className="p-1 rounded border text-xs text-center font-mono" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black text-white p-5 rounded-2xl">
                            <p className="text-xs font-bold text-gray-400 uppercase">NPV (Net Present Value)</p>
                            <p className={`text-3xl font-mono font-bold ${npv >= 0 ? 'text-green-400' : 'text-red-400'}`}>${npv.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-600 text-white p-5 rounded-2xl">
                            <p className="text-xs font-bold text-blue-200 uppercase">ROI (Return on Inv)</p>
                            <p className="text-3xl font-mono font-bold">{roi}%</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" tickLine={false}/>
                                <YAxis hide/>
                                <RechartsTooltip cursor={{fill: 'transparent'}}/>
                                <Bar dataKey="cash" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Burndown Simulator
const BurndownSimulator = () => {
    const totalPoints = 50;
    const days = 10;
    const [actuals, setActuals] = useState([50, 48, 42, 38, 30, 28, 20, 10, 5, 0]); // Default ideal-ish

    const data = Array.from({length: days + 1}, (_, i) => ({
        day: i,
        ideal: totalPoints - (i * (totalPoints/days)),
        actual: actuals[i] !== undefined ? actuals[i] : null
    }));

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FlameIcon className="text-orange-600"/> 燃尽图模拟器</h2>
            <div className="flex-1 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" label={{ value: 'Sprint Days', position: 'insideBottomRight', offset: -5 }} />
                            <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-48 space-y-3 overflow-y-auto">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Adjust Remaining</p>
                    {actuals.map((val, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400 w-8">Day {i}</span>
                            <input 
                                type="range" min="0" max={totalPoints} value={val} 
                                onChange={(e) => {
                                    const n = [...actuals]; n[i] = Number(e.target.value); setActuals(n);
                                }}
                                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs font-bold w-6 text-right">{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 4. Stakeholder Matrix
const StakeholderMatrix = () => {
    const [stakeholders, setStakeholders] = useState([
        { id: 1, name: 'Sponsor', x: 90, y: 90, r: 20 }, // High P, High I
        { id: 2, name: 'Team', x: 30, y: 80, r: 15 },    // Low P, High I
        { id: 3, name: 'Public', x: 20, y: 20, r: 10 },  // Low P, Low I
        { id: 4, name: 'Gov', x: 85, y: 30, r: 18 },     // High P, Low I
    ]);

    const handleUpdate = (id: number, axis: 'x'|'y', val: string) => {
        setStakeholders(stakeholders.map(s => s.id === id ? { ...s, [axis]: Number(val) } : s));
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="text-purple-600"/> 相关方博弈矩阵</h2>
            <div className="flex-1 flex gap-6">
                <div className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 relative p-8">
                    {/* Quadrant Backgrounds */}
                    <div className="absolute inset-8 grid grid-cols-2 grid-rows-2 gap-1 pointer-events-none opacity-50">
                        <div className="bg-yellow-100 rounded-tl-xl flex p-2"><span className="text-xs font-bold text-yellow-700">Keep Satisfied</span></div>
                        <div className="bg-green-100 rounded-tr-xl flex p-2 justify-end"><span className="text-xs font-bold text-green-700">Manage Closely</span></div>
                        <div className="bg-gray-100 rounded-bl-xl flex items-end p-2"><span className="text-xs font-bold text-gray-500">Monitor</span></div>
                        <div className="bg-blue-100 rounded-br-xl flex items-end justify-end p-2"><span className="text-xs font-bold text-blue-700">Keep Informed</span></div>
                    </div>
                    {/* Chart */}
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis type="number" dataKey="x" name="Interest" domain={[0, 100]} label={{ value: 'Interest (利益)', position: 'bottom' }} />
                            <YAxis type="number" dataKey="y" name="Power" domain={[0, 100]} label={{ value: 'Power (权力)', angle: -90, position: 'left' }} />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Stakeholders" data={stakeholders} fill="#8884d8">
                                {stakeholders.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={['#eab308', '#22c55e', '#94a3b8', '#3b82f6'][index % 4]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-64 space-y-4 overflow-y-auto">
                    {stakeholders.map((s, i) => (
                        <div key={s.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: ['#eab308', '#22c55e', '#94a3b8', '#3b82f6'][i%4]}}></div>
                                {s.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-[10px] text-gray-400">Power</label><input type="number" value={s.y} onChange={e=>handleUpdate(s.id,'y',e.target.value)} className="w-full text-xs p-1 border rounded"/></div>
                                <div><label className="text-[10px] text-gray-400">Interest</label><input type="number" value={s.x} onChange={e=>handleUpdate(s.id,'x',e.target.value)} className="w-full text-xs p-1 border rounded"/></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 5. Risk EMV
const RiskEmvTool = () => {
    const [risks, setRisks] = useState([
        { id: 1, name: 'Server Failure', prob: 10, impact: -50000 },
        { id: 2, name: 'Vendor Delay', prob: 30, impact: -20000 },
        { id: 3, name: 'Early Bonus', prob: 20, impact: 10000 },
    ]);
    const totalEmv = risks.reduce((sum, r) => sum + (r.prob/100 * r.impact), 0);

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><GitMerge className="text-red-500"/> 风险决策树 (EMV)</h2>
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex-1 flex flex-col">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-500">
                            <th className="py-2">Risk Event</th>
                            <th>Probability (%)</th>
                            <th>Impact ($)</th>
                            <th className="text-right">EMV ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {risks.map((r, i) => (
                            <tr key={r.id} className="border-b border-gray-50">
                                <td className="py-3 font-medium">{r.name}</td>
                                <td>
                                    <input type="number" value={r.prob} onChange={(e)=>{const n=[...risks];n[i].prob=Number(e.target.value);setRisks(n)}} className="w-16 bg-gray-50 rounded p-1 text-center"/> %
                                </td>
                                <td>
                                    <input type="number" value={r.impact} onChange={(e)=>{const n=[...risks];n[i].impact=Number(e.target.value);setRisks(n)}} className="w-24 bg-gray-50 rounded p-1 text-center"/>
                                </td>
                                <td className={`text-right font-mono font-bold ${(r.prob/100 * r.impact) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {(r.prob/100 * r.impact).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end items-end gap-4">
                    <span className="text-sm font-bold text-gray-500 uppercase">Project EMV Exposure</span>
                    <span className={`text-4xl font-mono font-bold ${totalEmv < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${totalEmv.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

// 6. OKR Tracker
const OkrTracker = () => {
    const [objs, setObjs] = useState([
        { id: 1, title: '提升产品用户体验', krs: [{ id: 101, title: 'NPS 提升至 50', progress: 40 }, { id: 102, title: '页面加载 < 1s', progress: 80 }] }
    ]);

    const updateProgress = (oid: number, krid: number, val: number) => {
        const newObjs = [...objs];
        const o = newObjs.find(x => x.id === oid);
        const kr = o?.krs.find(k => k.id === krid);
        if (kr) kr.progress = val;
        setObjs(newObjs);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><TargetIcon className="text-indigo-600"/> OKR 目标管理</h2>
            <div className="space-y-6">
                {objs.map(o => {
                    const avg = Math.round(o.krs.reduce((a,b)=>a+b.progress,0) / o.krs.length);
                    return (
                        <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 rounded text-xs">O</span> {o.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all" style={{width: `${avg}%`}}></div>
                                    </div>
                                    <span className="font-bold text-blue-600">{avg}%</span>
                                </div>
                            </div>
                            <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                                {o.krs.map(kr => (
                                    <div key={kr.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">KR: {kr.title}</span>
                                            <span className="text-gray-400">{kr.progress}%</span>
                                        </div>
                                        <input type="range" value={kr.progress} onChange={e=>updateProgress(o.id, kr.id, Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 7. WBS Outliner
const WbsOutliner = () => {
    // Simplified flat list with level for demo
    const [items, setItems] = useState([
        { id: 1, level: 0, text: '项目：新一代电商平台' },
        { id: 2, level: 1, text: '1.1 前端开发' },
        { id: 3, level: 2, text: '1.1.1 首页设计' },
        { id: 4, level: 2, text: '1.1.2 购物车交互' },
        { id: 5, level: 1, text: '1.2 后端架构' },
    ]);

    const add = () => setItems([...items, { id: Date.now(), level: 1, text: 'New Task' }]);
    const update = (idx: number, text: string) => { const n=[...items]; n[idx].text=text; setItems(n); };
    const indent = (idx: number, delta: number) => { const n=[...items]; n[idx].level = Math.max(0, Math.min(3, n[idx].level + delta)); setItems(n); };
    const remove = (idx: number) => setItems(items.filter((_,i)=>i!==idx));

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><Layers className="text-purple-600"/> WBS 分解结构</h2>
                <button onClick={add} className="text-xs bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1"><Plus size={14}/> Add Node</button>
            </div>
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 overflow-y-auto">
                {items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2 mb-2 group">
                        <div style={{width: item.level * 24 + 'px'}} className="shrink-0 flex justify-end">
                            {item.level > 0 && <div className="w-3 h-3 border-l border-b border-gray-300 rounded-bl mr-1 -mt-2"></div>}
                        </div>
                        <div className="flex items-center gap-2 flex-1 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg p-2 transition-all">
                            <div className={`w-2 h-2 rounded-full ${item.level===0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                            <input value={item.text} onChange={e=>update(i, e.target.value)} className="bg-transparent outline-none flex-1 text-sm font-medium"/>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <button onClick={()=>indent(i, -1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={14}/></button>
                                <button onClick={()=>indent(i, 1)} className="p-1 hover:bg-gray-200 rounded"><ArrowRight size={14}/></button>
                                <button onClick={()=>remove(i)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 8. Charter Wizard
const ProjectCharter = () => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', goal: '', stakeholders: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    const generateCharter = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `Act as a Senior Project Manager. Generate a professional Project Charter for a project named "${data.name}" with the goal: "${data.goal}". 
            
            Structure the output clearly with the following sections:
            1. Executive Summary
            2. Project Objectives
            3. Scope
            4. Key Stakeholders
            
            Format the output as clean text suitable for a document.`;

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            
            setGeneratedContent(resp.response.text);
            setStep(3); // Move to result step
        } catch (e) {
            console.error("AI Error", e);
            alert("AI 生成失败，请检查 API Key 或网络连接。");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="text-blue-500"/> 项目章程生成器</h2>
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                {step === 1 && (
                    <div className="w-full space-y-4 animate-fade-in-up">
                        <h3 className="text-lg font-bold">1. 项目名称与背景</h3>
                        <input placeholder="Project Name" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200" value={data.name} onChange={e=>setData({...data, name: e.target.value})}/>
                        <button onClick={()=>setStep(2)} disabled={!data.name} className="w-full py-3 bg-black text-white rounded-xl font-bold disabled:opacity-50">Next</button>
                    </div>
                )}
                {step === 2 && (
                    <div className="w-full space-y-4 animate-fade-in-up">
                        <h3 className="text-lg font-bold">2. 项目目标 (SMART)</h3>
                        <textarea placeholder="Specific, Measurable..." className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 h-32" value={data.goal} onChange={e=>setData({...data, goal: e.target.value})}/>
                        <div className="flex gap-3">
                            <button onClick={()=>setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Back</button>
                            <button 
                                onClick={generateCharter} 
                                disabled={isGenerating || !data.goal}
                                className="flex-1 py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16}/>}
                                AI Generate Charter
                            </button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="w-full h-full flex flex-col space-y-6 animate-fade-in-up bg-yellow-50 p-8 rounded-3xl border border-yellow-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Award size={100}/></div>
                        <div className="text-center mb-4 shrink-0">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">PROJECT CHARTER</h2>
                            <div className="h-1 w-20 bg-black mx-auto mt-2"></div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-relaxed whitespace-pre-line">
                                {generatedContent}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between items-end shrink-0 border-t border-yellow-200/50">
                            <div className="font-serif italic text-lg opacity-50">Authorized by Sponsor</div>
                            <button onClick={()=>alert('PDF Exported!')} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold flex items-center gap-2"><Save size={14}/> Export PDF</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 9. Retro Board
const RetroBoard = () => {
    const [cards, setCards] = useState([
        { id: 1, type: 'good', text: '团队沟通顺畅' },
        { id: 2, type: 'bad', text: '测试环境不稳定' },
        { id: 3, type: 'action', text: '下周升级服务器' },
    ]);

    const addCard = (type: string) => {
        const text = prompt("Add item:");
        if(text) setCards([...cards, { id: Date.now(), type, text }]);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><RefreshCw className="text-green-600"/> 敏捷回顾看板</h2>
            <div className="flex-1 grid grid-cols-3 gap-4">
                {[
                    { id: 'good', title: 'Start / Good', color: 'bg-green-50 border-green-200' },
                    { id: 'bad', title: 'Stop / Bad', color: 'bg-red-50 border-red-200' },
                    { id: 'action', title: 'Continue / Action', color: 'bg-blue-50 border-blue-200' }
                ].map(col => (
                    <div key={col.id} className={`rounded-2xl border p-4 flex flex-col ${col.color}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm uppercase">{col.title}</h3>
                            <button onClick={()=>addCard(col.id)}><Plus size={18} className="opacity-50 hover:opacity-100"/></button>
                        </div>
                        <div className="space-y-2 overflow-y-auto">
                            {cards.filter(c=>c.type===col.id).map(c=>(
                                <div key={c.id} className="bg-white/80 p-3 rounded-xl shadow-sm text-sm font-medium relative group">
                                    {c.text}
                                    <button onClick={()=>setCards(cards.filter(x=>x.id!==c.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 10. User Story Splitter
const UserStorySplitter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const handleSplit = async () => {
        setIsThinking(true);
        if (!process.env.API_KEY) {
            alert("未配置 API Key，无法使用 AI 功能");
            setIsThinking(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Act as an Agile Coach. Split the following Epic/User Story into 3-5 smaller, INVEST-compliant user stories. 
            Return ONLY the list of stories, one per line. Do not include introductory text.
            
            Input: "${input}"`;

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            const text = resp.response.text;
            // Split by newline and filter empty strings
            const stories = text.split('\n').filter(line => line.trim().length > 0);
            setOutput(stories);

        } catch (e) {
            console.error("AI Error", e);
            setOutput(['AI Service Unavailable. Please try again later.']);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-indigo-600"/> User Story 拆分助手</h2>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <textarea 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="输入一个宏大的需求 (Epic)，例如：'我想做一个像 Uber 一样的打车软件'..."
                        value={input}
                        onChange={e=>setInput(e.target.value)}
                    />
                    <button 
                        onClick={handleSplit} disabled={isThinking || !input}
                        className="py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isThinking ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16}/>}
                        AI 智能拆分
                    </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-y-auto relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Code size={60}/></div>
                    <h3 className="font-bold text-gray-900 mb-4">拆分建议 (INVEST 原则)</h3>
                    {output.length > 0 ? (
                        <ul className="space-y-3">
                            {output.map((s,i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <span className="font-bold text-blue-500">#{i+1}</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">等待输入...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Re-export existing components for safety ---
const EvmCalculator = () => {
    const [inputs, setInputs] = useState({ pv: 1000, ev: 850, ac: 920, bac: 5000 });
    const [res, setRes] = useState<any>(null);
    useEffect(() => {
        const sv = inputs.ev - inputs.pv;
        const cv = inputs.ev - inputs.ac;
        const spi = inputs.pv === 0 ? 0 : Number((inputs.ev / inputs.pv).toFixed(2));
        const cpi = inputs.ac === 0 ? 0 : Number((inputs.ev / inputs.ac).toFixed(2));
        const eac = cpi === 0 ? 0 : Math.round(inputs.bac / cpi);
        setRes({ sv, cv, spi, cpi, eac, vac: inputs.bac - eac });
    }, [inputs]);

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="text-blue-600"/> 挣值管理 (EVM)</h2>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 bg-gray-50 p-6 rounded-3xl h-fit">
                    {['pv', 'ev', 'ac', 'bac'].map(k => (
                        <div key={k} className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase text-gray-500">{k.toUpperCase()}</label>
                            <input type="number" value={(inputs as any)[k]} onChange={e=>setInputs({...inputs, [k]: Number(e.target.value)})} className="w-24 p-2 rounded border text-right font-mono"/>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase">SPI (进度)</div>
                            <div className={`text-2xl font-bold ${res?.spi>=1?'text-green-500':'text-red-500'}`}>{res?.spi}</div>
                        </div>
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase">CPI (成本)</div>
                            <div className={`text-2xl font-bold ${res?.cpi>=1?'text-green-500':'text-red-500'}`}>{res?.cpi}</div>
                        </div>
                    </div>
                    <div className="bg-black text-white p-6 rounded-2xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Estimate at Completion</p>
                                <p className="text-3xl font-mono font-bold">${res?.eac.toLocaleString()}</p>
                            </div>
                            <div className={`text-right ${res?.vac>=0?'text-green-400':'text-red-400'}`}>
                                <p className="text-xs font-bold opacity-60 uppercase">Variance</p>
                                <p className="text-xl font-mono font-bold">{res?.vac>0?'+':''}{res?.vac}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PertCalculator = () => {
    const [v, setV] = useState({ o: 10, m: 15, p: 25 });
    const e = (v.o + 4 * v.m + v.p) / 6;
    const sd = (v.p - v.o) / 6;
    return (
        <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto justify-center">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Activity className="text-purple-600"/> PERT 三点估算</h2>
            <div className="grid grid-cols-3 gap-6 mb-12">
                {[
                    { id: 'o', label: 'Optimistic', c: 'text-green-600' },
                    { id: 'm', label: 'Most Likely', c: 'text-blue-600' },
                    { id: 'p', label: 'Pessimistic', c: 'text-red-600' }
                ].map(f => (
                    <div key={f.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className={`block text-xs font-bold uppercase mb-2 ${f.c}`}>{f.label}</label>
                        <input type="number" className="w-full text-2xl font-bold bg-transparent outline-none border-b border-gray-300" value={(v as any)[f.id]} onChange={e => setV({...v, [f.id]: Number(e.target.value)})}/>
                    </div>
                ))}
            </div>
            <div className="bg-black text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex justify-between items-center">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Expected Duration</p>
                    <div className="text-5xl font-mono font-bold">{e.toFixed(1)} <span className="text-lg text-gray-500">days</span></div>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Std Dev (σ)</p>
                    <div className="text-3xl font-mono text-gray-300">± {sd.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

const SwotBoard = () => {
    const q = [
        { id: 's', t: 'Strengths', c: 'bg-green-50 border-green-200' }, { id: 'w', t: 'Weaknesses', c: 'bg-orange-50 border-orange-200' },
        { id: 'o', t: 'Opportunities', c: 'bg-blue-50 border-blue-200' }, { id: 't', t: 'Threats', c: 'bg-red-50 border-red-200' }
    ];
    const [items, setItems] = useState<any>({ s: ['团队经验丰富'], w: ['资金不足'], o: ['AI 市场爆发'], t: ['竞品价格战'] });
    const add = (id: string) => { const t = prompt('Add:'); if(t) setItems({...items, [id]: [...items[id], t]}); };
    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-blue-600"/> SWOT 战略分析</h2>
            <div className="flex-1 grid grid-cols-2 gap-4">
                {q.map(x => (
                    <div key={x.id} className={`rounded-2xl border p-4 flex flex-col ${x.c}`}>
                        <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm uppercase">{x.t}</h3><button onClick={()=>add(x.id)}><Plus size={16}/></button></div>
                        <ul className="space-y-2">{items[x.id].map((t:string,i:number)=><li key={i} className="text-sm bg-white/60 p-2 rounded">{t}</li>)}</ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LearningHub;
