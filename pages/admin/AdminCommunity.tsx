import React, { useState, useEffect } from 'react';
import { Search, Trash2, ShieldAlert, CheckCircle2, MessageSquare, Heart, RefreshCw, Loader2, AlertTriangle, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminCommunity: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'likes'>('posts');

    // Posts state
    const [posts, setPosts] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [likes, setLikes] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (activeTab === 'posts') fetchPosts();
        else if (activeTab === 'comments') fetchComments();
        else if (activeTab === 'likes') fetchLikes();
    }, [activeTab]);

    const showNotification = (msg: string, type: 'success' | 'error') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // ========== POSTS ==========
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

    const handleDeletePost = async (id: number) => {
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

    const handleBatchDeletePosts = async () => {
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

    // ========== COMMENTS ==========
    const fetchComments = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('app_comments')
            .select('*, app_community_posts(id, content)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showNotification('加载评论失败', 'error');
        } else {
            setComments(data || []);
        }
        setIsLoading(false);
    };

    const handleDeleteComment = async (id: number) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;

        const { error } = await supabase
            .from('app_comments')
            .delete()
            .eq('id', id);

        if (error) {
            showNotification('删除失败', 'error');
        } else {
            setComments(comments.filter(c => c.id !== id));
            showNotification('评论已删除', 'success');
        }
    };

    const handleBatchDeleteComments = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 条评论吗？`)) return;

        const { error } = await supabase
            .from('app_comments')
            .delete()
            .in('id', selectedIds);

        if (error) {
            showNotification('批量删除失败', 'error');
        } else {
            setComments(comments.filter(c => !selectedIds.includes(c.id)));
            setSelectedIds([]);
            showNotification('批量删除成功', 'success');
        }
    };

    // ========== LIKES ==========
    const fetchLikes = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('app_user_likes')
            .select('*, app_community_posts(id, content, user_name), app_users!app_user_likes_user_id_fkey(id, name, email)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            showNotification('加载点赞数据失败', 'error');
        } else {
            setLikes(data || []);
        }
        setIsLoading(false);
    };

    const handleDeleteLike = async (userId: string, postId: number) => {
        if (!window.confirm('确定要删除这条点赞记录吗？')) return;

        const { error } = await supabase
            .from('app_user_likes')
            .delete()
            .eq('user_id', userId)
            .eq('post_id', postId);

        if (error) {
            showNotification('删除失败', 'error');
        } else {
            setLikes(likes.filter(l => !(l.user_id === userId && l.post_id === postId)));
            showNotification('点赞记录已删除', 'success');
        }
    };

    // ========== COMMON ==========
    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'posts') fetchPosts();
        else if (activeTab === 'comments') fetchComments();
        else if (activeTab === 'likes') fetchLikes();
    };

    const filteredPosts = posts.filter(post =>
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredComments = comments.filter(comment =>
        comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLikes = likes.filter(like =>
        like.app_users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        like.app_community_posts?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative min-h-[600px]">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-white'
                    }`}>
                    {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        社区内容管理
                        {isLoading && <Loader2 size={18} className="animate-spin text-gray-400" />}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">监控和管理用户发帖、评论、点赞。</p>
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={activeTab === 'posts' ? handleBatchDeletePosts : handleBatchDeleteComments}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors animate-fade-in"
                    >
                        <Trash2 size={18} /> 批量删除 ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('posts'); setSelectedIds([]); setSearchTerm(''); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'posts'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <MessageSquare size={16} className="inline mr-2" />
                    帖子管理
                </button>
                <button
                    onClick={() => { setActiveTab('comments'); setSelectedIds([]); setSearchTerm(''); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'comments'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <MessageSquare size={16} className="inline mr-2" />
                    评论管理
                </button>
                <button
                    onClick={() => { setActiveTab('likes'); setSelectedIds([]); setSearchTerm(''); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'likes'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Heart size={16} className="inline mr-2" />
                    点赞管理
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`搜索${activeTab === 'posts' ? '帖子' : activeTab === 'comments' ? '评论' : '用户'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Content */}
            {activeTab === 'posts' && (
                <PostsList
                    posts={filteredPosts}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    onDelete={handleDeletePost}
                />
            )}

            {activeTab === 'comments' && (
                <CommentsList
                    comments={filteredComments}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    onDelete={handleDeleteComment}
                />
            )}

            {activeTab === 'likes' && (
                <LikesList
                    likes={filteredLikes}
                    onDelete={handleDeleteLike}
                />
            )}
        </div>
    );
};

// ========== SUB COMPONENTS ==========
const PostsList = ({ posts, selectedIds, toggleSelect, onDelete }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {posts.length > 0 ? (
            <div className="divide-y divide-gray-100">
                {posts.map((post: any) => (
                    <div key={post.id} className="p-6 hover:bg-gray-50/50 transition-colors flex gap-4 group">
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(post.id)}
                                onChange={() => toggleSelect(post.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                            />
                        </div>

                        <div className="shrink-0">
                            <img
                                src={post.user_avatar || `https://ui-avatars.com/api/?name=${post.user_name}`}
                                alt={post.user_name}
                                className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-sm font-bold text-gray-900 mr-2">{post.user_name}</span>
                                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
                                    {post.likes > 20 && (
                                        <span className="ml-2 inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                            <Heart size={10} fill="currentColor" /> 热门 ({post.likes})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="mt-1 text-sm text-gray-800 leading-relaxed line-clamp-3">
                                {post.content}
                            </p>

                            <div className="flex gap-4 mt-3 text-xs text-gray-400 font-medium">
                                <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.comments}</span>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <button
                                onClick={() => onDelete(post.id)}
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
            <EmptyState text="暂无社区帖子" />
        )}
    </div>
);

const CommentsList = ({ comments, selectedIds, toggleSelect, onDelete }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {comments.length > 0 ? (
            <div className="divide-y divide-gray-100">
                {comments.map((comment: any) => (
                    <div key={comment.id} className="p-6 hover:bg-gray-50/50 transition-colors flex gap-4 group">
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(comment.id)}
                                onChange={() => toggleSelect(comment.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                            />
                        </div>

                        <div className="shrink-0">
                            <img
                                src={comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name}`}
                                alt={comment.user_name}
                                className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-sm font-bold text-gray-900 mr-2">{comment.user_name}</span>
                                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="mt-1 text-sm text-gray-800">{comment.content}</p>

                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                <span className="font-medium">原帖:</span> {comment.app_community_posts?.content?.substring(0, 50)}...
                            </div>
                        </div>

                        <div className="flex items-start">
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState text="暂无评论" />
        )}
    </div>
);

const LikesList = ({ likes, onDelete }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {likes.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">帖子内容</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {likes.map((like: any) => (
                            <tr key={`${like.user_id}-${like.post_id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {like.app_users?.name || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {like.app_community_posts?.content || '已删除的帖子'}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-500">
                                        {new Date(like.created_at).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onDelete(like.user_id, like.post_id)}
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
        ) : (
            <EmptyState text="暂无点赞记录" />
        )}
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="py-20 text-center flex flex-col items-center text-gray-400">
        <ShieldAlert size={32} className="mb-4 opacity-50" />
        <p className="font-bold">{text}</p>
    </div>
);

export default AdminCommunity;
