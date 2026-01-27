
import React, { useState, useEffect } from 'react';
import { X, Save, Network, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface NodeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    node: any | null;
    onSave: (nodeData: any) => void;
}

const KnowledgeNodeBuilder: React.FC<NodeBuilderProps> = ({ isOpen, onClose, node, onSave }) => {
    const [formData, setFormData] = useState<any>({
        id: '', label: '', category: 'Concept', description: '', formula: '', course_id: '', val: 50, edges: []
    });
    const [courses, setCourses] = useState<any[]>([]);
    const [allNodes, setAllNodes] = useState<any[]>([]);

    // Fetch helper data
    useEffect(() => {
        const fetchData = async () => {
            const { data: cData } = await supabase.from('app_courses').select('id, title');
            if (cData) setCourses(cData);

            const { data: nData } = await supabase.from('app_kb_nodes').select('id, label');
            if (nData) setAllNodes(nData);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    // Load Node Data
    useEffect(() => {
        if (node) {
            // Fetch edges for this node
            const fetchEdges = async () => {
                const { data } = await supabase.from('app_kb_edges').select('target').eq('source', node.id);
                const targets = data ? data.map(d => d.target) : [];
                setFormData({
                    id: node.id,
                    label: node.label,
                    category: node.category || 'Concept',
                    description: node.description || '',
                    formula: node.formula || '',
                    course_id: node.course_id || '',
                    val: node.val || 50,
                    edges: targets
                });
            };
            fetchEdges();
        } else {
            setFormData({
                id: `node-${Date.now()}`,
                label: '',
                category: 'Concept',
                description: '',
                formula: '',
                course_id: '',
                val: 50,
                edges: []
            });
        }
    }, [node, isOpen]);

    const toggleEdge = (targetId: string) => {
        const currentEdges = formData.edges;
        if (currentEdges.includes(targetId)) {
            setFormData({ ...formData, edges: currentEdges.filter((id: string) => id !== targetId) });
        } else {
            setFormData({ ...formData, edges: [...currentEdges, targetId] });
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Network size={20} /> 知识节点编辑器</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">节点名称 (Label)</label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="例如: 风险管理"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">分类 (Category)</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                            >
                                <option value="Concept">概念 (Concept)</option>
                                <option value="Core">核心 (Core)</option>
                                <option value="Area">领域 (Area)</option>
                                <option value="Tool">工具 (Tool)</option>
                                <option value="Output">输出 (Output)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">权重/大小 (Size)</label>
                            <input
                                type="number"
                                value={formData.val}
                                onChange={(e) => setFormData({ ...formData, val: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">详细定义 (Description)</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm resize-none"
                            placeholder="输入知识点定义..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">核心公式 (Markdown Optional)</label>
                        <input
                            type="text"
                            value={formData.formula}
                            onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-mono text-blue-600"
                            placeholder="e.g. CPI = EV / AC"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><LinkIcon size={12} /> 关联课程</label>
                        <select
                            value={formData.course_id}
                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
                        >
                            <option value="">-- 无关联 --</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">关联关系 (Connect To)</label>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                            {allNodes.filter(n => n.id !== formData.id).map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => toggleEdge(n.id)}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${formData.edges.includes(n.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${formData.edges.includes(n.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {formData.edges.includes(n.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    {n.label}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                    <button
                        onClick={() => { onSave(formData); onClose(); }}
                        className="flex-1 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> 保存节点
                    </button>
                </div>
            </div>
        </>
    );
};

export default KnowledgeNodeBuilder;
