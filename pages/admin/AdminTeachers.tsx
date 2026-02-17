import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  Users, Search, CheckCircle, XCircle, 
  Clock, ChevronDown, ChevronUp, GraduationCap,
  Star, X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface AdminTeachersProps {
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  bio?: string;
  title?: string;
  total_courses: number;
  total_students: number;
  rating: number;
}

const AdminTeachers: React.FC<AdminTeachersProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'students'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 获取教师列表
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // 获取教师基本信息
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Teacher')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 获取每个教师的统计信息
      const teachersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // 获取课程数量
          const { count: courseCount } = await supabase
            .from('app_courses')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', profile.id);

          // 获取学生总数（通过课程注册）
          const { data: enrollments } = await supabase
            .from('app_course_enrollments')
            .select('student_id')
            .in('course_id', 
              (await supabase
                .from('app_courses')
                .select('id')
                .eq('teacher_id', profile.id)
              ).data?.map(c => c.id) || []
            );

          const uniqueStudents = new Set(enrollments?.map(e => e.student_id)).size;

          return {
            id: profile.id,
            name: profile.name || profile.email?.split('@')[0] || '未命名',
            email: profile.email || '',
            avatar: profile.avatar,
            phone: profile.phone,
            status: (profile.is_active !== false ? 'active' : 'inactive') as 'active' | 'inactive',
            created_at: profile.created_at,
            bio: profile.bio,
            title: profile.title,
            total_courses: courseCount || 0,
            total_students: uniqueStudents,
            rating: 4.5 + Math.random() * 0.5, // 模拟评分，后续可真实计算
          };
        })
      );

      setTeachers(teachersWithStats);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  // 更新教师状态
  const updateTeacherStatus = async (teacherId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus === 'active' })
        .eq('id', teacherId);

      if (error) throw error;

      setTeachers(prev => prev.map(t => 
        t.id === teacherId ? { ...t, status: newStatus } : t
      ));
    } catch (err) {
      console.error('Failed to update teacher status:', err);
      alert('更新状态失败，请重试');
    }
  };

  // 过滤和排序
  const filteredTeachers = teachers
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'students':
          comparison = a.total_students - b.total_students;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 统计数据
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === 'active').length,
    inactive: teachers.filter(t => t.status === 'inactive').length,
    pending: teachers.filter(t => t.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> 正常</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle size={12} /> 禁用</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> 待审核</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_USERS} 
      onNavigate={onNavigate}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={28} />
            教师管理
          </h1>
          <p className="text-gray-500 mt-1">管理教师账号、查看授课统计</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">教师总数</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">正常</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            <p className="text-sm text-gray-500">禁用</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">待审核</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索教师姓名或邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="active">正常</option>
                <option value="inactive">禁用</option>
                <option value="pending">待审核</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="created">最近加入</option>
                <option value="name">姓名</option>
                <option value="students">学生数</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p>暂无教师数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">职称</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">课程/学生</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">评分</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">加入时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={teacher.avatar || `https://i.pravatar.cc/150?u=${teacher.id}`}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{teacher.title || '普通教师'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{teacher.total_courses} 门课程</p>
                          <p className="text-gray-500">{teacher.total_students} 名学生</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{teacher.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(teacher.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(teacher.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            详情
                          </button>
                          {teacher.status === 'active' ? (
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, 'inactive')}
                              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              禁用
                            </button>
                          ) : (
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, 'active')}
                              className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              启用
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedTeacher && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">教师详情</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={selectedTeacher.avatar || `https://i.pravatar.cc/150?u=${selectedTeacher.id}`}
                    alt={selectedTeacher.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedTeacher.name}</h3>
                    <p className="text-gray-500">{selectedTeacher.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedTeacher.status)}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {selectedTeacher.title || '普通教师'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <p className="text-2xl font-bold text-blue-600">{selectedTeacher.total_courses}</p>
                    <p className="text-xs text-gray-500 mt-1">课程数</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <p className="text-2xl font-bold text-green-600">{selectedTeacher.total_students}</p>
                    <p className="text-xs text-gray-500 mt-1">学生数</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <p className="text-2xl font-bold text-yellow-600">{selectedTeacher.rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 mt-1">评分</p>
                  </div>
                </div>

                {selectedTeacher.bio && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">个人简介</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">{selectedTeacher.bio}</p>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>加入时间：{new Date(selectedTeacher.created_at).toLocaleString('zh-CN')}</p>
                  {selectedTeacher.phone && <p>联系电话：{selectedTeacher.phone}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeachers;
