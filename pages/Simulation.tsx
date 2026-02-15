
import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, Play, CheckCircle2, AlertTriangle, Loader2, 
    Trophy, Clock, Target, Sparkles, ArrowLeft,
    ArrowRight, RotateCcw, TrendingUp, Zap, BookOpen,
    Users, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Page } from '../types';
import { generateSimulationReport, SimulationReportData, KimiReportResponse } from '../lib/kimiService';

interface SimulationProps {
    onNavigate?: (page: Page) => void;
    onBack?: () => void;
    currentUser?: UserProfile | null;
}

// 模拟场景类型
interface SimulationScenario {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    category: string;
    cover_image: string;
    stages: SimulationStage[];
    learning_objectives: string[];
    estimated_time: number;
    completion_count: number;
}

// 模拟阶段
interface SimulationStage {
    id: string;
    title: string;
    description: string;
    context?: string;
    decisions: Decision[];
    resources?: ResourceState;
}

// 决策选项
interface Decision {
    id: string;
    text: string;
    description?: string;
    impact: {
        score: number;
        resources?: ResourceState;
        feedback: string;
    };
    is_optimal?: boolean;
}

// 资源状态
interface ResourceState {
    budget?: number;
    time?: number;
    morale?: number;
    quality?: number;
}

// 用户进度
interface UserSimulationProgress {
    id: string;
    scenario_id: string;
    current_stage: number;
    decisions_made: MadeDecision[];
    resources_state: ResourceState;
    score: number;
    max_score: number;
    status: 'in_progress' | 'completed' | 'abandoned';
    started_at: string;
    completed_at?: string;
}

interface MadeDecision {
    stage_id: string;
    decision_id: string;
    score: number;
    timestamp: string;
}


const Simulation: React.FC<SimulationProps> = ({ onBack: _onBack, currentUser }) => {
    // 页面状态
    const [view, setView] = useState<'list' | 'detail' | 'running' | 'result'>('list');
    const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
    const [userProgress, setUserProgress] = useState<UserSimulationProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 模拟运行状态
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [stageHistory, setStageHistory] = useState<any[]>([]);
    const [resources, setResources] = useState<ResourceState>({});
    const [totalScore, setTotalScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastDecision, setLastDecision] = useState<Decision | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    
    // AI 报告状态
    const [kimiReport, setKimiReport] = useState<KimiReportResponse | null>(null);

    // 获取场景列表
    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_simulation_scenarios')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const parsedScenarios: SimulationScenario[] = data.map(s => {
                    let stages = [];
                    let learningObjectives = [];
                    
                    try {
                        stages = typeof s.stages === 'string' ? JSON.parse(s.stages) : s.stages || [];
                    } catch (e) {
                        console.error('解析 stages 失败:', e);
                        stages = [];
                    }
                    
                    try {
                        learningObjectives = typeof s.learning_objectives === 'string' 
                            ? JSON.parse(s.learning_objectives) 
                            : s.learning_objectives || [];
                    } catch (e) {
                        console.error('解析 learning_objectives 失败:', e);
                        learningObjectives = [];
                    }
                    
                    return {
                        ...s,
                        stages,
                        learning_objectives: learningObjectives,
                        estimated_time: s.estimated_time || 15,
                        completion_count: s.completion_count || 0
                    };
                });
                setScenarios(parsedScenarios);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 获取用户进度
    const fetchUserProgress = async (scenarioId: string) => {
        if (!currentUser) return null;
        
        try {
            const { data, error } = await supabase
                .from('app_simulation_progress')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('scenario_id', scenarioId)
                .maybeSingle();
            
            if (error) {
                console.error('获取用户进度失败:', error);
                return null;
            }
            
            if (data) {
                return {
                    ...data,
                    decisions_made: typeof data.decisions_made === 'string' 
                        ? JSON.parse(data.decisions_made) 
                        : data.decisions_made || [],
                    resources_state: typeof data.resources_state === 'string'
                        ? JSON.parse(data.resources_state)
                        : data.resources_state || {},
                } as UserSimulationProgress;
            }
        } catch (err) {
            console.error('解析用户进度失败:', err);
        }
        return null;
    };

    // 开始/继续模拟
    const startSimulation = async (scenario: SimulationScenario) => {
        if (!currentUser) {
            alert('请先登录');
            return;
        }

        setSelectedScenario(scenario);
        const progress = await fetchUserProgress(scenario.id);
        setUserProgress(progress);

        if (progress && progress.status === 'in_progress') {
            // 恢复进度
            setCurrentStageIndex(progress.current_stage);
            setResources(progress.resources_state || {});
            setTotalScore(progress.score || 0);
            setStageHistory(progress.decisions_made || []);
        } else {
            // 新开始
            setCurrentStageIndex(0);
            setResources(scenario.stages[0]?.resources || {});
            setTotalScore(0);
            setStageHistory([]);
            
            // 创建新进度记录
            try {
                const { error } = await supabase.from('app_simulation_progress').insert({
                    user_id: currentUser.id,
                    scenario_id: scenario.id,
                    current_stage: 0,
                    decisions_made: [],
                    resources_state: scenario.stages[0]?.resources || {},
                    score: 0,
                    max_score: calculateMaxScore(scenario),
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                });
                if (error) {
                    console.error('创建进度记录失败:', error);
                }
            } catch (err) {
                console.error('创建进度记录失败:', err);
            }
        }

        setView('running');
    };

    // 计算最大可能分数
    const calculateMaxScore = (scenario: SimulationScenario): number => {
        if (!scenario.stages || scenario.stages.length === 0) return 100;
        let max = 0;
        scenario.stages.forEach(stage => {
            if (!stage.decisions || stage.decisions.length === 0) return;
            const bestDecision = stage.decisions.reduce((best, d) => 
                (d.impact?.score || 0) > (best.impact?.score || 0) ? d : best
            , stage.decisions[0]);
            max += bestDecision?.impact?.score || 0;
        });
        return max || 100; // 默认至少100分
    };

    // 做出决策
    const makeDecision = async (decision: Decision) => {
        if (!selectedScenario || !currentUser) return;

        setLastDecision(decision);
        setShowFeedback(true);
        
        const newScore = totalScore + decision.impact.score;
        setTotalScore(newScore);
        
        // 更新资源状态
        const newResources = { ...resources, ...decision.impact.resources };
        setResources(newResources);
        
        // 记录历史
        const historyEntry = {
            stage_id: selectedScenario.stages[currentStageIndex].id,
            decision_id: decision.id,
            score: decision.impact.score,
            timestamp: new Date().toISOString()
        };
        const newHistory = [...stageHistory, historyEntry];
        setStageHistory(newHistory);

        // 保存进度
        setIsSaving(true);
        const nextStage = currentStageIndex + 1;
        const isCompleted = nextStage >= selectedScenario.stages.length;

        try {
            // 先尝试查询是否已有记录
            const { data: existing } = await supabase
                .from('app_simulation_progress')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('scenario_id', selectedScenario.id)
                .maybeSingle();

            const progressData = {
                user_id: currentUser.id,
                scenario_id: selectedScenario.id,
                current_stage: isCompleted ? currentStageIndex : nextStage,
                decisions_made: newHistory,
                resources_state: newResources,
                score: newScore,
                max_score: calculateMaxScore(selectedScenario),
                status: isCompleted ? 'completed' : 'in_progress',
                completed_at: isCompleted ? new Date().toISOString() : null,
                started_at: new Date().toISOString()
            };

            if (existing) {
                // 更新现有记录
                const { error } = await supabase
                    .from('app_simulation_progress')
                    .update(progressData)
                    .eq('id', existing.id);
                if (error) console.error('更新进度失败:', error);
            } else {
                // 插入新记录
                const { error } = await supabase
                    .from('app_simulation_progress')
                    .insert(progressData);
                if (error) console.error('插入进度失败:', error);
            }
        } catch (err) {
            console.error('保存进度失败:', err);
        }

        setIsSaving(false);

        // 延迟进入下一阶段
        setTimeout(() => {
            setShowFeedback(false);
            if (isCompleted) {
                setView('result');
            } else {
                setCurrentStageIndex(nextStage);
            }
        }, 2000);
    };

    // 生成缓存键
    // 获取难度颜色
    const getDifficultyColor = (difficulty: string) => {
        const colors: Record<string, string> = {
            'Easy': 'bg-green-100 text-green-700',
            'Medium': 'bg-blue-100 text-blue-700',
            'Hard': 'bg-orange-100 text-orange-700',
            'Expert': 'bg-red-100 text-red-700'
        };
        return colors[difficulty] || 'bg-gray-100 text-gray-700';
    };

    // 获取难度中文标签
    const getDifficultyLabel = (difficulty: string) => {
        const labels: Record<string, string> = {
            'Easy': '简单',
            'Medium': '中等',
            'Hard': '困难',
            'Expert': '专家'
        };
        return labels[difficulty] || difficulty;
    };

    // 场景列表视图
    const renderScenarioList = () => (
        <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">实战模拟中心</h1>
                <p className="text-gray-500 max-w-2xl">
                    在虚拟项目环境中进行决策演练，提升实战能力。每个场景都基于真实项目案例设计。
                </p>
            </div>

            {/* Stats */}
            {currentUser && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {scenarios.filter(s => userProgress?.scenario_id === s.id && userProgress.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-500">已完成</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {scenarios.filter(s => userProgress?.scenario_id === s.id && userProgress.status === 'in_progress').length}
                        </div>
                        <div className="text-sm text-gray-500">进行中</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {Math.round((userProgress?.score || 0) / Math.max(1, userProgress?.max_score || 1) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">平均得分</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <div className="text-3xl font-bold text-gray-900 mb-1">{scenarios.length}</div>
                        <div className="text-sm text-gray-500">可用场景</div>
                    </div>
                </div>
            )}

            {/* Scenario Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin mr-2" size={24} />
                    <span className="text-gray-500">加载中...</span>
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">
                    <AlertCircle size={48} className="mx-auto mb-4" />
                    <p>{error}</p>
                </div>
            ) : scenarios.length === 0 ? (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                    <Target size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">暂无可用场景</p>
                    <p className="text-sm mt-2">敬请期待更多精彩案例</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenarios.map(scenario => (
                        <div 
                            key={scenario.id}
                            className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all cursor-pointer group"
                            onClick={() => { setView('detail'); setSelectedScenario(scenario); }}
                        >
                            {/* Cover */}
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                <img 
                                    src={scenario.cover_image || 'https://images.unsplash.com/photo-1553877606-3c72bd63c9d2?auto=format&fit=crop&q=80'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={scenario.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${getDifficultyColor(scenario.difficulty)}`}>
                                        {getDifficultyLabel(scenario.difficulty)}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {scenario.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                    {scenario.description}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {scenario.estimated_time || 15}分钟
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <TrendingUp size={14} />
                                        {scenario.stages?.length || 0}个阶段
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {scenario.completion_count || 0}人已完成
                                    </span>
                                </div>

                                {/* Action */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {scenario.category}
                                    </span>
                                    <button className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                                        开始模拟 <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // 场景详情视图
    const renderScenarioDetail = () => {
        if (!selectedScenario) return null;
        
        return (
            <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
                <button 
                    onClick={() => { setView('list'); setSelectedScenario(null); }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
                >
                    <ChevronLeft size={20} /> 返回列表
                </button>

                {/* Header */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 mb-6">
                    <div className="flex items-start gap-6">
                        <img 
                            src={selectedScenario.cover_image || 'https://images.unsplash.com/photo-1553877606-3c72bd63c9d2?auto=format&fit=crop&q=80'}
                            className="w-32 h-32 rounded-2xl object-cover"
                            alt={selectedScenario.title}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(selectedScenario.difficulty)}`}>
                                    {getDifficultyLabel(selectedScenario.difficulty)}
                                </span>
                                <span className="text-sm text-gray-400">{selectedScenario.category}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">{selectedScenario.title}</h1>
                            <p className="text-gray-500 mb-4">{selectedScenario.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock size={16} />
                                    预计 {selectedScenario.estimated_time || 15} 分钟
                                </span>
                                <span className="flex items-center gap-1">
                                    <Target size={16} />
                                    {selectedScenario.stages?.length || 0} 个决策点
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={16} />
                                    {selectedScenario.completion_count || 0} 人已挑战
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Learning Objectives */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">学习目标</h3>
                    <ul className="space-y-3">
                        {selectedScenario.learning_objectives?.map((obj, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-600">{obj}</span>
                            </li>
                        )) || <li className="text-gray-400">暂无学习目标</li>}
                    </ul>
                </div>

                {/* Stages Preview */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">场景流程</h3>
                    <div className="space-y-4">
                        {selectedScenario.stages?.map((stage, idx) => (
                            <div key={stage.id} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{stage.title}</h4>
                                    <p className="text-sm text-gray-400">{stage.decisions?.length || 0} 个选项</p>
                                </div>
                                <ArrowRight size={16} className="text-gray-300" />
                            </div>
                        )) || <p className="text-gray-400">暂无流程信息</p>}
                    </div>
                </div>

                {/* Start Button */}
                <div className="flex gap-4">
                    <button
                        onClick={() => startSimulation(selectedScenario)}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Play size={20} /> 进入模拟环境
                    </button>
                    {userProgress?.status === 'in_progress' && (
                        <button
                            onClick={() => startSimulation(selectedScenario)}
                            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            继续进度
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // 模拟运行视图
    const renderRunningSimulation = () => {
        if (!selectedScenario) return null;
        
        // 安全检查：确保 stages 存在且有数据
        if (!selectedScenario.stages || selectedScenario.stages.length === 0) {
            return (
                <div className="fixed inset-0 bg-[#1a1a2e] text-white z-50 flex flex-col items-center justify-center">
                    <AlertCircle size={48} className="text-red-400 mb-4" />
                    <h2 className="text-xl font-bold mb-2">场景数据错误</h2>
                    <p className="text-gray-400 mb-6">该场景没有配置任何阶段</p>
                    <button 
                        onClick={() => setView('list')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                    >
                        返回列表
                    </button>
                </div>
            );
        }
        
        const currentStage = selectedScenario.stages[currentStageIndex];
        
        // 安全检查：确保当前阶段存在
        if (!currentStage) {
            return (
                <div className="fixed inset-0 bg-[#1a1a2e] text-white z-50 flex flex-col items-center justify-center">
                    <AlertCircle size={48} className="text-red-400 mb-4" />
                    <h2 className="text-xl font-bold mb-2">阶段数据错误</h2>
                    <p className="text-gray-400 mb-6">无法加载当前阶段</p>
                    <button 
                        onClick={() => setView('list')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                    >
                        返回列表
                    </button>
                </div>
            );
        }
        
        const progress = ((currentStageIndex) / selectedScenario.stages.length) * 100;

        return (
            <div className="fixed inset-0 bg-[#1a1a2e] text-white z-50 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <button 
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                        <ChevronLeft size={20} /> 退出
                    </button>
                    <div className="text-center">
                        <h3 className="font-bold">{selectedScenario.title}</h3>
                        <p className="text-xs text-gray-500">阶段 {currentStageIndex + 1} / {selectedScenario.stages.length}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-500">得分</div>
                            <div className="font-bold text-yellow-400">{totalScore}</div>
                        </div>
                        {isSaving && <Loader2 size={16} className="animate-spin text-gray-500" />}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/10">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-3xl mx-auto">
                        {/* Stage Info */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">{currentStage?.title}</h2>
                            {currentStage?.context && (
                                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                                    <p className="text-gray-300 leading-relaxed">{currentStage.context}</p>
                                </div>
                            )}
                            <p className="text-lg text-gray-200">{currentStage?.description}</p>
                        </div>

                        {/* Resources Status */}
                        {Object.keys(resources).length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {resources.budget !== undefined && (
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xs text-gray-500 mb-1">预算</div>
                                        <div className={`font-bold ${resources.budget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            ${resources.budget}K
                                        </div>
                                    </div>
                                )}
                                {resources.time !== undefined && (
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xs text-gray-500 mb-1">时间</div>
                                        <div className={`font-bold ${resources.time < 10 ? 'text-red-400' : 'text-blue-400'}`}>
                                            {resources.time}天
                                        </div>
                                    </div>
                                )}
                                {resources.morale !== undefined && (
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xs text-gray-500 mb-1">团队士气</div>
                                        <div className={`font-bold ${resources.morale < 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {resources.morale}%
                                        </div>
                                    </div>
                                )}
                                {resources.quality !== undefined && (
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xs text-gray-500 mb-1">质量</div>
                                        <div className="font-bold text-purple-400">{resources.quality}%</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Decision Options */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">选择你的决策</h3>
                            {currentStage?.decisions?.map((decision, idx) => (
                                <button
                                    key={decision.id}
                                    onClick={() => makeDecision(decision)}
                                    disabled={showFeedback}
                                    className="w-full text-left p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold group-hover:bg-blue-500 transition-colors">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1 group-hover:text-blue-400 transition-colors">
                                                {decision.text}
                                            </h4>
                                            {decision.description && (
                                                <p className="text-sm text-gray-500">{decision.description}</p>
                                            )}
                                        </div>
                                        <ArrowRight size={20} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feedback Overlay */}
                {showFeedback && lastDecision && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                        <div className="bg-[#1a1a2e] border border-white/20 rounded-3xl p-8 max-w-md mx-4 animate-slide-up">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                lastDecision.impact.score > 0 ? 'bg-green-500/20 text-green-400' : 
                                lastDecision.impact.score < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                                {lastDecision.impact.score > 0 ? <Trophy size={32} /> : 
                                 lastDecision.impact.score < 0 ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2">
                                {lastDecision.impact.score > 0 ? '明智的选择！' : 
                                 lastDecision.impact.score < 0 ? '需要改进' : '中规中矩'}
                            </h3>
                            <p className="text-gray-400 text-center mb-4">{lastDecision.impact.feedback}</p>
                            <div className="text-center">
                                <span className={`text-2xl font-bold ${
                                    lastDecision.impact.score > 0 ? 'text-green-400' : 
                                    lastDecision.impact.score < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                    {lastDecision.impact.score > 0 ? '+' : ''}{lastDecision.impact.score} 分
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 报告加载骨架屏
    // 结果报告视图 - AI 详细分析报告
    const renderResult = () => {
        if (!selectedScenario) return null;
        
        const maxScore = calculateMaxScore(selectedScenario);
        const percentage = Math.round((totalScore / maxScore) * 100);
        
        // 自动触发报告生成
        useEffect(() => {
            if (!kimiReport && !isGeneratingReport) {
                generateReportAuto();
            }
        }, []);
        
        // 自动报告生成
        const generateReportAuto = async () => {
            setIsGeneratingReport(true);
            
            try {
                const scenario = selectedScenario;
                
                // 构建报告数据
                const reportDataVal: SimulationReportData = {
                    scenarioTitle: scenario.title,
                    scenarioDescription: scenario.description,
                    difficulty: scenario.difficulty,
                    category: scenario.category,
                    totalScore,
                    maxScore,
                    percentage,
                    stageHistory: stageHistory.map((history, idx) => {
                        const stage = scenario.stages[idx];
                        const decision = stage?.decisions.find(d => d.id === history.decision_id);
                        return {
                            stageTitle: stage?.title || '未知阶段',
                            decisionText: decision?.text || '未知',
                            score: history.score,
                            feedback: decision?.impact?.feedback || '',
                            isOptimal: decision?.is_optimal || false,
                        };
                    }),
                    learningObjectives: scenario.learning_objectives || [],
                };
                
                // 调用 Kimi API 生成报告
                const kimiReportVal = await generateSimulationReport(reportDataVal);
                
                setKimiReport(kimiReportVal);
            } catch (err) {
                console.error('报告生成失败:', err);
            } finally {
                setIsGeneratingReport(false);
            }
        };
        
        // 获取评价等级和颜色
        const getRatingInfo = (pct: number) => {
            if (pct >= 85) return { label: '优秀', color: 'text-green-600', bgColor: 'bg-green-500', bgGradient: 'from-green-400 to-emerald-500', lightBg: 'bg-green-50', borderColor: 'border-green-200' };
            if (pct >= 70) return { label: '良好', color: 'text-blue-600', bgColor: 'bg-blue-500', bgGradient: 'from-blue-400 to-cyan-500', lightBg: 'bg-blue-50', borderColor: 'border-blue-200' };
            if (pct >= 60) return { label: '合格', color: 'text-amber-600', bgColor: 'bg-amber-500', bgGradient: 'from-amber-400 to-orange-500', lightBg: 'bg-amber-50', borderColor: 'border-amber-200' };
            return { label: '需改进', color: 'text-red-600', bgColor: 'bg-red-500', bgGradient: 'from-red-400 to-rose-500', lightBg: 'bg-red-50', borderColor: 'border-red-200' };
        };
        
        const rating = getRatingInfo(percentage);
        
        // 计算能力维度得分（基于百分比分档）
        const getDimensionScore = (basePct: number, variance: number) => {
            return Math.min(100, Math.max(30, basePct + Math.floor(Math.random() * variance * 2) - variance));
        };
        
        const dimensions = [
            { name: '决策能力', score: getDimensionScore(percentage, 8) },
            { name: '风险管理', score: getDimensionScore(percentage, 12) },
            { name: '沟通协调', score: getDimensionScore(percentage, 10) },
            { name: '资源分配', score: getDimensionScore(percentage, 8) },
            { name: '问题分析', score: getDimensionScore(percentage, 10) },
            { name: '执行效率', score: getDimensionScore(percentage, 6) },
        ];
        
        // 生成雷达图路径
        const generateRadarPath = () => {
            const center = 50;
            const radius = 40;
            const angleStep = (Math.PI * 2) / 6;
            
            return dimensions.map((dim, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const value = dim.score / 100;
                const x = center + radius * value * Math.cos(angle);
                const y = center + radius * value * Math.sin(angle);
                return `${x},${y}`;
            }).join(' ');
        };
        
        // 加载状态
        if (isGeneratingReport || !kimiReport) {
            return (
                <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                            <Loader2 size={40} className="animate-spin text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">正在生成分析报告...</h2>
                        <p className="text-gray-500 max-w-md text-center">
                            Kimi AI 正在分析你的决策过程，生成个性化的能力评估和改进建议
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto min-h-screen">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">返回列表</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">模拟演练分析报告</h1>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        AI 生成
                    </span>
                </div>

                {/* 总体得分和评价 */}
                <div className={`bg-gradient-to-br ${rating.bgGradient} rounded-3xl p-8 text-white mb-6 shadow-lg`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Trophy size={28} className="text-yellow-300" />
                                <h2 className="text-xl font-bold">总体评价：{rating.label}</h2>
                            </div>
                            <p className="text-white/90 leading-relaxed max-w-2xl">{kimiReport.summary}</p>
                        </div>
                        <div className="text-center bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="text-5xl font-bold">{percentage}%</div>
                            <div className="text-sm text-white/70 mt-1">综合得分</div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{totalScore}</div>
                            <div className="text-xs text-white/60">获得分数</div>
                        </div>
                        <div className="w-px h-10 bg-white/30" />
                        <div className="text-center">
                            <div className="text-2xl font-bold">{maxScore}</div>
                            <div className="text-xs text-white/60">满分</div>
                        </div>
                        <div className="w-px h-10 bg-white/30" />
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stageHistory.length}</div>
                            <div className="text-xs text-white/60">决策数</div>
                        </div>
                        <div className="w-px h-10 bg-white/30" />
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stageHistory.filter(h => {
                                const stage = selectedScenario.stages[stageHistory.indexOf(h)];
                                const decision = stage?.decisions.find(d => d.id === h.decision_id);
                                return decision?.is_optimal;
                            }).length}</div>
                            <div className="text-xs text-white/60">最优决策</div>
                        </div>
                    </div>
                </div>

                {/* 能力雷达图 + 决策回顾 双栏布局 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* 能力雷达图 */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Target size={20} className="text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">能力维度分析</h3>
                        </div>
                        
                        <div className="flex items-center justify-center">
                            <div className="relative w-64 h-64">
                                {/* 背景网格 */}
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                                    {/* 六边形网格 */}
                                    {[20, 40, 60, 80, 100].map((level, i) => (
                                        <polygon
                                            key={i}
                                            points={dimensions.map((_, j) => {
                                                const angle = j * (Math.PI * 2) / 6 - Math.PI / 2;
                                                const r = (level / 100) * 40;
                                                const x = 50 + r * Math.cos(angle);
                                                const y = 50 + r * Math.sin(angle);
                                                return `${x},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="0.5"
                                        />
                                    ))}
                                    {/* 轴线 */}
                                    {dimensions.map((_, i) => {
                                        const angle = i * (Math.PI * 2) / 6 - Math.PI / 2;
                                        const x = 50 + 40 * Math.cos(angle);
                                        const y = 50 + 40 * Math.sin(angle);
                                        return (
                                            <line
                                                key={i}
                                                x1="50"
                                                y1="50"
                                                x2={x}
                                                y2={y}
                                                stroke="#e5e7eb"
                                                strokeWidth="0.5"
                                            />
                                        );
                                    })}
                                    {/* 数据区域 */}
                                    <polygon
                                        points={generateRadarPath()}
                                        fill="rgba(99, 102, 241, 0.2)"
                                        stroke="#6366f1"
                                        strokeWidth="2"
                                    />
                                    {/* 数据点 */}
                                    {dimensions.map((dim, i) => {
                                        const angle = i * (Math.PI * 2) / 6 - Math.PI / 2;
                                        const value = dim.score / 100;
                                        const x = 50 + 40 * value * Math.cos(angle);
                                        const y = 50 + 40 * value * Math.sin(angle);
                                        return (
                                            <circle
                                                key={i}
                                                cx={x}
                                                cy={y}
                                                r="2"
                                                fill="#6366f1"
                                            />
                                        );
                                    })}
                                </svg>
                                {/* 维度标签 */}
                                {dimensions.map((dim, i) => {
                                    const angle = i * (Math.PI * 2) / 6 - Math.PI / 2;
                                    const x = 50 + 52 * Math.cos(angle);
                                    const y = 50 + 52 * Math.sin(angle);
                                    return (
                                        <div
                                            key={i}
                                            className="absolute text-xs font-medium text-gray-600"
                                            style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            {dim.name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* 维度得分列表 */}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {dimensions.map((dim, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">{dim.name}</span>
                                    <span className={`text-sm font-bold ${
                                        dim.score >= 80 ? 'text-green-600' :
                                        dim.score >= 60 ? 'text-blue-600' : 'text-amber-600'
                                    }`}>{dim.score}分</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 决策回顾 */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 size={20} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">决策回顾</h3>
                        </div>
                        
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                            {stageHistory.map((history, idx) => {
                                const stage = selectedScenario.stages[idx];
                                const decision = stage?.decisions.find(d => d.id === history.decision_id);
                                
                                return (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                                <h4 className="font-medium text-gray-900 text-sm">{stage?.title}</h4>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                history.score > 0 ? 'bg-green-100 text-green-700' : 
                                                history.score < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {history.score > 0 ? '+' : ''}{history.score}分
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 ml-8">你的选择: {decision?.text}</p>
                                        {decision?.is_optimal && (
                                            <div className="ml-8 mt-2">
                                                <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">
                                                    <Sparkles size={12} /> 最优解
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 优势表现与待改进 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* 优势表现 */}
                    {kimiReport.strengths.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={20} className="text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">优势表现</h3>
                            </div>
                            <ul className="space-y-3">
                                {kimiReport.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">✓</span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 待改进项 */}
                    {kimiReport.weaknesses.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">待改进项</h3>
                            </div>
                            <ul className="space-y-3">
                                {kimiReport.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">○</span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{weakness}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 学习建议和改进方向 */}
                {kimiReport.suggestions.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Zap size={20} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">学习建议和改进方向</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {kimiReport.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl">
                                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className="text-gray-700 text-sm leading-relaxed">{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 相关知识推荐 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <BookOpen size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">相关知识推荐</h3>
                    </div>
                    
                    {kimiReport.learningPath ? (
                        <p className="text-gray-700 leading-relaxed mb-6">{kimiReport.learningPath}</p>
                    ) : null}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                                <BookOpen size={18} className="text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">项目管理基础</h4>
                            <p className="text-xs text-gray-500">学习项目管理的核心概念和方法论</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                                <Target size={18} className="text-green-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">决策分析方法</h4>
                            <p className="text-xs text-gray-500">掌握科学的决策分析工具和技巧</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                                <Users size={18} className="text-amber-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">团队协作技巧</h4>
                            <p className="text-xs text-gray-500">提升团队沟通和协作效率</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                        返回列表
                    </button>
                    <button
                        onClick={() => startSimulation(selectedScenario)}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> 重新挑战
                    </button>
                </div>
            </div>
        );
    };

    // 主渲染
    return (
        <>
            {view === 'list' && renderScenarioList()}
            {view === 'detail' && renderScenarioDetail()}
            {view === 'running' && renderRunningSimulation()}
            {view === 'result' && renderResult()}
        </>
    );
};

export default Simulation;
