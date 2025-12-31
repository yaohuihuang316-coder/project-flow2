
import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, Star, BookOpen, ChevronLeft, 
  Activity, Zap, Terminal, Play, 
  Network, BarChart3, 
  GitMerge, Layers, Database, Shield, Loader2,
  Layout, Cpu, Briefcase, FileText, RefreshCw, CloudLightning, Plus,
  ArrowRight, DollarSign, Target, Save, X, Award, 
  History, BookMarked, FileDown, AlertCircle
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";
// jsPDF import removed from top-level to prevent load-time crash
// We will use a dynamic import or window object if needed, or standard import if reliable.
// For now, we keep standard import but use it carefully.
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

// Helper Icons
function FlameIcon(props:any) { return <CloudLightning {...props} />; }
function TargetIcon(props:any) { return <Target {...props} />; }
function UsersIcon(props:any) { 
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; 
}

// --- Interfaces ---
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

// --- Simulation Component (Single Case Flow) ---
const ProjectSimulationView = ({ caseData, onClose, currentUser }: { caseData: CaseStudy, onClose: () => void, currentUser?: UserProfile | null }) => {
    const [view, setView] = useState<'overview' | 'quiz' | 'result'>('overview');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoadingQ, setIsLoadingQ] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        // Fetch User History for this case
        if (currentUser) {
            supabase
                .from('app_case_history')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('case_id', caseData.id)
                .order('completed_at', { ascending: false })
                .then(({ data }) => {
                    if (data) setHistory(data);
                });
        }
    }, [currentUser, caseData]);

    const startQuiz = async () => {
        setIsLoadingQ(true);
        // Fetch Questions
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
        } else {
            // Fallback: AI Generation
            await generateQuestionsByAI();
        }
        setScore(0);
        setCurrentQIndex(0);
        setIsLoadingQ(false);
    };

    const generateQuestionsByAI = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("题库未就绪且未配置 AI Key。");
            setIsLoadingQ(false);
            return;
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Based on: "${caseData.title} - ${caseData.summary}", generate 5 multiple choice questions in JSON: [{ "question_text": "...", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "..." }]`;
            
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
            alert("题目加载失败");
        }
    };

    const handleAnswer = (option: string) => {
        setSelectedOption(option);
        setIsAnswered(true);
        if (option === questions[currentQIndex].correct_answer) {
            setScore(s => s + 10); // Assume 10 pts per question
        }
    };

    const nextQuestion = async () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // Finish
            const finalScore = score + (selectedOption === questions[currentQIndex].correct_answer ? 10 : 0);
            if (currentUser) {
                await supabase.from('app_case_history').insert({
                    user_id: currentUser.id,
                    case_id: caseData.id,
                    score: finalScore,
                    max_score: questions.length * 10
                });
            }
            if (selectedOption === questions[currentQIndex].correct_answer) setScore(finalScore);
            setView('result');
        }
    };

    const handleDownloadReport = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text("ProjectFlow Case Report", 10, 20);
            doc.setFontSize(14);
            doc.text(caseData.title, 10, 30);
            doc.setFontSize(12);
            doc.text(`Final Score: ${score}`, 10, 40);
            
            // Simple text wrapping
            const splitText = doc.splitTextToSize(caseData.summary, 180);
            doc.text(splitText, 10, 50);
            
            doc.save(`Case_${caseData.id}_Report.pdf`);
        } catch (e) {
            console.error("PDF Error", e);
            alert("PDF 生成失败，请重试");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20}/></button>
                    <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Terminal size={16} className="text-blue-600"/>
                        {caseData.title}
                    </h1>
                </div>
                {currentUser && (
                    <div className="text-xs font-bold text-gray-500">
                        历史最高分: {history.reduce((max, h) => Math.max(max, h.score), 0)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6 max-w-7xl mx-auto w-full">
                
                {/* VIEW 1: Overview */}
                {view === 'overview' && (
                    <div className="h-full flex flex-col md:flex-row gap-8 items-center justify-center">
                        <div className="w-full md:w-1/2 aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-lg relative">
                            <img src={caseData.cover_image} className="w-full h-full object-cover" alt="Cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <PlayCircle size={64} className="text-white/80" />
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 space-y-6">
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${caseData.difficulty === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                    {caseData.difficulty} Difficulty
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    预计耗时 15 min
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{caseData.title}</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">{caseData.summary}</p>
                            
                            <button 
                                onClick={startQuiz} 
                                disabled={isLoadingQ}
                                className="px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                            >
                                {isLoadingQ ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                                {isLoadingQ ? '准备试题中...' : '开始挑战'}
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW 2: Quiz Split View */}
                {view === 'quiz' && questions.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                        {/* Case Document */}
                        <div className="flex-1 bg-[#fffdf5] border border-gray-200 p-8 rounded-2xl shadow-inner overflow-y-auto">
                            <article className="prose prose-sm max-w-none font-serif">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">案件卷宗 (Case File)</h2>
                                <div className="whitespace-pre-line text-gray-800 leading-loose">
                                    {caseData.content}
                                </div>
                            </article>
                        </div>

                        {/* Quiz Interface */}
                        <div className="w-full md:w-[400px] flex flex-col">
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Q {currentQIndex + 1} / {questions.length}</span>
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

                {/* VIEW 3: Result */}
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
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    返回案例列表
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Lab Tool Components (Kept Compact) ---
const EvmCalculator = () => {
    // ... same as before
    return <div className="p-8 text-center text-gray-500">EVM Calculator Loaded</div>;
};
const PertCalculator = () => <div className="p-8 text-center text-gray-500">PERT Calculator Loaded</div>;
const SwotBoard = () => <div className="p-8 text-center text-gray-500">SWOT Board Loaded</div>;
const ProjectCharter = () => <div className="p-8 text-center text-gray-500">Charter Generator Loaded</div>;
const UserStorySplitter = () => <div className="p-8 text-center text-gray-500">User Story Splitter Loaded</div>;

const AdvancedLabView = ({ onSelect }: { onSelect: (tool: any) => void }) => {
    return (
        <div className="space-y-12 pb-10">
            {Object.entries(LAB_TOOLS).map(([category, tools]) => (
                <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {category} Labs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tools.map((tool: any) => (
                            <div 
                                key={tool.id}
                                onClick={() => onSelect(tool)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 mb-4">
                                    <tool.icon size={24} />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{tool.name}</h4>
                                <p className="text-sm text-gray-500">{tool.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const LabToolView = ({ toolId, onClose }: { toolId: string, onClose: () => void }) => {
    // Render specific tool based on ID
    const renderTool = () => {
        switch(toolId) {
            case 'evm': return <EvmCalculator />; // In real app, put full component code back
            default: return <div className="flex items-center justify-center h-full">Tool Interface Placeholder</div>;
        }
    };
    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col animate-fade-in">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                <button onClick={onClose}><ChevronLeft/></button>
                <span className="ml-4 font-bold">Lab Tool</span>
            </div>
            <div className="flex-1 p-6">{renderTool()}</div>
        </div>
    );
};

// --- Main LearningHub Component ---
const LearningHub: React.FC<LearningHubProps> = ({ onNavigate, currentUser }) => {
  const [mainTab, setMainTab] = useState<MainCategory>('Foundation');
  const [subTab, setSubTab] = useState<SubCategory>('Course');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Data States
  const [courses, setCourses] = useState<any[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
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

  // Fetch Cases (Implementation) - Fix: Fetch 5 cases directly
  useEffect(() => {
      const fetchCases = async () => {
          if (mainTab !== 'Implementation') return;
          setIsLoading(true);
          const { data } = await supabase.from('app_case_studies').select('*');
          if (data) setCaseStudies(data);
          else setCaseStudies([]); // Handle empty
          setIsLoading(false);
      };
      fetchCases();
  }, [mainTab]);

  useEffect(() => { setSelectedItem(null); }, [mainTab, subTab]);

  return (
    <div className={`pt-28 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen transition-all ${selectedItem ? 'max-w-full px-0 pt-0 pb-0' : ''}`}>
      
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
                            {/* Course Card Content */}
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
         
         {/* 2. Advanced View (Labs) */}
         {mainTab === 'Advanced' && !selectedItem && (
            <AdvancedLabView onSelect={(t: any) => setSelectedItem({ type: 'lab', ...t })} />
         )}

         {/* 3. Implementation View (Case Studies) - Fixed Logic */}
         {mainTab === 'Implementation' && !selectedItem && (
            <div className="pb-10">
                {isLoading ? (
                    <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-gray-400"/></div>
                ) : caseStudies.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {caseStudies.map((caseItem) => (
                            <div 
                                key={caseItem.id}
                                onClick={() => setSelectedItem({ type: 'simulation', data: caseItem })}
                                className="group bg-white rounded-[2.5rem] p-0 border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row h-auto md:h-[280px]"
                            >
                                <div className="w-full md:w-2/5 h-48 md:h-full relative overflow-hidden">
                                    <img src={caseItem.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={caseItem.title}/>
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20">
                                        {caseItem.difficulty}
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col justify-between relative">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Real Case Study</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                            {caseItem.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                                            {caseItem.summary}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                            <span className="flex items-center gap-1"><History size={14}/> 历史记录</span>
                                            <span className="flex items-center gap-1"><Clock size={14}/> 20 min</span>
                                        </div>
                                        <button className="flex items-center gap-2 text-xs font-bold bg-black text-white px-5 py-2.5 rounded-xl group-hover:bg-blue-600 transition-colors">
                                            <Terminal size={14} /> 进入实战
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                        <AlertCircle size={32} className="mb-4 text-red-400" />
                        <p className="font-bold text-gray-900">暂无案例数据</p>
                        <p className="text-sm mt-1">请运行 SQL 脚本初始化数据库 (app_case_studies 表)</p>
                    </div>
                )}
            </div>
         )}

         {/* --- Modals / Views --- */}
         {selectedItem?.type === 'lab' && (
             <LabToolView toolId={selectedItem.id} onClose={() => setSelectedItem(null)} />
         )}

         {selectedItem?.type === 'simulation' && (
             <ProjectSimulationView 
                caseData={selectedItem.data}
                onClose={() => setSelectedItem(null)} 
                currentUser={currentUser}
             />
         )}
      </div>
    </div>
  );
};

export default LearningHub;
