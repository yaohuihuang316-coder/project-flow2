
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Terminal, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface SimulationProps {
    onBack: () => void;
    currentUser?: UserProfile | null;
}

const Simulation: React.FC<SimulationProps> = ({ onBack }) => {
    // State
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [activeScenario, setActiveScenario] = useState<any>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Scenarios from DB
    useEffect(() => {
        const fetchSimulations = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('app_courses')
                .select('*')
                .eq('category', 'Simulation'); // Assuming Simulations are stored here
            if (data) {
                // Parse script data
                const parsed = data.map(d => ({
                    ...d,
                    script: typeof d.simulation_data === 'string' ? JSON.parse(d.simulation_data) : d.simulation_data
                }));
                setScenarios(parsed);
            }
            setIsLoading(false);
        };
        fetchSimulations();
    }, []);

    const startScenario = (scenario: any) => {
        if (!scenario.script || scenario.script.length === 0) {
            alert("该模拟暂无剧本配置 (Admin Please Config)");
            return;
        }
        setActiveScenario(scenario);
        setCurrentStepIndex(0);
        setScore(0);
        setHistory([]);
    };

    const handleChoice = (option: any) => {
        const points = option.score || 0;
        setScore(s => s + points);
        setHistory(prev => [...prev, {
            step: activeScenario.script[currentStepIndex].message,
            choice: option.text,
            points
        }]);

        if (currentStepIndex < activeScenario.script.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // End
            setCurrentStepIndex(-1); // Mark as finished
        }
    };

    // --- Render View: Scenario List ---
    if (!activeScenario) {
        return (
            <div className="w-full h-screen bg-[#F5F5F7] flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg"><ChevronLeft /></button>
                    <h1 className="text-2xl font-bold text-gray-900">实战模拟中心 (Simulation Hub)</h1>
                </div>
                {isLoading ? <div className="text-center"><Loader2 className="animate-spin mx-auto" /> Loading Scenarios...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {scenarios.map(s => (
                            <div key={s.id} className="bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100" onClick={() => startScenario(s)}>
                                <div className="h-40 bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="text-white fill-white" size={48} />
                                    </div>
                                    <img src={s.image || 'https://images.unsplash.com/photo-1553877606-3c72bd63c9d2?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{s.author}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Terminal size={14} /> {s.script?.length || 0} Events
                                </div>
                            </div>
                        ))}
                        {scenarios.length === 0 && (
                            <div className="col-span-3 text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                                暂无剧本，请在后台内容管理中创建类型为 "Simulation" 的内容。
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // --- Render View: Active Scenario Runner ---
    const currentEvent = activeScenario.script[currentStepIndex];
    const isFinished = currentStepIndex === -1;

    return (
        <div className="w-full h-screen bg-[#1c1c1e] text-white flex flex-col relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/10">
                <button onClick={() => setActiveScenario(null)} className="text-gray-400 hover:text-white flex items-center gap-2 font-bold text-sm">
                    <ChevronLeft size={16} /> 退出模拟
                </button>
                <div className="text-center">
                    <h2 className="font-bold">{activeScenario.title}</h2>
                    <p className="text-xs text-gray-500">{isFinished ? 'Completed' : `Event ${currentStepIndex + 1} / ${activeScenario.script.length}`}</p>
                </div>
                <div className="px-3 py-1 rounded bg-white/10 text-xs font-mono font-bold">
                    Score: {score}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-2xl mx-auto w-full">
                {isFinished ? (
                    <div className="text-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-black mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">模拟完成</h1>
                        <p className="text-gray-400 mb-8">最终得分: <span className="text-white font-bold text-xl">{score}</span></p>
                        <div className="space-y-2 text-left bg-white/5 p-6 rounded-2xl mb-8 max-h-60 overflow-y-auto custom-scrollbar">
                            {history.map((h, i) => (
                                <div key={i} className="text-sm border-b border-white/10 pb-2 last:border-0">
                                    <p className="text-gray-400 text-xs mb-1">Event: {h.step}</p>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-blue-400">{h.choice}</span>
                                        <span className={h.points >= 0 ? 'text-green-500' : 'text-red-500'}>{h.points > 0 ? '+' : ''}{h.points}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setActiveScenario(null)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                            返回列表
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-8 animate-fade-in">
                        {/* Event Card */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl">
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> {currentEvent.trigger}
                            </div>
                            <h3 className="text-2xl font-medium leading-relaxed">
                                {currentEvent.message}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="grid gap-4">
                            {currentEvent.options && currentEvent.options.length > 0 ? (
                                currentEvent.options.map((opt: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleChoice(opt)}
                                        className="w-full p-4 rounded-xl bg-white text-black font-bold text-left hover:bg-gray-200 hover:scale-[1.01] transition-all flex justify-between group"
                                    >
                                        <span>{opt.text}</span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">选择 →</span>
                                    </button>
                                ))
                            ) : (
                                <button onClick={() => handleChoice({})} className="w-full p-4 bg-blue-600 rounded-xl font-bold">继续 (Next)</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Simulation;
