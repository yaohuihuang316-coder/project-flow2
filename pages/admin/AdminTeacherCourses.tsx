import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  BookOpen, Search, Edit2, Trash2, 
  CheckCircle, XCircle, User
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Course {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  student_count: number;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar?: string;
  category: string;
  level: string;
  created_at: string;
  updated_at: string;
}

interface AdminTeacherCoursesProps {
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const AdminTeacherCourses: React.FC<AdminTeacherCoursesProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .eq('role', 'Teacher');
    setTeachers(data || []);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('app_courses')
        .select(`
          *,
          teacher:teacher_id (name, avatar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course: any) => {
          const { count } = await supabase
            .from('app_course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            teacher_name: course.teacher?.name || '未知教师',
            teacher_avatar: course.teacher?.avatar,
            student_count: count || 0
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (err) {
      console.error('获取课程失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('确定要删除这门课程吗？此操作不可恢复！')) return;
    
    try {
      const { error } = await supabase
        .from('app_courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const handleUpdateStatus = async (courseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('app_courses')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', courseId);
      
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      alert('更新失败: ' + (err as Error).message);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesTeacher = teacherFilter === 'all' || course.teacher_id === teacherFilter;
    return matchesSearch && matchesStatus && matchesTeacher;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> 已发布</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"><Edit2 size={12} /> 草稿</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"><XCircle size={12} /> 已归档</span>;
      default:
        return null;
    }
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalStudents: courses.reduce((sum, c) => sum + c.student_count, 0)
  };

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_USERS} 
      onNavigate={onNavigate}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">教师课程管理</h1>
          </div>
          <p className="text-gray-500 ml-13">查看和管理所有教师创建的课程</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">课程总数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-gray-500 mt-1">已发布</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-sm text-gray-500 mt-1">草稿</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 mt-1">总学生数</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索课程或教师..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[140px]"
              >
                <option value="all">全部教师</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无课程数据</p>
              <p className="text-sm mt-1">数据库中没有找到任何课程</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课程信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学生</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">价格</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {course.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{course.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{course.description || '暂无描述'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={course.teacher_avatar || `https://i.pravatar.cc/150?u=${course.teacher_id}`}
                            alt={course.teacher_name}
                            className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                          />
                          <span className="text-sm text-gray-700 font-medium">{course.teacher_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{course.category || '未分类'}</span>
                          <p className="text-gray-400 text-xs mt-1">{course.level || '全部等级'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{course.student_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          ¥{course.price || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={course.status}
                            onChange={(e) => handleUpdateStatus(course.id, e.target.value)}
                            className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <option value="draft">草稿</option>
                            <option value="published">发布</option>
                            <option value="archived">归档</option>
                          </select>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherCourses;
