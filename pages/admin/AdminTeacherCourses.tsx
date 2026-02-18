import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { Search, Plus, BookOpen, User, Eye, Trash2, Loader2, Clock } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    author: '', 
    category: 'Foundation', 
    duration: '', 
    status: 'Draft' 
  });

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

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        id: editingCourse?.id || crypto.randomUUID(),
        views: editingCourse?.views || 0,
        chapters: [],
        resources: [],
      };

      if (editingCourse) {
        await supabase.from('app_courses').update(payload).eq('id', editingCourse.id);
      } else {
        await supabase.from('app_courses').insert([payload]);
      }
      
      setIsModalOpen(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', author: '', category: 'Foundation', duration: '', status: 'Draft' });
      fetchCourses();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除此课程吗？')) return;
    
    try {
      await supabase.from('app_courses').delete().eq('id', courseId);
      fetchCourses();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      author: course.author || '',
      category: course.category || 'Foundation',
      duration: course.duration || '',
      status: course.status,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ title: '', description: '', author: '', category: 'Foundation', duration: '', status: 'Draft' });
    setIsModalOpen(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (course.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || course.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-50 text-green-700 border-green-200';
      case 'Draft': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'Review': return 'bg-orange-50 text-orange-600 border-orange-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const statuses = ['All', 'Published', 'Draft', 'Review'];

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_TEACHER_COURSES} 
      onNavigate={onNavigate}
      currentUser={currentUser}
      onLogout={onLogout}
    >
      <div className="space-y-4 animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索课程或教师..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {statuses.map(status => (
                <button 
                  key={status} 
                  onClick={() => setFilterStatus(status)} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {status === 'All' ? '全部' : status}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={18} /> 添加课程
          </button>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
          ) : filteredCourses.length > 0 ? filteredCourses.map(course => (
            <div
              key={course.id}
              onClick={() => openEditModal(course)}
              className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${course.status === 'Published' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-5 pl-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{course.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{course.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1"><User size={10} /> {course.author || '未知'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{course.category || '未分类'}</span>
                    {course.duration && <span className="flex items-center gap-1"><Clock size={10} /> {course.duration}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><User size={14} /> {course.student_count}</span>
                  <span className="flex items-center gap-1"><Eye size={14} /> {(course.views || 0).toLocaleString()}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(course.status)}`}>
                  {course.status}
                </div>
                <button 
                  onClick={(e) => handleDelete(course.id, e)} 
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold">暂无课程</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                立即添加
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCourse ? '编辑课程' : '添加课程'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
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
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入课程名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">课程描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="教师姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">时长</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Draft">草稿</option>
                      <option value="Published">已发布</option>
                      <option value="Review">审核中</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  {editingCourse ? '保存' : '添加'}
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
