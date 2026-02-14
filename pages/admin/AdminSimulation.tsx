
import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, X, Copy,
    ChevronDown, ChevronRight, GripVertical,
    Brain, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// 类型定义
interface SimulationScenario {
    id?: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    category: string;
    cover_image: string;
    stages: SimulationStage[];
    learning_objectives: string[];
    estimated_time: number;
    is_published: boolean;
}

interface SimulationStage {
    id: string;
    title: string;
    description: string;
    context?: string;
    decisions: Decision[];
    resources?: ResourceState;
}

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

interface ResourceState {
    budget?: number;
    time?: number;
    morale?: number;
    quality?: number;
}

const AdminSimulation: React.FC = () => {
    const [scenarios, setScenarios] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingScenario, setEditingScenario] = useState<SimulationScenario | null>(null);
    const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([0]));
    const [isSaving, setIsSaving] = useState(false);

    // 初始空场景模板
    const emptyScenario: SimulationScenario = {
        title: '',
        description: '',
        difficulty: 'Medium',
        category: 'CPM',
        cover_image: '',
        stages: [{
            id: 'stage-1',
            title: '阶段 1',
            description: '',
            context: '',
            decisions: [{
                id: 'dec-1',
                text: '',
                description: '',
                impact: { score: 0, feedback: '' }
            }]
        }],
        learning_objectives: [''],
        estimated_time: 15,
        is_published: false
    };

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
                .order('created_at', { ascending: false });

            if (error) throw error;

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
        } catch (err) {
            console.error('获取场景失败:', err);
            alert('获取场景列表失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 保存场景
    const handleSave = async () => {
        if (!editingScenario) return;

        // 验证
        if (!editingScenario.title.trim()) {
            alert('请输入场景标题');
            return;
        }
        if (editingScenario.stages.length === 0) {
            alert('至少需要一个阶段');
            return;
        }

        // 验证每个阶段至少有一个决策选项
        for (let i = 0; i < editingScenario.stages.length; i++) {
            const stage = editingScenario.stages[i];
            if (!stage.decisions || stage.decisions.length === 0) {
                alert(`阶段 ${i + 1} 至少需要有一个决策选项`);
                return;
            }
            // 验证每个决策选项有文本内容
            for (let j = 0; j < stage.decisions.length; j++) {
                if (!stage.decisions[j].text.trim()) {
                    alert(`阶段 ${i + 1} 的选项 ${j + 1} 需要填写描述`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            // 计算预计时间（如果没有设置）
            const estimatedTime = editingScenario.estimated_time || editingScenario.stages.length * 5;
            
            const payload = {
                title: editingScenario.title.trim(),
                description: editingScenario.description.trim(),
                difficulty: editingScenario.difficulty,
                category: editingScenario.category,
                cover_image: editingScenario.cover_image?.trim() || '',
                stages: editingScenario.stages,
                learning_objectives: editingScenario.learning_objectives.filter(o => o.trim()),
                estimated_time: estimatedTime,
                is_published: editingScenario.is_published,
                completion_count: 0
            };

            if (editingScenario.id) {
                // 更新 - 保留原有的 completion_count
                const { data: existing } = await supabase
                    .from('app_simulation_scenarios')
                    .select('completion_count')
                    .eq('id', editingScenario.id)
                    .single();
                
                const updatePayload = {
                    ...payload,
                    completion_count: existing?.completion_count || 0
                };

                const { error } = await supabase
                    .from('app_simulation_scenarios')
                    .update(updatePayload)
                    .eq('id', editingScenario.id);
                if (error) throw error;
            } else {
                // 创建
                const { error } = await supabase
                    .from('app_simulation_scenarios')
                    .insert(payload);
                if (error) throw error;
            }

            await fetchScenarios();
            setShowEditor(false);
            setEditingScenario(null);
            alert('保存成功！');
        } catch (err: any) {
            console.error('保存失败:', err);
            alert('保存失败: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 删除场景
    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此场景吗？此操作不可恢复。')) return;

        try {
            const { error } = await supabase
                .from('app_simulation_scenarios')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Delete error:', error);
                throw new Error(error.message || '删除失败，请检查权限');
            }
            await fetchScenarios();
            alert('删除成功！');
        } catch (err: any) {
            console.error('删除失败:', err);
            alert('删除失败: ' + (err.message || '未知错误'));
        }
    };

    // 复制场景
    const handleDuplicate = async (scenario: any) => {
        // 深拷贝并生成新的 ID
        const newStages = (scenario.stages || []).map((s: any, sIdx: number) => ({
            ...s,
            id: `stage-${Date.now()}-${sIdx}-${Math.random().toString(36).substr(2, 5)}`,
            decisions: (s.decisions || []).map((d: any, dIdx: number) => ({
                ...d,
                id: `dec-${Date.now()}-${sIdx}-${dIdx}-${Math.random().toString(36).substr(2, 5)}`
            }))
        }));

        const newScenario: SimulationScenario = {
            title: scenario.title + ' (复制)',
            description: scenario.description || '',
            difficulty: scenario.difficulty || 'Medium',
            category: scenario.category || 'CPM',
            cover_image: scenario.cover_image || '',
            stages: newStages,
            learning_objectives: scenario.learning_objectives || [''],
            estimated_time: scenario.estimated_time || 15,
            is_published: false
        };

        setEditingScenario(newScenario);
        setShowEditor(true);
        setExpandedStages(new Set([0]));
    };

    // 添加阶段
    const addStage = () => {
        if (!editingScenario) return;
        
        const newStage: SimulationStage = {
            id: `stage-${Date.now()}`,
            title: `阶段 ${editingScenario.stages.length + 1}`,
            description: '',
            context: '',
            decisions: [{
                id: `dec-${Date.now()}`,
                text: '',
                description: '',
                impact: { score: 0, feedback: '' }
            }]
        };

        setEditingScenario({
            ...editingScenario,
            stages: [...editingScenario.stages, newStage]
        });
        setExpandedStages(prev => new Set([...prev, editingScenario.stages.length]));
    };

    // 删除阶段
    const removeStage = (index: number) => {
        if (!editingScenario) return;
        if (editingScenario.stages.length <= 1) {
            alert('至少保留一个阶段');
            return;
        }

        const newStages = editingScenario.stages.filter((_, i) => i !== index);
        setEditingScenario({ ...editingScenario, stages: newStages });
    };

    // 添加决策选项
    const addDecision = (stageIndex: number) => {
        if (!editingScenario) return;

        const newStages = [...editingScenario.stages];
        newStages[stageIndex].decisions.push({
            id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            text: '',
            description: '',
            impact: { score: 0, feedback: '' }
        });

        setEditingScenario({ ...editingScenario, stages: newStages });
    };

    // 删除决策选项
    const removeDecision = (stageIndex: number, decisionIndex: number) => {
        if (!editingScenario) return;
        
        const stage = editingScenario.stages[stageIndex];
        if (stage.decisions.length <= 1) {
            alert('至少保留一个选项');
            return;
        }

        const newStages = [...editingScenario.stages];
        newStages[stageIndex].decisions = stage.decisions.filter((_, i) => i !== decisionIndex);
        setEditingScenario({ ...editingScenario, stages: newStages });
    };

    // 更新阶段字段
    const updateStage = (index: number, field: keyof SimulationStage, value: any) => {
        if (!editingScenario) return;
        
        const newStages = [...editingScenario.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setEditingScenario({ ...editingScenario, stages: newStages });
    };

    // 更新决策字段
    const updateDecision = (stageIndex: number, decisionIndex: number, field: string, value: any) => {
        if (!editingScenario) return;

        const newStages = [...editingScenario.stages];
        const decision = { ...newStages[stageIndex].decisions[decisionIndex] };
        
        if (field.startsWith('impact.')) {
            const impactField = field.replace('impact.', '');
            decision.impact = { ...decision.impact, [impactField]: value };
        } else {
            (decision as any)[field] = value;
        }

        newStages[stageIndex].decisions[decisionIndex] = decision;
        setEditingScenario({ ...editingScenario, stages: newStages });
    };

    // 切换阶段展开
    const toggleStage = (index: number) => {
        setExpandedStages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // 编辑器视图
    const renderEditor = () => {
        if (!editingScenario) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            {editingScenario.id ? '编辑场景' : '创建场景'}
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setShowEditor(false); setEditingScenario(null); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {isSaving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="space-y-6">
                            {/* 基本信息 */}
                            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                                <h3 className="font-bold text-gray-900">基本信息</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">场景标题</label>
                                        <input
                                            type="text"
                                            value={editingScenario.title}
                                            onChange={e => setEditingScenario({ ...editingScenario, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="例如：关键路径危机处理"
                                        />
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">场景描述</label>
                                        <textarea
                                            value={editingScenario.description}
                                            onChange={e => setEditingScenario({ ...editingScenario, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                                            placeholder="简要描述这个模拟场景的背景和目标..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                                        <select
                                            value={editingScenario.difficulty}
                                            onChange={e => setEditingScenario({ ...editingScenario, difficulty: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Easy">简单</option>
                                            <option value="Medium">中等</option>
                                            <option value="Hard">困难</option>
                                            <option value="Expert">专家</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                                        <select
                                            value={editingScenario.category}
                                            onChange={e => setEditingScenario({ ...editingScenario, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="CPM">关键路径法 (CPM)</option>
                                            <option value="PERT">PERT分析</option>
                                            <option value="Risk">风险管理</option>
                                            <option value="Agile">敏捷管理</option>
                                            <option value="Stakeholder">干系人管理</option>
                                            <option value="Crisis">危机处理</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">预计时长（分钟）</label>
                                        <input
                                            type="number"
                                            value={editingScenario.estimated_time}
                                            onChange={e => setEditingScenario({ ...editingScenario, estimated_time: parseInt(e.target.value) || 15 })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">封面图片 URL</label>
                                        <input
                                            type="text"
                                            value={editingScenario.cover_image}
                                            onChange={e => setEditingScenario({ ...editingScenario, cover_image: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">学习目标（每行一个）</label>
                                        <textarea
                                            value={editingScenario.learning_objectives.join('\n')}
                                            onChange={e => setEditingScenario({ 
                                                ...editingScenario, 
                                                learning_objectives: e.target.value.split('\n').filter(s => s.trim())
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                            placeholder="理解关键路径的概念\n掌握进度压缩技术..."
                                        />
                                    </div>

                                    <div className="col-span-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_published"
                                            checked={editingScenario.is_published}
                                            onChange={e => setEditingScenario({ ...editingScenario, is_published: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="is_published" className="text-sm text-gray-700">
                                            立即发布
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* 阶段配置 */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">阶段配置</h3>
                                    <button
                                        onClick={addStage}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                                    >
                                        <Plus size={16} /> 添加阶段
                                    </button>
                                </div>

                                {editingScenario.stages.map((stage, stageIndex) => (
                                    <div key={stage.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                                        {/* Stage Header */}
                                        <div 
                                            className="bg-gray-50 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleStage(stageIndex)}
                                        >
                                            <GripVertical size={16} className="text-gray-400" />
                                            {expandedStages.has(stageIndex) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            <span className="font-medium">阶段 {stageIndex + 1}</span>
                                            <input
                                                type="text"
                                                value={stage.title}
                                                onChange={e => updateStage(stageIndex, 'title', e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                                                placeholder="阶段标题"
                                            />
                                            <button
                                                onClick={e => { e.stopPropagation(); removeStage(stageIndex); }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Stage Content */}
                                        {expandedStages.has(stageIndex) && (
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">场景描述</label>
                                                    <textarea
                                                        value={stage.description}
                                                        onChange={e => updateStage(stageIndex, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={2}
                                                        placeholder="描述当前面临的决策情境..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">背景信息（可选）</label>
                                                    <textarea
                                                        value={stage.context || ''}
                                                        onChange={e => updateStage(stageIndex, 'context', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={2}
                                                        placeholder="提供额外的项目背景信息..."
                                                    />
                                                </div>

                                                {/* Decisions */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-gray-500">决策选项</span>
                                                        <button
                                                            onClick={() => addDecision(stageIndex)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                                                        >
                                                            <Plus size={12} /> 添加选项
                                                        </button>
                                                    </div>

                                                    {stage.decisions.map((decision, decIndex) => (
                                                        <div key={decision.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
                                                                    {String.fromCharCode(65 + decIndex)}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={decision.text}
                                                                    onChange={e => updateDecision(stageIndex, decIndex, 'text', e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="选项描述"
                                                                />
                                                                <button
                                                                    onClick={() => removeDecision(stageIndex, decIndex)}
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={decision.description || ''}
                                                                onChange={e => updateDecision(stageIndex, decIndex, 'description', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="选项详细说明（可选）"
                                                            />

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs text-gray-500 mb-1">得分影响</label>
                                                                    <input
                                                                        type="number"
                                                                        value={decision.impact.score}
                                                                        onChange={e => updateDecision(stageIndex, decIndex, 'impact.score', parseInt(e.target.value) || 0)}
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <div className="flex items-end">
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={decision.is_optimal || false}
                                                                            onChange={e => updateDecision(stageIndex, decIndex, 'is_optimal', e.target.checked)}
                                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                                        />
                                                                        <span className="text-sm text-gray-600">标记为最优解</span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            <textarea
                                                                value={decision.impact.feedback}
                                                                onChange={e => updateDecision(stageIndex, decIndex, 'impact.feedback', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                rows={2}
                                                                placeholder="选择此选项后的反馈说明..."
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">模拟场景管理</h1>
                    <p className="text-gray-500 mt-1">创建和管理实战模拟场景</p>
                </div>
                <button
                    onClick={() => { setEditingScenario({ ...emptyScenario }); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                >
                    <Plus size={18} /> 创建场景
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: '总场景数', value: scenarios.length, color: 'bg-blue-500' },
                    { label: '已发布', value: scenarios.filter(s => s.is_published).length, color: 'bg-green-500' },
                    { label: '草稿', value: scenarios.filter(s => !s.is_published).length, color: 'bg-gray-500' },
                    { label: '总完成次数', value: scenarios.reduce((sum, s) => sum + (s.completion_count || 0), 0), color: 'bg-purple-500' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className={`w-8 h-8 ${stat.color} rounded-xl flex items-center justify-center text-white text-xs font-bold mb-2`}>
                            {stat.value}
                        </div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-gray-500">加载中...</p>
                </div>
            ) : scenarios.length === 0 ? (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                    <Brain size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">暂无模拟场景</p>
                    <p className="text-sm mt-2">点击右上角创建第一个场景</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-4 font-medium text-gray-600">场景</th>
                                <th className="text-left p-4 font-medium text-gray-600">分类</th>
                                <th className="text-left p-4 font-medium text-gray-600">难度</th>
                                <th className="text-center p-4 font-medium text-gray-600">阶段数</th>
                                <th className="text-center p-4 font-medium text-gray-600">状态</th>
                                <th className="text-right p-4 font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scenarios.map(scenario => (
                                <tr key={scenario.id} className="border-t border-gray-100">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={scenario.cover_image || 'https://via.placeholder.com/40'} 
                                                className="w-10 h-10 rounded-lg object-cover"
                                                alt={scenario.title}
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">{scenario.title}</div>
                                                <div className="text-xs text-gray-500 line-clamp-1">{scenario.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                            {scenario.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                            scenario.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                            scenario.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                            scenario.difficulty === 'Hard' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {scenario.difficulty}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm text-gray-600">
                                            {(scenario.stages || []).length} 阶段
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {scenario.is_published ? (
                                            <span className="flex items-center justify-center gap-1 text-green-600 text-sm">
                                                <CheckCircle2 size={14} /> 已发布
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                                                <AlertTriangle size={14} /> 草稿
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setEditingScenario(scenario); setShowEditor(true); }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="编辑"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(scenario)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                title="复制"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(scenario.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && renderEditor()}
        </div>
    );
};

export default AdminSimulation;
