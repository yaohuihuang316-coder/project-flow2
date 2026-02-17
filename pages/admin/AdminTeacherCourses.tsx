import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  BookOpen, Search, Edit2, Trash2, 
  CheckCircle, XCircle, User, Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  author: string;
  student_count: number;
  category: string;
  duration: string;
  views: number;
  rating: number;
  image?: string;
  created_at: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', author: '', category: 'Foundation', duration: '', status: 'Draft' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('app_courses')
        .select('*')
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

  const handleAddCourse = async () => {
    try {
      const { error } = await supabase
        .from('app_courses')
        .insert([{
          id: crypto.randomUUID(),
          ...formData,
          views: 0,
          rating: 4.5,
          chapters: [],
          resources: [],
        }]);
      
      if (error) throw error;
      setShowAddModal(false);
      setFormData({ title: '', description: '', author: '', category: 'Foundation', duration: '', status: 'Draft' });
      fetchCourses();
    } catch (err) {
      console.error('Failed to add course:', err);
      alert('添加失败，请重试');
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse) return;
    try {
      const { error } = await supabase
        .from('app_courses')
        .update(formData)
        .eq('id', selectedCourse.id);
      
      if (error) throw error;
      setShowEditModal(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (err) {
      console.error('Failed to edit course:', err);
      alert('更新失败，请重试');
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
        .update({ status: newStatus })
        .eq('id', courseId);
      
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      alert('更新失败: ' + (err as Error).message);
    }
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      author: course.author || '',
      category: course.category || 'Foundation',
      duration: course.duration || '',
      status: course.status,
    });
    setShowEditModal(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> 已发布</span>;
      case 'Draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"><Edit2 size={12} /> 草稿</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium"><XCircle size={12} /> {status}</span>;
    }
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'Published').length,
    draft: courses.filter(c => c.status === 'Draft').length,
    totalStudents: courses.reduce((sum, c) => sum + c.student_count, 0)
  };

  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_USERS} 
      onNavigate={onNavigate}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BookOpen className="text-white" size={20} />
              </div>
              教师课程管理
            </h1>
            <p className="text-gray-500 mt-1 ml-13">查看和管理所有教师创建的课程</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Plus size={18} />
            添加课程
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">课程总数</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">{stats.published}</p>
            <p className="text-sm text-gray-600 mt-1">已发布</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">{stats.draft}</p>
            <p className="text-sm text-gray-600 mt-1">草稿</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
            <p className="text-sm text-gray-600 mt-1">总学生数</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索课程或教师..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
              >
                <option value="all">全部分类</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
              >
                <option value="all">全部状态</option>
                <option value="Published">已发布</option>
                <option value="Draft">草稿</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无课程数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课程信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">分类/时长</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学生/浏览</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">评分</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {course.title.charAt(0)}
                          </div>
                          <div className="max-w-[200px]">
                            <p className="font-semibold text-gray-900 truncate">{course.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{course.description || '暂无描述'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">{course.author || '未知'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{course.category || '未分类'}</span>
                          <p className="text-gray-400 text-xs mt-1">{course.duration || '未知'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 font-semibold flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            {course.student_count}
                          </p>
                          <p className="text-gray-400 text-xs">{course.views} 浏览</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{course.rating?.toFixed(1) || '4.5'}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(course.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <select
                            value={course.status}
                            onChange={(e) => handleUpdateStatus(course.id, e.target.value)}
                            className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <option value="Draft">草稿</option>
                            <option value="Published">发布</option>
                          </select>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {showAddModal ? '添加课程' : '编辑课程'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">课程名称 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入课程名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">课程描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    placeholder="请输入课程描述"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">授课教师</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="教师姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">时长</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="如：10小时"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Foundation">Foundation</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Course">Course</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Draft">草稿</option>
                      <option value="Published">已发布</option>
                    </select>
                  </div>
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
                  onClick={showAddModal ? handleAddCourse : handleEditCourse}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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

export default AdminTeacherCourses;
