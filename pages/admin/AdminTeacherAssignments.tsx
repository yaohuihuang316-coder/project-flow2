import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  FileText, Search, Trash2, 
  Clock, BookOpen, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  course_title: string;
  teacher_id: string;
  teacher_name: string;
  deadline: string;
  total_score: number;
  submitted_count: number;
  graded_count: number;
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
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchCourses();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'Teacher');
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
      const { data: assignmentsData, error } = await supabase
        .from('app_assignments')
        .select(`
          *,
          course:course_id (title),
          teacher:teacher_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assignmentsWithStats = await Promise.all(
        (assignmentsData || []).map(async (assignment: any) => {
          const { count: submittedCount } = await supabase
            .from('app_assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);

          const { count: gradedCount } = await supabase
            .from('app_assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id)
            .not('score', 'is', null);

          return {
            ...assignment,
            course_title: assignment.course?.title || '未知课程',
            teacher_name: assignment.teacher?.name || '未知教师',
            submitted_count: submittedCount || 0,
            graded_count: gradedCount || 0
          };
        })
      );

      setAssignments(assignmentsWithStats);
    } catch (err) {
      console.error('获取作业失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    const { data } = await supabase
      .from('app_assignment_submissions')
      .select(`
        *,
        student:student_id (name, avatar)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    setSubmissions(data || []);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('确定要删除这个作业吗？所有提交记录也会被删除！')) return;
    
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

  const handleViewDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    fetchSubmissions(assignment.id);
    setShowDetailModal(true);
  };

  const getSubmissionRate = (submitted: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((submitted / total) * 100);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.course_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeacher = teacherFilter === 'all' || assignment.teacher_id === teacherFilter;
    const matchesCourse = courseFilter === 'all' || assignment.course_id === courseFilter;
    return matchesSearch && matchesTeacher && matchesCourse;
  });

  const stats = {
    total: assignments.length,
    totalSubmissions: assignments.reduce((sum, a) => sum + a.submitted_count, 0),
    totalGraded: assignments.reduce((sum, a) => sum + a.graded_count, 0),
    overdue: assignments.filter(a => new Date(a.deadline) < new Date() && a.submitted_count === 0).length
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
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="text-purple-600" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">教师作业管理</h1>
          </div>
          <p className="text-gray-500 ml-13">查看和管理所有教师布置的作业</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">作业总数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-blue-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-500 mt-1">总提交数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-green-600">{stats.totalGraded}</p>
            <p className="text-sm text-gray-500 mt-1">已批改</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-gray-500 mt-1">逾期未交</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索作业或课程..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
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
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[140px]"
              >
                <option value="all">全部课程</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
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
              <p className="text-sm mt-1">数据库中没有找到任何作业</p>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交/批改</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">满分</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{assignment.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{assignment.description || '暂无描述'}</p>
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
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-blue-600">{assignment.submitted_count}</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-semibold text-green-600">{assignment.graded_count}</span>
                            <span className="text-gray-500 text-xs">已批改</span>
                          </div>
                          <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                              style={{ width: `${getSubmissionRate(assignment.graded_count, assignment.submitted_count)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{assignment.total_score} 分</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(assignment)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            查看提交
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Detail Modal */}
        {showDetailModal && selectedAssignment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">作业提交详情</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedAssignment.title}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {submissions.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users size={28} className="text-gray-300" />
                    </div>
                    <p>暂无提交记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <img 
                            src={sub.student?.avatar || `https://i.pravatar.cc/150?u=${sub.student_id}`}
                            alt={sub.student?.name}
                            className="w-10 h-10 rounded-full ring-2 ring-white"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{sub.student?.name || '未知学生'}</p>
                            <p className="text-xs text-gray-500">
                              提交时间: {new Date(sub.submitted_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${sub.score !== null ? 'text-green-600' : 'text-gray-400'}`}>
                            {sub.score !== null ? `${sub.score} 分` : '未批改'}
                          </p>
                          {sub.feedback && (
                            <p className="text-xs text-gray-500 max-w-[200px] truncate">{sub.feedback}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherAssignments;
