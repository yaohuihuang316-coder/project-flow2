import { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, TrendingUp, Award, Clock, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminProgress = () => {
    const [progressData, setProgressData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterProgress, setFilterProgress] = useState('all');
    const [courses, setCourses] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        avgProgress: 0,
        completedCount: 0,
        inProgressCount: 0
    });

    useEffect(() => {
        fetchCourses();
        fetchProgress();
    }, []);

    useEffect(() => {
        filterData();
    }, [searchQuery, filterCourse, filterProgress, progressData]);

    const fetchCourses = async () => {
        const { data } = await supabase.from('app_courses').select('id, title').order('title');
        if (data) setCourses(data);
    };

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_user_progress')
                .select(`
                    *,
                    app_courses (id, title, image),
                    app_users!app_user_progress_user_id_fkey (id, name, avatar, email)
                `)
                .order('last_accessed', { ascending: false });

            if (error) throw error;

            if (data) {
                setProgressData(data);
                calculateStats(data);
            }
        } catch (err) {
            console.error('Error fetching progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const totalUsers = new Set(data.map(d => d.user_id)).size;
        const avgProgress = data.reduce((sum, d) => sum + (d.progress || 0), 0) / data.length || 0;
        const completedCount = data.filter(d => d.progress >= 100).length;
        const inProgressCount = data.filter(d => d.progress > 0 && d.progress < 100).length;

        setStats({
            totalUsers,
            avgProgress: Math.round(avgProgress),
            completedCount,
            inProgressCount
        });
    };

    const filterData = () => {
        let filtered = [...progressData];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.app_users?.name?.toLowerCase().includes(query) ||
                item.app_users?.email?.toLowerCase().includes(query) ||
                item.app_courses?.title?.toLowerCase().includes(query)
            );
        }

        // Course filter
        if (filterCourse !== 'all') {
            filtered = filtered.filter(item => item.course_id === filterCourse);
        }

        // Progress filter
        if (filterProgress === 'completed') {
            filtered = filtered.filter(item => item.progress >= 100);
        } else if (filterProgress === 'inprogress') {
            filtered = filtered.filter(item => item.progress > 0 && item.progress < 100);
        } else if (filterProgress === 'notstarted') {
            filtered = filtered.filter(item => item.progress === 0);
        }

        setFilteredData(filtered);
    };

    const handleResetProgress = async (userId: string, courseId: string) => {
        if (!window.confirm('确定要重置该用户的学习进度吗？此操作不可撤销！')) return;

        const { error } = await supabase
            .from('app_user_progress')
            .update({
                progress: 0,
                completed_chapters: [],
                last_chapter: null,
                last_accessed: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('course_id', courseId);

        if (!error) {
            fetchProgress();
            alert('✅ 进度已重置');
        } else {
            alert('❌ 重置失败');
        }
    };

    const handleDeleteProgress = async (userId: string, courseId: string) => {
        if (!window.confirm('确定要删除该学习记录吗？此操作不可撤销！')) return;

        const { error } = await supabase
            .from('app_user_progress')
            .delete()
            .eq('user_id', userId)
            .eq('course_id', courseId);

        if (!error) {
            fetchProgress();
            alert('✅ 记录已删除');
        } else {
            alert('❌ 删除失败');
        }
    };

    const exportData = () => {
        const csvContent = [
            ['用户名', '邮箱', '课程', '进度%', '完成章节', '最后访问'].join(','),
            ...filteredData.map(item => [
                item.app_users?.name || 'N/A',
                item.app_users?.email || 'N/A',
                item.app_courses?.title || 'N/A',
                item.progress || 0,
                (item.completed_chapters || []).length,
                new Date(item.last_accessed).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `学习进度_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'text-green-600 bg-green-50';
        if (progress >= 60) return 'text-blue-600 bg-blue-50';
        if (progress >= 30) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" />
                    学习进度管理
                </h1>
                <p className="text-gray-500 mt-1">查看和管理所有用户的学习进度</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">学习用户数</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">平均进度</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgProgress}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Award className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">已完成</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                            <Award className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">学习中</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgressCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索用户/课程..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">所有课程</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>

                    <select
                        value={filterProgress}
                        onChange={(e) => setFilterProgress(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">所有进度</option>
                        <option value="completed">已完成 (100%)</option>
                        <option value="inprogress">学习中 (1-99%)</option>
                        <option value="notstarted">未开始 (0%)</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchProgress}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> 刷新
                        </button>
                        <button
                            onClick={exportData}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> 导出
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    用户信息
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    课程
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    进度
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    完成章节
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    最后访问
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        暂无数据
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.app_users?.avatar || 'https://via.placeholder.com/40'}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.app_users?.name || '未知用户'}</p>
                                                    <p className="text-sm text-gray-500">{item.app_users?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{item.app_courses?.title || '未知课程'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${item.progress || 0}%` }}
                                                    />
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getProgressColor(item.progress || 0)}`}>
                                                    {item.progress || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900">{(item.completed_chapters || []).length} 章节</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-sm">
                                                {new Date(item.last_accessed).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleResetProgress(item.user_id, item.course_id)}
                                                    className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    title="重置进度"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProgress(item.user_id, item.course_id)}
                                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="删除记录"
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
            </div>

            {/* Results Count */}
            {!loading && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    共 {filteredData.length} 条记录
                </div>
            )}
        </div>
    );
};

export default AdminProgress;
