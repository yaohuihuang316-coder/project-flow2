
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlayCircle, Clock, ChevronLeft, ChevronDown, Plus,
  Activity, Terminal, 
  Network, BarChart3, 
  GitMerge, Layers, Shield, Loader2,
  Layout, Cpu, Briefcase, FileText, RefreshCw, CloudLightning, 
  DollarSign, Target, X, 
  History, BookOpen,
  ArrowRight, Zap, Save,
  AlertTriangle
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Bar, Legend, Line, ComposedChart, Area
} from 'recharts';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type MainCategory = 'Foundation' | 'Advanced' | 'Implementation';
type SubCategory = 'Course' | 'Cert' | 'Official';

interface LearningHubProps {
    onNavigate: (page: Page, id?: string) => void;
    currentUser?: UserProfile | null;
}

// Helper for Safe Env Access
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {}
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) {}
    return '';
};

// --- 1. Data Configuration (Advanced Labs) ---
const LAB_CATEGORIES = {
    Quantitative: {
        label: 'Quantitative (量化)',
        color: 'from-blue-600 to-indigo-600',
        desc: '数据驱动的硬核计算工具',
        tools: [
            { id: 'cpm', name: 'CPM 关键路径 (Chronos)', icon: Network },
            { id: 'evm', name: 'EVM 挣值分析', icon: BarChart3 },
            { id: 'pert', name: 'PERT 三点估算', icon: Activity },
            { id: 'roi', name: 'ROI/NPV 模型', icon: DollarSign },
            { id: 'burn', name: '敏捷燃尽图', icon: CloudLightning },
        ]
    },
    Strategic: {
        label: 'Strategic (战略)',
        color: 'from-purple-600 to-pink-600',
        desc: '宏观决策与分析模型',
        tools: [
            { id: 'swot', name: 'SWOT 分析', icon: Shield },
            { id: 'risk', name: '风险 EMV', icon: GitMerge },
            { id: 'okr', name: 'OKR 对齐', icon: Target },
        ]
    },
    Toolkit: {
        label: 'Toolkit (工具箱)',
        color: 'from-emerald-500 to-teal-600',
        desc: '日常项目管理必备套件',
        tools: [
            { id: 'wbs', name: 'WBS 分解', icon: Layers },
            { id: 'charter', name: '章程生成', icon: FileText },
            { id: 'retro', name: '复盘回顾', icon: RefreshCw },
            { id: 'userstory', name: '用户故事', icon: BookOpen },
        ]
    }
};

const CLASSIC_CASES = [
    {
        id: 'case-dia',
        title: '丹佛国际机场 (DIA) 行李系统',
        summary: '历史上著名的范围蔓延与技术激进案例。自动化行李系统导致机场延期开放16个月，超支20亿美元。',
        difficulty: 'High',
        cover_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: 'case-nhs',
        title: '英国 NHS 民用IT系统',
        summary: '世界上最大的民用IT项目失败案例。耗资120亿英镑，最终因需求过于复杂且无法落地而被废弃。',
        difficulty: 'Critical',
        cover_image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: 'case-apollo',
        title: '阿波罗 13 号救援',
        summary: '“失败不是选项”。在极端资源受限（氧气、电力）的情况下，如何通过敏捷决策和团队协作将宇航员带回家。',
        difficulty: 'Medium',
        cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800',
    }
];

// --- CPM ALGORITHM ENGINE ---
interface CpmTask {
    id: string; name: string; duration: number; predecessors: string[]; 
    es: number; ef: number; ls: number; lf: number; slack: number;
    isCritical: boolean; level: number;
}

class CpmEngine {
    static calculate(tasks: CpmTask[]): CpmTask[] {
        const taskMap = new Map(tasks.map(t => [t.id, { ...t, es: 0, ef: 0, ls: Infinity, lf: Infinity, slack: 0, isCritical: false, level: 0 }]));
        
        // 1. Forward Pass
        let changed = true;
        while (changed) {
            changed = false;
            for (const task of taskMap.values()) {
                let maxPrevEf = 0;
                let maxPrevLevel = -1;
                const preds = task.predecessors.map(pid => taskMap.get(pid)).filter(p => p !== undefined) as CpmTask[];
                for (const p of preds) {
                    if (p.ef > maxPrevEf) maxPrevEf = p.ef;
                    if (p.level > maxPrevLevel) maxPrevLevel = p.level;
                }
                const newEs = maxPrevEf;
                const newEf = newEs + task.duration;
                const newLevel = maxPrevLevel + 1;
                if (task.es !== newEs || task.ef !== newEf || task.level !== newLevel) {
                    task.es = newEs; task.ef = newEf; task.level = newLevel;
                    changed = true;
                }
            }
        }
        // 2. Backward Pass
        const projectDuration = Math.max(0, ...Array.from(taskMap.values()).map(t => t.ef));
        for (const task of taskMap.values()) {
            // Find if task is a predecessor to anyone
            const isPredecessorToSomeone = Array.from(taskMap.values()).some(t => t.predecessors.includes(task.id));
            if (!isPredecessorToSomeone) {
                task.lf = projectDuration;
                task.ls = task.lf - task.duration;
            }
        }
        // Iterate backwards through levels roughly by repeating scan
        for (let i = 0; i < tasks.length + 2; i++) {
            for (const task of taskMap.values()) {
                const successors = Array.from(taskMap.values()).filter(t => t.predecessors.includes(task.id));
                if (successors.length > 0) {
                    const minSuccLs = Math.min(...successors.map(s => s.ls));
                    task.lf = minSuccLs;
                    task.ls = task.lf - task.duration;
                }
            }
        }
        // 3. Slack
        for (const task of taskMap.values()) {
            task.slack = task.ls - task.es;
            // Floating point tolerance
            if (Math.abs(task.slack) < 0.001) {
                task.slack = 0; 
                task.isCritical = true;
            } else {
                task.isCritical = false;
            }
        }
        return Array.from(taskMap.values());
    }
}

// --- TOOL COMPONENTS ---

// 1. Chronos Flow CPM (Advanced Design)
const CpmStudio = () => {
    const [tasks, setTasks] = useState<CpmTask[]>([
        { id: 'A', name: '需求分析', duration: 3, predecessors: [], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'B', name: '原型设计', duration: 5, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'C', name: '后端架构', duration: 4, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'D', name: '前端开发', duration: 6, predecessors: ['B'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'E', name: 'API开发', duration: 5, predecessors: ['C'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'F', name: '集成测试', duration: 3, predecessors: ['D', 'E'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
    ]);
    const [calculatedTasks, setCalculatedTasks] = useState<CpmTask[]>([]);
    const [projectDuration, setProjectDuration] = useState(0);
    const [criticalCount, setCriticalCount] = useState(0);

    const handleCalculate = () => {
        const result = CpmEngine.calculate(tasks);
        setCalculatedTasks(result);
        setProjectDuration(Math.max(0, ...result.map(t => t.ef)));
        setCriticalCount(result.filter(t => t.isCritical).length);
    };
    
    // Auto-calculate on task change
    useEffect(() => { handleCalculate(); }, [tasks]);

    const getTaskPos = (task: CpmTask) => {
        const levelNodes = calculatedTasks.filter(t => t.level === task.level).sort((a,b) => a.id.localeCompare(b.id));
        const indexInLevel = levelNodes.findIndex(t => t.id === task.id);
        
        // Dynamic Layout
        const xBase = 100;
        const xStep = 220;
        const yStep = 140;
        
        const x = xBase + (task.level * xStep);
        // Center vertically based on number of nodes in level
        const totalHeight = levelNodes.length * yStep;
        const yOffset = (600 - totalHeight) / 2; // Assuming container height ~600
        const y = yOffset + (indexInLevel * yStep);
        
        return { x, y };
    };

    const updateTask = (idx: number, field: string, value: any) => {
        const newTasks = [...tasks];
        // @ts-ignore
        newTasks[idx][field] = value;
        if(field === 'predecessors') {
             // @ts-ignore
             newTasks[idx][field] = value.split(/[,，]/).map(s=>s.trim().toUpperCase()).filter(s=>s);
        }
        setTasks(newTasks);
    };

    return (
        <div className="h-full w-full relative bg-[#F5F5F7] overflow-hidden flex font-sans">
            {/* 0. Animation Styles */}
            <style>{`
                @keyframes dashFlow {
                    to { stroke-dashoffset: -20; }
                }
                .animate-flow {
                    animation: dashFlow 1s linear infinite;
                }
            `}</style>

            {/* 1. Infinite Canvas Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                 style={{backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px'}}>
            </div>

            {/* 2. Floating Glass Console (Left) */}
            <div className="absolute top-6 left-6 bottom-6 w-80 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2rem] z-30 flex flex-col overflow-hidden transition-all duration-300">
                <div className="p-6 border-b border-white/20 bg-white/40">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Network size={20} className="text-blue-600"/> 任务控制台
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">配置任务依赖关系与工期</p>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {tasks.map((task, i) => (
                        <div key={i} className="group bg-white/80 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all relative">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-md">
                                        {task.id}
                                    </div>
                                    <input 
                                        className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-gray-400" 
                                        value={task.name} 
                                        onChange={(e)=>updateTask(i, 'name', e.target.value)} 
                                        placeholder="Task Name"
                                    />
                                </div>
                                <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                                    <X size={14}/>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Duration</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none" 
                                        value={task.duration} 
                                        onChange={(e)=>updateTask(i, 'duration', Number(e.target.value))} 
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Predecessors</label>
                                    <input 
                                        className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none uppercase" 
                                        value={task.predecessors.join(',')} 
                                        onChange={(e)=>updateTask(i, 'predecessors', e.target.value)} 
                                        placeholder="Ex: A,B"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={()=>setTasks([...tasks, {id: String.fromCharCode(65+tasks.length), name:'New Task', duration:1, predecessors:[], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0}])} 
                        className="w-full py-4 border-2 border-dashed border-gray-300/50 rounded-2xl text-gray-400 font-bold hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16}/> Add Task
                    </button>
                </div>
            </div>

            {/* 3. HUD (Heads-Up Display) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-8 py-3 rounded-full shadow-2xl border border-white/50 z-20 flex items-center gap-8 animate-fade-in-up">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Duration</span>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 font-mono">
                        {projectDuration}<span className="text-sm text-gray-400 ml-1">days</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical Tasks</span>
                    <div className="text-2xl font-black text-[#FF3B30] font-mono flex items-center gap-2">
                        {criticalCount}
                        {criticalCount > 0 && <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"></div>}
                    </div>
                </div>
            </div>

            {/* 4. Graph Canvas Area */}
            <div className="flex-1 ml-80 overflow-auto relative custom-scrollbar">
                <div className="min-w-[1000px] min-h-[800px] relative p-20">
                    
                    {/* SVG Layer (Edges) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <marker id="arrow" markerWidth="6" markerHeight="6" refX="24" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L6,3 z" fill="#D1D5DB" />
                            </marker>
                            <marker id="arrow-critical" markerWidth="6" markerHeight="6" refX="24" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L6,3 z" fill="#FF3B30" />
                            </marker>
                        </defs>
                        {calculatedTasks.map((task) => {
                            const end = getTaskPos(task);
                            // Adjust End pos for better connection point (center left)
                            const endX = end.x; 
                            const endY = end.y + 35; // Half of card height roughly

                            return task.predecessors.map(pid => {
                                const parent = calculatedTasks.find(t => t.id === pid);
                                if(!parent) return null;
                                const start = getTaskPos(parent);
                                // Adjust Start pos (center right)
                                const startX = start.x + 160; // Card Width
                                const startY = start.y + 35;

                                const isCriticalLink = task.isCritical && parent.isCritical && (Math.abs(parent.ef - task.es) < 0.01); 
                                
                                // Bezier Curve Calculation
                                const midX = (startX + endX) / 2;
                                const path = `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
                                
                                return (
                                    <g key={`${pid}-${task.id}`}>
                                        <path 
                                            d={path} 
                                            fill="none" 
                                            stroke={isCriticalLink ? "#FF3B30" : "#E5E7EB"} 
                                            strokeWidth={isCriticalLink ? 3 : 2} 
                                            markerEnd={isCriticalLink ? "url(#arrow-critical)" : "url(#arrow)"}
                                            strokeDasharray={isCriticalLink ? "8,4" : "none"} 
                                            className={isCriticalLink ? "animate-flow" : ""}
                                            style={{ opacity: isCriticalLink ? 1 : 0.4 }}
                                        />
                                        {/* Slack Label on Line if Slack > 0 */}
                                        {!isCriticalLink && task.slack > 0 && (
                                            <text x={(startX+endX)/2} y={(startY+endY)/2} fill="#34C759" fontSize="10" fontWeight="bold" textAnchor="middle" dy="-5">
                                                +{task.slack}d
                                            </text>
                                        )}
                                    </g>
                                );
                            });
                        })}
                    </svg>

                    {/* HTML Layer (Smart Nodes) */}
                    {calculatedTasks.map((task) => {
                        const pos = getTaskPos(task);
                        return (
                            <div 
                                key={task.id}
                                className={`absolute w-40 h-20 rounded-xl p-3 flex flex-col justify-between transition-all duration-500 z-10
                                    ${task.isCritical 
                                        ? 'bg-white border-2 border-[#FF3B30] shadow-[0_8px_30px_rgba(255,59,48,0.25)] scale-105' 
                                        : 'bg-white border border-gray-200 shadow-sm opacity-90'
                                    }`}
                                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-gray-800 truncate pr-2">{task.name}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${task.isCritical ? 'bg-[#FF3B30]' : 'bg-gray-800'}`}>
                                        {task.id}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Duration</span>
                                        <span className="text-sm font-mono font-bold text-gray-700">{task.duration}d</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">ES / EF</span>
                                        <span className="text-[10px] font-mono text-gray-500">{task.es} → {task.ef}</span>
                                    </div>
                                </div>

                                {/* Slack Bubble */}
                                {task.slack > 0 && (
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#34C759] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                        Slack: {task.slack}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// 2. Financial Modeler (Advanced)
const FinModeler = () => {
    const [initInv, setInitInv] = useState(50000);
    const [cashFlows, setCashFlows] = useState([15000, 20000, 25000, 30000, 35000]);
    const [discountRate, setDiscountRate] = useState(10);

    const data = useMemo(() => {
        let cumulative = -initInv;
        return cashFlows.map((flow, i) => {
            const pv = flow / Math.pow(1 + discountRate/100, i+1);
            cumulative += pv;
            return { year: `Y${i+1}`, flow: flow, pv: Math.round(pv), cumulative: Math.round(cumulative) };
        });
    }, [initInv, cashFlows, discountRate]);

    const npv = data[data.length-1]?.cumulative || -initInv;
    const roi = ((data.reduce((a,b)=>a+b.flow, 0) - initInv) / initInv) * 100;
    const breakEvenIndex = data.findIndex(d => d.cumulative >= 0);
    const payBackPeriod = breakEvenIndex === -1 ? 'N/A' : `${breakEvenIndex + 1} Years`;

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 p-6 animate-fade-in">
            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign className="text-green-600"/> 核心参数</h3>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Initial Investment</label><input type="number" className="w-full text-xl font-bold border-b border-gray-200 outline-none py-1" value={initInv} onChange={(e)=>setInitInv(Number(e.target.value))}/></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Discount Rate (%)</label><div className="flex items-center gap-2"><input type="range" min="0" max="20" className="flex-1 accent-green-600" value={discountRate} onChange={(e)=>setDiscountRate(Number(e.target.value))}/><span className="text-sm font-mono">{discountRate}%</span></div></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-gray-900">现金流预测</h3><button onClick={()=>setCashFlows([...cashFlows, 20000])} className="p-1 bg-black text-white rounded hover:bg-gray-800"><Plus size={14}/></button></div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {cashFlows.map((cf, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm"><span className="w-8 font-bold text-gray-400">Y{i+1}</span><input type="number" className="flex-1 bg-gray-50 rounded px-2 py-1 text-right" value={cf} onChange={(e)=>{const n = [...cashFlows]; n[i] = Number(e.target.value); setCashFlows(n);}}/><button onClick={()=>setCashFlows(cashFlows.filter((_,idx)=>idx!==i))} className="text-red-300 hover:text-red-500"><X size={14}/></button></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black text-white p-5 rounded-2xl"><p className="text-xs font-bold text-gray-500 uppercase">NPV (净现值)</p><p className={`text-2xl font-mono font-bold ${npv>0?'text-green-400':'text-red-400'}`}>${npv.toLocaleString()}</p></div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl"><p className="text-xs font-bold text-gray-400 uppercase">ROI</p><p className={`text-2xl font-mono font-bold ${roi>0?'text-green-600':'text-red-500'}`}>{roi.toFixed(1)}%</p></div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl"><p className="text-xs font-bold text-gray-400 uppercase">Payback Period</p><p className="text-2xl font-mono font-bold text-blue-600">{payBackPeriod}</p></div>
                </div>
                <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[{year: 'Start', flow: 0, cumulative: -initInv}, ...data]} margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/>
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:10}}/>
                            <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                            <ReferenceLine y={0} stroke="#000" strokeOpacity={0.2} />
                            <Bar dataKey="flow" fill="#E5E7EB" radius={[4,4,0,0]} name="Annual Flow"/>
                            <Line type="monotone" dataKey="cumulative" stroke="#2563EB" strokeWidth={3} dot={{r:4, fill:'#2563EB'}} name="Cumulative NPV"/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// 3. Agile Burn (Advanced)
const AgileBurn = () => {
    const totalPoints = 100;
    const [days, setDays] = useState(14);
    const [data, setData] = useState<any[]>([]);
    useEffect(() => {
        const arr = [];
        let actual = totalPoints;
        let scope = totalPoints;
        for(let i=0; i<=days; i++) {
            const ideal = totalPoints - (totalPoints/days)*i;
            if(i > 0 && i < days) {
                actual -= Math.floor(Math.random() * 12); // Sim burn
                if(actual < 0) actual = 0;
                if(Math.random() > 0.8) scope += Math.floor(Math.random() * 10); // Sim creep
            }
            arr.push({ day: i, Ideal: Math.round(ideal), Actual: i > 8 ? null : actual, Scope: scope });
        }
        setData(arr);
    }, [days]);
    return (
        <div className="h-full flex flex-col p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Zap size={20}/></div>
                    <div><h3 className="font-bold text-gray-900">Sprint 42 Burn-down</h3><p className="text-xs text-gray-500">Velocity: 24pts / day</p></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>setDays(days===14?21:14)} className="px-3 py-1 bg-white border rounded-lg text-xs font-bold">{days} Day Sprint</button>
                    <button onClick={()=>setData([...data])} className="p-2 bg-white border rounded-lg text-gray-500 hover:text-black"><RefreshCw size={14}/></button>
                </div>
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10}} label={{ value: 'Sprint Days', position: 'insideBottom', offset: -5, fontSize:10 }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:10}} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fontSize:10 }}/>
                        <RechartsTooltip />
                        <Legend verticalAlign="top" height={36}/>
                        <Line type="monotone" dataKey="Ideal" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                        <Area type="monotone" dataKey="Actual" stroke="#2563EB" fill="url(#colorActual)" strokeWidth={3} />
                        <Line type="step" dataKey="Scope" stroke="#EF4444" strokeWidth={2} dot={false}/>
                        <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                    </ComposedChart>
                </ResponsiveContainer>
                <div className="absolute top-16 right-10 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 animate-bounce-in">
                    <AlertTriangle size={16} className="text-red-500"/>
                    <div><p className="text-[10px] font-bold text-red-800 uppercase">Scope Creep Detected</p><p className="text-xs text-red-600">+15 pts added mid-sprint</p></div>
                </div>
            </div>
        </div>
    );
};

// 4. WBS Tree (Advanced)
const WbsTree = () => {
    const Node = ({ data, level }: {data:any, level:number}) => {
        const [expanded, setExpanded] = useState(true);
        const progressColor = data.progress === 100 ? 'bg-green-500' : data.progress > 50 ? 'bg-blue-500' : 'bg-gray-300';
        return (
            <div className="flex flex-col items-center relative">
                {level > 0 && <div className="h-6 w-px bg-gray-300"></div>}
                <div className={`relative z-10 bg-white border-2 rounded-xl p-3 w-40 text-center shadow-sm cursor-pointer transition-all hover:scale-105 ${data.progress===100 ? 'border-green-200' : 'border-gray-100'}`} onClick={()=>setExpanded(!expanded)}>
                    <div className="text-[10px] font-bold text-gray-400 mb-1">{data.code}</div>
                    <div className="text-sm font-bold text-gray-800 leading-tight mb-2">{data.name}</div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${progressColor}`} style={{width: `${data.progress}%`}}></div></div>
                    {data.children && <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border rounded-full p-0.5 text-gray-400 shadow-sm ${expanded ? 'rotate-180':''}`}><ChevronDown size={12}/></div>}
                </div>
                {expanded && data.children && (
                    <div className="flex gap-4 mt-0 pt-0 relative">
                        {data.children.length > 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-10rem)] h-px bg-transparent"><div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div></div>}
                        {data.children.map((child:any, i:number) => <Node key={i} data={child} level={level+1} />)}
                    </div>
                )}
            </div>
        );
    };
    const wbsData = { code: '1.0', name: 'New Mobile App', progress: 65, children: [{ code: '1.1', name: 'Planning', progress: 100, children: [{ code: '1.1.1', name: 'Market Research', progress: 100 }, { code: '1.1.2', name: 'Feasibility', progress: 100 }] }, { code: '1.2', name: 'Design', progress: 80, children: [{ code: '1.2.1', name: 'Prototyping', progress: 100 }, { code: '1.2.2', name: 'UI Assets', progress: 60 }] }, { code: '1.3', name: 'Development', progress: 40, children: [{ code: '1.3.1', name: 'Backend API', progress: 70 }, { code: '1.3.2', name: 'Frontend', progress: 10 }] }] };
    return <div className="h-full bg-gray-50/50 rounded-3xl overflow-auto custom-scrollbar p-10 flex justify-center items-start animate-fade-in"><Node data={wbsData} level={0} /></div>;
};

// 5. Simple Tools Implementation
const EvmCalculator = () => {
    const [inputs, setInputs] = useState({ pv: 1000, ev: 850, ac: 920, bac: 5000 });
    const [res, setRes] = useState<any>(null);
    useEffect(() => {
        const sv = inputs.ev - inputs.pv; const cv = inputs.ev - inputs.ac;
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
                        <div key={k} className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-gray-500">{k.toUpperCase()}</label><input type="number" value={(inputs as any)[k]} onChange={e=>setInputs({...inputs, [k]: Number(e.target.value)})} className="w-24 p-2 rounded border text-right font-mono"/></div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center"><div className="text-xs text-gray-400 font-bold uppercase">SPI</div><div className={`text-2xl font-bold ${res?.spi>=1?'text-green-500':'text-red-500'}`}>{res?.spi}</div></div>
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center"><div className="text-xs text-gray-400 font-bold uppercase">CPI</div><div className={`text-2xl font-bold ${res?.cpi>=1?'text-green-500':'text-red-500'}`}>{res?.cpi}</div></div>
                    </div>
                    <div className="bg-black text-white p-6 rounded-2xl"><div className="flex justify-between items-end"><div><p className="text-xs font-bold text-gray-500 uppercase">EAC</p><p className="text-3xl font-mono font-bold">${res?.eac.toLocaleString()}</p></div></div></div>
                </div>
            </div>
        </div>
    );
};

const PertCalculator = () => {
    const [v, setV] = useState({ o: 10, m: 15, p: 25 });
    const e = (v.o + 4 * v.m + v.p) / 6; const sd = (v.p - v.o) / 6;
    return (
        <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto justify-center">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Activity className="text-purple-600"/> PERT 三点估算</h2>
            <div className="grid grid-cols-3 gap-6 mb-12">
                {[{ id: 'o', label: 'Optimistic', c: 'text-green-600' }, { id: 'm', label: 'Most Likely', c: 'text-blue-600' }, { id: 'p', label: 'Pessimistic', c: 'text-red-600' }].map(f => (
                    <div key={f.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className={`block text-xs font-bold uppercase mb-2 ${f.c}`}>{f.label}</label><input type="number" className="w-full text-2xl font-bold bg-transparent outline-none border-b border-gray-300" value={(v as any)[f.id]} onChange={e => setV({...v, [f.id]: Number(e.target.value)})}/></div>
                ))}
            </div>
            <div className="bg-black text-white rounded-3xl p-8 shadow-xl flex justify-between items-center"><div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Expected</p><div className="text-5xl font-mono font-bold">{e.toFixed(1)}d</div></div><div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Std Dev</p><div className="text-3xl font-mono text-gray-300">± {sd.toFixed(2)}</div></div></div>
        </div>
    );
};

const SwotBoard = () => {
    const q = [{ id: 's', t: 'Strengths', c: 'bg-green-50 border-green-200' }, { id: 'w', t: 'Weaknesses', c: 'bg-orange-50 border-orange-200' }, { id: 'o', t: 'Opportunities', c: 'bg-blue-50 border-blue-200' }, { id: 't', t: 'Threats', c: 'bg-red-50 border-red-200' }];
    const [items, setItems] = useState<any>({ s: ['团队经验丰富'], w: ['资金不足'], o: ['AI 市场爆发'], t: ['竞品价格战'] });
    const add = (id: string) => { const t = prompt('Add:'); if(t) setItems({...items, [id]: [...items[id], t]}); };
    return <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-blue-600"/> SWOT 战略分析</h2><div className="flex-1 grid grid-cols-2 gap-4">{q.map(x => (<div key={x.id} className={`rounded-2xl border p-4 flex flex-col ${x.c}`}><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm uppercase">{x.t}</h3><button onClick={()=>add(x.id)}><ArrowRight size={16}/></button></div><ul className="space-y-2">{items[x.id].map((t:string,i:number)=><li key={i} className="text-sm bg-white/60 p-2 rounded">{t}</li>)}</ul></div>))}</div></div>;
};

// 2.4 Project Charter (AI)
const ProjectCharter = () => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', goal: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [content, setContent] = useState('');
    const generateCharter = async () => {
        setIsGenerating(true);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Missing");
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Generate a professional Project Charter for "${data.name}" with goal: "${data.goal}". Include Executive Summary, Objectives, Scope, Stakeholders.`;
            const resp = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
            setContent(resp.text || '');
            setStep(3);
        } catch (e) { alert("AI Error"); } finally { setIsGenerating(false); }
    };
    return (
        <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="text-blue-500"/> 章程生成器</h2>
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                {step === 1 && (<div className="w-full space-y-4 animate-fade-in-up"><h3 className="text-lg font-bold">1. 项目名称</h3><input placeholder="Project Name" className="w-full p-4 bg-gray-50 rounded-xl border" value={data.name} onChange={e=>setData({...data, name: e.target.value})}/><button onClick={()=>setStep(2)} disabled={!data.name} className="w-full py-3 bg-black text-white rounded-xl font-bold">Next</button></div>)}
                {step === 2 && (<div className="w-full space-y-4 animate-fade-in-up"><h3 className="text-lg font-bold">2. 项目目标</h3><textarea placeholder="SMART Goal..." className="w-full p-4 bg-gray-50 rounded-xl border h-32" value={data.goal} onChange={e=>setData({...data, goal: e.target.value})}/><div className="flex gap-3"><button onClick={()=>setStep(1)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Back</button><button onClick={generateCharter} disabled={isGenerating||!data.goal} className="flex-1 py-3 bg-black text-white rounded-xl font-bold flex justify-center gap-2">{isGenerating?<Loader2 className="animate-spin" size={16}/>:<Zap size={16}/>} Generate</button></div></div>)}
                {step === 3 && (<div className="w-full h-full flex flex-col space-y-6 animate-fade-in-up bg-yellow-50 p-8 rounded-3xl border border-yellow-200 shadow-sm relative overflow-hidden"><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><div className="prose prose-sm font-serif whitespace-pre-line">{content}</div></div><button onClick={()=>alert('PDF!')} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold w-fit"><Save size={14}/> Export</button></div>)}
            </div>
        </div>
    );
};

// 2.3.3 Retro
const RetroBoard = () => {
    return <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><RefreshCw className="text-pink-500"/> 迭代回顾</h2><div className="flex-1 grid grid-cols-3 gap-6">{[{t:'Start',c:'bg-green-50 text-green-700'},{t:'Stop',c:'bg-red-50 text-red-700'},{t:'Continue',c:'bg-blue-50 text-blue-700'}].map((col,i)=><div key={i} className={`${col.c} p-6 rounded-3xl`}><h3 className="font-bold text-lg mb-4">{col.t}</h3><div className="bg-white/60 p-3 rounded-xl shadow-sm h-20"></div></div>)}</div></div>;
};

// 2.5 User Story (AI)
const UserStorySplitter = () => {
    const [input, setInput] = useState(''); const [output, setOutput] = useState<string[]>([]); const [isThinking, setIsThinking] = useState(false);
    const handleSplit = async () => {
        setIsThinking(true); const apiKey = getApiKey();
        if(!apiKey) { alert("No Key"); setIsThinking(false); return; }
        try { const ai = new GoogleGenAI({apiKey}); const resp = await ai.models.generateContent({model:'gemini-3-flash-preview', contents:[{role:'user', parts:[{text:`Split this epic into 3 INVEST user stories: "${input}". List only.`}]}]}); setOutput((resp.text||'').split('\n').filter((l: string)=>l.trim())); } catch(e){console.error(e);} finally{setIsThinking(false);}
    };
    return <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-indigo-600"/> User Story 拆分</h2><div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="flex flex-col gap-4"><textarea className="flex-1 bg-gray-50 border rounded-2xl p-4 resize-none" placeholder="Enter Epic..." value={input} onChange={e=>setInput(e.target.value)}/><button onClick={handleSplit} disabled={isThinking||!input} className="py-3 bg-black text-white rounded-xl font-bold">{isThinking?'Thinking...':'Split Story'}</button></div><div className="bg-white rounded-2xl border p-6 overflow-y-auto"><ul className="space-y-3">{output.map((s,i)=><li key={i} className="bg-gray-50 p-3 rounded-lg text-sm">{s}</li>)}</ul></div></div></div>;
};

// --- SIMULATION COMPONENT ---
const ProjectSimulationView = ({ caseData, onClose }: { caseData: any, onClose: () => void, currentUser?: UserProfile | null }) => {
    const [view, setView] = useState<'overview' | 'quiz' | 'result'>('overview');
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoadingQ, setIsLoadingQ] = useState(false);

    const startQuiz = async () => {
        setIsLoadingQ(true);
        // Fake questions for demo
        setTimeout(() => {
            setQuestions([{id:1, text:"Is this project risky?", options:["Yes","No"], correct:"Yes"}]);
            setView('quiz');
            setIsLoadingQ(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
                <button onClick={onClose}><X size={20}/></button>
                <h1 className="font-bold">{caseData.title}</h1>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                {view === 'overview' && (
                    <div className="max-w-4xl mx-auto text-center space-y-8 mt-10">
                        <img src={caseData.cover_image} className="w-full h-64 object-cover rounded-3xl shadow-xl"/>
                        <h2 className="text-4xl font-bold">{caseData.title}</h2>
                        <p className="text-xl text-gray-500">{caseData.summary}</p>
                        <button onClick={startQuiz} disabled={isLoadingQ} className="px-8 py-4 bg-black text-white rounded-xl font-bold text-lg">
                            {isLoadingQ ? 'Loading...' : 'Start Simulation'}
                        </button>
                    </div>
                )}
                {view === 'quiz' && (
                    <div className="max-w-2xl mx-auto text-center mt-20">
                        <h3 className="text-2xl font-bold mb-8">Question 1</h3>
                        <div className="space-y-4">
                            {questions[0].options.map((opt:string)=><button key={opt} onClick={()=>setView('result')} className="w-full p-4 bg-white border rounded-xl hover:bg-gray-50">{opt}</button>)}
                        </div>
                    </div>
                )}
                {view === 'result' && (
                    <div className="text-center mt-32">
                        <h2 className="text-4xl font-bold mb-4">Simulation Complete</h2>
                        <button onClick={onClose} className="px-6 py-3 bg-black text-white rounded-xl">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- WRAPPER FOR TOOLS ---
const LabToolView = ({ toolId, onClose }: { toolId: string, onClose: () => void }) => {
    const renderTool = () => {
        switch(toolId) {
            case 'cpm': return <CpmStudio />;
            case 'evm': return <EvmCalculator />;
            case 'pert': return <PertCalculator />;
            case 'roi': return <FinModeler />;
            case 'burn': return <AgileBurn />;
            case 'swot': return <SwotBoard />;
            case 'charter': return <ProjectCharter />; 
            case 'wbs': return <WbsTree />;
            case 'retro': return <RetroBoard />;
            case 'userstory': return <UserStorySplitter />;
            default: return <div className="flex justify-center items-center h-full text-gray-400">Tool Coming Soon</div>;
        }
    };
    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
           <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex items-center gap-2 font-bold text-sm"><ChevronLeft size={20}/> 返回实验室</button>
               <div className="font-bold text-gray-900">PM 实验室环境</div><div className="w-10"></div>
           </div>
           <div className="flex-1 overflow-auto p-6 md:p-10"><div className="max-w-6xl mx-auto h-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 overflow-hidden relative">{renderTool()}</div></div>
        </div>
    );
}

// --- ADVANCED LAB VIEW ---
const AdvancedLabView = ({ onSelect }: { onSelect: (tool: any) => void }) => {
    return (
        <div className="space-y-12 pb-10">
            {Object.entries(LAB_CATEGORIES).map(([category, data]) => (
                <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category === 'Quantitative' && <BarChart3 className="text-blue-500" />}
                        {category === 'Strategic' && <Shield className="text-purple-500" />}
                        {category === 'Toolkit' && <Layers className="text-green-500" />}
                        {data.label}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.tools.map((tool: any) => (
                            <div key={tool.id} onClick={() => onSelect(tool)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110`}><tool.icon size={80} /></div>
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 mb-4 group-hover:bg-black group-hover:text-white transition-colors shadow-sm"><tool.icon size={24} /></div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h4>
                                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">进入实验室 <ArrowRight size={12} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---
const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
        if (mainTab !== 'Foundation') return;
        setIsLoading(true);
        const { data } = await supabase.from('app_courses').select('*').eq('category', subTab).eq('status', 'Published').order('created_at', { ascending: false });
        if (data) setCourses(data);
        setIsLoading(false);
    };
    fetchCourses();
  }, [mainTab, subTab]);

  return (
    <>
        <div className={`pt-28 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen transition-all ${selectedItem ? 'max-w-full px-0 pt-0 pb-0 overflow-hidden h-screen' : ''}`}>
        {!selectedItem && (
            <div className="flex flex-col gap-6 mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div><h1 className="text-4xl font-bold text-gray-900 tracking-tight">学海无涯</h1><p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">书山有路勤为径</p></div>
                    <div className="bg-gray-200/50 p-1.5 rounded-full flex relative backdrop-blur-md shadow-inner">
                        {[{ id: 'Foundation', label: '基础', icon: Layout }, { id: 'Advanced', label: '实验室', icon: Cpu }, { id: 'Implementation', label: '实战', icon: Briefcase }].map((tab) => (
                            <button key={tab.id} onClick={() => setMainTab(tab.id as MainCategory)} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all ${mainTab === tab.id ? 'bg-white text-black shadow-md scale-100' : 'text-gray-500 hover:text-gray-800 scale-95'}`}><tab.icon size={16} /><span className="hidden sm:inline">{tab.label}</span></button>
                        ))}
                    </div>
                </div>
                {mainTab === 'Foundation' && (<div className="flex gap-4 animate-fade-in pl-1">{[{ id: 'Course', label: '体系课程' }, { id: 'Cert', label: '认证冲刺' }, { id: 'Official', label: '官方必修' }].map((sub) => (<button key={sub.id} onClick={() => setSubTab(sub.id as SubCategory)} className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${subTab === sub.id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{sub.label}</button>))}</div>)}
            </div>
        )}

        <div className="animate-fade-in-up w-full">
            {mainTab === 'Foundation' && !selectedItem && (
            <div className="min-h-[300px]">
                {isLoading ? (<div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-400"/></div>) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                        {courses.map(item => (
                            <div key={item.id} onClick={() => onNavigate(Page.CLASSROOM, item.id)} className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border border-gray-100/50">
                                <div className="aspect-[4/3] bg-gray-200 relative"><img src={item.image} className="w-full h-full object-cover" /><div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold">{item.duration || '2h 15m'}</div></div>
                                <div className="p-6"><h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3><p className="text-xs text-gray-500">{item.author}</p></div>
                            </div>
                        ))}
                    </div>
                ) : (<div className="text-center py-20 text-gray-400">暂无课程</div>)}
            </div>
            )}
            {mainTab === 'Advanced' && !selectedItem && (<AdvancedLabView onSelect={(t: any) => setSelectedItem({ type: 'lab', ...t })} />)}
            {mainTab === 'Implementation' && !selectedItem && (
                <div className="pb-10 grid grid-cols-1 gap-8">
                    {CLASSIC_CASES.map((caseItem) => (
                        <div key={caseItem.id} onClick={() => setSelectedItem({ type: 'simulation', data: caseItem })} className="group bg-white rounded-[2.5rem] p-0 border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row h-auto md:h-[320px]">
                            <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden"><img src={caseItem.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8"><div className="text-white"><div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${caseItem.difficulty === 'High' ? 'bg-red-500' : 'bg-blue-500'}`}>{caseItem.difficulty}</div><h3 className="text-2xl font-bold leading-tight">{caseItem.title}</h3></div></div></div>
                            <div className="flex-1 p-8 flex flex-col justify-between relative"><div><div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest"><Terminal size={14} className="text-blue-500"/>Interactive Simulation</div><p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{caseItem.summary}</p></div><div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6"><div className="flex items-center gap-4 text-xs font-bold text-gray-400"><span className="flex items-center gap-1"><History size={14}/> 0% Complete</span><span className="flex items-center gap-1"><Clock size={14}/> ~30 min</span></div><button className="flex items-center gap-2 text-xs font-bold bg-black text-white px-6 py-3 rounded-xl group-hover:bg-blue-600 transition-colors shadow-lg">Start Case <PlayCircle size={14} /></button></div></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </div>
        {selectedItem?.type === 'lab' && (<LabToolView toolId={selectedItem.id} onClose={() => setSelectedItem(null)}/>)}
        {selectedItem?.type === 'simulation' && (<ProjectSimulationView caseData={selectedItem.data} onClose={() => setSelectedItem(null)} currentUser={currentUser}/>)}
    </>
  );
};

export default LearningHub;
