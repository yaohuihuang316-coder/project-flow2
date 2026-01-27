import { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp, MessageSquare, Award, Calendar, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminAnalytics = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsersThisMonth: 0,
        totalCourses: 0,
        totalPosts: 0,
        totalProgress: 0,
        avgProgress: 0,
        activeUsers: 0,
        totalEvents: 0
    });

    const [userGrowth, setUserGrowth] = useState<any[]>([]);
    const [courseStats, setCourseStats] = useState<any[]>([]);
    const [communityStats, setCommunityStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllStats();
    }, []);

    const fetchAllStats = async () => {
        setLoading(true);
        await Promise.all([
            fetchBasicStats(),
            fetchUserGrowth(),
            fetchCourseStats(),
            fetchCommunityStats()
        ]);
        setLoading(false);
    };

    const fetchBasicStats = async () => {
        try {
            // Total users
            const { count: totalUsers } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true });

            // New users this month
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const { count: newUsersThisMonth } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', firstDayOfMonth.toISOString());

            // Total courses
            const { count: totalCourses } = await supabase
                .from('app_courses')
                .select('*', { count: 'exact', head: true });

            // Total posts
            const { count: totalPosts } = await supabase
                .from('app_community_posts')
                .select('*', { count: 'exact', head: true });

            // Total progress records
            const { count: totalProgress } = await supabase
                .from('app_user_progress')
                .select('*', { count: 'exact', head: true });

            // Average progress
            const { data: progressData } = await supabase
                .from('app_user_progress')
                .select('progress');

            const avgProgress = progressData && progressData.length > 0
                ? Math.round(progressData.reduce((sum, p) => sum + (p.progress || 0), 0) / progressData.length)
                : 0;

            // Active users (with progress > 0)
            const { count: activeUsers } = await supabase
                .from('app_user_progress')
                .select('user_id', { count: 'exact', head: true })
                .gt('progress', 0);

            // Total events
            const { count: totalEvents } = await supabase
                .from('app_events')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalUsers: totalUsers || 0,
                newUsersThisMonth: newUsersThisMonth || 0,
                totalCourses: totalCourses || 0,
                totalPosts: totalPosts || 0,
                totalProgress: totalProgress || 0,
                avgProgress,
                activeUsers: activeUsers || 0,
                totalEvents: totalEvents || 0
            });
        } catch (err) {
            console.error('Error fetching basic stats:', err);
        }
    };

    const fetchUserGrowth = async () => {
        try {
            const { data } = await supabase
                .from('app_users')
                .select('created_at')
                .order('created_at', { ascending: true });

            if (data) {
                // Group by month
                const monthlyGrowth: { [key: string]: number } = {};
                data.forEach(user => {
                    const month = new Date(user.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
                    monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
                });

                const growthData = Object.entries(monthlyGrowth)
                    .map(([month, count]) => ({ month, count }))
                    .slice(-6); // Last 6 months

                setUserGrowth(growthData);
            }
        } catch (err) {
            console.error('Error fetching user growth:', err);
        }
    };

    const fetchCourseStats = async () => {
        try {
            const { data } = await supabase
                .from('app_courses')
                .select(`
                    id, 
                    title,
                    app_user_progress(count)
                `);

            if (data) {
                const stats = data.map(course => ({
                    title: course.title,
                    enrollments: course.app_user_progress?.length || 0
                })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);

                setCourseStats(stats);
            }
        } catch (err) {
            console.error('Error fetching course stats:', err);
        }
    };

    const fetchCommunityStats = async () => {
        try {
            const { data: topUsers } = await supabase
                .from('app_community_posts')
                .select('user_id, app_users!app_community_posts_user_id_fkey(name)')
                .limit(100);

            if (topUsers) {
                const userPostCount: { [key: string]: { name: string; count: number } } = {};
                topUsers.forEach((post: any) => {
                    const userId = post.user_id;
                    const userName = post.app_users?.name || '未知用户';
                    if (!userPostCount[userId]) {
                        userPostCount[userId] = { name: userName, count: 0 };
                    }
                    userPostCount[userId].count++;
                });

                const topPosters = Object.values(userPostCount)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setCommunityStats(topPosters);
            }
        } catch (err) {
            console.error('Error fetching community stats:', err);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载统计数据中...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" />
                    数据统计看板
                </h1>
                <p className="text-gray-500 mt-1">平台核心指标与数据分析</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="text-blue-600" size={24} />}
                    title="总用户数"
                    value={stats.totalUsers}
                    subtitle={`本月新增 ${stats.newUsersThisMonth}`}
                    color="blue"
                />
                <StatCard
                    icon={<BookOpen className="text-green-600" size={24} />}
                    title="课程总数"
                    value={stats.totalCourses}
                    subtitle={`${stats.totalProgress} 条学习记录`}
                    color="green"
                />
                <StatCard
                    icon={<TrendingUp className="text-purple-600" size={24} />}
                    title="平均进度"
                    value={`${stats.avgProgress}%`}
                    subtitle={`${stats.activeUsers} 活跃学习者`}
                    color="purple"
                />
                <StatCard
                    icon={<MessageSquare className="text-orange-600" size={24} />}
                    title="社区帖子"
                    value={stats.totalPosts}
                    subtitle={`${stats.totalEvents} 个日程事件`}
                    color="orange"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <ChartCard title="用户增长趋势" icon={<Activity className="text-blue-600" size={20} />}>
                    <div className="space-y-3">
                        {userGrowth.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-600 w-24">{item.month}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full flex items-center justify-end pr-2 text-white text-xs font-bold rounded-full transition-all"
                                        style={{ width: `${Math.min((item.count / Math.max(...userGrowth.map(u => u.count))) * 100, 100)}%` }}
                                    >
                                        {item.count}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Top Courses */}
                <ChartCard title="热门课程 Top 5" icon={<Award className="text-green-600" size={20} />}>
                    <div className="space-y-3">
                        {courseStats.map((course, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-lg font-bold text-gray-400 w-8">#{idx + 1}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">{course.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-full rounded-full"
                                                style={{ width: `${Math.min((course.enrollments / Math.max(...courseStats.map(c => c.enrollments))) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{course.enrollments} 人</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Top Community Contributors */}
                <ChartCard title="社区活跃用户 Top 5" icon={<MessageSquare className="text-purple-600" size={20} />}>
                    <div className="space-y-3">
                        {communityStats.map((user, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-lg font-bold text-gray-400 w-8">#{idx + 1}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-full rounded-full"
                                                style={{ width: `${Math.min((user.count / Math.max(...communityStats.map(u => u.count))) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{user.count} 篇</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Quick Stats */}
                <ChartCard title="快速统计" icon={<Calendar className="text-orange-600" size={20} />}>
                    <div className="grid grid-cols-2 gap-4">
                        <QuickStat label="本月新用户" value={stats.newUsersThisMonth} color="blue" />
                        <QuickStat label="活跃学习者" value={stats.activeUsers} color="green" />
                        <QuickStat label="学习记录" value={stats.totalProgress} color="purple" />
                        <QuickStat label="日程事件" value={stats.totalEvents} color="orange" />
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

// ========== SUB COMPONENTS ==========
const StatCard = ({ icon, title, value, subtitle, color }: any) => {
    const colorClasses: { [key: string]: string } = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        purple: 'bg-purple-50 border-purple-200',
        orange: 'bg-orange-50 border-orange-200'
    };

    return (
        <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-shadow hover:shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
            </div>
        </div>
    );
};

const ChartCard = ({ title, icon, children }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-6">
            {icon}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {children}
    </div>
);

const QuickStat = ({ label, value, color }: any) => {
    const colorClasses: { [key: string]: string } = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        purple: 'text-purple-600 bg-purple-100',
        orange: 'text-orange-600 bg-orange-100'
    };

    return (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]} mb-1`}>
                {value}
            </div>
            <div className="text-xs text-gray-600">{label}</div>
        </div>
    );
};

export default AdminAnalytics;
