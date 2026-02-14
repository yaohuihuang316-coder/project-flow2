
import React, { useState, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
import {
    PlayCircle, Clock, ChevronLeft, ChevronDown, Plus,
    Activity, Terminal,
    Network, BarChart3,
    GitMerge, Layers, Shield, Loader2,
    Layout, Cpu, Briefcase, FileText, RefreshCw, CloudLightning,
    DollarSign, Target, X,
    History, BookOpen,
    ArrowRight, Zap, Save,
    AlertTriangle, Play,
    CheckCircle2,
    Lock, Award, FileDown,
    FlaskConical
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, Bar, Legend, Line, ComposedChart, Area
} from 'recharts';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';

// --- Toast System ---
interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration: number;
}

interface ToastContextValue {
    showToast: (type: Toast['type'], message: string, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast必须在ToastProvider内使用');
    return context;
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
                        animate-slideIn backdrop-blur-sm border
                        ${toast.type === 'success' ? 'bg-green-500/90 border-green-300 text-white' : ''}
                        ${toast.type === 'error' ? 'bg-red-500/90 border-red-300 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-300 text-white' : ''}
                        ${toast.type === 'warning' ? 'bg-orange-500/90 border-orange-300 text-white' : ''}
                    `}
                    style={{ animation: 'slideIn 0.3s ease-out' }}
                >
                    <span className="text-xl">
                        {toast.type === 'success' && '✅'}
                        {toast.type === 'error' && '❌'}
                        {toast.type === 'info' && 'ℹ️'}
                        {toast.type === 'warning' && '⚠️'}
                    </span>
                    <span className="flex-1 font-medium">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="hover:bg-white/20 rounded p-1 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((type: Toast['type'], message: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev.slice(-2), newToast]); // 最多显示3个

        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    const value: ToastContextValue = {
        showToast,
        success: (msg) => showToast('success', msg),
        error: (msg) => showToast('error', msg),
        info: (msg) => showToast('info', msg),
        warning: (msg) => showToast('warning', msg),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

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
    } catch (e) { }
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) { }
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
    },
    ProLab: {
        label: 'Pro Lab (高级实验室)',
        color: 'from-amber-500 to-orange-600',
        desc: '专业会员专属高级工具集',
        tools: [
            { id: 'prolab', name: '进入 Pro Lab', icon: FlaskConical, isExternal: true },
        ],
        requiresMembership: 'pro'
    }
};

// 保留为参考，当前使用数据库数据
// const CLASSIC_CASES = [
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
        id: 'case-tesla',
        title: 'Model 3 "生产地狱"',
        summary: '特斯拉如何通过激进的自动化策略遭遇瓶颈，又是如何通过快速迭代和帐篷工厂解决产能危机的。',
        difficulty: 'Medium',
        cover_image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: 'case-olympics',
        title: '2012 伦敦奥运会',
        summary: '教科书级别的成功项目管理。如何在绝对不可延期的截止日期前，通过风险管理确保按时交付。',
        difficulty: 'Medium',
        cover_image: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&q=80&w=800',
    },
    {
        id: 'case-apollo',
        title: '阿波罗 13 号救援',
        summary: '“失败不是选项”。在极端资源受限（氧气、电力）的情况下，如何通过敏捷决策和团队协作将宇航员带回家。',
        difficulty: 'High',
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
        // ✅ 边界处理: 空列表检查
        if (!tasks || tasks.length === 0) {
            return [];
        }

        const taskMap = new Map(tasks.map(t => [t.id, { ...t, es: 0, ef: 0, ls: Infinity, lf: Infinity, slack: 0, isCritical: false, level: 0 }]));
        const MAX_ITERATIONS = tasks.length * 2; // 防止循环依赖导致无限循环

        // 1. Forward Pass (带循环检测)
        let changed = true;
        let forwardIterations = 0;
        while (changed && forwardIterations < MAX_ITERATIONS) {
            changed = false;
            forwardIterations++;

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

        // ⚠️ 循环依赖警告
        if (forwardIterations >= MAX_ITERATIONS) {
            console.warn('CPM Warning: 可能存在循环依赖,已达到最大迭代次数');
        }

        // 2. Backward Pass (优化收敛判断)
        const projectDuration = Math.max(0, ...Array.from(taskMap.values()).map(t => t.ef));

        // ✅ 初始化所有终点任务的LF
        for (const task of taskMap.values()) {
            const successors = Array.from(taskMap.values()).filter(t => t.predecessors.includes(task.id));
            if (successors.length === 0 && task.lf === Infinity) {
                task.lf = projectDuration;
                task.ls = task.lf - task.duration;
            }
        }

        // 使用收敛判断替代固定迭代
        let backwardChanged = true;
        let backwardIterations = 0;
        while (backwardChanged && backwardIterations < MAX_ITERATIONS) {
            backwardChanged = false;
            backwardIterations++;

            for (const task of taskMap.values()) {
                const successors = Array.from(taskMap.values()).filter(t => t.predecessors.includes(task.id));
                if (successors.length > 0) {
                    const minSuccLs = Math.min(...successors.map(s => s.ls));
                    const newLf = minSuccLs;
                    const newLs = newLf - task.duration;

                    // 只在值真正变化时标记
                    if (task.lf !== newLf || task.ls !== newLs) {
                        task.lf = newLf;
                        task.ls = newLs;
                        backwardChanged = true;
                    }
                }
            }
        }

        // 3. Slack 计算 (✅ 提升浮点容差)
        for (const task of taskMap.values()) {
            task.slack = task.ls - task.es;
            // 浮点容差从 0.001 提升至 0.1
            if (Math.abs(task.slack) < 0.1) {
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
        { id: 'A', name: '需求分析', duration: 3, predecessors: [], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
        { id: 'B', name: '原型设计', duration: 5, predecessors: ['A'], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
        { id: 'C', name: '后端架构', duration: 4, predecessors: ['A'], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
        { id: 'D', name: '前端开发', duration: 6, predecessors: ['B'], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
        { id: 'E', name: 'API开发', duration: 5, predecessors: ['C'], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
        { id: 'F', name: '集成测试', duration: 3, predecessors: ['D', 'E'], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 },
    ]);
    const [calculatedTasks, setCalculatedTasks] = useState<CpmTask[]>([]);
    const [projectDuration, setProjectDuration] = useState(0);
    const [criticalCount, setCriticalCount] = useState(0);

    // UI State: Controls whether the critical path is revealed
    const [isCalculated, setIsCalculated] = useState(false);

    // Auto-calculate logic (for layout only)
    useEffect(() => {
        const result = CpmEngine.calculate(tasks);
        setCalculatedTasks(result);
        setProjectDuration(Math.max(0, ...result.map(t => t.ef)));
        setCriticalCount(result.filter(t => t.isCritical).length);
        // Do NOT set isCalculated to true here, we wait for user action
    }, [tasks]);

    const handleStartCalculation = () => {
        setIsCalculated(true);
    };

    const getTaskPos = (task: CpmTask) => {
        const levelNodes = calculatedTasks.filter(t => t.level === task.level).sort((a, b) => a.id.localeCompare(b.id));
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
        if (field === 'predecessors') {
            // @ts-ignore
            newTasks[idx][field] = value.split(/[,，]/).map(s => s.trim().toUpperCase()).filter(s => s);
        }
        setTasks(newTasks);
        setIsCalculated(false); // Reset visualization on edit
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
                style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* 2. Floating Glass Console (Left) */}
            <div className="absolute top-6 left-6 bottom-6 w-80 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2rem] z-30 flex flex-col overflow-hidden transition-all duration-300">
                <div className="p-6 border-b border-white/20 bg-white/40">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Network size={20} className="text-blue-600" /> 任务控制台
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
                                        onChange={(e) => updateTask(i, 'name', e.target.value)}
                                        placeholder="Task Name"
                                    />
                                </div>
                                <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Duration</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none"
                                        value={task.duration}
                                        onChange={(e) => updateTask(i, 'duration', Number(e.target.value))}
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-colors">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Predecessors</label>
                                    <input
                                        className="w-full bg-transparent text-xs font-bold text-gray-700 outline-none uppercase"
                                        value={task.predecessors.join(',')}
                                        onChange={(e) => updateTask(i, 'predecessors', e.target.value)}
                                        placeholder="Ex: A,B"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setTasks([...tasks, { id: String.fromCharCode(65 + tasks.length), name: 'New Task', duration: 1, predecessors: [], es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false, level: 0 }])}
                        className="w-full py-4 border-2 border-dashed border-gray-300/50 rounded-2xl text-gray-400 font-bold hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                        <Plus size={16} /> Add Task
                    </button>
                </div>

                {/* Calculate Button Area */}
                <div className="p-4 bg-white/50 border-t border-white/20">
                    <button
                        onClick={handleStartCalculation}
                        className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${isCalculated
                            ? 'bg-gray-900 text-white cursor-default'
                            : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
                            }`}
                    >
                        {isCalculated ? (
                            <>
                                <CheckCircle2 size={18} className="text-green-400" /> Calculation Done
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" /> 开始计算 (Calculate)
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 3. HUD (Heads-Up Display) */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-8 py-3 rounded-full shadow-2xl border border-white/50 z-20 flex items-center gap-8 animate-fade-in-up transition-opacity duration-500 ${isCalculated ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Duration</span>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 font-mono">
                        {isCalculated ? projectDuration : '--'}<span className="text-sm text-gray-400 ml-1">days</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical Tasks</span>
                    <div className="text-2xl font-black text-[#FF3B30] font-mono flex items-center gap-2">
                        {isCalculated ? criticalCount : '--'}
                        {isCalculated && criticalCount > 0 && <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"></div>}
                    </div>
                </div>
            </div>

            {/* 4. Graph Canvas Area */}
            <div className="flex-1 ml-80 overflow-auto relative custom-scrollbar">
                <div className="min-w-[1000px] min-h-[800px] relative p-20">

                    {/* SVG Layer (Edges) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                                <path d="M0,0 L0,10 L10,5 z" fill="#D1D5DB" />
                            </marker>
                            <marker id="arrow-critical" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                                <path d="M0,0 L0,10 L10,5 z" fill="#FF3B30" />
                            </marker>
                        </defs>
                        {calculatedTasks.map((task) => {
                            const end = getTaskPos(task);
                            const endX = end.x;
                            const endY = end.y + 40; // 节点高度80px，中心在40px处

                            return task.predecessors.map(pid => {
                                const parent = calculatedTasks.find(t => t.id === pid);
                                if (!parent) return null;
                                const start = getTaskPos(parent);
                                const startX = start.x + 160; // 节点宽度160px，右边缘
                                const startY = start.y + 40; // 节点中心

                                // Determine if this specific connection is critical
                                const isCriticalLink = task.isCritical && parent.isCritical && (Math.abs(parent.ef - task.es) < 0.01);

                                // Show critical style ONLY if button clicked AND it is critical
                                const showCritical = isCalculated && isCriticalLink;

                                const midX = (startX + endX) / 2;
                                const path = `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;

                                // Calculate bezier curve midpoint for label placement
                                // Cubic bezier: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
                                // At t=0.5: x = (startX + 6*midX + endX) / 8, y = (startY + endY) / 2
                                const labelX = (startX + 6 * midX + endX) / 8;
                                const labelY = (startY + endY) / 2;

                                return (
                                    <g key={`${pid}-${task.id}`}>
                                        <path
                                            d={path}
                                            fill="none"
                                            stroke={showCritical ? "#FF3B30" : "#E5E7EB"}
                                            strokeWidth={showCritical ? 3 : 2}
                                            markerEnd={showCritical ? "url(#arrow-critical)" : "url(#arrow)"}
                                            strokeDasharray={showCritical ? "8,4" : "none"}
                                            className={showCritical ? "animate-flow" : "transition-colors duration-1000"}
                                            style={{ opacity: showCritical ? 1 : 0.4 }}
                                        />
                                        {/* Slack Label on Curve if Slack > 0 */}
                                        {isCalculated && !isCriticalLink && parent.slack > 0 && (
                                            <g>
                                                {/* Background for better readability */}
                                                <circle cx={labelX} cy={labelY} r="12" fill="white" opacity="0.9" />
                                                <text 
                                                    x={labelX} 
                                                    y={labelY} 
                                                    fill="#34C759" 
                                                    fontSize="10" 
                                                    fontWeight="bold" 
                                                    textAnchor="middle" 
                                                    dominantBaseline="middle"
                                                >
                                                    +{parent.slack}d
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            });
                        })}
                    </svg>

                    {/* HTML Layer (Smart Nodes) */}
                    {calculatedTasks.map((task) => {
                        const pos = getTaskPos(task);
                        const isCriticalNode = isCalculated && task.isCritical;

                        return (
                            <div
                                key={task.id}
                                className={`absolute w-40 h-20 rounded-xl p-3 flex flex-col justify-between transition-all duration-500 z-10
                                    ${isCriticalNode
                                        ? 'bg-white border-2 border-[#FF3B30] shadow-[0_8px_30px_rgba(255,59,48,0.25)] scale-105'
                                        : 'bg-white border border-gray-200 shadow-sm opacity-90'
                                    }`}
                                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-gray-800 truncate pr-2">{task.name}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${isCriticalNode ? 'bg-[#FF3B30]' : 'bg-gray-800'}`}>
                                        {task.id}
                                    </span>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Duration</span>
                                        <span className="text-sm font-mono font-bold text-gray-700">{task.duration}d</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">ES / EF</span>
                                        {isCalculated ? (
                                            <span className="text-[10px] font-mono text-gray-600 font-semibold">{task.es} → {task.ef}</span>
                                        ) : (
                                            <span className="text-[10px] font-mono text-gray-300">- → -</span>
                                        )}
                                    </div>
                                </div>

                                {/* Slack Bubble */}
                                {isCalculated && task.slack > 0 && (
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#34C759] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap animate-bounce-in">
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
            const pv = flow / Math.pow(1 + discountRate / 100, i + 1);
            cumulative += pv;
            return { year: `Y${i + 1}`, flow: flow, pv: Math.round(pv), cumulative: Math.round(cumulative) };
        });
    }, [initInv, cashFlows, discountRate]);

    const npv = data[data.length - 1]?.cumulative || -initInv;
    const roi = ((data.reduce((a, b) => a + b.flow, 0) - initInv) / initInv) * 100;
    const breakEvenIndex = data.findIndex(d => d.cumulative >= 0);
    const payBackPeriod = breakEvenIndex === -1 ? 'N/A' : `${breakEvenIndex + 1} Years`;

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 p-6 animate-fade-in">
            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign className="text-green-600" /> 核心参数</h3>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Initial Investment</label><input type="number" className="w-full text-xl font-bold border-b border-gray-200 outline-none py-1" value={initInv} onChange={(e) => setInitInv(Number(e.target.value))} /></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Discount Rate (%)</label><div className="flex items-center gap-2"><input type="range" min="0" max="20" className="flex-1 accent-green-600" value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value))} /><span className="text-sm font-mono">{discountRate}%</span></div></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-gray-900">现金流预测</h3><button onClick={() => setCashFlows([...cashFlows, 20000])} className="p-1 bg-black text-white rounded hover:bg-gray-800"><Plus size={14} /></button></div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {cashFlows.map((cf, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm"><span className="w-8 font-bold text-gray-400">Y{i + 1}</span><input type="number" className="flex-1 bg-gray-50 rounded px-2 py-1 text-right" value={cf} onChange={(e) => { const n = [...cashFlows]; n[i] = Number(e.target.value); setCashFlows(n); }} /><button onClick={() => setCashFlows(cashFlows.filter((_, idx) => idx !== i))} className="text-red-300 hover:text-red-500"><X size={14} /></button></div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black text-white p-5 rounded-2xl"><p className="text-xs font-bold text-gray-500 uppercase">NPV (净现值)</p><p className={`text-2xl font-mono font-bold ${npv > 0 ? 'text-green-400' : 'text-red-400'}`}>${npv.toLocaleString()}</p></div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl"><p className="text-xs font-bold text-gray-400 uppercase">ROI</p><p className={`text-2xl font-mono font-bold ${roi > 0 ? 'text-green-600' : 'text-red-500'}`}>{roi.toFixed(1)}%</p></div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl"><p className="text-xs font-bold text-gray-400 uppercase">Payback Period</p><p className="text-2xl font-mono font-bold text-blue-600">{payBackPeriod}</p></div>
                </div>
                <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[{ year: 'Start', flow: 0, cumulative: -initInv }, ...data]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <ReferenceLine y={0} stroke="#000" strokeOpacity={0.2} />
                            <Bar dataKey="flow" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Annual Flow" />
                            <Line type="monotone" dataKey="cumulative" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} name="Cumulative NPV" />
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
        for (let i = 0; i <= days; i++) {
            const ideal = totalPoints - (totalPoints / days) * i;
            if (i > 0 && i < days) {
                actual -= Math.floor(Math.random() * 12); // Sim burn
                if (actual < 0) actual = 0;
                if (Math.random() > 0.8) scope += Math.floor(Math.random() * 10); // Sim creep
            }
            arr.push({ day: i, Ideal: Math.round(ideal), Actual: i > 8 ? null : actual, Scope: scope });
        }
        setData(arr);
    }, [days]);
    return (
        <div className="h-full flex flex-col p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Zap size={20} /></div>
                    <div><h3 className="font-bold text-gray-900">Sprint 42 Burn-down</h3><p className="text-xs text-gray-500">Velocity: 24pts / day</p></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setDays(days === 14 ? 21 : 14)} className="px-3 py-1 bg-white border rounded-lg text-xs font-bold">{days} Day Sprint</button>
                    <button onClick={() => setData([...data])} className="p-2 bg-white border rounded-lg text-gray-500 hover:text-black"><RefreshCw size={14} /></button>
                </div>
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Sprint Days', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <RechartsTooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="Ideal" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                        <Area type="monotone" dataKey="Actual" stroke="#2563EB" fill="url(#colorActual)" strokeWidth={3} />
                        <Line type="step" dataKey="Scope" stroke="#EF4444" strokeWidth={2} dot={false} />
                        <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                    </ComposedChart>
                </ResponsiveContainer>
                <div className="absolute top-16 right-10 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 animate-bounce-in">
                    <AlertTriangle size={16} className="text-red-500" />
                    <div><p className="text-[10px] font-bold text-red-800 uppercase">Scope Creep Detected</p><p className="text-xs text-red-600">+15 pts added mid-sprint</p></div>
                </div>
            </div>
        </div>
    );
};

// 4. WBS Tree (Advanced) - INTERACTIVE VERSION
interface WbsNodeData {
    code: string;
    name: string;
    progress: number;
    children?: WbsNodeData[];
}

interface WbsNodeProps {
    data: WbsNodeData;
    level: number;
    onUpdate: (code: string, updates: Partial<WbsNodeData>) => void;
    onDelete: (code: string) => void;
    onAddChild: (parentCode: string) => void;
}

const WbsNode: React.FC<WbsNodeProps> = ({ data, level, onUpdate, onDelete, onAddChild }) => {
    const [expanded, setExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(data.name);
    const progressColor = data.progress === 100 ? 'bg-green-500' : data.progress > 50 ? 'bg-blue-500' : 'bg-gray-300';

    const handleNameSave = () => {
        onUpdate(data.code, { name: editName });
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col items-center relative">
            {level > 0 && <div className="h-6 w-px bg-gray-300"></div>}
            <div className={`relative z-10 bg-white border-2 rounded-xl p-3 w-48 text-center shadow-sm transition-all hover:scale-105 ${data.progress === 100 ? 'border-green-200' : 'border-gray-100'}`}>
                <div className="text-[10px] font-bold text-gray-400 mb-1">{data.code}</div>

                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className="text-sm font-bold text-gray-800 w-full px-1 border-b border-blue-500 outline-none text-center"
                        autoFocus
                    />
                ) : (
                    <div
                        className="text-sm font-bold text-gray-800 leading-tight mb-2 cursor-pointer hover:text-blue-600"
                        onClick={() => setIsEditing(true)}
                    >
                        {data.name}
                    </div>
                )}

                <div className="mb-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={data.progress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(data.code, { progress: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${progressColor} transition-all`} style={{ width: `${data.progress}%` }}></div>
                </div>

                <div className="text-xs font-mono font-bold text-gray-600">{data.progress}%</div>

                <div className="flex gap-1 mt-2 justify-center">
                    <button
                        onClick={() => onAddChild(data.code)}
                        className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs"
                        title="添加子任务"
                    >
                        <Plus size={12} />
                    </button>
                    {level > 0 && (
                        <button
                            onClick={() => onDelete(data.code)}
                            className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                            title="删除"
                        >
                            <X size={12} />
                        </button>
                    )}
                    {data.children && data.children.length > 0 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs"
                        >
                            <ChevronDown size={12} className={expanded ? 'rotate-180' : ''} />
                        </button>
                    )}
                </div>
            </div>
            {expanded && data.children && data.children.length > 0 && (
                <div className="flex gap-4 mt-0 pt-0 relative">
                    {data.children.length > 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-12rem)] h-px bg-transparent"><div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div></div>}
                    {data.children?.map((child: WbsNodeData) => (
                        <WbsNode
                            key={child.code}
                            data={child}
                            level={level + 1}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const WbsTree = () => {
    const initialData: WbsNodeData = {
        code: '1.0',
        name: '新建项目 (点击编辑)',
        progress: 0,
        children: []
    };

    const [wbsData, setWbsData] = useState<WbsNodeData>(initialData);
    const [nextCode, setNextCode] = useState(2);
    const [treeId, setTreeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 加载或创建WBS树
    useEffect(() => {
        const loadOrCreateTree = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 查找用户的WBS树
                const { data: trees } = await supabase
                    .from('lab_wbs_trees')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                let currentTreeId: string;

                if (trees && trees.length > 0) {
                    // 使用现有树
                    currentTreeId = trees[0].id;
                } else {
                    // 创建新树
                    const { data: newTree } = await supabase
                        .from('lab_wbs_trees')
                        .insert({
                            user_id: user.id,
                            project_name: '我的WBS项目',
                            description: '工作分解结构'
                        })
                        .select()
                        .single();

                    if (!newTree) {
                        setLoading(false);
                        return;
                    }
                    currentTreeId = newTree.id;

                    // 创建根节点
                    await supabase.from('lab_wbs_nodes').insert({
                        tree_id: currentTreeId,
                        code: '1.0',
                        name: '新建项目 (点击编辑)',
                        progress: 0,
                        parent_code: null
                    });
                }

                setTreeId(currentTreeId);

                // 加载节点数据
                const { data: nodes } = await supabase
                    .from('lab_wbs_nodes')
                    .select('*')
                    .eq('tree_id', currentTreeId)
                    .order('code');

                if (nodes && nodes.length > 0) {
                    // 构建树状结构
                    const tree = buildTree(nodes);
                    setWbsData(tree);

                    // 计算下一个code
                    const maxCode = Math.max(...nodes.map((n: any) => {
                        const parts = n.code.split('.');
                        return parseInt(parts[0]);
                    }));
                    setNextCode(maxCode + 1);
                }

                setLoading(false);
            } catch (error) {
                console.error('加载WBS数据失败:', error);
                setLoading(false);
            }
        };

        loadOrCreateTree();
    }, []);

    // 构建树状结构
    const buildTree = (nodes: any[]): WbsNodeData => {
        const nodeMap = new Map<string, WbsNodeData>();

        // 创建所有节点
        nodes.forEach((node: any) => {
            nodeMap.set(node.code, {
                code: node.code,
                name: node.name,
                progress: node.progress,
                children: []
            });
        });

        // 建立父子关系
        let root: WbsNodeData | null = null;
        nodes.forEach((node: any) => {
            const current = nodeMap.get(node.code)!;
            if (node.parent_code) {
                const parent = nodeMap.get(node.parent_code);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(current);
                }
            } else {
                root = current;
            }
        });

        return root || initialData;
    };

    // 更新节点（数据库+本地）
    const updateNode = async (code: string, updates: Partial<WbsNodeData>) => {
        if (!treeId) return;

        try {
            // 更新数据库
            await supabase
                .from('lab_wbs_nodes')
                .update({
                    name: updates.name,
                    progress: updates.progress
                })
                .eq('tree_id', treeId)
                .eq('code', code);

            // 更新本地状态
            const updateNodeRecursive = (node: WbsNodeData): WbsNodeData => {
                if (node.code === code) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: node.children.map(updateNodeRecursive)
                    };
                }
                return node;
            };

            setWbsData(updateNodeRecursive(wbsData));
        } catch (error) {
            console.error('更新节点失败:', error);
        }
    };

    // 删除节点（数据库+本地）
    const deleteNode = async (code: string) => {
        if (!treeId || !window.confirm('确定删除此节点及其所有子节点?')) return;

        try {
            // 递归获取所有要删除的节点code
            const getCodes = (node: WbsNodeData): string[] => {
                let codes = [node.code];
                if (node.children) {
                    node.children.forEach(child => {
                        codes = codes.concat(getCodes(child));
                    });
                }
                return codes;
            };

            const findNode = (node: WbsNodeData, targetCode: string): WbsNodeData | null => {
                if (node.code === targetCode) return node;
                if (node.children) {
                    for (const child of node.children) {
                        const found = findNode(child, targetCode);
                        if (found) return found;
                    }
                }
                return null;
            };

            const nodeToDelete = findNode(wbsData, code);
            if (nodeToDelete) {
                const codesToDelete = getCodes(nodeToDelete);

                // 从数据库删除
                await supabase
                    .from('lab_wbs_nodes')
                    .delete()
                    .eq('tree_id', treeId)
                    .in('code', codesToDelete);
            }

            // 更新本地状态
            const deleteNodeRecursive = (node: WbsNodeData): WbsNodeData | null => {
                if (node.code === code) return null;
                if (node.children) {
                    return {
                        ...node,
                        children: node.children
                            .map(deleteNodeRecursive)
                            .filter((n): n is WbsNodeData => n !== null)
                    };
                }
                return node;
            };

            const updated = deleteNodeRecursive(wbsData);
            if (updated) setWbsData(updated);
        } catch (error) {
            console.error('删除节点失败:', error);
        }
    };

    // 添加子节点（数据库+本地）
    const addChild = async (parentCode: string) => {
        if (!treeId) return;

        const childName = prompt('输入子任务名称:');
        if (!childName || !childName.trim()) return;

        try {
            const newCode = `${parentCode}.${nextCode}`;

            // 插入数据库
            await supabase.from('lab_wbs_nodes').insert({
                tree_id: treeId,
                code: newCode,
                name: childName.trim(),
                progress: 0,
                parent_code: parentCode
            });

            // 更新本地状态
            const addChildRecursive = (node: WbsNodeData): WbsNodeData => {
                if (node.code === parentCode) {
                    return {
                        ...node,
                        children: [
                            ...(node.children || []),
                            {
                                code: newCode,
                                name: childName.trim(),
                                progress: 0,
                                children: []
                            }
                        ]
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: node.children.map(addChildRecursive)
                    };
                }
                return node;
            };

            setWbsData(addChildRecursive(wbsData));
            setNextCode(nextCode + 1);
        } catch (error) {
            console.error('添加子节点失败:', error);
        }
    };

    // 重置（数据库+本地）
    const handleReset = async () => {
        if (!treeId || !window.confirm('确定要重置整个WBS树吗？')) return;

        try {
            // 删除所有节点
            await supabase
                .from('lab_wbs_nodes')
                .delete()
                .eq('tree_id', treeId);

            // 创建新根节点
            await supabase.from('lab_wbs_nodes').insert({
                tree_id: treeId,
                code: '1.0',
                name: '新建项目 (点击编辑)',
                progress: 0,
                parent_code: null
            });

            setWbsData(initialData);
            setNextCode(2);
        } catch (error) {
            console.error('重置失败:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50/50 rounded-3xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Network className="text-blue-600" /> WBS 工作分解结构
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            // 导出WBS为PDF
                            const doc = new jsPDF();
                            let yPos = 20;

                            // 封面
                            doc.setFontSize(20);
                            doc.text('WBS 工作分解结构报告', 105, yPos, { align: 'center' });
                            yPos += 15;

                            doc.setFontSize(12);
                            doc.text(`项目: ${wbsData.name}`, 20, yPos);
                            yPos += 8;
                            doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, 20, yPos);
                            yPos += 15;

                            // 统计信息
                            const countNodes = (node: WbsNodeData): number => {
                                return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0);
                            };
                            const totalTasks = countNodes(wbsData);
                            const calcAvgProgress = (node: WbsNodeData): number => {
                                const self = node.progress;
                                const childAvg = node.children && node.children.length > 0
                                    ? node.children.reduce((sum, c) => sum + calcAvgProgress(c), 0) / node.children.length
                                    : 0;
                                return node.children && node.children.length > 0 ? (self + childAvg) / 2 : self;
                            };
                            const avgProgress = Math.round(calcAvgProgress(wbsData));

                            doc.setFontSize(14);
                            doc.text('项目概览', 20, yPos);
                            yPos += 8;
                            doc.setFontSize(10);
                            doc.text(`总任务数: ${totalTasks}`, 25, yPos);
                            yPos += 6;
                            doc.text(`整体进度: ${avgProgress}%`, 25, yPos);
                            yPos += 10;

                            // 绘制WBS树
                            doc.setFontSize(14);
                            doc.text('任务分解结构', 20, yPos);
                            yPos += 8;

                            const renderNode = (node: WbsNodeData, level: number, y: number): number => {
                                if (y > 270) {
                                    doc.addPage();
                                    y = 20;
                                }

                                const indent = 20 + level * 10;
                                doc.setFontSize(10);
                                doc.text(`${node.code} ${node.name}`, indent, y);
                                doc.text(`${node.progress}%`, 180, y);

                                // 进度条
                                doc.setDrawColor(200, 200, 200);
                                doc.rect(150, y - 3, 25, 4);
                                doc.setFillColor(66, 133, 244);
                                doc.rect(150, y - 3, 25 * (node.progress / 100), 4, 'F');

                                y += 7;

                                if (node.children) {
                                    for (const child of node.children) {
                                        y = renderNode(child, level + 1, y);
                                    }
                                }

                                return y;
                            };

                            renderNode(wbsData, 0, yPos);

                            doc.save(`WBS_${wbsData.code}_${new Date().toISOString().split('T')[0]}.pdf`);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 flex items-center gap-2"
                    >
                        <FileDown size={14} />
                        导出PDF
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 flex items-center gap-2"
                    >
                        <RefreshCw size={14} />
                        重置
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <WbsNode
                    data={wbsData}
                    level={0}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onAddChild={addChild}
                />
            </div>
        </div>
    );
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
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="text-blue-600" /> 挣值管理 (EVM)</h2>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 bg-gray-50 p-6 rounded-3xl h-fit">
                    {['pv', 'ev', 'ac', 'bac'].map(k => (
                        <div key={k} className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-gray-500">{k.toUpperCase()}</label><input type="number" value={(inputs as any)[k]} onChange={e => setInputs({ ...inputs, [k]: Number(e.target.value) })} className="w-24 p-2 rounded border text-right font-mono" /></div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center"><div className="text-xs text-gray-400 font-bold uppercase">SPI</div><div className={`text-2xl font-bold ${res?.spi >= 1 ? 'text-green-500' : 'text-red-500'}`}>{res?.spi}</div></div>
                        <div className="p-4 bg-white border rounded-xl shadow-sm text-center"><div className="text-xs text-gray-400 font-bold uppercase">CPI</div><div className={`text-2xl font-bold ${res?.cpi >= 1 ? 'text-green-500' : 'text-red-500'}`}>{res?.cpi}</div></div>
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
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Activity className="text-purple-600" /> PERT 三点估算</h2>
            <div className="grid grid-cols-3 gap-6 mb-12">
                {[{ id: 'o', label: 'Optimistic', c: 'text-green-600' }, { id: 'm', label: 'Most Likely', c: 'text-blue-600' }, { id: 'p', label: 'Pessimistic', c: 'text-red-600' }].map(f => (
                    <div key={f.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><label className={`block text-xs font-bold uppercase mb-2 ${f.c}`}>{f.label}</label><input type="number" className="w-full text-2xl font-bold bg-transparent outline-none border-b border-gray-300" value={(v as any)[f.id]} onChange={e => setV({ ...v, [f.id]: Number(e.target.value) })} /></div>
                ))}
            </div>
            <div className="bg-black text-white rounded-3xl p-8 shadow-xl flex justify-between items-center"><div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Expected</p><div className="text-5xl font-mono font-bold">{e.toFixed(1)}d</div></div><div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Std Dev</p><div className="text-3xl font-mono text-gray-300">± {sd.toFixed(2)}</div></div></div>
        </div>
    );
};

const SwotBoard = () => {
    const q = [{ id: 's', t: 'Strengths', c: 'bg-green-50 border-green-200' }, { id: 'w', t: 'Weaknesses', c: 'bg-orange-50 border-orange-200' }, { id: 'o', t: 'Opportunities', c: 'bg-blue-50 border-blue-200' }, { id: 't', t: 'Threats', c: 'bg-red-50 border-red-200' }];
    const [items, setItems] = useState<any>({ s: ['团队经验丰富'], w: ['资金不足'], o: ['AI 市场爆发'], t: ['竞品价格战'] });
    const add = (id: string) => { const t = prompt('Add:'); if (t) setItems({ ...items, [id]: [...items[id], t] }); };
    return <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-blue-600" /> SWOT 战略分析</h2><div className="flex-1 grid grid-cols-2 gap-4">{q.map(x => (<div key={x.id} className={`rounded-2xl border p-4 flex flex-col ${x.c}`}><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm uppercase">{x.t}</h3><button onClick={() => add(x.id)}><ArrowRight size={16} /></button></div><ul className="space-y-2">{items[x.id].map((t: string, i: number) => <li key={i} className="text-sm bg-white/60 p-2 rounded">{t}</li>)}</ul></div>))}</div></div>;
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
        <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="text-blue-500" /> 章程生成器</h2>
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                {step === 1 && (<div className="w-full space-y-4 animate-fade-in-up"><h3 className="text-lg font-bold">1. 项目名称</h3><input placeholder="Project Name" className="w-full p-4 bg-gray-50 rounded-xl border" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} /><button onClick={() => setStep(2)} disabled={!data.name} className="w-full py-3 bg-black text-white rounded-xl font-bold">Next</button></div>)}
                {step === 2 && (<div className="w-full space-y-4 animate-fade-in-up"><h3 className="text-lg font-bold">2. 项目目标</h3><textarea placeholder="SMART Goal..." className="w-full p-4 bg-gray-50 rounded-xl border h-32" value={data.goal} onChange={e => setData({ ...data, goal: e.target.value })} /><div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Back</button><button onClick={generateCharter} disabled={isGenerating || !data.goal} className="flex-1 py-3 bg-black text-white rounded-xl font-bold flex justify-center gap-2">{isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Generate</button></div></div>)}
                {step === 3 && (<div className="w-full h-full flex flex-col space-y-6 animate-fade-in-up bg-yellow-50 p-8 rounded-3xl border border-yellow-200 shadow-sm relative overflow-hidden"><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><div className="prose prose-sm font-serif whitespace-pre-line">{content}</div></div><button onClick={() => alert('PDF!')} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold w-fit"><Save size={14} /> Export</button></div>)}
            </div>
        </div>
    );
};

// 2.3.3 Retro - INTERACTIVE VERSION WITH DATABASE
const RetroBoard = () => {
    const [notes, setNotes] = useState({
        start: [] as string[],
        stop: [] as string[],
        continue: [] as string[]
    });
    const [boardId, setBoardId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 加载或创建回顾板
    useEffect(() => {
        const loadOrCreateBoard = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 查找用户的回顾板
                const { data: boards } = await supabase
                    .from('lab_retro_boards')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                let currentBoardId: string;

                if (boards && boards.length > 0) {
                    currentBoardId = boards[0].id;
                } else {
                    // 创建新回顾板
                    const { data: newBoard } = await supabase
                        .from('lab_retro_boards')
                        .insert({
                            user_id: user.id,
                            sprint_name: '我的迭代回顾',
                            sprint_date: new Date().toISOString().split('T')[0]
                        })
                        .select()
                        .single();

                    if (!newBoard) {
                        setLoading(false);
                        return;
                    }
                    currentBoardId = newBoard.id;
                }

                setBoardId(currentBoardId);

                // 加载便签
                const { data: notesData } = await supabase
                    .from('lab_retro_notes')
                    .select('*')
                    .eq('board_id', currentBoardId);

                if (notesData && notesData.length > 0) {
                    const categorized = {
                        start: notesData.filter((n: any) => n.column_type === 'start').map((n: any) => n.content),
                        stop: notesData.filter((n: any) => n.column_type === 'stop').map((n: any) => n.content),
                        continue: notesData.filter((n: any) => n.column_type === 'continue').map((n: any) => n.content)
                    };
                    setNotes(categorized);
                }

                setLoading(false);
            } catch (error) {
                console.error('加载回顾板数据失败:', error);
                setLoading(false);
            }
        };

        loadOrCreateBoard();
    }, []);

    // 添加便签（数据库+本地）
    const addNote = async (column: 'start' | 'stop' | 'continue') => {
        if (!boardId) return;

        const text = prompt(`添加到 ${column.toUpperCase()} 栏:`);
        if (!text || !text.trim()) return;

        try {
            //插入数据库
            await supabase.from('lab_retro_notes').insert({
                board_id: boardId,
                column_type: column,
                content: text.trim()
            });

            // 更新本地状态
            setNotes({
                ...notes,
                [column]: [...notes[column], text.trim()]
            });
        } catch (error) {
            console.error('添加便签失败:', error);
        }
    };

    // 删除便签（数据库+本地）
    const deleteNote = async (column: 'start' | 'stop' | 'continue', index: number) => {
        if (!boardId) return;

        const noteContent = notes[column][index];

        try {
            // 从数据库删除（根据内容匹配）
            await supabase
                .from('lab_retro_notes')
                .delete()
                .eq('board_id', boardId)
                .eq('column_type', column)
                .eq('content', noteContent);

            // 更新本地状态
            setNotes({
                ...notes,
                [column]: notes[column].filter((_, i) => i !== index)
            });
        } catch (error) {
            console.error('删除便签失败:', error);
        }
    };

    // 清空全部（数据库+本地）
    const clearAll = async () => {
        if (!boardId || !window.confirm('确定要清空所有便签吗？')) return;

        try {
            // 从数据库删除所有便签
            await supabase
                .from('lab_retro_notes')
                .delete()
                .eq('board_id', boardId);

            setNotes({ start: [], stop: [], continue: [] });
        } catch (error) {
            console.error('清空失败:', error);
        }
    };

    const columns = [
        { key: 'start' as const, title: 'Start Doing', color: 'bg-green-50 border-green-200', textColor: 'text-green-700', icon: '🚀' },
        { key: 'stop' as const, title: 'Stop Doing', color: 'bg-red-50 border-red-200', textColor: 'text-red-700', icon: '🛑' },
        { key: 'continue' as const, title: 'Continue', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', icon: '✅' }
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <RefreshCw className="text-pink-500" /> 迭代回顾
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            // 导出为Markdown
                            const totalNotes = notes.start.length + notes.stop.length + notes.continue.length;
                            const markdown = `# 迭代回顾 - Sprint Review

**日期**: ${new Date().toLocaleDateString('zh-CN')}
**参与人**: ${'项目团队'}

---

## 🚀 Start Doing (开始做)

${notes.start.length > 0 ? notes.start.map((note: string) => `- ${note}`).join('\n') : '*暂无内容*'}

## 🛑 Stop Doing (停止做)

${notes.stop.length > 0 ? notes.stop.map((note: string) => `- ${note}`).join('\n') : '*暂无内容*'}

## ✅ Continue (继续保持)

${notes.continue.length > 0 ? notes.continue.map((note: string) => `- ${note}`).join('\n') : '*暂无内容*'}

---

## 总结

- **Start Doing**: ${notes.start.length} 条建议
- **Stop Doing**: ${notes.stop.length} 条建议
- **Continue**: ${notes.continue.length} 条建议
- **总计**: ${totalNotes} 条反馈

---

*生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
                            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `retro_${new Date().toISOString().split('T')[0]}.md`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 flex items-center gap-2"
                    >
                        <FileDown size={14} />
                        导出MD
                    </button>
                    <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 flex items-center gap-2"
                    >
                        <X size={14} />
                        清空全部
                    </button>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {columns.map((col) => (
                    <div key={col.key} className={`${col.color} p-6 rounded-3xl border-2 flex flex-col`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`font-bold text-lg ${col.textColor} flex items-center gap-2`}>
                                <span>{col.icon}</span>
                                {col.title}
                            </h3>
                            <button
                                onClick={() => addNote(col.key)}
                                className={`p-2 ${col.color} ${col.textColor} rounded-lg hover:opacity-70`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                            {notes[col.key].length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-8">
                                    点击 + 添加便签
                                </div>
                            ) : (
                                notes[col.key].map((note: string, index: number) => (
                                    <div
                                        key={index}
                                        className="group bg-white/80 p-3 rounded-xl shadow-sm flex justify-between items-start gap-2 hover:shadow-md transition-shadow"
                                    >
                                        <span className="text-sm text-gray-700 flex-1">{note}</span>
                                        <button
                                            onClick={() => deleteNote(col.key, index)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 text-xs text-gray-500 text-center">
                            {notes[col.key].length} 条便签
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2.5 User Story (AI)
const UserStorySplitter = () => {
    const [input, setInput] = useState(''); const [output, setOutput] = useState<string[]>([]); const [isThinking, setIsThinking] = useState(false);
    const handleSplit = async () => {
        setIsThinking(true); const apiKey = getApiKey();
        if (!apiKey) { alert("No Key"); setIsThinking(false); return; }
        try { const ai = new GoogleGenAI({ apiKey }); const resp = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: [{ role: 'user', parts: [{ text: `Split this epic into 3 INVEST user stories: "${input}". List only.` }] }] }); setOutput((resp.text || '').split('\n').filter((l: string) => l.trim())); } catch (e) { console.error(e); } finally { setIsThinking(false); }
    };
    return <div className="h-full flex flex-col animate-fade-in"><h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-indigo-600" /> User Story 拆分</h2><div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="flex flex-col gap-4"><textarea className="flex-1 bg-gray-50 border rounded-2xl p-4 resize-none" placeholder="Enter Epic..." value={input} onChange={e => setInput(e.target.value)} /><button onClick={handleSplit} disabled={isThinking || !input} className="py-3 bg-black text-white rounded-xl font-bold">{isThinking ? 'Thinking...' : 'Split Story'}</button></div><div className="bg-white rounded-2xl border p-6 overflow-y-auto"><ul className="space-y-3">{output.map((s, i) => <li key={i} className="bg-gray-50 p-3 rounded-lg text-sm">{s}</li>)}</ul></div></div></div>;
};

// 2.6 Risk EMV Calculator
interface RiskOption {
    id: string;
    label: string;
    probability: number;
    impact: number;
    emv: number;
}

const RiskEmvCalculator = () => {
    const [options, setOptions] = useState<RiskOption[]>([
        { id: '1', label: '方案A: 快速迭代', probability: 0.7, impact: 150000, emv: 0 },
        { id: '2', label: '方案B: 稳健推进', probability: 0.9, impact: 100000, emv: 0 },
        { id: '3', label: '风险事件: 技术故障', probability: 0.3, impact: -80000, emv: 0 },
    ]);

    const [bestOption, setBestOption] = useState<string>('');

    useEffect(() => {
        const calculated = options.map(opt => ({
            ...opt,
            emv: opt.probability * opt.impact
        }));
        setOptions(calculated);

        // Find best positive EMV
        const positiveOptions = calculated.filter(o => o.emv > 0);
        if (positiveOptions.length > 0) {
            const best = positiveOptions.reduce((max, opt) => opt.emv > max.emv ? opt : max);
            setBestOption(best.id);
        }
    }, [options.map(o => `${o.probability}-${o.impact}`).join(',')]);

    const updateOption = (id: string, field: keyof RiskOption, value: any) => {
        setOptions(options.map(opt =>
            opt.id === id ? { ...opt, [field]: value } : opt
        ));
    };

    const addOption = () => {
        const newId = (parseInt(options[options.length - 1]?.id || '0') + 1).toString();
        setOptions([...options, {
            id: newId,
            label: `新选项 ${newId}`,
            probability: 0.5,
            impact: 50000,
            emv: 0
        }]);
    };

    return (
        <div className="h-full flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <GitMerge className="text-purple-600" /> 风险 EMV 决策分析
                </h2>
                <button
                    onClick={addOption}
                    className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center gap-2"
                >
                    <Plus size={16} /> 添加选项
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Options Editor */}
                <div className="lg:col-span-2 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            className={`bg-white p-6 rounded-2xl border-2 transition-all ${opt.id === bestOption
                                ? 'border-green-400 shadow-lg shadow-green-100 scale-[1.02]'
                                : 'border-gray-200'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => updateOption(opt.id, 'label', e.target.value)}
                                    className="text-lg font-bold bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors flex-1 mr-4"
                                />
                                {opt.id === bestOption && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">推荐</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">
                                        概率 (Probability)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={opt.probability}
                                            onChange={(e) => updateOption(opt.id, 'probability', parseFloat(e.target.value))}
                                            className="flex-1 accent-purple-600"
                                        />
                                        <span className="text-sm font-mono font-bold text-gray-700 min-w-[3rem] text-right">
                                            {(opt.probability * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">
                                        影响值 (Impact $)
                                    </label>
                                    <input
                                        type="number"
                                        value={opt.impact}
                                        onChange={(e) => updateOption(opt.id, 'impact', parseFloat(e.target.value))}
                                        className="w-full text-sm font-mono font-bold bg-white rounded px-3 py-2 border border-gray-200 outline-none focus:border-purple-400 text-right"
                                    />
                                </div>
                            </div>

                            {/* EMV Display */}
                            <div className={`p-4 rounded-xl ${opt.emv >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">EMV (期望货币价值)</div>
                                <div className={`text-2xl font-mono font-bold ${opt.emv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${opt.emv.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    = {(opt.probability * 100).toFixed(0)}% × ${opt.impact.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <div className="bg-black text-white p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">决策建议</h3>
                        {bestOption ? (
                            <>
                                <p className="text-sm text-gray-300 mb-2">基于 EMV 分析,推荐选择:</p>
                                <p className="text-lg font-bold text-white">
                                    {options.find(o => o.id === bestOption)?.label}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">暂无正向收益选项</p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">EMV 排名</h3>
                        <div className="space-y-2">
                            {[...options].sort((a, b) => b.emv - a.emv).map((opt, idx) => (
                                <div key={opt.id} className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">{idx + 1}. {opt.label.substring(0, 15)}...</span>
                                    <span className={`font-mono font-bold ${opt.emv >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        ${(opt.emv / 1000).toFixed(0)}K
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">💡 公式说明</h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>EMV</strong> = 概率 × 影响值<br />
                            用于量化不确定性下的决策价值。选择 EMV 最大的方案可最大化期望收益。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2.7 OKR Alignment Tool - INTERACTIVE VERSION WITH DATABASE
interface Objective {
    id: string;
    title: string;
    keyResults: { id?: string; kr: string; progress: number }[];
    level: 'company' | 'department' | 'individual';
}

type KeyResult = { id?: string; kr: string; progress: number };

const OkrAlignment = () => {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [periodName, setPeriodName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const levelConfig = {
        company: { label: '公司级', color: 'from-blue-600 to-indigo-600', icon: '🏢' },
        department: { label: '部门级', color: 'from-purple-600 to-pink-600', icon: '👥' },
        individual: { label: '个人级', color: 'from-emerald-500 to-teal-600', icon: '👤' }
    };

    // 加载或创建OKR周期
    useEffect(() => {
        const loadOrCreatePeriod = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 查找用户的OKR周期
                const { data: periods } = await supabase
                    .from('lab_okr_periods')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                let currentPeriodId: string;
                let currentPeriodName: string;

                if (periods && periods.length > 0) {
                    currentPeriodId = periods[0].id;
                    currentPeriodName = periods[0].period_name || 'OKR Period';
                } else {
                    // 创建新周期
                    const currentYear = new Date().getFullYear();
                    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
                    const newPeriodName = `${currentYear} Q${currentQuarter}`;
                    const { data: newPeriod } = await supabase
                        .from('lab_okr_periods')
                        .insert({
                            user_id: user.id,
                            period_name: newPeriodName,
                            start_date: new Date().toISOString().split('T')[0],
                            end_date: new Date(currentYear, currentQuarter * 3, 0).toISOString().split('T')[0]
                        })
                        .select()
                        .single();

                    if (!newPeriod) {
                        setLoading(false);
                        return;
                    }
                    currentPeriodId = newPeriod.id;
                    currentPeriodName = newPeriodName;
                }

                setPeriodId(currentPeriodId);
                setPeriodName(currentPeriodName);

                // 加载objectives
                const { data: objectivesData } = await supabase
                    .from('lab_okr_objectives')
                    .select('*')
                    .eq('period_id', currentPeriodId);

                if (objectivesData && objectivesData.length > 0) {
                    // 加载key results
                    const objIds = objectivesData.map((obj: any) => obj.id);
                    const { data: krsData } = await supabase
                        .from('lab_okr_key_results')
                        .select('*')
                        .in('objective_id', objIds);

                    const formattedObjs: Objective[] = objectivesData.map((obj: any) => ({
                        id: obj.id,
                        title: obj.title,
                        level: obj.level,
                        keyResults: (krsData || [])
                            .filter((kr: any) => kr.objective_id === obj.id)
                            .map((kr: any) => ({
                                id: kr.id,
                                kr: kr.kr_text,
                                progress: kr.progress
                            }))
                    }));

                    setObjectives(formattedObjs);
                }

                setLoading(false);
            } catch (error) {
                console.error('加载OKR数据失败:', error);
                setLoading(false);
            }
        };

        loadOrCreatePeriod();
    }, []);

    // 添加Objective（数据库+本地）
    const addObjective = async (level: 'company' | 'department' | 'individual') => {
        if (!periodId) return;

        const title = prompt(`添加${levelConfig[level].label}目标:`);
        if (!title || !title.trim()) return;

        try {
            const { data: newObj } = await supabase
                .from('lab_okr_objectives')
                .insert({
                    period_id: periodId,
                    title: title.trim(),
                    level: level
                })
                .select()
                .single();

            if (newObj) {
                const objective: Objective = {
                    id: newObj.id,
                    level: level,
                    title: title.trim(),
                    keyResults: []
                };
                setObjectives([...objectives, objective]);
            }
        } catch (error) {
            console.error('添加Objective失败:', error);
        }
    };

    // 删除Objective（数据库+本地）
    const deleteObjective = async (id: string) => {
        if (!window.confirm('确定要删除此 OKR 吗？')) return;

        try {
            await supabase
                .from('lab_okr_objectives')
                .delete()
                .eq('id', id);

            setObjectives(objectives.filter(obj => obj.id !== id));
        } catch (error) {
            console.error('删除Objective失败:', error);
        }
    };

    // 添加Key Result（数据库+本地）
    const addKeyResult = async (objId: string) => {
        const kr = prompt('添加 Key Result:');
        if (!kr || !kr.trim()) return;

        try {
            const { data: newKR } = await supabase
                .from('lab_okr_key_results')
                .insert({
                    objective_id: objId,
                    kr_text: kr.trim(),
                    progress: 0
                })
                .select()
                .single();

            if (newKR) {
                setObjectives(objectives.map(obj =>
                    obj.id === objId
                        ? { ...obj, keyResults: [...obj.keyResults, { id: newKR.id, kr: kr.trim(), progress: 0 }] }
                        : obj
                ));
            }
        } catch (error) {
            console.error('添加Key Result失败:', error);
        }
    };

    // 删除Key Result（数据库+本地）
    const deleteKeyResult = async (objId: string, krIndex: number) => {
        const obj = objectives.find(o => o.id === objId);
        if (!obj) return;

        const krId = obj.keyResults[krIndex].id;
        if (!krId) return;

        try {
            await supabase
                .from('lab_okr_key_results')
                .delete()
                .eq('id', krId);

            setObjectives(objectives.map(obj =>
                obj.id === objId
                    ? { ...obj, keyResults: obj.keyResults.filter((_, i) => i !== krIndex) }
                    : obj
            ));
        } catch (error) {
            console.error('删除Key Result失败:', error);
        }
    };

    // 更新进度（数据库+本地）
    const updateProgress = async (objId: string, krIndex: number, newProgress: number) => {
        const obj = objectives.find(o => o.id === objId);
        if (!obj) return;

        const krId = obj.keyResults[krIndex].id;
        if (!krId) return;

        try {
            await supabase
                .from('lab_okr_key_results')
                .update({ progress: newProgress })
                .eq('id', krId);

            setObjectives(objectives.map(obj =>
                obj.id === objId
                    ? {
                        ...obj,
                        keyResults: obj.keyResults.map((kr, i) =>
                            i === krIndex ? { ...kr, progress: newProgress } : kr
                        )
                    }
                    : obj
            ));
        } catch (error) {
            console.error('更新进度失败:', error);
        }
    };

    const calculateAlignment = () => {
        if (objectives.length === 0) return 0;
        const avgProgress = objectives.reduce((sum: number, obj: Objective) => {
            if (obj.keyResults.length === 0) return sum;
            const objAvg = obj.keyResults.reduce((s: number, kr: KeyResult) => s + kr.progress, 0) / obj.keyResults.length;
            return sum + objAvg;
        }, 0) / objectives.length;
        return Math.round(avgProgress);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Target className="text-blue-600" /> OKR 对齐工具
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Objectives and Key Results Alignment</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            // 导出OKR为PDF
                            const doc = new jsPDF();
                            let yPos = 20;

                            // 封面
                            doc.setFontSize(20);
                            doc.text('OKR 对齐报告', 105, yPos, { align: 'center' });
                            yPos += 15;

                            doc.setFontSize(12);
                            doc.text(`周期: ${periodName}`, 20, yPos);
                            yPos += 6;
                            doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, 20, yPos);
                            yPos += 6;
                            doc.text(`整体对齐度: ${calculateAlignment()}%`, 20, yPos);
                            yPos += 15;

                            // 统计
                            doc.setFontSize(14);
                            doc.text('概览', 20, yPos);
                            yPos += 8;
                            doc.setFontSize(10);
                            doc.text(`Objectives总数: ${objectives.length}`, 25, yPos);
                            yPos += 6;
                            const totalKRs = objectives.reduce((sum: number, obj: Objective) => sum + obj.keyResults.length, 0);
                            doc.text(`Key Results总数: ${totalKRs}`, 25, yPos);
                            yPos += 12;

                            // 按级别分类
                            ['company', 'department', 'individual'].forEach(level => {
                                const objs = objectives.filter((obj: Objective) => obj.level === level);
                                if (objs.length === 0) return;

                                const levelConfig: any = {
                                    company: { label: '公司级', color: [255, 59, 48] },
                                    department: { label: '部门级', color: [255, 149, 0] },
                                    individual: { label: '个人级', color: [52, 199, 89] }
                                };

                                doc.setFontSize(14);
                                doc.setTextColor(levelConfig[level].color[0], levelConfig[level].color[1], levelConfig[level].color[2]);
                                doc.text(levelConfig[level].label + ' OKR', 20, yPos);
                                doc.setTextColor(0, 0, 0);
                                yPos += 8;

                                objs.forEach((obj: Objective) => {
                                    if (yPos > 260) {
                                        doc.addPage();
                                        yPos = 20;
                                    }

                                    doc.setFontSize(11);
                                    doc.text(`O: ${obj.title}`, 25, yPos);
                                    yPos += 7;

                                    obj.keyResults.forEach((kr: KeyResult, idx: number) => {
                                        doc.setFontSize(9);
                                        doc.text(`KR${idx + 1}: ${kr.kr}`, 30, yPos); // Changed kr.description to kr.kr
                                        doc.text(`${kr.progress}%`, 180, yPos);

                                        // 进度条
                                        doc.setDrawColor(200);
                                        doc.rect(150, yPos - 3, 25, 3);
                                        doc.setFillColor(66, 133, 244);
                                        doc.rect(150, yPos - 3, 25 * (kr.progress / 100), 3, 'F');

                                        yPos += 6;
                                    });
                                    yPos += 3;
                                });
                                yPos += 5;
                            });

                            doc.save(`OKR_${periodName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 flex items-center gap-2"
                    >
                        <FileDown size={14} />
                        导出PDF
                    </button>
                    <div className="bg-black text-white px-6 py-3 rounded-full">
                        <span className="text-xs font-bold text-gray-400 uppercase">整体对齐度</span>
                        <div className="text-2xl font-bold">{calculateAlignment()}%</div>
                    </div>
                    <div className="relative group">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Plus size={16} />
                            添加 OKR
                        </button>
                        <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                            {Object.entries(levelConfig).map(([level, config]) => (
                                <button
                                    key={level}
                                    onClick={() => addObjective(level as 'company' | 'department' | 'individual')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                                >
                                    <span>{config.icon}</span>
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-10">
                {objectives.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Target size={48} className="mx-auto mb-4 opacity-50" />
                        <p>暂无 OKR，点击右上角添加</p>
                    </div>
                ) : (
                    objectives.map((obj: Objective) => {
                        const config = levelConfig[obj.level];
                        const avgProgress = obj.keyResults.length > 0
                            ? obj.keyResults.reduce((s: number, kr: KeyResult) => s + kr.progress, 0) / obj.keyResults.length
                            : 0;

                        return (
                            <div key={obj.id} className="group relative animate-fade-in-up">
                                {obj.level !== 'company' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-gray-200"></div>
                                )}

                                <div className={`bg-gradient-to-br ${config.color} p-[2px] rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500`}>
                                    <div className="bg-white rounded-[calc(1.5rem-2px)] p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`text-2xl flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                                                    <span className="text-white">{config.icon}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${config.color} text-white`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">{obj.title}</h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative w-16 h-16">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle
                                                            cx="32" cy="32" r="28"
                                                            stroke="#E5E7EB" strokeWidth="6" fill="none"
                                                        />
                                                        <circle
                                                            cx="32" cy="32" r="28"
                                                            stroke="url(#gradient)" strokeWidth="6" fill="none"
                                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - avgProgress / 100)}`}
                                                            className="transition-all duration-1000"
                                                        />
                                                        <defs>
                                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                                <stop offset="0%" stopColor="#3B82F6" />
                                                                <stop offset="100%" stopColor="#8B5CF6" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-gray-700">{Math.round(avgProgress)}%</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteObjective(obj.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mt-6">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase">Key Results</h4>
                                                <button
                                                    onClick={() => addKeyResult(obj.id)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    <Plus size={12} />
                                                    添加 KR
                                                </button>
                                            </div>
                                            {obj.keyResults.length === 0 ? (
                                                <div className="text-center py-4 text-gray-400 text-sm">
                                                    暂无 Key Result
                                                </div>
                                            ) : (
                                                obj.keyResults.map((kr: KeyResult, idx: number) => (
                                                    <div key={idx} className="bg-gray-50 p-4 rounded-xl group/kr">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium text-gray-700 flex-1">{kr.kr}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-blue-600">{kr.progress}%</span>
                                                                <button
                                                                    onClick={() => deleteKeyResult(obj.id, idx)}
                                                                    className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover/kr:opacity-100 transition-opacity"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={kr.progress}
                                                                onChange={(e) => updateProgress(obj.id, idx, Number(e.target.value))}
                                                                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                                            />
                                                        </div>
                                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                                                            <div
                                                                className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out`}
                                                                style={{ width: `${kr.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-around text-xs">
                    {Object.entries(levelConfig).map(([level, config]) => (
                        <div key={level} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.color}`}></div>
                            <span className="font-medium text-gray-600">{config.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};



// --- SIMULATION COMPONENT (AI-Powered) ---
interface Question {
    id: string;
    question_text: string;
    type: 'mc';
    options: string[];
    correct_answer: string;
    explanation: string;
}

const ProjectSimulationView = ({ caseData, onClose }: { caseData: any, onClose: () => void, currentUser?: any }) => {
    const [view, setView] = useState<'overview' | 'quiz' | 'result'>('overview');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoadingQ, setIsLoadingQ] = useState(false);

    const startQuiz = async () => {
        setIsLoadingQ(true);
        await generateQuestionsByAI();
    };

    const generateQuestionsByAI = async () => {
        const apiKey = getApiKey();

        // 1. Fallback Data (Offline/No Key)
        if (!apiKey) {
            setQuestions([
                {
                    id: 'q1', question_text: '在项目初期，面对需求不明确的情况，最佳策略是？', type: 'mc',
                    options: ['A. 拒绝开始工作直到需求明确', 'B. 采用敏捷方法迭代开发', 'C. 估算一个最大预算', 'D. 忽略风险直接开工'],
                    correct_answer: 'B. 采用敏捷方法迭代开发',
                    explanation: '敏捷方法允许在需求不明确时通过迭代和小步快跑来逐步明确方向。'
                },
                {
                    id: 'q2', question_text: '当关键相关方提出变更请求，且该变更会严重影响进度时，应首先做什么？', type: 'mc',
                    options: ['A. 立即拒绝', 'B. 立即接受以取悦相关方', 'C. 评估变更的影响并走变更控制流程', 'D. 偷偷加班完成'],
                    correct_answer: 'C. 评估变更的影响并走变更控制流程',
                    explanation: 'PMBOK 标准流程要求先评估影响，再由变更控制委员会 (CCB) 决策。'
                }
            ]);
            setView('quiz');
            setIsLoadingQ(false);
            return;
        }

        // 2. AI Generation
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Create 5 project management multiple choice questions based on case: "${caseData.title}". Return JSON array only: [{ "question_text": "...", "options": ["A..","B.."], "correct_answer": "...", "explanation": "..." }]`;

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json' }
            });

            const text = resp.text || '[]';
            const generated = JSON.parse(text);
            setQuestions(generated);
            setView('quiz');
        } catch (e) {
            console.error(e);
            alert("AI 服务暂时不可用，请检查 Key 或网络。");
            setIsLoadingQ(false);
        } finally {
            setIsLoadingQ(false);
        }
    };

    const handleAnswer = (option: string) => {
        setSelectedOption(option);
        setIsAnswered(true);
        if (option === questions[currentQIndex].correct_answer) {
            setScore(s => s + 20);
        }
    };

    const nextQuestion = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setView('result');
        }
    };

    const handleDownloadReport = () => {
        try {
            const doc = new jsPDF();
            let yPos = 20;

            // 封面
            doc.setFontSize(20);
            doc.text('项目管理实战模拟报告', 105, yPos, { align: 'center' });
            yPos += 15;

            doc.setFontSize(12);
            doc.text(`案例: ${caseData.title}`, 20, yPos);
            yPos += 6;
            doc.text(`完成时间: ${new Date().toLocaleString('zh-CN')}`, 20, yPos);
            yPos += 6;
            doc.text(`最终得分: ${score}/100`, 20, yPos);
            yPos += 15;

            // 测验总览
            doc.setFontSize(14);
            doc.text('测验总览', 20, yPos);
            yPos += 8;

            const correctCount = Math.floor(score / 20);
            const wrongCount = questions.length - correctCount;
            const percentage = Math.round((score / 100) * 100);

            doc.setFontSize(10);
            doc.text(`总题数: ${questions.length}题`, 25, yPos);
            yPos += 5;
            doc.text(`正确数: ${correctCount}题`, 25, yPos);
            yPos += 5;
            doc.text(`错误数: ${wrongCount}题`, 25, yPos);
            yPos += 5;

            const grading = percentage >= 80 ? '优秀' : percentage >= 60 ? '良好' : '需改进';
            doc.text(`评级: ${grading}`, 25, yPos);
            yPos += 15;

            // 逐题分析
            doc.setFontSize(14);
            doc.text('逐题分析', 20, yPos);
            yPos += 10;

            questions.forEach((q, idx) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(`第${idx + 1}题`, 20, yPos);
                yPos += 6;

                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                const questionLines = doc.splitTextToSize(q.question_text, 170);
                questionLines.forEach((line: string) => {
                    doc.text(line, 25, yPos);
                    yPos += 5;
                });
                yPos += 2;

                doc.setFontSize(9);
                doc.text(`正确答案: ${q.correct_answer}`, 25, yPos);
                yPos += 6;

                doc.setFontSize(8);
                const explanationLines = doc.splitTextToSize(`解析: ${q.explanation}`, 170);
                explanationLines.forEach((line: string) => {
                    doc.text(line, 25, yPos);
                    yPos += 4;
                });
                yPos += 8;
            });

            // 综合分析
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.text('综合分析', 20, yPos);
            yPos += 10;

            doc.setFontSize(10);
            if (score >= 80) {
                doc.text('知识强项:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 项目管理核心知识掌握扎实', 30, yPos);
                yPos += 5;
                doc.text('- 能够正确识别管理情景并应对', 30, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.text('建议:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 深入学习高级项目管理技术', 30, yPos);
                yPos += 5;
                doc.text('- 准备PMP/PRINCE2认证考试', 30, yPos);
            } else if (score >= 60) {
                doc.text('知识强项:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 基础项目管理概念理解正确', 30, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.text('需要加强:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 风险管理与应对策略', 30, yPos);
                yPos += 5;
                doc.text('- 相关方管理与沟通', 30, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.text('建议:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 系统学习PMBOK指南', 30, yPos);
                yPos += 5;
                doc.text('- 多做实战案例练习', 30, yPos);
            } else {
                doc.text('需要加强:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('- 项目管理基础知识', 30, yPos);
                yPos += 5;
                doc.text('- 流程与方法论理解', 30, yPos);
                yPos += 5;
                doc.text('- 实践经验积累', 30, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.text('建议学习路径:', 25, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.text('1. PMBOK指南第6版/第7版基础', 30, yPos);
                yPos += 5;
                doc.text('2. 项目管理入门课程', 30, yPos);
                yPos += 5;
                doc.text('3. 实战案例分析与模拟', 30, yPos);
            }

            doc.save(`Simulation_Report_${caseData.id}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                    <h1 className="font-bold text-gray-900 truncate max-w-md">{caseData.title}</h1>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto w-full min-h-full">
                    {view === 'overview' && (
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center min-h-[calc(100vh-140px)]">
                            <div className="w-full lg:w-1/2 aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl group ring-1 ring-black/5">
                                <img src={caseData.cover_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-700" alt="Case Cover" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle size={80} className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-transform opacity-90 hover:opacity-100" onClick={startQuiz} />
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 space-y-8">
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 mb-4`}>
                                        <Lock size={12} /> {caseData.difficulty} Case
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">{caseData.title}</h2>
                                    <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-gray-200 pl-4">{caseData.summary}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Terminal size={18} /> Mission Brief</h3>
                                    <div className="text-sm text-gray-500 space-y-2">
                                        <p>• Identify key risks in the project timeline.</p>
                                        <p>• Make critical decisions under pressure.</p>
                                        <p>• Analyze stakeholder impact.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={startQuiz}
                                    disabled={isLoadingQ}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                                >
                                    {isLoadingQ ? <Loader2 className="animate-spin" /> : <Terminal size={20} />}
                                    {isLoadingQ ? 'Initializing AI Scenario...' : 'Enter Simulation Environment'}
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'quiz' && (
                        <div className="max-w-3xl mx-auto mt-10 pb-20">
                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-6">
                                <span>QUESTION {currentQIndex + 1} OF {questions.length}</span>
                                <span>SCORE: {score}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-tight">{questions[currentQIndex].question_text}</h3>
                            <div className="space-y-4">
                                {questions[currentQIndex].options.map((opt, i) => {
                                    const isCorrect = opt === questions[currentQIndex].correct_answer;
                                    let bg = "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50";
                                    if (isAnswered) {
                                        if (isCorrect) bg = "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500";
                                        else if (selectedOption === opt) bg = "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500";
                                        else bg = "bg-gray-50 border-gray-100 opacity-50";
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => !isAnswered && handleAnswer(opt)}
                                            className={`w-full p-5 rounded-xl text-left border text-base font-medium transition-all ${bg}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                            {isAnswered && (
                                <div className="mt-8 animate-fade-in-up">
                                    <div className="p-5 bg-blue-50 rounded-xl text-sm text-blue-800 mb-6 border border-blue-100 flex gap-3">
                                        <div className="shrink-0 mt-0.5"><Activity size={16} /></div>
                                        <div>
                                            <span className="font-bold block mb-1">Analysis:</span>
                                            {questions[currentQIndex].explanation}
                                        </div>
                                    </div>
                                    <button onClick={nextQuestion} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors">
                                        Next Question
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'result' && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                            <div className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-2xl text-white animate-bounce-in">
                                <Award size={56} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-2">Simulation Complete</h2>
                            <p className="text-gray-500 mb-8">You have completed the scenario analysis.</p>

                            <div className="text-7xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                {score} <span className="text-2xl text-gray-400 font-bold">/ 100</span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                <button onClick={handleDownloadReport} className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                                    <FileDown size={20} /> Download Report
                                </button>
                                <button onClick={onClose} className="flex-1 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                    Return to Hub
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PRO LAB ENTRY VIEW ---
const ProLabEntryView = ({ onNavigate }: { onNavigate: (page: Page) => void }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                <FlaskConical size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pro Lab 高级实验室</h2>
            <p className="text-gray-500 text-center max-w-md mb-8">
                解锁10+高级项目管理工具：蒙特卡洛模拟、敏捷估算扑克、Kanban流动指标、
                学习曲线分析、FMEA风险评估、CCPM关键链、鱼骨图分析等。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                {['蒙特卡洛', '估算扑克', 'Kanban流', '学习曲线', 'FMEA'].map((name, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                        <span className="text-xs font-bold text-gray-600">{name}</span>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => onNavigate(Page.TOOLS_LAB)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3"
            >
                <Zap size={20} fill="currentColor" />
                进入 Pro Lab
                <ArrowRight size={20} />
            </button>
        </div>
    );
};

// --- WRAPPER FOR TOOLS ---
const LabToolView = ({ toolId, onClose, onNavigate }: { toolId: string, onClose: () => void, onNavigate?: (page: Page) => void }) => {
    const renderTool = () => {
        switch (toolId) {
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
            case 'risk': return <RiskEmvCalculator />;
            case 'okr': return <OkrAlignment />;
            case 'prolab': return onNavigate ? <ProLabEntryView onNavigate={onNavigate} /> : <div className="flex justify-center items-center h-full text-gray-400">Navigation not available</div>;
            default: return <div className="flex justify-center items-center h-full text-gray-400">Tool Coming Soon</div>;
        }
    };
    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex items-center gap-2 font-bold text-sm"><ChevronLeft size={20} /> 返回实验室</button>
                <div className="font-bold text-gray-900">PM 实验室环境</div><div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-auto p-6 md:p-10"><div className="max-w-6xl mx-auto h-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 overflow-hidden relative">{renderTool()}</div></div>
        </div>
    );
}

// --- ADVANCED LAB VIEW ---
const AdvancedLabView = ({ onSelect, userMembership }: { onSelect: (tool: any) => void, userMembership: string }) => {
    return (
        <div className="space-y-12 pb-10">
            {Object.entries(LAB_CATEGORIES).map(([category, data]: [string, any]) => {
                // Check membership requirement
                const requiresMembership = data.requiresMembership;
                const isLocked = requiresMembership && userMembership === 'free';
                
                return (
                <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category === 'Quantitative' && <BarChart3 className="text-blue-500" />}
                        {category === 'Strategic' && <Shield className="text-purple-500" />}
                        {category === 'Toolkit' && <Layers className="text-green-500" />}
                        {category === 'ProLab' && <FlaskConical className="text-amber-500" />}
                        {data.label}
                        {requiresMembership && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                userMembership === 'pro_plus' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                userMembership === 'pro' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                                'bg-gray-200 text-gray-600'
                            }`}>
                                {requiresMembership === 'pro' ? 'PRO' : 'PRO+'}
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.tools.map((tool: any) => (
                            <div key={tool.id} 
                                 onClick={() => !isLocked && onSelect(tool)} 
                                 className={`bg-white p-6 rounded-2xl shadow-sm border transition-all relative overflow-hidden ${
                                     isLocked 
                                         ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                                         : 'border-gray-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer group'
                                 }`}>
                                {isLocked && (
                                    <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                                        <Lock className="text-gray-400 mb-2" size={24} />
                                        <span className="text-xs font-bold text-gray-500">需要 {requiresMembership === 'pro' ? 'Pro' : 'Pro+'} 会员</span>
                                        <span className="text-[10px] text-gray-400 mt-1">完成 {requiresMembership === 'pro' ? '5' : '10'} 门课程解锁</span>
                                    </div>
                                )}
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110`}><tool.icon size={80} /></div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors shadow-sm ${
                                    category === 'ProLab' 
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                                        : 'bg-gray-50 text-gray-600 group-hover:bg-black group-hover:text-white'
                                }`}>
                                    <tool.icon size={24} />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h4>
                                {category === 'ProLab' && (
                                    <p className="text-xs text-gray-500 mb-2">蒙特卡洛、看板流、FMEA等10+高级工具</p>
                                )}
                                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                    {category === 'ProLab' ? '进入高级实验室' : '进入实验室'} <ArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                );
            })}
        </div>
    );
};

// --- MAIN COMPONENT ---
const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
    const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
    const [subTab, setSubTab] = useState<SubCategory>('Course');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [scenarios, setScenarios] = useState<any[]>([]);
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

    // 获取模拟场景数据
    useEffect(() => {
        const fetchScenarios = async () => {
            if (mainTab !== 'Implementation') return;
            setIsLoading(true);
            const { data } = await supabase
                .from('app_simulation_scenarios')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });
            if (data) {
                const parsed = data.map(s => ({
                    ...s,
                    stages: typeof s.stages === 'string' ? JSON.parse(s.stages) : s.stages || [],
                    learning_objectives: typeof s.learning_objectives === 'string' 
                        ? JSON.parse(s.learning_objectives) 
                        : s.learning_objectives || [],
                }));
                setScenarios(parsed);
            }
            setIsLoading(false);
        };
        fetchScenarios();
    }, [mainTab]);

    return (
        <ToastProvider>

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
                            {isLoading ? (<div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-400" /></div>) : courses.length > 0 ? (
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
                    {mainTab === 'Advanced' && !selectedItem && (<AdvancedLabView onSelect={(t: any) => setSelectedItem({ type: 'lab', ...t })} userMembership={currentUser?.membershipTier || 'free'} />)}
                    {mainTab === 'Implementation' && !selectedItem && (
                        <div className="min-h-[300px]">
                            {isLoading ? (<div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-400" /></div>) : scenarios.length > 0 ? (
                                <div className="pb-10 grid grid-cols-1 gap-8">
                                    {scenarios.map((caseItem: any) => (
                                        <div key={caseItem.id} onClick={() => setSelectedItem({ type: 'simulation', data: caseItem })} className="group bg-white rounded-[2.5rem] p-0 border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row h-auto md:h-[320px]">
                                            <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden"><img src={caseItem.cover_image || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8"><div className="text-white"><div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${caseItem.difficulty === 'Hard' || caseItem.difficulty === 'Expert' ? 'bg-red-500' : caseItem.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}>{caseItem.difficulty}</div><h3 className="text-2xl font-bold leading-tight">{caseItem.title}</h3></div></div></div>
                                            <div className="flex-1 p-8 flex flex-col justify-between relative"><div><div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest"><Terminal size={14} className="text-blue-500" />Interactive Simulation</div><p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{caseItem.description}</p><div className="mt-3 flex flex-wrap gap-2">{(caseItem.learning_objectives || []).slice(0, 3).map((obj: string, idx: number) => (<span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded">{obj}</span>))}</div></div><div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6"><div className="flex items-center gap-4 text-xs font-bold text-gray-400"><span className="flex items-center gap-1"><History size={14} /> {(caseItem.stages || []).length} 个阶段</span><span className="flex items-center gap-1"><Clock size={14} /> ~{caseItem.estimated_time || 15} min</span></div><button className="flex items-center gap-2 text-xs font-bold bg-black text-white px-6 py-3 rounded-xl group-hover:bg-blue-600 transition-colors shadow-lg">开始模拟 <PlayCircle size={14} /></button></div></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<div className="text-center py-20 text-gray-400">暂无实战场景</div>)}
                        </div>
                    )}
                </div>
            </div>
            {selectedItem?.type === 'lab' && (<LabToolView toolId={selectedItem.id} onClose={() => setSelectedItem(null)} onNavigate={onNavigate} />)}
            {selectedItem?.type === 'simulation' && (<ProjectSimulationView caseData={selectedItem.data} onClose={() => setSelectedItem(null)} currentUser={currentUser} />)}
        </ToastProvider>
    );
};

export default LearningHub;

