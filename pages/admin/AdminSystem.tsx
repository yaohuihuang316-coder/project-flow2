import { useState, useEffect } from 'react';
import { Settings, Megaphone, Tag, Network, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminSystem = () => {
    const [activeTab, setActiveTab] = useState<'announcements' | 'topics' | 'edges'>('announcements');

    // Announcements
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal' });

    // Topics
    const [topics, setTopics] = useState<any[]>([]);
    const [newTopic, setNewTopic] = useState({ name: '', color: '#3B82F6' });

    // Edges
    const [edges, setEdges] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'announcements') fetchAnnouncements();
        else if (activeTab === 'topics') fetchTopics();
        else if (activeTab === 'edges') fetchEdges();
    }, [activeTab]);

    // ========== ANNOUNCEMENTS ==========
    const fetchAnnouncements = async () => {
        const { data } = await supabase
            .from('app_announcements')
            .select('*')
            .order('created_at', { ascending: false });
        setAnnouncements(data || []);
    };

    const handleCreateAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            alert('请填写标题和内容');
            return;
        }

        const { error } = await supabase
            .from('app_announcements')
            .insert([{ ...newAnnouncement, created_at: new Date().toISOString() }]);

        if (!error) {
            fetchAnnouncements();
            setNewAnnouncement({ title: '', content: '', priority: 'normal' });
            alert('✅ 公告创建成功');
        } else {
            alert('❌ 创建失败');
        }
    };

    const handleUpdateAnnouncement = async () => {
        if (!editingAnnouncement) return;

        const { error } = await supabase
            .from('app_announcements')
            .update({
                title: editingAnnouncement.title,
                content: editingAnnouncement.content,
                priority: editingAnnouncement.priority
            })
            .eq('id', editingAnnouncement.id);

        if (!error) {
            fetchAnnouncements();
            setEditingAnnouncement(null);
            alert('✅ 更新成功');
        } else {
            alert('❌ 更新失败');
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        if (!window.confirm('确定要删除这条公告吗?')) return;

        const { error } = await supabase
            .from('app_announcements')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchAnnouncements();
            alert('✅ 删除成功');
        }
    };

    // ========== TOPICS ==========
    const fetchTopics = async () => {
        const { data } = await supabase
            .from('app_topics')
            .select('*')
            .order('name');
        setTopics(data || []);
    };

    const handleCreateTopic = async () => {
        if (!newTopic.name) {
            alert('请输入话题名称');
            return;
        }

        const { error } = await supabase
            .from('app_topics')
            .insert([newTopic]);

        if (!error) {
            fetchTopics();
            setNewTopic({ name: '', color: '#3B82F6' });
            alert('✅ 话题创建成功');
        } else {
            alert('❌ 创建失败');
        }
    };

    const handleDeleteTopic = async (id: number) => {
        if (!window.confirm('确定要删除这个话题吗?')) return;

        const { error } = await supabase
            .from('app_topics')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchTopics();
            alert('✅ 删除成功');
        }
    };

    // ========== EDGES ==========
    const fetchEdges = async () => {
        const { data } = await supabase
            .from('app_kb_edges')
            .select('*, source:app_kb_nodes!app_kb_edges_source_fkey(id, label), target:app_kb_nodes!app_kb_edges_target_fkey(id, label)')
            .order('id');
        setEdges(data || []);
    };



    const handleDeleteEdge = async (id: number) => {
        if (!window.confirm('确定要删除这条知识关联吗?')) return;

        const { error } = await supabase
            .from('app_kb_edges')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchEdges();
            alert('✅ 删除成功');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="text-blue-600" />
                    系统配置管理
                </h1>
                <p className="text-gray-500 mt-1">管理公告、话题标签和知识图谱关联</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'announcements'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Megaphone size={16} className="inline mr-2" />
                    全站公告 ({announcements.length})
                </button>
                <button
                    onClick={() => setActiveTab('topics')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'topics'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Tag size={16} className="inline mr-2" />
                    话题标签 ({topics.length})
                </button>
                <button
                    onClick={() => setActiveTab('edges')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'edges'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Network size={16} className="inline mr-2" />
                    知识关联 ({edges.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'announcements' && (
                <AnnouncementsManager
                    announcements={announcements}
                    newAnnouncement={newAnnouncement}
                    setNewAnnouncement={setNewAnnouncement}
                    editingAnnouncement={editingAnnouncement}
                    setEditingAnnouncement={setEditingAnnouncement}
                    onCreate={handleCreateAnnouncement}
                    onUpdate={handleUpdateAnnouncement}
                    onDelete={handleDeleteAnnouncement}
                />
            )}

            {activeTab === 'topics' && (
                <TopicsManager
                    topics={topics}
                    newTopic={newTopic}
                    setNewTopic={setNewTopic}
                    onCreate={handleCreateTopic}
                    onDelete={handleDeleteTopic}
                />
            )}

            {activeTab === 'edges' && (
                <EdgesManager
                    edges={edges}
                    onDelete={handleDeleteEdge}
                />
            )}
        </div>
    );
};

// ========== SUB COMPONENTS ==========
const AnnouncementsManager = ({ announcements, newAnnouncement, setNewAnnouncement, editingAnnouncement, setEditingAnnouncement, onCreate, onUpdate, onDelete }: any) => (
    <div className="space-y-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold mb-4">创建新公告</h3>
            <div className="grid gap-4">
                <input
                    type="text"
                    placeholder="公告标题"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                    placeholder="公告内容"
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="low">低优先级</option>
                    <option value="normal">普通</option>
                    <option value="high">高优先级</option>
                </select>
                <button
                    onClick={onCreate}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} /> 发布公告
                </button>
            </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {announcements.length === 0 ? (
                <div className="p-12 text-center text-gray-500">暂无公告</div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {announcements.map((announcement: any) => (
                        <div key={announcement.id} className="p-6">
                            {editingAnnouncement?.id === announcement.id ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editingAnnouncement.title}
                                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <textarea
                                        value={editingAnnouncement.content}
                                        rows={4}
                                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <select
                                        value={editingAnnouncement.priority}
                                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, priority: e.target.value })}
                                        className="px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="low">低优先级</option>
                                        <option value="normal">普通</option>
                                        <option value="high">高优先级</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={onUpdate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                            <Save size={16} /> 保存
                                        </button>
                                        <button onClick={() => setEditingAnnouncement(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                            <X size={16} className="inline mr-1" /> 取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-900">{announcement.title}</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingAnnouncement(announcement)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(announcement.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mb-3">{announcement.content}</p>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${announcement.priority === 'high' ? 'bg-red-100 text-red-600' :
                                            announcement.priority === 'normal' ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {announcement.priority === 'high' ? '高优先级' :
                                                announcement.priority === 'normal' ? '普通' : '低优先级'}
                                        </span>
                                        <span className="text-gray-500">
                                            {new Date(announcement.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const TopicsManager = ({ topics, newTopic, setNewTopic, onCreate, onDelete }: any) => (
    <div className="space-y-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold mb-4">创建新话题</h3>
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="话题名称"
                    value={newTopic.name}
                    onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="color"
                    value={newTopic.color}
                    onChange={(e) => setNewTopic({ ...newTopic, color: e.target.value })}
                    className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} /> 创建
                </button>
            </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {topics.length === 0 ? (
                <div className="p-12 text-center text-gray-500">暂无话题</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {topics.map((topic: any) => (
                        <div key={topic.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: topic.color }}
                                />
                                <span className="font-medium text-gray-900">{topic.name}</span>
                            </div>
                            <button
                                onClick={() => onDelete(topic.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const EdgesManager = ({ edges, onDelete }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {edges.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无知识关联</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源节点</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标节点</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关系类型</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {edges.map((edge: any) => (
                            <tr key={edge.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {edge.source?.label || `节点 ${edge.source_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {edge.target?.label || `节点 ${edge.target_id}`}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                                        {edge.type || '关联'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onDelete(edge.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default AdminSystem;
