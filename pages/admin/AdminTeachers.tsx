import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { Search, Plus, GraduationCap, Mail, BookOpen, Trash2, Loader2, Users } from 'lucide-react';
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
  status: string;
  department?: string;
  job_title?: string;
  created_at: string;
  total_courses: number;
  total_students: number;
}

const AdminTeachers: React.FC<AdminTeachersProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    department: '', 
    job_title: '', 
    status: '正常' 
  });

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
              (await supabase.from('app_courses').select('id').eq('author', profile.name)).data?.map(c => c.id) || []
            );

          const uniqueStudents = new Set(enrollments?.map(e => e.student_id)).size;

          return {
            id: profile.id,
            name: profile.name || '未命名',
            email: profile.email || '',
            avatar: profile.avatar,
            status: profile.status || '正常',
            department: profile.department,
            job_title: profile.job_title,
            created_at: profile.created_at,
            total_courses: courseCount || 0,
            total_students: uniqueStudents,
          };
        })
      );

      setTeachers(teachersWithStats);
    } catch (err) {
      console.error('获取教师失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        id: editingTeacher?.id || crypto.randomUUID(),
        role: 'Manager',
        subscription_tier: 'free',
        xp: 0,
        streak: 0,
      };

      if (editingTeacher) {
        await supabase.from('app_users').update(payload).eq('id', editingTeacher.id);
      } else {
        await supabase.from('app_users').insert([payload]);
      }
      
      setIsModalOpen(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '', department: '', job_title: '', status: '正常' });
      fetchTeachers();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (teacherId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除此教师吗？')) return;
    
    try {
      await supabase.from('app_users').delete().eq('id', teacherId);
      fetchTeachers();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || '',
      job_title: teacher.job_title || '',
      status: teacher.status,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', department: '', job_title: '', status: '正常' });
    setIsModalOpen(true);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || teacher.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '正常': return 'bg-green-50 text-green-700 border-green-200';
      case '禁用': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const statuses = ['All', '正常', '禁用'];

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_USERS} 
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
                placeholder="搜索教师姓名、邮箱..."
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
            <Plus size={18} /> 添加教师
          </button>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
          ) : filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
            <div
              key={teacher.id}
              onClick={() => openEditModal(teacher)}
              className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${teacher.status === '正常' ? 'bg-blue-500' : 'bg-red-400'}`}></div>
              <div className="flex items-center gap-5 pl-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <GraduationCap size={20} className="text-blue-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{teacher.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{teacher.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1"><Mail size={10} /> {teacher.email}</span>
                    {teacher.department && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{teacher.department}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {teacher.total_courses} 课程</span>
                  <span className="flex items-center gap-1"><Users size={14} /> {teacher.total_students} 学生</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(teacher.status)}`}>
                  {teacher.status}
                </div>
                <button 
                  onClick={(e) => handleDelete(teacher.id, e)} 
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <GraduationCap size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold">暂无教师</p>
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
                  {editingTeacher ? '编辑教师' : '添加教师'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="如：计算机学院"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">职称</label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="如：讲师"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="正常">正常</option>
                    <option value="禁用">禁用</option>
                  </select>
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
                  {editingTeacher ? '保存' : '添加'}
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
