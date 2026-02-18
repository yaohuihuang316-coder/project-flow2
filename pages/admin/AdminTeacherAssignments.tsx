import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { Search, Plus, FileText, BookOpen, Clock, User, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Assignment {
  id: string;
  title: string;
  content: string;
  course_id: string;
  course_title: string;
  teacher_id: string;
  teacher_name: string;
  deadline: string;
  max_score: number;
  status: string;
  submitted_count: number;
  created_at: string;
}

interface AdminTeacherAssignmentsProps {
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const AdminTeacherAssignments: React.FC<AdminTeacherAssignmentsProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    course_id: '', 
    max_score: 100,
    deadline: '',
    status: 'pending'
  });
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from('app_courses').select('id, title');
    setCourses(data || []);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取作业失败:', error);
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 获取关联数据
      const coursesData = await supabase.from('app_courses').select('id, title');
      const teachersData = await supabase.from('app_users').select('id, name').in('role', ['Manager', 'Editor']);

      const assignmentsWithDetails = (data || []).map((assignment: any) => {
        const course = coursesData.data?.find(c => c.id === assignment.course_id);
        const teacher = teachersData.data?.find(t => t.id === assignment.teacher_id);
        return {
          ...assignment,
          course_title: course?.title || '未知课程',
          teacher_name: teacher?.name || '未知教师',
        };
      });

      setAssignments(assignmentsWithDetails);
    } catch (err) {
      console.error('获取作业失败:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        id: editingAssignment?.id || crypto.randomUUID(),
        teacher_id: currentUser?.id,
        submitted_count: editingAssignment?.submitted_count || 0,
      };

      if (editingAssignment) {
        await supabase.from('app_assignments').update(payload).eq('id', editingAssignment.id);
      } else {
        await supabase.from('app_assignments').insert([payload]);
      }
      
      setIsModalOpen(false);
      setEditingAssignment(null);
      setFormData({ title: '', content: '', course_id: '', max_score: 100, deadline: '', status: 'pending' });
      fetchAssignments();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除此作业吗？')) return;
    
    try {
      await supabase.from('app_assignments').delete().eq('id', assignmentId);
      fetchAssignments();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      content: assignment.content || '',
      course_id: assignment.course_id || '',
      max_score: assignment.max_score || 100,
      deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : '',
      status: assignment.status || 'pending',
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAssignment(null);
    setFormData({ title: '', content: '', course_id: '', max_score: 100, deadline: '', status: 'pending' });
    setIsModalOpen(true);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       assignment.course_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || assignment.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'grading': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'pending': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'grading': return '批改中';
      case 'pending': return '进行中';
      default: return status;
    }
  };

  const statuses = ['All', 'pending', 'grading', 'completed'];

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_TEACHER_ASSIGNMENTS} 
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
                placeholder="搜索作业或课程..."
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
                  {status === 'All' ? '全部' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={18} /> 添加作业
          </button>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
          ) : filteredAssignments.length > 0 ? filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              onClick={() => openEditModal(assignment)}
              className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${assignment.status === 'completed' ? 'bg-green-500' : assignment.status === 'grading' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
              <div className="flex items-center gap-5 pl-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{assignment.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{assignment.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1 text-blue-600"><BookOpen size={10} /> {assignment.course_title}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><User size={10} /> {assignment.teacher_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><CheckCircle size={14} /> {assignment.max_score}分</span>
                  <span className={`flex items-center gap-1 ${new Date(assignment.deadline) < new Date() ? 'text-red-500' : ''}`}>
                    <Clock size={14} /> {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(assignment.status)}`}>
                  {getStatusText(assignment.status)}
                </div>
                <button 
                  onClick={(e) => handleDelete(assignment.id, e)} 
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold">暂无作业</p>
              <p className="text-sm text-gray-500 mt-1">点击上方按钮添加作业</p>
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
                  {editingAssignment ? '编辑作业' : '添加作业'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">作业标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入作业标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">作业内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    placeholder="请输入作业内容"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">所属课程</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择课程</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">满分</label>
                    <input
                      type="number"
                      value={formData.max_score}
                      onChange={(e) => setFormData({...formData, max_score: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">截止时间</label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                    <option value="pending">进行中</option>
                    <option value="grading">批改中</option>
                    <option value="completed">已完成</option>
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
                  {editingAssignment ? '保存' : '添加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherAssignments;
