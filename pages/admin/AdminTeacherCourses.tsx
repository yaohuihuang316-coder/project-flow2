import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  BookOpen, Search, Edit2, Trash2, 
  CheckCircle, XCircle
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
  // const [showEditModal, setShowEditModal] = useState(false);
  // const [editingCourse, setEditingCourse] = useState<Course | null>(null);

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

      // 获取每门课的学生数
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
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> 已发布</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Edit2 size={12} /> 草稿</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> 已归档</span>;
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={28} />
            教师课程管理
          </h1>
          <p className="text-gray-500 mt-1">查看和管理所有教师创建的课程</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">课程总数</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-gray-500">已发布</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-sm text-gray-500">草稿</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500">总学生数</p>
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
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部教师</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p>暂无课程数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">课程信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">分类/等级</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">学生数</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">价格</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">创建时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {course.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{course.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{course.description?.substring(0, 50)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={course.teacher_avatar || `https://i.pravatar.cc/150?u=${course.teacher_id}`}
                            alt={course.teacher_name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm text-gray-700">{course.teacher_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-700">{course.category || '未分类'}</p>
                          <p className="text-gray-400 text-xs">{course.level || '全部等级'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{course.student_count} 人</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          ¥{course.price || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(course.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={course.status}
                            onChange={(e) => handleUpdateStatus(course.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg"
                          >
                            <option value="draft">草稿</option>
                            <option value="published">发布</option>
                            <option value="archived">归档</option>
                          </select>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
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
