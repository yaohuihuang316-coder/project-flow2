import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  FileText, Search, Trash2, 
  Clock, BookOpen
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

      // 获取提交统计
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-purple-600" size={28} />
            教师作业管理
          </h1>
          <p className="text-gray-500 mt-1">查看和管理所有教师布置的作业</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">作业总数</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-gray-500">总提交数</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{stats.totalGraded}</p>
            <p className="text-sm text-gray-500">已批改</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-gray-500">逾期未交</p>
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
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部课程</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
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
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>暂无作业数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">作业信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">所属课程</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">截止日</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">提交/批改</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">满分</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{assignment.description?.substring(0, 40)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-blue-600 flex items-center gap-1">
                          <BookOpen size={14} />
                          {assignment.course_title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{assignment.teacher_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm flex items-center gap-1 ${
                          new Date(assignment.deadline) < new Date() ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <Clock size={14} />
                          {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">{assignment.submitted_count}</span>
                          <span className="text-gray-400"> 提交 / </span>
                          <span className="font-medium text-green-600">{assignment.graded_count}</span>
                          <span className="text-gray-400"> 批改</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${getSubmissionRate(assignment.graded_count, assignment.submitted_count)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{assignment.total_score} 分</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(assignment)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            查看提交
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
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

        {/* Detail Modal */}
        {showDetailModal && selectedAssignment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold">作业提交详情</h2>
                  <p className="text-sm text-gray-500">{selectedAssignment.title}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {submissions.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">暂无提交记录</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub: any) => (
                      <div key={sub.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={sub.student?.avatar || `https://i.pravatar.cc/150?u=${sub.student_id}`}
                            alt={sub.student?.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{sub.student?.name || '未知学生'}</p>
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
                            <p className="text-xs text-gray-500">{sub.feedback}</p>
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
