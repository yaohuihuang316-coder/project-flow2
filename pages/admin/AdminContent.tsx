
import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Clock, Tag, Eye, Loader2, Trash2, Network } from 'lucide-react';
import CourseBuilder from './CourseBuilder';
import KnowledgeNodeBuilder from './KnowledgeNodeBuilder';
import { supabase } from '../../lib/supabaseClient';

interface AdminContentProps {
    initialTab?: string; // 'courses' | 'labs' | 'projects' | 'graph'
}

const AdminContent: React.FC<AdminContentProps> = ({ initialTab = 'courses' }) => {
    // Use initialTab as the source of truth for activeTab
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Data State
    const [contentData, setContentData] = useState<any[]>([]);
    const [nodesData, setNodesData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Builder State
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any | null>(null);

    // Graph Builder State
    const [isNodeBuilderOpen, setIsNodeBuilderOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<any | null>(null);

    // Sync prop change to state (when sidebar clicked)
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const fetchContent = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('app_courses')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                const mappedData = data.map(item => ({
                    ...item,
                    lastUpdate: item.last_update || (item.created_at ? item.created_at.split('T')[0] : 'N/A'),
                }));
                setContentData(mappedData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNodes = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('app_kb_nodes').select('*').order('created_at', { ascending: false });
        if (data) setNodesData(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'graph') {
            fetchNodes();
        } else {
            fetchContent();
        }
    }, [activeTab]);

    const filteredData = activeTab === 'graph'
        ? nodesData.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()))
        : contentData.filter(item => {
            const matchSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.author || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filterStatus === 'All' || item.status === filterStatus;
            // courses 标签显示所有课程
            return matchSearch && matchStatus;
        });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-green-50 text-green-700 border-green-200';
            case 'Draft': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'Review': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'Archived': return 'bg-purple-50 text-purple-600 border-purple-200';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const getIcon = (category: string) => {
        if (['Lab', 'Tool', 'Algorithm'].includes(category)) return <Tag size={20} />;
        if (['Project', 'Simulation', 'Case'].includes(category)) return <Clock size={20} />;
        return <BookOpen size={20} />;
    };

    const handleSaveContent = async (formData: any) => {
        const newItem = {
            ...formData,
            id: editingCourse ? editingCourse.id : `new-${Date.now()}`,
            views: editingCourse ? editingCourse.views : 0,
            last_update: new Date().toISOString().split('T')[0],
        };
        await supabase.from('app_courses').upsert(newItem);
        fetchContent();
    };

    const handleDeleteContent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('确定要删除此内容吗？')) return;
        await supabase.from('app_courses').delete().eq('id', id);
        fetchContent();
    };

    const handleSaveNode = async (nodeData: any) => {
        const { error } = await supabase.from('app_kb_nodes').upsert({
            id: nodeData.id,
            label: nodeData.label,
            category: nodeData.category,
            description: nodeData.description,
            formula: nodeData.formula,
            val: nodeData.val,
            course_id: nodeData.course_id
        });

        if (!error && nodeData.edges) {
            await supabase.from('app_kb_edges').delete().eq('source', nodeData.id);
            if (nodeData.edges.length > 0) {
                const edgesToInsert = nodeData.edges.map((targetId: string) => ({
                    source: nodeData.id,
                    target: targetId,
                    type: 'relates'
                }));
                await supabase.from('app_kb_edges').insert(edgesToInsert);
            }
        }
        fetchNodes();
    };

    const handleDeleteNode = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('确定删除此节点吗？')) return;
        await supabase.from('app_kb_nodes').delete().eq('id', id);
        fetchNodes();
    };

    return (
        <div className="space-y-6 animate-fade-in min-h-[600px] relative">

            {/* --- Toolbar --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Left: Search & Filter */}
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={activeTab === 'graph' ? "搜索知识点..." : "搜索标题、讲师或 ID..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                    {activeTab !== 'graph' && (
                        <div className="flex gap-2 overflow-x-auto">
                            {['All', 'Published', 'Draft', 'Review'].map(status => (
                                <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>{status}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Create Button */}
                <button
                    onClick={() => {
                        if (activeTab === 'graph') {
                            setEditingNode(null);
                            setIsNodeBuilderOpen(true);
                        } else {
                            setEditingCourse({ category: 'Foundation' });
                            setIsBuilderOpen(true);
                        }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                    <Plus size={18} /> {activeTab === 'graph' ? '新建节点' : '新建课程'}
                </button>
            </div>

            {/* --- Data Grid --- */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
                ) : filteredData.length > 0 ? filteredData.map(item => (
                    activeTab === 'graph' ? (
                        // Graph Node Card
                        <div
                            key={item.id}
                            onClick={() => { setEditingNode(item); setIsNodeBuilderOpen(true); }}
                            className="group bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${item.category === 'Core' ? 'bg-blue-500' : item.category === 'Tool' ? 'bg-orange-500' : 'bg-green-500'
                                    }`}>
                                    <Network size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.label}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{item.category}</span>
                                        {item.course_id && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1"><BookOpen size={10} /> Linked</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={(e) => handleDeleteNode(item.id, e)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                        </div>
                    ) : (
                        // Content Card
                        <div
                            key={item.id}
                            onClick={() => { setEditingCourse(item); setIsBuilderOpen(true); }}
                            className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'Published' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className="flex items-center gap-5 pl-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                                    {getIcon(item.category)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{item.id}</span>
                                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {item.author}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{item.category}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-8 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-gray-900 flex items-center justify-end gap-1">
                                        <Eye size={14} className="text-gray-400" /> {(item.views || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(item.status)}`}>
                                    {item.status}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={(e) => handleDeleteContent(item.id, e)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        </div>
                    )
                )) : (
                    <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-bold">该分类下暂无内容</p>
                        <button
                            onClick={() => {
                                if (activeTab === 'graph') {
                                    setEditingNode(null);
                                    setIsNodeBuilderOpen(true);
                                } else {
                                            setEditingCourse({ category: 'Foundation' });
                                    setIsBuilderOpen(true);
                                }
                            }}
                            className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            立即创建
                        </button>
                    </div>
                )}
            </div>

            <CourseBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                course={editingCourse}
                onSave={handleSaveContent}
            />

            <KnowledgeNodeBuilder
                isOpen={isNodeBuilderOpen}
                onClose={() => setIsNodeBuilderOpen(false)}
                node={editingNode}
                onSave={handleSaveNode}
            />
        </div>
    );
};

export default AdminContent;
