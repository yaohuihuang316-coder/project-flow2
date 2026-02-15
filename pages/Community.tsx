
import React, { useState, useEffect } from 'react';
import {
    Search, MessageSquare, Heart, Share2, MoreHorizontal,
    Image as ImageIcon, Hash, TrendingUp, Users, Filter, Send, CornerDownRight, CheckCircle2, AlertTriangle, Loader2,
    UserPlus, UserCheck, Pin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserProfile, Comment } from '../types';
import { supabase } from '../lib/supabaseClient';

interface CommunityProps {
    currentUser?: UserProfile | null;
}

// Mock Topics for sidebar
const TRENDING_TOPICS = [
    { id: 1, name: 'PMP 备考冲刺', count: 1240 },
    { id: 2, name: '敏捷转型实战', count: 856 },
    { id: 3, name: 'DevOps 工具链', count: 632 },
];

const POSTS_PER_PAGE = 10;

const Community: React.FC<CommunityProps> = ({ currentUser }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTags, setNewPostTags] = useState('');
    const [activeTab, setActiveTab] = useState<'recommend' | 'latest' | 'following'>('recommend');
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Interaction States
    const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
    const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

    // Real Comments Map
    const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({});
    const [commentInput, setCommentInput] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    // 获取用户已点赞的帖子
    const fetchUserLikes = async () => {
        if (!currentUser) return;
        const { data } = await supabase
            .from('app_user_likes')
            .select('post_id')
            .eq('user_id', currentUser.id);

        if (data) {
            setLikedPosts(new Set(data.map(like => like.post_id)));
        }
    };

    // 获取用户关注列表
    const fetchUserFollows = async () => {
        if (!currentUser) return;
        const { data } = await supabase
            .from('app_user_follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);

        if (data) {
            setFollowedUsers(new Set(data.map(f => f.following_id)));
        }
    };

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_community_posts')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching posts:", error);
            }

            if (data && data.length > 0) {
                const formattedData = data.map(post => ({
                    ...post,
                    tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags || [],
                }));
                setPosts(formattedData);
                setTotalPages(Math.ceil(data.length / POSTS_PER_PAGE));
            } else {
                setPosts([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchUserLikes();
        fetchUserFollows();
    }, [currentUser]);

    // 标签页筛选和分页
    useEffect(() => {
        let filtered = posts;
        
        // 标签页筛选
        if (activeTab === 'following' && currentUser) {
            filtered = filtered.filter(post => followedUsers.has(post.user_id));
        }
        
        // 排序：置顶始终在最前，其余按时间或推荐排序
        if (activeTab === 'latest') {
            filtered = [...filtered].sort((a, b) => {
                // 置顶帖子优先
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                // 然后按时间
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        } else {
            // recommend: 置顶优先，然后按热度(点赞+评论)
            filtered = [...filtered].sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return (b.likes + b.comments) - (a.likes + a.comments);
            });
        }
        
        setFilteredPosts(filtered);
        setCurrentPage(1);
    }, [posts, activeTab, followedUsers, currentUser]);

    // 分页数据
    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    // 真实数据库搜索
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            fetchPosts();
            return;
        }
        
        setIsLoading(true);
        try {
            const searchTerm = `%${query}%`;
            
            const { data, error } = await supabase
                .from('app_community_posts')
                .select('*')
                .or(`content.ilike.${searchTerm},user_name.ilike.${searchTerm}`)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (data) {
                const formattedData = data.map(post => ({
                    ...post,
                    tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags || [],
                }));
                setFilteredPosts(formattedData);
                setTotalPages(Math.ceil(data.length / POSTS_PER_PAGE));
                setCurrentPage(1);
            } else {
                setFilteredPosts([]);
            }
        } catch (err) {
            console.error('搜索失败:', err);
            showToast('搜索失败', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId: number, currentLikes: number) => {
        if (!currentUser) {
            showToast("请先登录", "error");
            return;
        }

        const isLiked = likedPosts.has(postId);
        const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

        const updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p);
        setPosts(updatedPosts);

        const newLikedSet = new Set(likedPosts);
        if (isLiked) newLikedSet.delete(postId);
        else newLikedSet.add(postId);
        setLikedPosts(newLikedSet);

        if (isLiked) {
            await supabase.from('app_user_likes').delete().eq('user_id', currentUser.id).eq('post_id', postId);
        } else {
            await supabase.from('app_user_likes').insert({ user_id: currentUser.id, post_id: postId });
        }

        await supabase.from('app_community_posts').update({ likes: newLikes }).eq('id', postId);
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 关注/取消关注用户
    const handleFollow = async (targetUserId: string, targetUserName: string) => {
        if (!currentUser) {
            showToast('请先登录', 'error');
            return;
        }
        
        if (targetUserId === currentUser.id) {
            showToast('不能关注自己', 'error');
            return;
        }

        const isFollowing = followedUsers.has(targetUserId);
        
        if (isFollowing) {
            const { error } = await supabase
                .from('app_user_follows')
                .delete()
                .eq('follower_id', currentUser.id)
                .eq('following_id', targetUserId);
            
            if (!error) {
                const newFollowed = new Set(followedUsers);
                newFollowed.delete(targetUserId);
                setFollowedUsers(newFollowed);
                showToast(`已取消关注 ${targetUserName}`, 'success');
            }
        } else {
            const { error } = await supabase
                .from('app_user_follows')
                .insert({ follower_id: currentUser.id, following_id: targetUserId });
            
            if (!error) {
                const newFollowed = new Set(followedUsers);
                newFollowed.add(targetUserId);
                setFollowedUsers(newFollowed);
                showToast(`已关注 ${targetUserName}`, 'success');
            } else {
                showToast('关注失败', 'error');
            }
        }
    };

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        if (!currentUser) {
            alert("请先登录");
            return;
        }

        setIsPosting(true);

        // 解析标签
        const tags = newPostTags.split(/[,，]/).map(t => t.trim()).filter(t => t);

        const { error } = await supabase.from('app_community_posts').insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            role: currentUser.role,
            content: newPostContent,
            tags: JSON.stringify(tags),
            likes: 0,
            comments: 0,
            is_pinned: false
        });

        setIsPosting(false);

        if (error) {
            showToast("发布失败，请稍后重试", "error");
        } else {
            showToast("发布成功！", "success");
            setNewPostContent('');
            setNewPostTags('');
            fetchPosts();
        }
    };

    // Comment Logic
    const fetchComments = async (postId: number) => {
        setIsLoadingComments(true);
        const { data } = await supabase
            .from('app_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (data) {
            setCommentsMap(prev => ({ ...prev, [postId]: data }));
        }
        setIsLoadingComments(false);
    };

    const toggleComments = (postId: number) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
        } else {
            setExpandedPostId(postId);
            fetchComments(postId);
        }
    };

    const handleSendComment = async (postId: number) => {
        if (!commentInput.trim() || !currentUser) return;

        const newCommentPayload = {
            post_id: postId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            content: commentInput,
            likes: 0
        };

        const { data, error } = await supabase
            .from('app_comments')
            .insert(newCommentPayload)
            .select()
            .single();

        if (error) {
            showToast("评论失败", "error");
            return;
        }

        setCommentsMap(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), data]
        }));
        setCommentInput('');

        const currentPost = posts.find(p => p.id === postId);
        const newCount = (currentPost?.comments || 0) + 1;

        const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments: newCount } : p);
        setPosts(updatedPosts);

        await supabase.from('app_community_posts').update({ comments: newCount }).eq('id', postId);
    };

    // Pagination Component
    const Pagination = () => {
        if (totalPages <= 1) return null;
        
        return (
            <div className="flex items-center justify-center gap-2 mt-8">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-600">
                    第 {currentPage} / {totalPages} 页
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

    return (
        <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen relative">
            {toast && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-black text-white'
                    }`}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="glass-card rounded-[2rem] p-6 space-y-2 sticky top-24">
                        <button onClick={() => setActiveTab('recommend')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'recommend' ? 'bg-black text-white shadow-lg scale-105' : 'hover:bg-gray-50 text-gray-600'}`}>
                            <TrendingUp size={20} /><span className="font-bold">推荐动态</span>
                        </button>
                        <button onClick={() => setActiveTab('latest')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'latest' ? 'bg-black text-white shadow-lg scale-105' : 'hover:bg-gray-50 text-gray-600'}`}>
                            <Filter size={20} /><span className="font-bold">最新发布</span>
                        </button>
                        <button 
                            onClick={() => {
                                if (!currentUser) {
                                    showToast('请先登录', 'error');
                                    return;
                                }
                                setActiveTab('following');
                            }} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'following' ? 'bg-black text-white shadow-lg scale-105' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Users size={20} />
                            <span className="font-bold">我的关注</span>
                            {followedUsers.size > 0 && (
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'following' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                                    {followedUsers.size}
                                </span>
                            )}
                        </button>

                        <div className="pt-6 mt-4 border-t border-gray-100">
                            <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">热门话题</h3>
                            <div className="space-y-1">
                                {TRENDING_TOPICS.map(topic => (
                                    <button key={topic.id} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg group transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">#</div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{topic.name}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{topic.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Feed */}
                <div className="col-span-1 lg:col-span-6 space-y-6">
                    {/* Compose Box */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                {currentUser?.avatar ? <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" /> : <Users size={24} className="text-gray-400" />}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    placeholder={currentUser ? `分享你的想法, ${currentUser.name}...` : "请先登录以发布动态..."}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    disabled={!currentUser}
                                    className="w-full h-24 bg-gray-50 rounded-2xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none font-medium placeholder:text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="添加标签，用逗号分隔 (如: PMP, 经验分享)"
                                    value={newPostTags}
                                    onChange={(e) => setNewPostTags(e.target.value)}
                                    disabled={!currentUser}
                                    className="w-full mt-2 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium placeholder:text-gray-400"
                                />
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-2 text-gray-400">
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"><ImageIcon size={20} /></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"><Hash size={20} /></button>
                                    </div>
                                    <button
                                        onClick={handlePost}
                                        disabled={!newPostContent.trim() || !currentUser || isPosting}
                                        className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-gray-200 min-w-[100px] justify-center"
                                    >
                                        {isPosting ? <Loader2 size={16} className="animate-spin" /> : <>发布动态 <Send size={14} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="space-y-6 pb-20">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))
                        ) : paginatedPosts.length > 0 ? (
                            <>
                                {paginatedPosts.map(post => (
                                    <div key={post.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all duration-300 animate-fade-in-up ${post.is_pinned ? 'border-amber-200 shadow-md' : 'border-gray-100 hover:shadow-xl'}`}>
                                        {/* 置顶标识 */}
                                        {post.is_pinned && (
                                            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mb-3">
                                                <Pin size={14} />
                                                <span>置顶</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={post.user_avatar || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`}
                                                    className="w-12 h-12 rounded-full bg-gray-100 object-cover border-2 border-white shadow-sm"
                                                    alt={post.user_name}
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{post.user_name}</h4>
                                                        {post.role === 'Manager' || post.role === 'SuperAdmin' || post.role === 'Admin' ? (
                                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">官方</span>
                                                        ) : null}
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                        {post.role} • {new Date(post.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* 关注按钮 */}
                                                {currentUser && currentUser.id !== post.user_id && (
                                                    <button
                                                        onClick={() => handleFollow(post.user_id, post.user_name)}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                            followedUsers.has(post.user_id)
                                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                        }`}
                                                    >
                                                        {followedUsers.has(post.user_id) ? (
                                                            <><UserCheck size={14} /> 已关注</>
                                                        ) : (
                                                            <><UserPlus size={14} /> 关注</>
                                                        )}
                                                    </button>
                                                )}
                                                <button className="text-gray-300 hover:text-black transition-colors p-2 hover:bg-gray-50 rounded-full">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-gray-800 text-sm leading-7 whitespace-pre-wrap mb-4 font-medium pl-1">
                                            {post.content}
                                        </p>

                                        {post.image && (
                                            <div className="mb-5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer">
                                                <img src={post.image} className="w-full object-cover max-h-[400px] group-hover:scale-105 transition-transform duration-700" alt="Post attachment" />
                                            </div>
                                        )}

                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-5 pl-1">
                                                {post.tags.map((tag: string) => (
                                                    <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">#{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                            <button
                                                onClick={() => handleLike(post.id, post.likes)}
                                                className={`flex items-center gap-2 text-sm font-bold transition-all group ${likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                            >
                                                <div className={`p-2 rounded-full group-hover:bg-red-50 transition-colors ${likedPosts.has(post.id) ? 'bg-red-50' : ''}`}>
                                                    <Heart size={20} className={`transition-transform duration-300 group-active:scale-75 ${likedPosts.has(post.id) ? 'fill-current scale-110' : ''}`} />
                                                </div>
                                                <span>{post.likes}</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className={`flex items-center gap-2 text-sm font-bold transition-all group ${expandedPostId === post.id ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                                            >
                                                <div className={`p-2 rounded-full group-hover:bg-blue-50 transition-colors ${expandedPostId === post.id ? 'bg-blue-50' : ''}`}>
                                                    <MessageSquare size={20} />
                                                </div>
                                                <span>{post.comments || 0}</span>
                                            </button>

                                            <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold ml-auto group">
                                                <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                                                    <Share2 size={20} />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Comment Section */}
                                        {expandedPostId === post.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 bg-gray-50/50 -mx-6 px-6 pb-2 animate-fade-in rounded-b-[2rem]">
                                                <div className="space-y-4 mb-4">
                                                    {isLoadingComments && !commentsMap[post.id] ? (
                                                        <div className="text-center py-4"><Loader2 className="animate-spin text-gray-400 mx-auto" /></div>
                                                    ) : (
                                                        commentsMap[post.id]?.map(comment => (
                                                            <div key={comment.id} className="flex gap-3">
                                                                <img
                                                                    src={comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name}`}
                                                                    className="w-8 h-8 rounded-full border border-white shadow-sm"
                                                                />
                                                                <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                                                    <div className="flex justify-between items-baseline mb-1">
                                                                        <span className="text-xs font-bold text-gray-900">{comment.user_name}</span>
                                                                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}

                                                    {(!isLoadingComments && (!commentsMap[post.id] || commentsMap[post.id].length === 0)) && (
                                                        <p className="text-center text-xs text-gray-400 py-2">暂无评论，来抢沙发吧！</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                    <input
                                                        type="text"
                                                        placeholder={currentUser ? "写下你的评论..." : "登录后发表评论"}
                                                        value={commentInput}
                                                        onChange={e => setCommentInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleSendComment(post.id)}
                                                        disabled={!currentUser}
                                                        className="flex-1 pl-4 text-sm outline-none bg-transparent"
                                                    />
                                                    <button
                                                        onClick={() => handleSendComment(post.id)}
                                                        disabled={!commentInput.trim() || !currentUser}
                                                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                                    >
                                                        <CornerDownRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Pagination />
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500">暂无动态</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    {/* Search */}
                    <div className="glass-card rounded-[2rem] p-2 sticky top-24">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="搜索社区..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-sm font-medium placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
