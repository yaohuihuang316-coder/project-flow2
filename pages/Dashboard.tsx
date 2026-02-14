
import React, { useEffect, useState, useMemo } from 'react';
import { 
    Calendar, Trophy, ArrowUpRight, Activity, FileText, ChevronRight,
    Flame, Target, Clock, BookOpen, Zap, TrendingUp, AlertCircle,
    CheckCircle2, Play, Star, Crown, ArrowRight, MoreHorizontal,
    BarChart3, RotateCcw, Lightbulb, Share2, GitBranch
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { Page, UserProfile, MembershipTier } from '../types';
import { supabase } from '../lib/supabaseClient';
import MembershipCard from '../components/MembershipCard';
import { MEMBERSHIP_CONFIG, getNextTierInfo } from '../lib/membership';

interface DashboardProps {
    onNavigate: (page: Page, id?: string) => void;
    currentUser?: UserProfile | null;
}

// 学习活动类型
interface LearningActivity {
    id: string;
    type: 'course_started' | 'course_completed' | 'chapter_finished' | 'simulation_done' | 'note_added';
    title: string;
    description: string;
    timestamp: string;
    courseId?: string;
    score?: number;
}

// 课程进度
interface CourseProgress {
    courseId: string;
    title: string;
    image: string;
    progress: number;
    totalChapters: number;
    completedChapters: number;
    category: string;
    lastAccessed: string;
}

// 每日学习时长
interface DailyLearning {
    date: string;
    minutes: number;
}

// 推荐课程
interface RecommendedCourse {
    id: string;
    title: string;
    image: string;
    category: string;
    difficulty: string;
    reason: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, currentUser }) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

    // === State ===
    const [streak, setStreak] = useState(0);
    const [todayTasks, setTodayTasks] = useState<CourseProgress[]>([]);
    const [weeklyData, setWeeklyData] = useState<DailyLearning[]>([]);
    const [recentActivities, setRecentActivities] = useState<LearningActivity[]>([]);
    const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
    const [recommendedCourse, setRecommendedCourse] = useState<RecommendedCourse | null>(null);
    const [recentNotes, setRecentNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 会员等级信息
    const nextTierInfo = useMemo(() => getNextTierInfo(currentUser || null), [currentUser]);

    // === Data Fetching ===
    useEffect(() => {
        if (!currentUser) return;
        fetchDashboardData();
    }, [currentUser]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchStreak(),
                fetchTodayTasks(),
                fetchWeeklyData(),
                fetchRecentActivities(),
                fetchCourseProgress(),
                fetchRecommendedCourse(),
                fetchRecentNotes()
            ]);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 获取连续学习天数
    const fetchStreak = async () => {
        if (!currentUser) return;
        
        // 从用户表获取 streak
        const { data } = await supabase
            .from('app_users')
            .select('streak')
            .eq('id', currentUser.id)
            .single();
        
        if (data) {
            setStreak(data.streak || 0);
        }
    };

    // 获取今日学习任务（最近学习的3门课程）
    const fetchTodayTasks = async () => {
        if (!currentUser) return;

        const { data } = await supabase
            .from('app_user_progress')
            .select('course_id, progress, completed_chapters, last_accessed')
            .eq('user_id', currentUser.id)
            .order('last_accessed', { ascending: false })
            .limit(3);

        if (data && data.length > 0) {
            const courseIds = data.map(d => d.course_id);
            const { data: coursesData } = await supabase
                .from('app_courses')
                .select('id, title, image, category, chapters')
                .in('id', courseIds);

            const tasks: CourseProgress[] = data.map(progress => {
                const course = coursesData?.find(c => c.id === progress.course_id);
                const chapters = typeof course?.chapters === 'string' 
                    ? JSON.parse(course.chapters) 
                    : course?.chapters || [];
                const completedChapters = typeof progress.completed_chapters === 'string'
                    ? JSON.parse(progress.completed_chapters)
                    : progress.completed_chapters || [];

                return {
                    courseId: progress.course_id,
                    title: course?.title || '未知课程',
                    image: course?.image || '',
                    progress: progress.progress || 0,
                    totalChapters: chapters.length,
                    completedChapters: completedChapters.length,
                    category: course?.category || 'General',
                    lastAccessed: progress.last_accessed
                };
            });

            setTodayTasks(tasks);
        }
    };

    // 获取本周学习时长数据
    const fetchWeeklyData = async () => {
        if (!currentUser) return;

        // 生成最近7天的日期
        const days: DailyLearning[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toISOString().split('T')[0],
                minutes: 0
            });
        }

        // 这里简化处理，实际应该查询学习时长表
        // 目前用随机数据模拟，后续可接入真实时长统计
        const { data } = await supabase
            .from('app_user_progress')
            .select('last_accessed')
            .eq('user_id', currentUser.id)
            .gte('last_accessed', days[0].date);

        if (data) {
            data.forEach(item => {
                const date = item.last_accessed.split('T')[0];
                const day = days.find(d => d.date === date);
                if (day) {
                    day.minutes += Math.floor(Math.random() * 30) + 15; // 模拟数据
                }
            });
        }

        setWeeklyData(days);
    };

    // 获取最近学习活动
    const fetchRecentActivities = async () => {
        if (!currentUser) return;

        const activities: LearningActivity[] = [];

        // 获取最近完成的课程章节
        const { data: progressData } = await supabase
            .from('app_user_progress')
            .select('course_id, progress, last_accessed')
            .eq('user_id', currentUser.id)
            .order('last_accessed', { ascending: false })
            .limit(5);

        if (progressData) {
            for (const progress of progressData) {
                if (progress.progress === 100) {
                    const { data: course } = await supabase
                        .from('app_courses')
                        .select('title')
                        .eq('id', progress.course_id)
                        .single();

                    activities.push({
                        id: `completed-${progress.course_id}`,
                        type: 'course_completed',
                        title: '完成课程',
                        description: `完成了《${course?.title || '未知课程'}》`,
                        timestamp: progress.last_accessed,
                        courseId: progress.course_id
                    });
                } else {
                    const { data: course } = await supabase
                        .from('app_courses')
                        .select('title')
                        .eq('id', progress.course_id)
                        .single();

                    activities.push({
                        id: `progress-${progress.course_id}`,
                        type: 'chapter_finished',
                        title: '学习进度',
                        description: `学习了《${course?.title || '未知课程'}》`,
                        timestamp: progress.last_accessed,
                        courseId: progress.course_id,
                        score: progress.progress
                    });
                }
            }
        }

        // 按时间排序
        activities.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setRecentActivities(activities.slice(0, 5));
    };

    // 获取所有课程进度
    const fetchCourseProgress = async () => {
        if (!currentUser) return;

        const { data } = await supabase
            .from('app_user_progress')
            .select('course_id, progress, completed_chapters')
            .eq('user_id', currentUser.id)
            .order('last_accessed', { ascending: false })
            .limit(4);

        if (data && data.length > 0) {
            const courseIds = data.map(d => d.course_id);
            const { data: coursesData } = await supabase
                .from('app_courses')
                .select('id, title, image, category, chapters')
                .in('id', courseIds);

            const progress: CourseProgress[] = data.map(p => {
                const course = coursesData?.find(c => c.id === p.course_id);
                const chapters = typeof course?.chapters === 'string' 
                    ? JSON.parse(course.chapters) 
                    : course?.chapters || [];
                const completedChapters = typeof p.completed_chapters === 'string'
                    ? JSON.parse(p.completed_chapters)
                    : p.completed_chapters || [];

                return {
                    courseId: p.course_id,
                    title: course?.title || '未知课程',
                    image: course?.image || '',
                    progress: p.progress || 0,
                    totalChapters: chapters.length,
                    completedChapters: completedChapters.length,
                    category: course?.category || 'General',
                    lastAccessed: ''
                };
            });

            setCourseProgress(progress);
        }
    };

    // 获取推荐课程
    const fetchRecommendedCourse = async () => {
        if (!currentUser) return;

        // 获取已学习的课程ID
        const { data: progressData } = await supabase
            .from('app_user_progress')
            .select('course_id')
            .eq('user_id', currentUser.id);

        const learnedIds = progressData?.map(p => p.course_id) || [];

        // 推荐未学习的课程
        const { data: courses } = await supabase
            .from('app_courses')
            .select('id, title, image, category, difficulty')
            .not('id', 'in', `(${learnedIds.join(',')})`)
            .eq('status', 'Published')
            .limit(1);

        if (courses && courses.length > 0) {
            setRecommendedCourse({
                ...courses[0],
                reason: '根据你的学习路径推荐'
            });
        }
    };

    // 获取最近笔记
    const fetchRecentNotes = async () => {
        if (!currentUser) return;

        const { data: notesData } = await supabase
            .from('app_user_progress')
            .select('course_id, notes, last_accessed')
            .eq('user_id', currentUser.id)
            .not('notes', 'is', null)
            .neq('notes', '')
            .order('last_accessed', { ascending: false })
            .limit(3);

        if (notesData && notesData.length > 0) {
            const courseIds = notesData.map(n => n.course_id);
            const { data: coursesData } = await supabase
                .from('app_courses')
                .select('id, title, image')
                .in('id', courseIds);

            const mergedNotes = notesData.map(note => {
                const course = coursesData?.find(c => c.id === note.course_id);
                return {
                    courseId: note.course_id,
                    noteSnippet: note.notes,
                    date: new Date(note.last_accessed).toLocaleDateString(),
                    courseTitle: course?.title || 'Unknown Course',
                    courseImage: course?.image
                };
            });
            setRecentNotes(mergedNotes);
        }
    };

    // 计算总学习时长
    const totalLearningMinutes = useMemo(() => 
        weeklyData.reduce((sum, d) => sum + d.minutes, 0),
    [weeklyData]);

    // 计算本周平均每日学习时长
    const avgDailyMinutes = useMemo(() => 
        Math.round(totalLearningMinutes / 7),
    [totalLearningMinutes]);

    // === Render Helpers ===
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'course_completed': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'chapter_finished': return <BookOpen size={16} className="text-blue-500" />;
            default: return <Zap size={16} className="text-yellow-500" />;
        }
    };

    // 知识图谱节点数据
    const knowledgeNodes = [
        { id: 'pmbok', label: 'PMBOK', color: 'bg-blue-500', courseId: 'c-f1', x: '50%', y: '50%', r: 45 },
        { id: 'risk', label: '风险管理', color: 'bg-red-500', courseId: 'c-a4', x: '20%', y: '30%', r: 35 },
        { id: 'agile', label: '敏捷管理', color: 'bg-green-500', courseId: 'c-a2', x: '80%', y: '30%', r: 40 },
        { id: 'cost', label: '成本管理', color: 'bg-purple-500', courseId: 'c-a3', x: '25%', y: '75%', r: 32 },
        { id: 'scope', label: '范围管理', color: 'bg-orange-500', courseId: 'c-f3', x: '75%', y: '70%', r: 35 },
        { id: 'quality', label: '质量管理', color: 'bg-teal-500', courseId: 'c-a5', x: '50%', y: '18%', r: 30 },
        { id: 'cpm', label: '关键路径', color: 'bg-indigo-500', courseId: 'c-f4', x: '15%', y: '55%', r: 28 },
        { id: 'stakeholder', label: '干系人', color: 'bg-pink-500', courseId: 'c-f6', x: '85%', y: '55%', r: 30 },
    ];

    return (
        <div className="pt-32 pb-12 px-6 sm:px-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col gap-2 mb-8">
                <h2 className="text-gray-500 font-medium text-lg tracking-wide uppercase">{dateStr}</h2>
                <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                    {getGreeting()}，{currentUser?.name || '探索者'}
                </h1>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* === Module 1: 智能学习概览 (Left, Span 2) === */}
                <div className="md:col-span-2 space-y-6">
                    {/* Streak Card */}
                    <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">学习概览</h3>
                                    <p className="text-gray-500 text-sm mt-1">保持连续学习，养成良好习惯</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-orange-500">
                                            <Flame size={24} className={streak > 0 ? 'animate-pulse' : ''} />
                                            <span className="text-3xl font-bold">{streak}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">连续学习天数</div>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Chart */}
                            <div className="h-40 -mx-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyData}>
                                        <defs>
                                            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(date) => new Date(date).getDate() + '日'}
                                            tick={{fontSize: 10, fill: '#9CA3AF'}}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            formatter={(value: number) => [`${value} 分钟`, '学习时长']}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="minutes" 
                                            stroke="#3B82F6" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorMinutes)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{Math.round(totalLearningMinutes / 60 * 10) / 10}h</div>
                                    <div className="text-xs text-gray-500">本周学习</div>
                                </div>
                                <div className="text-center border-x border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900">{avgDailyMinutes}</div>
                                    <div className="text-xs text-gray-500">日均(分钟)</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{todayTasks.length}</div>
                                    <div className="text-xs text-gray-500">进行中</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Tasks */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Target size={20} className="text-blue-500" />
                                今日学习任务
                            </h3>
                            <button 
                                onClick={() => onNavigate(Page.LEARNING)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                全部课程 <ArrowRight size={14} />
                            </button>
                        </div>

                        {todayTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">还没有开始学习的课程</p>
                                <button 
                                    onClick={() => onNavigate(Page.LEARNING)}
                                    className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100"
                                >
                                    去探索课程
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayTasks.map(task => (
                                    <div 
                                        key={task.courseId}
                                        onClick={() => onNavigate(Page.CLASSROOM, task.courseId)}
                                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <img 
                                            src={task.image} 
                                            alt={task.title}
                                            className="w-12 h-12 rounded-xl object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-10 text-right">{task.progress}%</span>
                                            </div>
                                        </div>
                                        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <Play size={14} fill="currentColor" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* === Right Column: Stats & Quick Actions (Span 1) === */}
                <div className="md:col-span-1 space-y-6">
                    {/* Membership Progress */}
                    {nextTierInfo && (
                        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-[2.5rem] p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown size={20} />
                                    <span className="font-bold">会员等级</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{MEMBERSHIP_CONFIG[currentUser?.membershipTier || 'free'].name}</div>
                                <div className="text-white/80 text-sm mb-4">
                                    距离 {nextTierInfo.name} 还差 {nextTierInfo.remainingCourses} 门课程
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white rounded-full transition-all"
                                        style={{ width: `${nextTierInfo.progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-white/70">
                                    <span>{nextTierInfo.completedCourses} 门已完成</span>
                                    <span>目标 {nextTierInfo.requiredCourses} 门</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activities */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-green-500" />
                            最近动态
                        </h3>
                        <div className="space-y-3">
                            {recentActivities.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">暂无学习动态</p>
                            ) : (
                                recentActivities.map(activity => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                                            <div className="text-xs text-gray-500 truncate">{activity.description}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => onNavigate(Page.AI_ASSISTANT)}
                            className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                        >
                            <Zap size={20} className="text-yellow-500 mb-2" />
                            <div className="font-medium text-sm">AI 助手</div>
                            <div className="text-xs text-gray-400">解答疑问</div>
                        </button>
                        <button 
                            onClick={() => onNavigate(Page.TOOLS_LAB)}
                            className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all text-left"
                        >
                            <BarChart3 size={20} className="text-purple-500 mb-2" />
                            <div className="font-medium text-sm">工具实验室</div>
                            <div className="text-xs text-gray-400">项目工具</div>
                        </button>
                    </div>
                </div>

                {/* === Module 2: Course Progress Overview (Span 3) === */}
                <div className="md:col-span-3">
                    <div className="glass-card rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">课程进度追踪</h3>
                            <button 
                                onClick={() => onNavigate(Page.LEARNING)}
                                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                            >
                                查看全部 <ChevronRight size={16} />
                            </button>
                        </div>

                        {courseProgress.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                                <p>开始学习课程，追踪你的进步</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {courseProgress.map(course => (
                                    <div 
                                        key={course.courseId}
                                        onClick={() => onNavigate(Page.CLASSROOM, course.courseId)}
                                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                                    >
                                        <img 
                                            src={course.image} 
                                            alt={course.title}
                                            className="w-full h-24 object-cover rounded-xl mb-3"
                                        />
                                        <h4 className="font-medium text-gray-900 truncate mb-1">{course.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded">{course.category}</span>
                                            <span>{course.completedChapters}/{course.totalChapters} 章</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-xs text-gray-500">{course.progress}%</span>
                                            {course.progress === 100 && (
                                                <span className="text-xs text-green-500 font-medium flex items-center gap-0.5">
                                                    <CheckCircle2 size={10} /> 已完成
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* === Knowledge Graph Module (Span 3) === */}
                <div className="md:col-span-3">
                    <div className="glass-card rounded-[2.5rem] p-6 relative overflow-hidden min-h-[380px] bg-[#0f172a]">
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <GitBranch size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">知识图谱</h3>
                                    <p className="text-xs text-gray-400">点击节点跳转对应课程</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onNavigate(Page.KNOWLEDGE_GRAPH)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white/80 transition-colors flex items-center gap-2"
                            >
                                查看完整图谱 <ArrowRight size={14} />
                            </button>
                        </div>
                        
                        {/* Graph Area */}
                        <div className="relative h-[280px] mt-4">
                            {/* Connecting Lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                                <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="25%" y2="75%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="75%" y2="70%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="50%" y2="18%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="15%" y2="55%" stroke="white" strokeWidth="1" />
                                <line x1="50%" y1="50%" x2="85%" y2="55%" stroke="white" strokeWidth="1" />
                                <line x1="20%" y1="30%" x2="15%" y2="55%" stroke="white" strokeWidth="0.5" opacity="0.5" />
                                <line x1="80%" y1="30%" x2="85%" y2="55%" stroke="white" strokeWidth="0.5" opacity="0.5" />
                            </svg>

                            {/* Floating Nodes */}
                            {knowledgeNodes.map((node, i) => (
                                <button
                                    key={node.id}
                                    onClick={() => onNavigate(Page.CLASSROOM, node.courseId)}
                                    className={`absolute flex flex-col items-center justify-center rounded-full text-white text-xs font-bold shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-md hover:scale-125 transition-all duration-300 group ${node.color}`}
                                    style={{
                                        left: node.x,
                                        top: node.y,
                                        width: node.r * 2,
                                        height: node.r * 2,
                                        transform: 'translate(-50%, -50%)',
                                        animation: `float ${3 + i * 0.3}s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 0.2}s`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                                    <span className="relative z-10 text-center px-1 leading-tight">{node.label}</span>
                                    <Play size={10} className="relative z-10 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}

                            {/* Legend */}
                            <div className="absolute bottom-2 right-4 flex items-center gap-4 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 基础
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> 进阶
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> 实战
                                </span>
                            </div>
                        </div>
                        
                        <style>{`
                            @keyframes float {
                                0% { margin-top: 0px; }
                                100% { margin-top: 12px; }
                            }
                        `}</style>
                    </div>
                </div>

                {/* === Module 3: Recommended Course & Notes (Span 3) === */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Recommended Course */}
                    {recommendedCourse && (
                        <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border border-blue-100">
                            <div className="flex items-start gap-6">
                                <img 
                                    src={recommendedCourse.image} 
                                    alt={recommendedCourse.title}
                                    className="w-32 h-32 rounded-2xl object-cover shadow-lg"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb size={16} className="text-yellow-500" />
                                        <span className="text-sm text-blue-600 font-medium">为你推荐</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{recommendedCourse.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{recommendedCourse.reason}</p>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                                            {recommendedCourse.category}
                                        </span>
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                                            {recommendedCourse.difficulty}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate(Page.CLASSROOM, recommendedCourse.id)}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Play size={16} fill="currentColor" /> 开始学习
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Notes */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileText size={16} className="text-blue-500"/> 
                                学习笔记
                            </h3>
                            {recentNotes.length > 0 && (
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                    {recentNotes.length}
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {recentNotes.length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <FileText size={16} className="opacity-50"/>
                                    </div>
                                    <span className="text-xs">暂无笔记</span>
                                </div>
                            ) : (
                                recentNotes.map((note, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => onNavigate(Page.CLASSROOM, note.courseId)}
                                        className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{note.courseTitle}</h4>
                                            <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-500"/>
                                        </div>
                                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {note.noteSnippet}
                                        </p>
                                        <div className="mt-2 text-[8px] text-gray-400 font-medium text-right">
                                            {note.date}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* === Module 4: Achievement Banner (Span 3) === */}
                <div 
                    onClick={() => onNavigate(Page.PROFILE)}
                    className="md:col-span-3 glass-card rounded-[2.5rem] p-8 flex items-center justify-between hover:bg-white transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/30 flex items-center justify-center text-white text-3xl font-bold transform rotate-3 group-hover:rotate-12 transition-transform">
                            <Trophy size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">荣誉成就</h3>
                            <p className="text-sm text-gray-500">查看已获得的证书、徽章以及详细的能力评估报告</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                        <span>前往成就中心</span>
                        <ArrowUpRight size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 获取问候语
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
}

export default Dashboard;
