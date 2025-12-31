
import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, ChevronLeft, 
  Activity, Terminal, 
  Network, BarChart3, 
  GitMerge, Layers, Shield, Loader2,
  Layout, Cpu, Briefcase, FileText, RefreshCw, CloudLightning, 
  DollarSign, Target, X, Award, 
  History, FileDown, Lock, BookOpen,
  ArrowRight, Code, Zap, Save, Users
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';

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
        { id: 'stakeholder', name: '相关方矩阵', desc: '权力/利益方格策略分析', icon: UsersIcon },
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

// --- 2. Data Configuration (5 Classic Cases) ---
const CLASSIC_CASES = [
    {
        id: 'case-dia',
        title: '丹佛国际机场 (DIA) 行李系统',
        summary: '历史上著名的范围蔓延与技术激进案例。自动化行李系统导致机场延期开放16个月，超支20亿美元。',
        difficulty: 'High',
        cover_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800',
        content: `
            **项目背景**：
            丹佛国际机场决定建立世界上最先进的自动化行李处理系统。
            
            **核心问题**：
            1. **范围蔓延**：在项目中期频繁变更需求，增加了滑雪板等特殊行李的处理。
            2. **技术风险**：低估了分布式网络控制系统的复杂性。
            3. **沟通失效**：各承包商之间缺乏统一的接口标准。
            
            **你的任务**：
            作为事后诸葛亮（复盘专家），你需要通过一系列决策题，找出如果在当时，应该在哪个节点叫停或改变策略。
        `
    },
    {
        id: 'case-nhs',
        title: '英国 NHS 民用IT系统',
        summary: '世界上最大的民用IT项目失败案例。耗资120亿英镑，最终因需求过于复杂且无法落地而被废弃。',
        difficulty: 'Critical',
        cover_image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
        content: '待生成内容...'
    },
    {
        id: 'case-tesla',
        title: 'Model 3 "生产地狱"',
        summary: '特斯拉如何通过激进的自动化策略遭遇瓶颈，又是如何通过快速迭代和帐篷工厂解决产能危机的。',
        difficulty: 'Medium',
        cover_image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
        content: '待生成内容...'
    },
    {
        id: 'case-olympics',
        title: '2012 伦敦奥运会',
        summary: '教科书级别的成功项目管理。如何在绝对不可延期的截止日期前，通过风险管理确保按时交付。',
        difficulty: 'Medium',
        cover_image: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&q=80&w=800',
        content: '待生成内容...'
    },
    {
        id: 'case-apollo',
        title: '阿波罗 13 号救援',
        summary: '“失败不是选项”。在极端资源受限（氧气、电力）的情况下，如何通过敏捷决策和团队协作将宇航员带回家。',
        difficulty: 'High',
        cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800',
        content: '待生成内容...'
    }
];

// Helper Icons
function FlameIcon(props:any) { return <CloudLightning {...props} />; }
function TargetIcon(props:any) { return <Target {...props} />; }
function UsersIcon(props:any) { return <Users {...props} />; }

// --- Interfaces ---
interface Question {
    id: string;
    question_text: string;
    type: 'mc' | 'tf';
    options: string[];
    correct_answer: string;
    explanation: string;
}

// --- Lab Components Implementation ---

// 2.1 EVM 计算器
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

// 2.2 PERT 估算器
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

// 2.1.3 CPM 关键路径
const CpmCalculator = () => {
    const [tasks, setTasks] = useState([
        { id: 'A', name: '需求分析', dur: 5, pre: '-' },
        { id: 'B', name: '系统设计', dur: 7, pre: 'A' },
        { id: 'C', name: '开发', dur: 10, pre: 'B' },
        { id: 'D', name: '测试', dur: 5, pre: 'C' },
    ]);
    const totalDur = tasks.reduce((acc, t) => acc + t.dur, 0);

    return (
        <div className="h-full flex flex-col animate-fade-in">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Network className="text-blue-600"/> 关键路径分析 (CPM)</h2>
             <div className="flex gap-8 h-full">
                <div className="w-1/3 bg-gray-50 p-6 rounded-3xl space-y-4 overflow-auto">
                    <h3 className="font-bold text-gray-500 text-xs uppercase">任务序列</h3>
                    {tasks.map((t, i) => (
                        <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="font-bold text-lg mr-2">{t.id}</span>
                                <span className="text-sm text-gray-600">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">前置: {t.pre}</span>
                                <input type="number" className="w-12 text-center border rounded" value={t.dur} onChange={(e)=>{
                                    const newT = [...tasks]; newT[i].dur = Number(e.target.value); setTasks(newT);
                                }} />
                                <span className="text-xs text-gray-400">天</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="flex items-center gap-4 z-10">
                        {tasks.map((t, i) => (
                            <React.Fragment key={t.id}>
                                <div className="w-24 h-24 bg-black text-white rounded-full flex flex-col items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-default">
                                    <span className="text-2xl font-bold">{t.id}</span>
                                    <span className="text-xs opacity-70">{t.dur}天</span>
                                </div>
                                {i < tasks.length -1 && <div className="w-10 h-1 bg-gray-300"></div>}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="mt-10 p-4 bg-green-50 text-green-700 rounded-xl font-bold">
                        关键路径总工期: {totalDur} 天
                    </div>
                </div>
             </div>
        </div>
    );
};

// 2.1.4 ROI/NPV 投资回报模型
const RoiCalculator = () => {
    const [inv, setInv] = useState(100000);
    const [flows, setFlows] = useState([30000, 40000, 50000]); // Year 1, 2, 3
    const discountRate = 0.1; // 10%

    const npv = flows.reduce((acc, val, i) => acc + (val / Math.pow(1 + discountRate, i + 1)), 0) - inv;
    const roi = ((flows.reduce((a, b) => a + b, 0) - inv) / inv) * 100;

    return (
        <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><DollarSign className="text-green-600"/> ROI & NPV 财务模型</h2>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-8">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">初始投资 (Initial Investment)</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-xl">
                        <span className="text-gray-400">$</span>
                        <input type="number" value={inv} onChange={e=>setInv(Number(e.target.value))} className="bg-transparent text-xl font-bold outline-none w-full" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase">现金流 (Cash Flows - Year 1-3)</label>
                    {flows.map((f, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="text-sm font-bold w-12">Y{i+1}</span>
                            <input type="range" min="0" max="100000" step="1000" value={f} onChange={e=>{
                                const n = [...flows]; n[i] = Number(e.target.value); setFlows(n);
                            }} className="flex-1 accent-green-600" />
                            <span className="font-mono w-20 text-right">${f/1000}k</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase">NPV (净现值)</p>
                        <p className={`text-2xl font-bold font-mono ${npv > 0 ? 'text-green-600' : 'text-red-600'}`}>${Math.round(npv).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase">ROI (投资回报率)</p>
                        <p className={`text-2xl font-bold font-mono ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2.1.5 燃尽图模拟
const BurnDownChart = () => {
    // 模拟数据
    const totalPoints = 50;
    const [completed, setCompleted] = useState([0, 5, 12, 18, 25, 30, 35, 42, 48, 50]); 

    return (
        <div className="h-full flex flex-col animate-fade-in">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CloudLightning className="text-orange-500"/> 敏捷燃尽图 (Burn-down)</h2>
             <div className="flex-1 flex items-end justify-between gap-2 px-8 pb-8 relative border-l-2 border-b-2 border-gray-200">
                {/* 理想线 (CSS 简单模拟) */}
                <div className="absolute top-0 left-0 w-full h-full border-t border-dashed border-gray-300 transform origin-top-left rotate-[25deg] opacity-30 pointer-events-none"></div>
                
                {completed.map((done, i) => {
                    const remaining = totalPoints - done;
                    const heightParams = `${(remaining/totalPoints)*100}%`;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                             <div className="w-full bg-blue-500 rounded-t-md relative transition-all duration-500 hover:bg-blue-600" style={{height: heightParams}}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    剩 {remaining} 点
                                </div>
                             </div>
                             <span className="text-xs text-gray-400 mt-2">D{i+1}</span>
                        </div>
                    )
                })}
             </div>
             <div className="mt-4 flex justify-center gap-4">
                 <button onClick={() => setCompleted(completed.map(c => Math.max(0, c - Math.floor(Math.random()*5))))} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200">模拟进度滞后</button>
                 <button onClick={() => setCompleted(completed.map(c => Math.min(totalPoints, c + Math.floor(Math.random()*5))))} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800">模拟进度超前</button>
             </div>
        </div>
    )
};

// 2.3 SWOT 看板
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
                        <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm uppercase">{x.t}</h3><button onClick={()=>add(x.id)}><ArrowRight size={16}/></button></div>
                        <ul className="space-y-2">{items[x.id].map((t:string,i:number)=><li key={i} className="text-sm bg-white/60 p-2 rounded">{t}</li>)}</ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2.2.2 相关方矩阵
const StakeholderMatrix = () => {
    // Fixed: Removed unused setSh
    const [sh] = useState([
        { id: 1, name: 'CEO', power: 90, interest: 90 },
        { id: 2, name: '项目组', power: 30, interest: 80 },
        { id: 3, name: '财务部', power: 80, interest: 20 },
    ]);

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-purple-600"/> 权力/利益相关方矩阵</h2>
            <div className="flex-1 relative bg-white border-2 border-gray-800 rounded-xl overflow-hidden">
                {/* 坐标轴背景 */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="bg-red-50 p-2 text-xs font-bold text-red-300 uppercase">重点管理 (High P/High I)</div>
                    <div className="bg-yellow-50 p-2 text-xs font-bold text-yellow-300 uppercase text-right">令其满意 (High P/Low I)</div>
                    <div className="bg-blue-50 p-2 flex items-end text-xs font-bold text-blue-300 uppercase">随时告知 (Low P/High I)</div>
                    <div className="bg-gray-50 p-2 flex items-end justify-end text-xs font-bold text-gray-300 uppercase">监督 (Low P/Low I)</div>
                </div>
                {/* 中轴线 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-gray-300"></div>
                    <div className="h-full w-0.5 bg-gray-300 absolute"></div>
                </div>
                
                {/* 点位 */}
                {sh.map(s => (
                    <div key={s.id} 
                         className="absolute w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xl cursor-pointer hover:scale-110 transition-transform z-10 border-2 border-white"
                         style={{ bottom: `${s.interest}%`, left: `${100 - s.power}%` }}
                         title={`${s.name} (P:${s.power}, I:${s.interest})`}
                    >
                        {s.name}
                    </div>
                ))}
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded-xl flex gap-4 overflow-x-auto">
                {sh.map(s => (
                    <div key={s.id} className="min-w-[120px] bg-white p-3 rounded-lg border border-gray-200 text-sm">
                        <div className="font-bold">{s.name}</div>
                        <div className="text-xs text-gray-500">Pow: {s.power}%</div>
                        <div className="text-xs text-gray-500">Int: {s.interest}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2.2.3 风险 EMV 计算
const RiskEmv = () => {
    // Fixed: Removed unused setRisks
    const [risks] = useState([
        { id: 1, name: '服务器宕机', prob: 0.1, impact: -50000 },
        { id: 2, name: '新功能大卖', prob: 0.3, impact: 20000 },
    ]);
    const totalEmv = risks.reduce((acc, r) => acc + (r.prob * r.impact), 0);

    return (
        <div className="h-full flex flex-col animate-fade-in max-w-3xl mx-auto">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><GitMerge className="text-red-500"/> 风险预期货币价值 (EMV)</h2>
             <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                        <tr>
                            <th className="p-4">风险事件</th>
                            <th className="p-4">概率 (Probability)</th>
                            <th className="p-4">影响 (Impact)</th>
                            <th className="p-4 text-right">EMV</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Fixed: Removed unused index 'i' */}
                        {risks.map((r) => (
                            <tr key={r.id}>
                                <td className="p-4 font-bold">{r.name}</td>
                                <td className="p-4">{r.prob * 100}%</td>
                                <td className={`p-4 font-mono ${r.impact<0?'text-red-500':'text-green-500'}`}>${r.impact}</td>
                                <td className="p-4 text-right font-mono font-bold">${r.prob * r.impact}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-black text-white">
                        <tr>
                            <td colSpan={3} className="p-4 text-right font-bold uppercase">Project EMV Total</td>
                            <td className={`p-4 text-right font-mono font-bold text-lg ${totalEmv>0?'text-green-400':'text-red-400'}`}>${totalEmv}</td>
                        </tr>
                    </tfoot>
                </table>
             </div>
        </div>
    );
};

// 2.2.4 OKR 追踪
const OkrTracker = () => {
    const [krs, setKrs] = useState([
        { id: 1, name: '系统可用性达到 99.9%', progress: 85 },
        { id: 2, name: '用户 NPS 提升至 50', progress: 40 },
        { id: 3, name: '完成 3 个核心模块重构', progress: 100 },
    ]);

    return (
        <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Target className="text-blue-500"/> OKR 目标对齐</h2>
            <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl mb-6">
                <div className="text-xs font-bold text-blue-500 uppercase mb-2">Objective (O)</div>
                <h3 className="text-2xl font-bold text-gray-900">打造行业领先的高可用性平台</h3>
            </div>
            <div className="space-y-4">
                {krs.map(kr => (
                    <div key={kr.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-700">{kr.name}</span>
                            <span className="font-mono font-bold text-blue-600">{kr.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${kr.progress}%`}}></div>
                        </div>
                        <input type="range" min="0" max="100" value={kr.progress} onChange={e=>{
                            const n = [...krs]; const idx = n.findIndex(x=>x.id===kr.id); n[idx].progress=Number(e.target.value); setKrs(n);
                        }} className="w-full mt-4 accent-black opacity-20 hover:opacity-100 transition-opacity"/>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2.3.1 WBS 分解
const WbsViewer = () => {
    return (
        <div className="h-full flex flex-col animate-fade-in">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Layers className="text-indigo-500"/> WBS 工作分解结构</h2>
             <div className="flex-1 overflow-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-inner">
                <div className="flex flex-col items-center">
                    <div className="px-6 py-3 bg-black text-white rounded-lg font-bold shadow-lg mb-8">1.0 移动端 APP 开发</div>
                    <div className="flex gap-8 w-full justify-center">
                        {/* 分支 1 */}
                        <div className="flex flex-col items-center">
                             <div className="h-8 w-px bg-gray-300 mb-0"></div>
                             <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded font-bold mb-4 border border-blue-200">1.1 前端 UI</div>
                             <div className="space-y-2">
                                <div className="p-2 bg-gray-50 border rounded text-xs text-center">1.1.1 首页设计</div>
                                <div className="p-2 bg-gray-50 border rounded text-xs text-center">1.1.2 个人中心</div>
                             </div>
                        </div>
                         {/* 分支 2 */}
                        <div className="flex flex-col items-center">
                             <div className="h-8 w-px bg-gray-300 mb-0"></div>
                             <div className="px-4 py-2 bg-green-100 text-green-800 rounded font-bold mb-4 border border-green-200">1.2 后端 API</div>
                             <div className="space-y-2">
                                <div className="p-2 bg-gray-50 border rounded text-xs text-center">1.2.1 鉴权模块</div>
                                <div className="p-2 bg-gray-50 border rounded text-xs text-center">1.2.2 订单接口</div>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

// 2.4 项目章程生成器 (AI)
const ProjectCharter = () => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', goal: '', stakeholders: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    const generateCharter = async () => {
        setIsGenerating(true);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Missing");
            
            const ai = new GoogleGenAI({ apiKey: apiKey });
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
            
            // Fix: Use .text property, NOT .text() method
            setGeneratedContent(resp.text || '');
            setStep(3);
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

// 2.3.3 回顾看板
const RetroBoard = () => {
    return (
        <div className="h-full flex flex-col animate-fade-in">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><RefreshCw className="text-pink-500"/> 迭代回顾 (Retrospective)</h2>
             <div className="flex-1 grid grid-cols-3 gap-6">
                {[
                    { t: 'Start (开始做)', c: 'bg-green-50 text-green-700', i: ['每日站会准时', '代码审查'] },
                    { t: 'Stop (停止做)', c: 'bg-red-50 text-red-700', i: ['无休止的会议', '直接操作生产库'] },
                    { t: 'Continue (继续做)', c: 'bg-blue-50 text-blue-700', i: ['周五下午茶', '结对编程'] }
                ].map((col, idx) => (
                    <div key={idx} className={`${col.c} p-6 rounded-3xl flex flex-col`}>
                        <h3 className="font-bold text-lg mb-4">{col.t}</h3>
                        <div className="space-y-3">
                            {col.i.map((item, ii) => (
                                <div key={ii} className="bg-white/60 p-3 rounded-xl shadow-sm font-medium text-sm">
                                    {item}
                                </div>
                            ))}
                            <button className="w-full py-3 rounded-xl border-2 border-dashed border-current opacity-30 hover:opacity-100 font-bold text-sm">+ Add Item</button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

// 2.5 用户故事拆分 (AI)
const UserStorySplitter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const handleSplit = async () => {
        setIsThinking(true);
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("未配置 API Key，无法使用 AI 功能");
            setIsThinking(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const prompt = `Act as an Agile Coach. Split the following Epic/User Story into 3-5 smaller, INVEST-compliant user stories. 
            Return ONLY the list of stories, one per line. Do not include introductory text.
            Input: "${input}"`;

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            // Fix: Use .text property, NOT .text() method
            const text: string = resp.text || '';
            const stories = text.split('\n').filter((line: string) => line.trim().length > 0);
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

// --- Simulation Component (Modal) ---
const ProjectSimulationView = ({ caseData, onClose, currentUser }: { caseData: any, onClose: () => void, currentUser?: UserProfile | null }) => {
    const [view, setView] = useState<'overview' | 'quiz' | 'result'>('overview');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoadingQ, setIsLoadingQ] = useState(false);

    useEffect(() => {
        if (currentUser) {
            console.log(`[Analytics] User ${currentUser.name} started case ${caseData.id}`);
        }
    }, [currentUser, caseData]);

    const startQuiz = async () => {
        setIsLoadingQ(true);
        // Try fetch DB first, else AI
        const { data: qData } = await supabase
            .from('app_case_questions')
            .select('*')
            .eq('case_id', caseData.id)
            .order('order_index');
        
        if (qData && qData.length > 0) {
            setQuestions(qData.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            })));
            setView('quiz');
            setIsLoadingQ(false);
        } else {
            await generateQuestionsByAI();
        }
    };

    const generateQuestionsByAI = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            // Fallback hardcoded questions if no AI key
            setQuestions([
                {
                    id: 'q1', question_text: '在项目初期，面对需求不明确的情况，最佳策略是？', type: 'mc',
                    options: ['A. 拒绝开始工作直到需求明确', 'B. 采用敏捷方法迭代开发', 'C. 估算一个最大预算', 'D. 忽略风险直接开工'],
                    correct_answer: 'B. 采用敏捷方法迭代开发',
                    explanation: '敏捷方法允许在需求不明确时通过迭代和小步快跑来逐步明确方向。'
                }
            ]);
            setView('quiz');
            setIsLoadingQ(false);
            return;
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Create 5 project management multiple choice questions based on case: "${caseData.title}". Return JSON array only: [{ "question_text": "...", "options": ["A..","B.."], "correct_answer": "...", "explanation": "..." }]`;
            
            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json' }
            });
            
            // FIX: Use .text property
            const text = resp.text || '[]';
            const generated = JSON.parse(text);
            setQuestions(generated);
            setView('quiz');
        } catch (e) {
            console.error(e);
            alert("题目加载失败");
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
            doc.setFontSize(16);
            doc.text(`Report: ${caseData.title}`, 10, 20);
            doc.text(`User: ${currentUser?.name || 'Guest'}`, 10, 30);
            doc.text(`Score: ${score} / 100`, 10, 40);
            doc.save("report.pdf");
        } catch(e) { console.error(e); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <X size={20}/>
                    </button>
                    <h1 className="font-bold text-gray-900 truncate max-w-md">{caseData.title}</h1>
                </div>
                {currentUser && (
                    <div className="hidden sm:block text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                        Challenger: {currentUser.name}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto w-full min-h-full">
                    {view === 'overview' && (
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center min-h-[calc(100vh-140px)]">
                            <div className="w-full lg:w-1/2 aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl group ring-1 ring-black/5">
                                <img src={caseData.cover_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-700" alt="Case Cover"/>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle size={80} className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-transform opacity-90 hover:opacity-100" onClick={startQuiz}/>
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 space-y-8">
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 mb-4`}>
                                        <Lock size={12}/> {caseData.difficulty} Case
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">{caseData.title}</h2>
                                    <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-gray-200 pl-4">{caseData.summary}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                     <h3 className="font-bold text-gray-900 flex items-center gap-2"><Terminal size={18}/> Mission Brief</h3>
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
                                    {isLoadingQ ? <Loader2 className="animate-spin"/> : <Terminal size={20}/>}
                                    {isLoadingQ ? 'Initializing Scenario...' : 'Enter Simulation Environment'}
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
                                        <div className="shrink-0 mt-0.5"><Activity size={16}/></div>
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
                                    <FileDown size={20}/> Download Report
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

// --- Lab Tool View (Wrapper) ---
const LabToolView = ({ toolId, onClose }: { toolId: string, onClose: () => void }) => {
    const renderTool = () => {
        switch(toolId) {
            // Quantitative
            case 'evm': return <EvmCalculator />;
            case 'pert': return <PertCalculator />;
            case 'cpm': return <CpmCalculator />; 
            case 'roi': return <RoiCalculator />; 
            case 'burn': return <BurnDownChart />;
            
            // Strategic
            case 'swot': return <SwotBoard />;
            case 'stakeholder': return <StakeholderMatrix />; 
            case 'risk': return <RiskEmv />; 
            case 'okr': return <OkrTracker />; 
            
            // Toolkit
            case 'wbs': return <WbsViewer />; 
            case 'charter': return <ProjectCharter />;
            case 'retro': return <RetroBoard />; 
            case 'userstory': return <UserStorySplitter />;
            
            default: return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Cpu size={48} className="mb-4 opacity-50"/>
                    <p className="font-bold text-lg">Tool Under Construction</p>
                    <p className="text-sm">此工具正在开发中...</p>
                </div>
            );
        }
    };
    
    return (
        <div className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col animate-fade-in">
           <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex items-center gap-2 font-bold text-sm">
                   <ChevronLeft size={20}/> 返回实验室
               </button>
               <div className="font-bold text-gray-900">PM 实验室环境</div>
               <div className="w-10"></div>
           </div>
           <div className="flex-1 overflow-auto p-6 md:p-10">
                <div className="max-w-6xl mx-auto h-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 overflow-hidden relative">
                    {renderTool()}
                </div>
           </div>
        </div>
    );
}

// --- Advanced Lab View ---
const AdvancedLabView = ({ onSelect }: { onSelect: (tool: any) => void }) => {
    return (
        <div className="space-y-12 pb-10">
            {Object.entries(LAB_TOOLS).map(([category, tools]) => (
                <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category === 'Quantitative' && <BarChart3 className="text-blue-500" />}
                        {category === 'Strategic' && <Shield className="text-purple-500" />}
                        {category === 'Toolkit' && <Layers className="text-green-500" />}
                        {category} Labs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tools.map((tool: any) => (
                            <div 
                                key={tool.id}
                                onClick={() => onSelect(tool)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110`}>
                                    <tool.icon size={80} />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 mb-4 group-hover:bg-black group-hover:text-white transition-colors shadow-sm">
                                    <tool.icon size={24} />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
                                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                    进入实验室 <ArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main LearningHub Component ---
const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Courses (Foundation)
  useEffect(() => {
    const fetchCourses = async () => {
        if (mainTab !== 'Foundation') return;
        setIsLoading(true);
        const { data } = await supabase
            .from('app_courses')
            .select('*')
            .eq('category', subTab) 
            .eq('status', 'Published')
            .order('created_at', { ascending: false });
        
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
            
            {/* 1. Foundation View */}
            {mainTab === 'Foundation' && !selectedItem && (
            <div className="min-h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-400"/></div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                        {courses.map(item => (
                            <div key={item.id} onClick={() => onNavigate(Page.CLASSROOM, item.id)} className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden border border-gray-100/50">
                                <div className="aspect-[4/3] bg-gray-200 relative">
                                    <img src={item.image} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold">
                                        {item.duration || '2h 15m'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">暂无课程</div>
                )}
            </div>
            )}
            
            {/* 2. Advanced View */}
            {mainTab === 'Advanced' && !selectedItem && (
                <AdvancedLabView onSelect={(t: any) => setSelectedItem({ type: 'lab', ...t })} />
            )}

            {/* 3. Implementation View */}
            {mainTab === 'Implementation' && !selectedItem && (
                <div className="pb-10 grid grid-cols-1 gap-8">
                    {CLASSIC_CASES.map((caseItem) => (
                        <div 
                            key={caseItem.id}
                            onClick={() => setSelectedItem({ type: 'simulation', data: caseItem })}
                            className="group bg-white rounded-[2.5rem] p-0 border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row h-auto md:h-[320px]"
                        >
                            <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden">
                                <img src={caseItem.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={caseItem.title}/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${caseItem.difficulty === 'High' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                            {caseItem.difficulty}
                                        </div>
                                        <h3 className="text-2xl font-bold leading-tight">{caseItem.title}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-8 flex flex-col justify-between relative">
                                <div>
                                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <Terminal size={14} className="text-blue-500"/>
                                        Interactive Simulation
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                                        {caseItem.summary}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1"><History size={14}/> 0% Complete</span>
                                        <span className="flex items-center gap-1"><Clock size={14}/> ~30 min</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold bg-black text-white px-6 py-3 rounded-xl group-hover:bg-blue-600 transition-colors shadow-lg">
                                        Start Case <PlayCircle size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
        </div>

        {/* --- Modals MOVED OUTSIDE of the animated container to fix position: fixed --- */}
        {selectedItem?.type === 'lab' && (
            <LabToolView 
                toolId={selectedItem.id} 
                onClose={() => setSelectedItem(null)}
            />
        )}

        {selectedItem?.type === 'simulation' && (
            <ProjectSimulationView 
                caseData={selectedItem.data}
                onClose={() => setSelectedItem(null)} 
                currentUser={currentUser}
            />
        )}
    </>
  );
};

export default LearningHub;
