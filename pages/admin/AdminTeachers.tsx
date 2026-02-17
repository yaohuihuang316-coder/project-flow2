import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  Users, Search, CheckCircle, XCircle, 
  Clock, ChevronDown, ChevronUp, GraduationCap,
  Star, Eye, Plus, Edit2, Trash2, Mail, Phone
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
  status: string;
  created_at: string;
  department?: string;
  job_title?: string;
  total_courses: number;
  total_students: number;
  rating: number;
}

const AdminTeachers: React.FC<AdminTeachersProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'students'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: '', job_title: '', phone: '' });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('app_users')
        .select('*')
        .in('role', ['Manager', 'Editor'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const teachersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: courseCount } = await supabase
            .from('app_courses')
            .select('*', { count: 'exact', head: true })
            .eq('author', profile.name);

          const { data: enrollments } = await supabase
            .from('app_course_enrollments')
            .select('student_id')
            .in('course_id', 
              (await supabase
                .from('app_courses')
                .select('id')
                .eq('author', profile.name)
              ).data?.map(c => c.id) || []
            );

          const uniqueStudents = new Set(enrollments?.map(e => e.student_id)).size;

          return {
            id: profile.id,
            name: profile.name || '未命名',
            email: profile.email || '',
            avatar: profile.avatar,
            phone: profile.phone || '',
            status: profile.status || '正常',
            created_at: profile.created_at,
            department: profile.department,
            job_title: profile.job_title,
            total_courses: courseCount || 0,
            total_students: uniqueStudents,
            rating: 4.5 + Math.random() * 0.5,
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

  const handleAddTeacher = async () => {
    try {
      const { error } = await supabase
        .from('app_users')
        .insert([{
          ...formData,
          id: crypto.randomUUID(),
          role: 'Manager',
          status: '正常',
          subscription_tier: 'free',
          xp: 0,
          streak: 0,
        }]);
      
      if (error) throw error;
      setShowAddModal(false);
      setFormData({ name: '', email: '', department: '', job_title: '', phone: '' });
      fetchTeachers();
    } catch (err) {
      console.error('Failed to add teacher:', err);
      alert('添加失败，请重试');
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      const { error } = await supabase
        .from('app_users')
        .update(formData)
        .eq('id', selectedTeacher.id);
      
      if (error) throw error;
      setShowEditModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (err) {
      console.error('Failed to edit teacher:', err);
      alert('更新失败，请重试');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('确定要删除这位教师吗？')) return;
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', teacherId);
      
      if (error) throw error;
      fetchTeachers();
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      alert('删除失败，请重试');
    }
  };

  const updateTeacherStatus = async (teacherId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ status: newStatus })
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

  const filteredTeachers = teachers
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && t.status === '正常') ||
                           (statusFilter === 'inactive' && t.status !== '正常');
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

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === '正常').length,
    inactive: teachers.filter(t => t.status !== '正常').length,
  };

  const getStatusBadge = (status: string) => {
    if (status === '正常') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> 正常</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"><XCircle size={12} /> 禁用</span>;
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || '',
      job_title: teacher.job_title || '',
      phone: teacher.phone || '',
    });
    setShowEditModal(true);
  };

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_USERS} 
      onNavigate={onNavigate}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              教师管理
            </h1>
            <p className="text-gray-500 mt-1 ml-13">管理教师账号、查看授课统计</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <Plus size={18} />
            添加教师
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">教师总数</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
                <p className="text-sm text-gray-600">正常</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <XCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-sm text-gray-600">禁用</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索教师姓名或邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">全部状态</option>
                <option value="active">正常</option>
                <option value="inactive">禁用</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="created">最近加入</option>
                <option value="name">姓名</option>
                <option value="students">学生数</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无教师数据</p>
              <p className="text-sm mt-1">点击上方"添加教师"按钮添加第一位教师</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">教师信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">部门/职称</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课程/学生</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">评分</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">加入时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={teacher.avatar || `https://i.pravatar.cc/150?u=${teacher.id}`}
                            alt={teacher.name}
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{teacher.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={11} />
                              {teacher.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 font-medium">{teacher.department || '未设置'}</p>
                        <p className="text-xs text-gray-500">{teacher.job_title || '普通教师'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 font-semibold">{teacher.total_courses} 门课程</p>
                          <p className="text-gray-500">{teacher.total_students} 名学生</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Star size={14} className="text-amber-500 fill-amber-500" />
                          <span className="text-sm font-semibold text-gray-900">{teacher.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(teacher.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(teacher.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                          {teacher.status === '正常' ? (
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, '禁用')}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              禁用
                            </button>
                          ) : (
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, '正常')}
                              className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
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

        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {showAddModal ? '添加教师' : '编辑教师'}
                </h2>
                <button 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">部门</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="如：计算机学院"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">职称</label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="如：讲师"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入电话"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={showAddModal ? handleAddTeacher : handleEditTeacher}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  {showAddModal ? '添加' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeachers;
