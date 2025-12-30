
import React, { useState, useEffect } from 'react';
import { 
  Search, MessageSquare, Heart, Share2, MoreHorizontal, 
  Image as ImageIcon, Hash, TrendingUp, Users, Filter, Send, Loader2
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface CommunityProps {
    currentUser?: UserProfile | null;
}

// Mock Topics for sidebar
const TRENDING_TOPICS = [
    { id: 1, name: 'PMP 备考冲刺', count: 1240 },
    { id: 2, name: '敏捷转型实战', count: 856 },
    { id: 3, name: 'DevOps 工具链', count: 632 },
    { id: 4, name: 'AI 辅助项目管理', count: 420 },
];

const Community: React.FC<CommunityProps> = ({ currentUser }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [activeTab, setActiveTab] = useState<'recommend' | 'latest' | 'following'>('recommend');
    const [isLoading, setIsLoading] = useState(true);
    // Track liked posts locally for UI feedback
    const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_community_posts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching posts:", error);
            }

            if (data && data.length > 0) {
                // Parse tags if stored as JSON string, map avatar
                const formattedData = data.map(post => ({
                    ...post,
                    tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags || [],
                }));
                setPosts(formattedData);
                setFilteredPosts(formattedData);
            } else {
                setPosts([]); 
                setFilteredPosts([]);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Handle Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredPosts(posts);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = posts.filter(post => 
                post.content?.toLowerCase().includes(lowerQuery) ||
                post.user_name?.toLowerCase().includes(lowerQuery) ||
                post.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
            );
            setFilteredPosts(filtered);
        }
    }, [searchQuery, posts]);

    const handleLike = async (postId: number, currentLikes: number) => {
        // Optimistic UI update
        const isLiked = likedPosts.has(postId);
        const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
        
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p);
        setPosts(updatedPosts);
        
        const newLikedSet = new Set(likedPosts);
        if (isLiked) newLikedSet.delete(postId);
        else newLikedSet.add(postId);
        setLikedPosts(newLikedSet);

        // DB Update (Fire and forget)
        await supabase.from('app_community_posts').update({ likes: newLikes }).eq('id', postId);
    };

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        if (!currentUser) {
            alert("请先登录");
            return;
        }
        
        const optimisticPost = {
            id: Date.now(), // Temporary ID
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            role: currentUser.role,
            content: newPostContent,
            tags: [],
            likes: 0,
            comments: 0,
            created_at: new Date().toISOString(),
            image: null
        };

        const updatedList = [optimisticPost, ...posts];
        setPosts(updatedList);
        setNewPostContent('');

        // Sync to DB
        const { error } = await supabase.from('app_community_posts').insert({
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_avatar: currentUser.avatar,
            role: currentUser.role,
            content: newPostContent,
            tags: JSON.stringify([]), // Store empty array as JSON
            likes: 0,
            comments: 0
        });

        if (error) {
            console.error("Post failed:", error);
            // Revert state if needed in real app
        } else {
            fetchPosts(); // Re-fetch to get real ID
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- Left Sidebar: Navigation --- */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="glass-card rounded-[2rem] p-6 space-y-2 sticky top-24">
                        <button 
                            onClick={() => setActiveTab('recommend')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'recommend' ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <TrendingUp size={20} />
                            <span className="font-bold">推荐动态</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('latest')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'latest' ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Filter size={20} />
                            <span className="font-bold">最新发布</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('following')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'following' ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Users size={20} />
                            <span className="font-bold">我的关注</span>
                        </button>

                        <div className="pt-6 mt-4 border-t border-gray-100">
                             <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">热门话题</h3>
                             <div className="space-y-1">
                                 {TRENDING_TOPICS.map(topic => (
                                     <button key={topic.id} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg group">
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

                {/* --- Center: Feed --- */}
                <div className="col-span-1 lg:col-span-6 space-y-6">
                    {/* Compose Box */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={24} className="text-gray-400"/>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea 
                                    placeholder={currentUser ? `分享你的想法, ${currentUser.name}...` : "请先登录以发布动态..."}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    disabled={!currentUser}
                                    className="w-full h-24 bg-gray-50 rounded-2xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none font-medium placeholder:text-gray-400"
                                />
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex gap-2 text-gray-400">
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ImageIcon size={20}/></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Hash size={20}/></button>
                                    </div>
                                    <button 
                                        onClick={handlePost}
                                        disabled={!newPostContent.trim() || !currentUser}
                                        className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-gray-200"
                                    >
                                        发布动态 <Send size={14}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="space-y-6 pb-20">
                        {isLoading ? (
                            // Skeleton Loader
                            [1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 animate-pulse">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                                        <div className="flex-1">
                                            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                </div>
                            ))
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map(post => (
                                <div key={post.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in-up">
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
                                                    {post.role === 'Manager' || post.role === 'SuperAdmin' ? (
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Official</span>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                    {post.role} • {new Date(post.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-gray-300 hover:text-black transition-colors p-2 hover:bg-gray-50 rounded-full">
                                            <MoreHorizontal size={20}/>
                                        </button>
                                    </div>

                                    <p className="text-gray-800 text-sm leading-7 whitespace-pre-wrap mb-4 font-medium">
                                        {post.content}
                                    </p>

                                    {post.image && (
                                        <div className="mb-5 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                            <img src={post.image} className="w-full object-cover max-h-[400px] hover:scale-105 transition-transform duration-700" alt="Post attachment"/>
                                        </div>
                                    )}

                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {post.tags.map((tag: string) => (
                                                <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">#{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                        <button 
                                            onClick={() => handleLike(post.id, post.likes)}
                                            className={`flex items-center gap-2 text-sm font-bold transition-colors group ${likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                        >
                                            <div className={`p-2 rounded-full group-hover:bg-red-50 transition-colors ${likedPosts.has(post.id) ? 'bg-red-50' : ''}`}>
                                                <Heart size={20} className={`transition-transform group-active:scale-75 ${likedPosts.has(post.id) ? 'fill-current' : ''}`}/> 
                                            </div>
                                            <span>{post.likes}</span>
                                        </button>

                                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors text-sm font-bold group">
                                            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                                <MessageSquare size={20} /> 
                                            </div>
                                            <span>{post.comments}</span>
                                        </button>
                                        
                                        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold ml-auto group">
                                            <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                                                <Share2 size={20} /> 
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-sm font-bold">没有找到相关动态</p>
                                <p className="text-xs mt-2">试着搜索其他关键词或发布第一条内容</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Right Sidebar --- */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    
                    {/* Search Widget */}
                    <div className="bg-white rounded-[1.5rem] p-2 border border-gray-100 shadow-sm sticky top-24 z-10">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input 
                                type="text"
                                placeholder="搜索动态、标签或用户..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Announcement Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 sticky top-44">
                        <div className="flex items-center gap-2 mb-3 opacity-80">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-widest">Notice</span>
                        </div>
                        <h3 className="font-bold text-xl mb-3 leading-tight">ProjectFlow 社区公约 v2.0</h3>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed opacity-90">
                            为了维护良好的技术交流氛围，请大家文明发言。欢迎分享实战经验、职场心得与技术难题。
                        </p>
                        <button className="bg-white text-blue-600 px-5 py-3 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors w-full shadow-lg">
                            阅读详情
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-center justify-center text-xs text-gray-400 leading-loose pt-4">
                        <a href="#" className="hover:text-gray-600">Privacy</a>
                        <span>•</span>
                        <a href="#" className="hover:text-gray-600">Terms</a>
                        <span>•</span>
                        <a href="#" className="hover:text-gray-600">Cookies</a>
                        <p className="w-full mt-2 opacity-50">&copy; 2024 ProjectFlow Enterprise</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
