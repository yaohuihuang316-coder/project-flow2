
import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, Star, BookOpen, ChevronLeft, 
  Activity, Zap, Terminal, Play, 
  Network, BarChart3, 
  GitMerge, Layers, Database, Shield, Loader2,
  Layout, Cpu, Briefcase, FileText, RefreshCw, CloudLightning, Plus,
  ArrowRight, DollarSign, Target, Save, X, Award, 
  History, BookMarked, FileDown
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
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

// Helper Icons to avoid import conflicts or unused errors
function FlameIcon(props:any) { return <CloudLightning {...props} />; }
function TargetIcon(props:any) { return <Target {...props} />; }
function UsersIcon(props:any) { 
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; 
}

// --- Sub-Components ---

// 1. Real Case Study View
interface CaseStudy {
    id: string;
    title: string;
    summary: string;
    content: string;
    cover_image: string;
    difficulty: string;
}

interface Question {
    id: string;
    question_text: string;
    type: 'mc' | 'tf';
    options: string[];
    correct_answer: string;
    explanation: string;
}

const ProjectSimulationView = ({ onClose, currentUser }: { onClose: () => void, currentUser?: UserProfile | null }) => {
    const [view, setView] = useState<'list' | 'quiz' | 'result'>('list');
    const [cases, setCases] = useState<CaseStudy[]>([]);
    const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    // Load Cases & History
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            
            // 1. Fetch Cases
            const { data: casesData } = await supabase.from('app_case_studies').select('*');
            if (casesData) setCases(casesData);

            // 2. Fetch History
            if (currentUser) {
                const { data: histData } = await supabase
                    .from('app_case_history')
                    .select('*, app_case_studies(title)')
                    .eq('user_id', currentUser.id)
                    .order('completed_at', { ascending: false });
                if (histData) setHistory(histData);
            }
            setIsLoading(false);
        };
        initData();
    }, [currentUser]);

    // Start Quiz
    const startCase = async (c: CaseStudy) => {
        setIsLoading(true);
        setSelectedCase(c);
        
        // Fetch Questions
        const { data: qData } = await supabase
            .from('app_case_questions')
            .select('*')
            .eq('case_id', c.id)
            .order('order_index');
        
        if (qData && qData.length > 0) {
            setQuestions(qData.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            })));
            setView('quiz');
        } else {
            // Fallback: Generate 10 questions via AI if DB is empty
            await generateQuestionsByAI(c);
        }
        
        setScore(0);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsLoading(false);
    };

    const generateQuestionsByAI = async (c: CaseStudy) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("题库为空且未配置 AI Key。建议在 SQL Editor 运行建表脚本插入数据。");
            setView('list');
            return;
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey });
            // Asking for 10 questions
            const prompt = `Based on the case study "${c.title}": ${c.summary}... 
            Generate 10 quiz questions (mix of Multiple Choice and True/False).
            Return valid JSON array: [{ "question_text": "...", "type": "mc", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "..." }]`;
            
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
            alert("AI生成题目失败，请检查网络或 Key");
            setView('list');
        }
    };

    const handleAnswer = (option: string) => {
        setSelectedOption(option);
        setIsAnswered(true);
        
        const currentQ = questions[currentQIndex];
        if (option === currentQ.correct_answer) {
            setScore(s => s + 10);
        }
    };

    const nextQuestion = async () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // Finish
            if (currentUser && selectedCase) {
                await supabase.from('app_case_history').insert({
                    user_id: currentUser.id,
                    case_id: selectedCase.id,
                    score: score + (selectedOption === questions[currentQIndex].correct_answer ? 10 : 0),
                    max_score: questions.length * 10
                });
                const { data } = await supabase.from('app_case_history').select('*, app_case_studies(title)').eq('user_id', currentUser.id).order('completed_at', {ascending:false});
                if(data) setHistory(data);
            }
            if (selectedOption === questions[currentQIndex].correct_answer) {
                setScore(s => s + 10);
            }
            setView('result');
        }
    };

    const handleDownloadReport = () => {
        if (!selectedCase) return;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("ProjectFlow Case Study Report", 10, 20);
        
        doc.setFontSize(16);
        doc.text(selectedCase.title, 10, 30);
        
        doc.setFontSize(12);
        doc.text(`Score: ${score} / ${questions.length * 10}`, 10, 40);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 48);
        
        doc.setFontSize(10);
        // Simple word wrap
        const splitText = doc.splitTextToSize(selectedCase.content.substring(0, 1000) + '...', 180);
        doc.text(splitText, 10, 60);
        
        doc.save(`${selectedCase.title}_Report.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20}/></button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <BookMarked size={16} className="text-blue-600"/>
                            商业案例实战 (Business Case Challenge)
                        </h1>
                    </div>
                </div>
                {currentUser && (
                    <div className="flex items-center gap-2 text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full text-gray-600">
                        <History size={14}/> 历史挑战: {history.length} 次
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-6 max-w-7xl mx-auto w-full">
                
                {/* VIEW: List */}
                {view === 'list' && (
                    <div className="h-full overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                            {cases.map((c) => (
                                <div key={c.id} onClick={() => startCase(c)} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                                        <img src={c.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={c.title}/>
                                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                                            {c.difficulty}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{c.title}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">{c.summary}</p>
                                        <button className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg group-hover:bg-blue-600 transition-colors">
                                            开始挑战
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {cases.length === 0 && !isLoading && (
                                <div className="col-span-full text-center py-20 text-gray-400">
                                    暂无案例，请检查数据库连接 (Run SQL Script)。
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: Quiz */}
                {view === 'quiz' && selectedCase && questions.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                        {/* Left: Case Doc */}
                        <div className="flex-1 bg-[#fffdf5] border border-gray-200 p-8 rounded-2xl shadow-inner overflow-y-auto relative">
                            <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-loose whitespace-pre-line">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedCase.title}</h2>
                                {selectedCase.content}
                            </div>
                        </div>

                        {/* Right: Question */}
                        <div className="w-full md:w-[400px] flex flex-col">
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Question {currentQIndex + 1} / {questions.length}</span>
                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Score: {score}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 leading-snug">
                                        {questions[currentQIndex].question_text}
                                    </h3>

                                    <div className="space-y-3">
                                        {questions[currentQIndex].options.map((opt, idx) => {
                                            const isCorrect = opt === questions[currentQIndex].correct_answer;
                                            const isSelected = opt === selectedOption;
                                            
                                            let btnClass = "w-full p-4 rounded-xl text-left text-sm font-medium border transition-all ";
                                            
                                            if (isAnswered) {
                                                if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-800";
                                                else if (isSelected) btnClass += "bg-red-50 border-red-200 text-red-700";
                                                else btnClass += "bg-gray-50 border-gray-100 opacity-50";
                                            } else {
                                                btnClass += "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md";
                                            }

                                            return (
                                                <button 
                                                    key={idx}
                                                    onClick={() => !isAnswered && handleAnswer(opt)}
                                                    className={btnClass}
                                                    disabled={isAnswered}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isAnswered && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900 animate-fade-in-up">
                                            <p className="font-bold mb-1">解析：</p>
                                            {questions[currentQIndex].explanation}
                                        </div>
                                    )}
                                </div>

                                {isAnswered && (
                                    <button onClick={nextQuestion} className="mt-6 w-full py-3 bg-black text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shrink-0">
                                        {currentQIndex < questions.length - 1 ? '下一题' : '查看结果'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: Result */}
                {view === 'result' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center max-w-md w-full animate-bounce-in">
                            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
                                <Award size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">挑战完成!</h2>
                            <p className="text-gray-500 mb-8">最终得分</p>
                            <div className="text-7xl font-black text-black mb-8">{score}</div>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={handleDownloadReport}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileDown size={18}/> 下载评估报告 (PDF)
                                </button>
                                <button 
                                    onClick={() => setView('list')}
                                    className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    返回案例大厅
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// 2. Lab Tools Implementation
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

const ProjectCharter = () => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: '', goal: '', stakeholders: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    const generateCharter = async () => {
        setIsGenerating(true);
        try {
            const apiKey = getApiKey();
            const ai = new GoogleGenAI({ apiKey: apiKey || '' });
            const prompt = `Act as a Senior Project Manager. Generate a professional Project Charter for a project named "${data.name}" with the goal: "${data.goal}". Format the output as clean text suitable for a document.`;

            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            
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

const UserStorySplitter = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const handleSplit = async () => {
        setIsThinking(true);
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("未配置 API Key");
            setIsThinking(false);
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Split this Epic into INVEST user stories: "${input}". Return list.`;
            const resp = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const text: string = resp.text || '';
            setOutput(text.split('\n').filter((l: string) => l.trim().length > 0));
        } catch (e) {
            setOutput(['AI Service Unavailable']);
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
                        placeholder="输入 Epic..."
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
                    <h3 className="font-bold text-gray-900 mb-4">拆分建议</h3>
                    <ul className="space-y-3">
                        {output.map((s,i) => <li key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg"><span className="font-bold text-blue-500">#{i+1}</span>{s}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AdvancedLabView = ({ onSelect }: { onSelect: (tool: any) => void }) => {
    return (
        <div className="space-y-12 pb-10">
            {Object.entries(LAB_TOOLS).map(([category, tools]) => (
                <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category === 'Quantitative' && <BarChart3 className="text-blue-500" />}
                        {category === 'Strategic' && <Shield className="text-purple-500" />}
                        {category === 'Toolkit' && <Briefcase className="text-green-500" />}
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

const LabToolView = ({ toolId, onClose }: { toolId: string, onClose: () => void }) => {
    const renderTool = () => {
        switch(toolId) {
            case 'evm': return <EvmCalculator />;
            case 'pert': return <PertCalculator />;
            case 'swot': return <SwotBoard />;
            case 'charter': return <ProjectCharter />;
            case 'userstory': return <UserStorySplitter />;
            default: return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Cpu size={48} className="mb-4 opacity-50"/>
                    <p className="font-bold text-lg">Tool Under Construction</p>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col animate-fade-in">
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
};

// --- Main Component ---
const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
         {/* --- 1. Foundation: Course List --- */}
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
         
         {/* --- 2. Advanced: Lab Tools --- */}
         {mainTab === 'Advanced' && !selectedItem && (
            <AdvancedLabView onSelect={(t: any) => setSelectedItem({ type: 'lab', ...t })} />
         )}

         {/* --- 3. Implementation: Case Studies --- */}
         {mainTab === 'Implementation' && !selectedItem && (
            <div className="grid grid-cols-1 gap-6 pb-10">
                <div 
                    onClick={() => setSelectedItem({ type: 'simulation', id: 'case-hub' })}
                    className="group bg-[#1e1e1e] p-0 rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-800 flex flex-col h-[280px]"
                >
                    <div className="h-10 bg-[#2d2d2d] flex items-center gap-2 px-6 border-b border-black/50 shrink-0">
                        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
                        <span className="ml-auto text-[10px] text-gray-500 font-mono flex items-center gap-1"><Terminal size={10}/> SIMULATION</span>
                    </div>
                    <div className="p-8 flex flex-col justify-between flex-1 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-blue-500 to-indigo-600 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-1 rounded border border-white/5">Real-world</span>
                                <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-1 rounded border border-white/5">Analysis</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">商业案例实战 (Case Studies)</h3>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">深入剖析经典项目成败案例，从历史中汲取经验。</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                            <Play size={14} className="fill-current"/> 进入实战 (Start)
                        </div>
                    </div>
                </div>
            </div>
         )}

         {/* --- Modals / Views --- */}
         {selectedItem?.type === 'lab' && (
             <LabToolView toolId={selectedItem.id} onClose={() => setSelectedItem(null)} />
         )}

         {selectedItem?.type === 'simulation' && (
             <ProjectSimulationView 
                onClose={() => setSelectedItem(null)} 
                currentUser={currentUser}
             />
         )}
      </div>
    </div>
  );
};

export default LearningHub;
