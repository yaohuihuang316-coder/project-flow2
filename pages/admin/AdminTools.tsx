
import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2,
    Wrench, Cog, GitBranch, Calculator, AlertTriangle,
    BarChart3, TrendingUp, TrendingDown, Layers, Users,
    Link2, DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    is_active: boolean;
    required_tier: string;
    difficulty: string;
    usage_count: number;
    config: any;
    created_at: string;
}

const AdminTools: React.FC = () => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingTool, setEditingTool] = useState<Partial<Tool>>({});

    // 获取工具列表
    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_tools')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTools(data || []);
        } catch (err) {
            console.error('Error fetching tools:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 保存工具
    const handleSave = async () => {
        // 验证必填字段
        if (!editingTool.name?.trim()) {
            alert('请输入工具名称');
            return;
        }
        if (!editingTool.description?.trim()) {
            alert('请输入工具描述');
            return;
        }

        try {
            const payload = {
                name: editingTool.name.trim(),
                description: editingTool.description.trim(),
                category: editingTool.category || 'cpm',
                icon: editingTool.icon || 'Wrench',
                is_active: editingTool.is_active ?? true,
                required_tier: editingTool.required_tier || 'pro',
                difficulty: editingTool.difficulty || 'Medium',
                config: editingTool.config || {}
            };

            let result;
            if (editingTool.id) {
                result = await supabase.from('app_tools').update(payload).eq('id', editingTool.id).select();
            } else {
                result = await supabase.from('app_tools').insert(payload).select();
            }

            if (result.error) {
                console.error('Supabase error:', result.error);
                throw new Error(result.error.message || '保存失败');
            }

            if (!result.data || result.data.length === 0) {
                throw new Error('保存后未返回数据，请检查RLS策略');
            }

            await fetchTools();
            setShowEditor(false);
            setEditingTool({});
            alert('保存成功！');
        } catch (err: any) {
            console.error('Error saving tool:', err);
            alert('保存失败: ' + (err.message || '未知错误，请检查控制台'));
        }
    };

    // 删除工具
    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此工具吗？')) return;
        try {
            const { error } = await supabase.from('app_tools').delete().eq('id', id);
            if (error) throw error;
            await fetchTools();
            alert('删除成功！');
        } catch (err: any) {
            console.error('Error deleting tool:', err);
            alert('删除失败: ' + (err.message || '未知错误'));
        }
    };

    // 切换状态
    const toggleStatus = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase.from('app_tools').update({ is_active: !current }).eq('id', id);
            if (error) throw error;
            await fetchTools();
        } catch (err: any) {
            console.error('Error toggling status:', err);
            alert('状态切换失败: ' + (err.message || '未知错误'));
        }
    };

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            'GitBranch': GitBranch,
            'Calculator': Calculator,
            'AlertTriangle': AlertTriangle,
            'BarChart3': BarChart3,
            'TrendingUp': TrendingUp,
            'TrendingDown': TrendingDown,
            'Layers': Layers,
            'Users': Users,
            'Link2': Link2,
            'DollarSign': DollarSign,
            'Cog': Cog
        };
        const IconComponent = icons[iconName] || Wrench;
        return <IconComponent size={20} />;
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            'free': 'bg-gray-100 text-gray-600',
            'pro': 'bg-blue-100 text-blue-600',
            'pro_plus': 'bg-amber-100 text-amber-600'
        };
        return colors[tier] || 'bg-gray-100';
    };

    const getDifficultyColor = (difficulty: string) => {
        const colors: Record<string, string> = {
            'Easy': 'text-green-600',
            'Medium': 'text-blue-600',
            'Hard': 'text-orange-600'
        };
        return colors[difficulty] || 'text-gray-600';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">核心算法管理</h1>
                    <p className="text-gray-500 mt-1">管理工具实验室中的算法和工具</p>
                </div>
                <button
                    onClick={() => { setEditingTool({ is_active: true, required_tier: 'pro', difficulty: 'Medium' }); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                >
                    <Plus size={18} /> 添加工具
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: '总工具数', value: tools.length },
                    { label: '已启用', value: tools.filter(t => t.is_active).length },
                    { label: 'Free可用', value: tools.filter(t => t.required_tier === 'free').length },
                    { label: 'Pro+专属', value: tools.filter(t => t.required_tier === 'pro_plus').length }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tools List */}
            {isLoading ? (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-gray-500">加载中...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-4 font-medium text-gray-600">工具</th>
                                <th className="text-left p-4 font-medium text-gray-600">分类</th>
                                <th className="text-left p-4 font-medium text-gray-600">难度</th>
                                <th className="text-center p-4 font-medium text-gray-600">等级要求</th>
                                <th className="text-center p-4 font-medium text-gray-600">状态</th>
                                <th className="text-right p-4 font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tools.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        暂无工具，点击右上角添加
                                    </td>
                                </tr>
                            ) : (
                                tools.map(tool => (
                                    <tr key={tool.id} className="border-t border-gray-100">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                    {getIcon(tool.icon)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{tool.name}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">{tool.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium uppercase">
                                                {tool.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-sm font-medium ${getDifficultyColor(tool.difficulty)}`}>
                                                {tool.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTierColor(tool.required_tier)}`}>
                                                {tool.required_tier === 'pro_plus' ? 'Pro+' : tool.required_tier}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(tool.id, tool.is_active)}
                                                className={`flex items-center justify-center gap-1 mx-auto text-sm ${tool.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                            >
                                                {tool.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                {tool.is_active ? '启用' : '禁用'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setEditingTool(tool); setShowEditor(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tool.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingTool.id ? '编辑工具' : '添加工具'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">工具名称</label>
                                <input
                                    type="text"
                                    value={editingTool.name || ''}
                                    onChange={e => setEditingTool({...editingTool, name: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="如：CPM关键路径"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                                <textarea
                                    value={editingTool.description || ''}
                                    onChange={e => setEditingTool({...editingTool, description: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                                    placeholder="工具功能描述"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                                    <select
                                        value={editingTool.category || 'cpm'}
                                        onChange={e => setEditingTool({...editingTool, category: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="cpm">关键路径法 (CPM)</option>
                                        <option value="risk">风险管理</option>
                                        <option value="evm">挣值管理 (EVM)</option>
                                        <option value="resource">资源管理</option>
                                        <option value="agile">敏捷工具</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
                                    <select
                                        value={editingTool.icon || 'GitBranch'}
                                        onChange={e => setEditingTool({...editingTool, icon: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="GitBranch">GitBranch (分支)</option>
                                        <option value="Calculator">Calculator (计算)</option>
                                        <option value="AlertTriangle">AlertTriangle (警告)</option>
                                        <option value="BarChart3">BarChart3 (图表)</option>
                                        <option value="TrendingUp">TrendingUp (上升)</option>
                                        <option value="TrendingDown">TrendingDown (下降)</option>
                                        <option value="Layers">Layers (层级)</option>
                                        <option value="Users">Users (用户)</option>
                                        <option value="Link2">Link2 (链接)</option>
                                        <option value="DollarSign">DollarSign (货币)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                                    <select
                                        value={editingTool.difficulty || 'Medium'}
                                        onChange={e => setEditingTool({...editingTool, difficulty: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Easy">简单</option>
                                        <option value="Medium">中等</option>
                                        <option value="Hard">困难</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">等级要求</label>
                                    <select
                                        value={editingTool.required_tier || 'pro'}
                                        onChange={e => setEditingTool({...editingTool, required_tier: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="pro_plus">Pro+</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingTool.is_active}
                                    onChange={e => setEditingTool({...editingTool, is_active: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">立即启用</label>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditor(false)}
                                className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTools;
