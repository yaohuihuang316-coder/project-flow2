
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { Users, BookOpen, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminDashboard: React.FC = () => {
  // 真实数据状态
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalPosts: 0,
    completedCourses: 0,
    freeUsers: 0,
    proUsers: 0,
    proPlusUsers: 0,
    todayNewUsers: 0,
    todayActiveUsers: 0
  });
  
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [tierData, setTierData] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. 用户统计
      const { data: usersData } = await supabase
        .from('app_users')
        .select('subscription_tier, created_at');
      
      if (usersData) {
        const today = new Date().toISOString().split('T')[0];
        const todayUsers = usersData.filter(u => u.created_at?.startsWith(today)).length;
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          freeUsers: usersData.filter(u => u.subscription_tier === 'free').length,
          proUsers: usersData.filter(u => u.subscription_tier === 'pro').length,
          proPlusUsers: usersData.filter(u => u.subscription_tier === 'pro_plus').length,
          todayNewUsers: todayUsers
        }));

        // 处理增长数据（最近7天）
        const dateMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dateMap[date.toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})] = 0;
        }
        
        usersData.forEach(u => {
          const date = new Date(u.created_at).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'});
          if (dateMap.hasOwnProperty(date)) {
            dateMap[date]++;
          }
        });
        
        const chartData = Object.entries(dateMap).map(([name, users]) => ({
          name,
          users,
          active: Math.floor(users * 0.6) + Math.floor(Math.random() * 5)
        }));
        setGrowthData(chartData);

        // 会员等级饼图数据
        setTierData([
          { name: 'Free', value: usersData.filter(u => u.subscription_tier === 'free').length, color: '#94a3b8' },
          { name: 'Pro', value: usersData.filter(u => u.subscription_tier === 'pro').length, color: '#3b82f6' },
          { name: 'Pro+', value: usersData.filter(u => u.subscription_tier === 'pro_plus').length, color: '#f59e0b' }
        ]);
      }

      // 2. 课程统计
      const { data: coursesData } = await supabase
        .from('app_courses')
        .select('id');
      
      if (coursesData) {
        setStats(prev => ({ ...prev, totalCourses: coursesData.length }));
      }

      // 3. 学习进度统计
      const { data: progressData } = await supabase
        .from('app_user_progress')
        .select('progress');
      
      if (progressData) {
        const completed = progressData.filter(p => p.progress === 100).length;
        const inProgress = progressData.filter(p => p.progress > 0 && p.progress < 100).length;
        const notStarted = progressData.filter(p => p.progress === 0).length;
        
        setStats(prev => ({ ...prev, completedCourses: completed }));
        setCourseProgress([
          { name: '已完成', value: completed, color: '#10b981' },
          { name: '学习中', value: inProgress, color: '#3b82f6' },
          { name: '未开始', value: notStarted, color: '#e5e7eb' }
        ]);
      }

      // 4. 社区统计
      const { data: postsData } = await supabase
        .from('app_community_posts')
        .select('id');
      
      if (postsData) {
        setStats(prev => ({ ...prev, totalPosts: postsData.length }));
      }

      // 5. 最近注册用户
      const { data: recentData } = await supabase
        .from('app_users')
        .select('id, name, email, subscription_tier, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentData) {
        setRecentUsers(recentData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'pro_plus': return 'text-amber-600 bg-amber-50';
      case 'pro': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理仪表盘</h1>
          <p className="text-gray-500 mt-1">实时数据概览</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
        >
          <TrendingUp size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', trend: `+${stats.todayNewUsers} 今日` },
          { label: '课程总数', value: stats.totalCourses, icon: BookOpen, color: 'bg-green-500', trend: '' },
          { label: '社区帖子', value: stats.totalPosts, icon: MessageSquare, color: 'bg-purple-500', trend: '' },
          { label: '已完成课程', value: stats.completedCourses, icon: Trophy, color: 'bg-amber-500', trend: '' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stat.value}
                </p>
                {stat.trend && (
                  <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                )}
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">用户增长趋势</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">加载中...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Membership Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">会员等级分布</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">加载中...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{stats.freeUsers}</p>
              <p className="text-xs text-gray-500">Free</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.proUsers}</p>
              <p className="text-xs text-gray-500">Pro</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.proPlusUsers}</p>
              <p className="text-xs text-gray-500">Pro+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">课程学习状态</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">加载中...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{fontSize: 12}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {courseProgress.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">最近注册用户</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8">加载中...</div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">暂无新用户</div>
            ) : (
              recentUsers.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name || '未命名'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTierColor(user.subscription_tier)}`}>
                    {user.subscription_tier === 'pro_plus' ? 'Pro+' : user.subscription_tier}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
