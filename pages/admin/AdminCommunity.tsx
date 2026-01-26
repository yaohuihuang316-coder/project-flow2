
import React, { useState, useEffect } from 'react';
import { Search, Trash2, ShieldAlert, CheckCircle2, MessageSquare, Heart, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminCommunity: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    const fetchPosts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('app_community_posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(error);
            showNotification('加载失败', 'error');
        } else {
            setPosts(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const showNotification = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('确定要永久删除这条帖子吗？此操作不可恢复。')) return;

        const { error } = await supabase
            .from('app_community_posts')
            .delete()
            .eq('id', id);

        if (error) {
            showNotification('删除失败', 'error');
        } else {
            setPosts(posts.filter(p => p.id !== id));
            showNotification('帖子已删除', 'success');
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 条帖子吗？`)) return;

        const { error } = await supabase
            .from('app_community_posts')
            .delete()
            .in('id', selectedIds);

        if (error) {
            showNotification('批量删除失败', 'error');
        } else {
            setPosts(posts.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            showNotification('批量删除成功', 'success');
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredPosts = posts.filter(post => 
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative min-h-[600px]">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${
                    notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-white'
                }`}>
                    {notification.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        社区内容审核
                        {isLoading && <Loader2 size={18} className="animate-spin text-gray-400"/>}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">监控用户发帖，维护社区环境。</p>
                </div>
                {selectedIds.length > 0 && (
                    <button 
                        onClick={handleBatchDelete}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors animate-fade-in"
                    >
                        <Trash2 size={18} /> 批量删除 ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="搜索帖子内容或用户名..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
                <button 
                    onClick={fetchPosts}
                    className="px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Content List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {filteredPosts.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredPosts.map(post => (
                            <div key={post.id} className="p-6 hover:bg-gray-50/50 transition-colors flex gap-4 group">
                                {/* Checkbox */}
                                <div className="pt-1">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(post.id)}
                                        onChange={() => toggleSelect(post.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                </div>
                                
                                {/* Avatar */}
                                <div className="shrink-0">
                                    <img 
                                        src={post.user_avatar || `https://ui-avatars.com/api/?name=${post.user_name}`} 
                                        alt={post.user_name}
                                        className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 mr-2">{post.user_name}</span>
                                            <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
                                            {post.likes > 20 && (
                                                <span className="ml-2 inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    <Heart size={10} fill="currentColor"/> 热门 ({post.likes})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className="mt-1 text-sm text-gray-800 leading-relaxed line-clamp-3">
                                        {post.content}
                                    </p>
                                    
                                    {post.image && (
                                        <div className="mt-2">
                                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                                包含图片附件
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-3 text-xs text-gray-400 font-medium">
                                        <span className="flex items-center gap-1"><Heart size={12}/> {post.likes}</span>
                                        <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.comments}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-start">
                                    <button 
                                        onClick={() => handleDelete(post.id)}
                                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="删除帖子"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center text-gray-400">
                        <ShieldAlert size={32} className="mb-4 opacity-50"/>
                        <p className="font-bold">暂无社区内容</p>
                        <p className="text-xs mt-1">所有帖子都符合规范，或暂无人发帖。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCommunity;
