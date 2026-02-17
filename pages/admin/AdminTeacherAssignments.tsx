import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  FileText, Search, Trash2, 
  Clock, BookOpen, Users, Plus, Edit2, CheckCircle
} from 'lucide-react';
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
  total_count: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name')
      .in('role', ['Manager', 'Editor']);
    setTeachers(data || []);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('app_courses')
      .select('id, title');
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
        return;
      }

      const assignmentsWithDetails = (data || []).map((assignment: any) => {
        const course = courses.find(c => c.id === assignment.course_id);
        const teacher = teachers.find(t => t.id === assignment.teacher_id);
        return {
          ...assignment,
          course_title: course?.title || '未知课程',
          teacher_name: teacher?.name || '未知教师',
        };
      });

      setAssignments(assignmentsWithDetails as Assignment[]);
    } catch (err) {
      console.error('获取作业失败:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('确定要删除这个作业吗？')) return;
    
    try {
      const { error } = await supabase
        .from('app_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      fetchAssignments();
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    return assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           assignment.course_title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    grading: assignments.filter(a => a.status === 'grading').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> 已完成</span>;
      case 'grading':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"><Edit2 size={12} /> 批改中</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"><Clock size={12} /> 进行中</span>;
    }
  };

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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              教师作业管理
            </h1>
            <p className="text-gray-500 mt-1 ml-13">查看和管理所有教师布置的作业</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Plus size={18} />
            添加作业
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">作业总数</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">进行中</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">{stats.grading}</p>
            <p className="text-sm text-gray-600 mt-1">批改中</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-sm text-gray-600 mt-1">已完成</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索作业或课程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无作业数据</p>
              <p className="text-sm mt-1">作业功能需要关联 auth.users 表，请联系管理员配置</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">作业信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">所属课程</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">截止日</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">满分</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{assignment.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{assignment.content || '暂无描述'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                          <BookOpen size={14} />
                          {assignment.course_title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">{assignment.teacher_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          new Date(assignment.deadline) < new Date() ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          <Clock size={14} />
                          {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{assignment.max_score} 分</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(assignment.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(assignment.id)}
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">提示</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>作业功能需要关联 auth.users 表</p>
                <p className="text-sm mt-2">请联系管理员在 Supabase 中配置外键约束</p>
              </div>
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
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
