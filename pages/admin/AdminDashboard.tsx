import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, BookOpen, Server, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminDashboard: React.FC = () => {
  // Real Data State
  const [totalUsers, setTotalUsers] = useState<number | string>('Loading...');
  const [totalCourses, setTotalCourses] = useState<number | string>('Loading...');

  // Mock Data
  const growthData = [
    { name: '周一', users: 4000, active: 2400 },
    { name: '周二', users: 3000, active: 1398 },
    { name: '周三', users: 2000, active: 9800 },
    { name: '周四', users: 2780, active: 3908 },
    { name: '周五', users: 1890, active: 4800 },
    { name: '周六', users: 2390, active: 3800 },
    { name: '周日', users: 3490, active: 4300 },
  ];

  const pieData = [
    { name: '在校学生', value: 400 },
    { name: '职场新人', value: 300 },
    { name: '资深专家', value: 300 },
    { name: '企业管理', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
      const fetchStats = async () => {
          // Fetch User Count
          const { count: userCount, error: userError } = await supabase
              .from('app_users')
              .select('*', { count: 'exact', head: true });
          
          if (!userError) setTotalUsers(userCount || 0);
          else setTotalUsers(12450); // Fallback mock

          // Fetch Course Count
          const { count: courseCount, error: courseError } = await supabase
              .from('app_courses')
              .select('*', { count: 'exact', head: true });
          
          if (!courseError) setTotalCourses(courseCount || 0);
          else setTotalCourses(24); // Fallback mock
      };

      fetchStats();
  }, []);

  const stats = [
    { label: '总用户数', value: totalUsers, change: '+12%', icon: Users },
    { label: '今日活跃', value: '1,203', change: '+5%', icon: TrendingUp },
    { label: '在线课程', value: totalCourses, change: '+2', icon: BookOpen },
    { label: '服务器负载', value: '34%', change: '-2%', icon: Server },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-2">
         <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
         <span className="text-sm text-gray-500">最后更新: 刚刚</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <stat.icon size={18} className="text-gray-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
              <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'}`}>
                {stat.change} 
                {stat.change.startsWith('+') && <ArrowUpRight size={12}/>}
                <span className="font-normal text-gray-400">较上月</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">用户增长趋势</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={3} fillOpacity={0} fill="transparent" strokeDasharray="5 5"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">用户构成分析</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{typeof totalUsers === 'number' ? (totalUsers / 1000).toFixed(1) + 'K' : '12K'}</span>
                <span className="text-xs text-gray-400 uppercase font-bold">总用户</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;