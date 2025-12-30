
import React, { useState, useEffect } from 'react';
import { 
  Search, MessageSquare, Heart, Share2, MoreHorizontal, 
  Image as ImageIcon, Hash, TrendingUp, Users, Filter, Send
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface CommunityProps {
    currentUser?: UserProfile | null;
}

// Mock Topics
const TRENDING_TOPICS = [
    { id: 1, name: 'PMP 备考冲刺', count: 1240 },
    { id: 2, name: '敏捷转型实战', count: 856 },
    { id: 3, name: 'DevOps 工具链', count: 632 },
    { id: 4, name: '职场软技能', count: 420 },
];

const Community: React.FC<CommunityProps> = ({ currentUser }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [activeTab, setActiveTab] = useState<'recommend' | 'latest' | 'following'>('recommend');
    const [isLoading, setIsLoading] = useState(true);

    // Mock Fetch Data
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                // Mock SQL: SELECT * FROM app_community_posts ORDER BY created_at DESC
                const { data, error } = await supabase
                    .from('app_community_posts')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (data && data.length > 0) {
                    setPosts(data);
                } else {
                    // Fallback Mock Data if table empty or missing
                    setPosts([
                        {
                            id: 1,
                            user_name: 'Sarah Chen',
                            user_avatar: 'https://i.pravatar.cc/150?u=1',
                            role: 'Senior PM',
                            content: '刚刚完成了《敏捷实战》课程，对于 Scrum 中的 Story Point 估算有了新的理解。大家平时是用斐波那契数列还是 T-shirt Size？🤔',
                            tags: ['Agile', 'Scrum'],
                            likes: 45,
                            comments: 12,
                            time: '2 hours ago',
                            image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
                        },
                        {
                            id: 2,
                            user_name: 'David Zhang',
                            user_avatar: 'https://i.pravatar.cc/150?u=5',
                            role: 'Tech Lead',
                            content: '分享一个好用的架构图工具，画微服务拓扑图非常顺手。链接放评论区了 👇',
                            tags: ['Tools', 'Architecture'],
                            likes: 128,
                            comments: 34,
                            time: '5 hours ago',
                            image: null
                        },
                        {
                            id: 3,
                            user_name: 'Mike Ross',
                            user_avatar: 'https://i.pravatar.cc/150?u=2',
                            role: 'Product Owner',
                            content: '下周要进行 PMP 考试了，有点紧张，有没有前辈分享一下重点复习区域？🙏',
                            tags: ['PMP', 'Exam'],
                            likes: 23,
                            comments: 56,
                            time: '1 day ago',
                            image: null
                        }
                    ]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        
        const newPost = {
            id: Date.now(),
            user_name: currentUser?.name || 'Guest User',
            user_avatar: currentUser?.avatar || null,
            role: currentUser?.role || 'Student',
            content: newPostContent,
            tags: [],
            likes: 0,
            comments: 0,
            time: 'Just now',
            created_at: new Date().toISOString()
        };

        setPosts([newPost, ...posts]);
        setNewPostContent('');

        // Try syncing to DB if user is logged in
        if (currentUser) {
            await supabase.from('app_community_posts').insert({
                user_id: currentUser.id,
                content: newPostContent,
                user_name: currentUser.name,
                user_avatar: currentUser.avatar
            });
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- Left Sidebar: Navigation (Span 3) --- */}
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

                {/* --- Center: Feed (Span 6) --- */}
                <div className="col-span-1 lg:col-span-6 space-y-6">
                    {/* Compose Box */}
                    <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full rounded-full"/> : <Users size={20} className="text-gray-400"/>}
                            </div>
                            <div className="flex-1">
                                <textarea 
                                    placeholder="分享你的学习心得..." 
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    className="w-full h-24 bg-gray-50 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex gap-2 text-gray-400">
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ImageIcon size={18}/></button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Hash size={18}/></button>
                                    </div>
                                    <button 
                                        onClick={handlePost}
                                        disabled={!newPostContent.trim()}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        发布 <Send size={14}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="space-y-6">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in-up">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={post.user_avatar || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{post.user_name}</h4>
                                            <p className="text-xs text-gray-500">{post.role} • {post.time}</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-300 hover:text-gray-600"><MoreHorizontal size={20}/></button>
                                </div>

                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                                    {post.content}
                                </p>

                                {post.image && (
                                    <div className="mb-4 rounded-2xl overflow-hidden">
                                        <img src={post.image} className="w-full object-cover max-h-[300px]" alt="Post attachment"/>
                                    </div>
                                )}

                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex gap-2 mb-4">
                                        {post.tags.map((tag: string) => (
                                            <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">#{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                    <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium group">
                                        <Heart size={18} className="group-hover:fill-current"/> 
                                        {post.likes}
                                    </button>
                                    <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors text-sm font-medium">
                                        <MessageSquare size={18} /> 
                                        {post.comments}
                                    </button>
                                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-medium ml-auto">
                                        <Share2 size={18} /> 
                                        分享
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Right Sidebar: Events & Footer (Span 3) --- */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    {/* Announcement Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-lg sticky top-24">
                        <h3 className="font-bold text-lg mb-2">社区公约 v2.0</h3>
                        <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                            为了维护良好的技术交流氛围，请大家文明发言，不仅限于技术讨论，也欢迎职场经验分享。
                        </p>
                        <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors w-full">
                            查看详情
                        </button>
                    </div>

                    <div className="text-center text-xs text-gray-400 leading-loose">
                        <p>&copy; 2024 ProjectFlow Enterprise</p>
                        <p>Privacy Policy • Terms of Service</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
