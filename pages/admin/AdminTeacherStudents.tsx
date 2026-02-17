import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  Users, Search, BookOpen, FileText, 
  Mail, GraduationCap, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  enrolled_courses: number;
  completed_assignments: number;
  attendance_rate: number;
  last_active?: string;
}

interface AdminTeacherStudentsProps {
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const AdminTeacherStudents: React.FC<AdminTeacherStudentsProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const studentsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count: enrolledCount } = await supabase
            .from('app_course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id);

          const { count: completedAssignments } = await supabase
            .from('app_assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id);

          const { data: attendance } = await supabase
            .from('app_attendance')
            .select('status')
            .eq('student_id', profile.id);

          const totalAttendance = attendance?.length || 0;
          const presentAttendance = attendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

          return {
            id: profile.id,
            name: profile.name || profile.email?.split('@')[0] || '未命名',
            email: profile.email || '',
            avatar: profile.avatar,
            created_at: profile.created_at,
            enrolled_courses: enrolledCount || 0,
            completed_assignments: completedAssignments || 0,
            attendance_rate: attendanceRate,
            last_active: profile.last_sign_in_at
          };
        })
      );

      setStudents(studentsWithStats);
    } catch (err) {
      console.error('获取学生失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    const { data: enrollments } = await supabase
      .from('app_course_enrollments')
      .select(`
        *,
        course:course_id (title, teacher_id, teacher:teacher_id (name))
      `)
      .eq('student_id', studentId);
    
    setStudentCourses(enrollments || []);

    const { data: submissions } = await supabase
      .from('app_assignment_submissions')
      .select(`
        *,
        assignment:assignment_id (title, course_id, course:course_id (title))
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });
    
    setStudentAssignments(submissions || []);
  };

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student);
    fetchStudentDetails(student.id);
    setShowDetailModal(true);
  };

  const filteredStudents = students.filter(student => {
    return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.last_active && new Date(s.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    totalEnrollments: students.reduce((sum, s) => sum + s.enrolled_courses, 0),
    avgAttendance: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendance_rate, 0) / students.length) : 0
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
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-teal-600" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          </div>
          <p className="text-gray-500 ml-13">查看所有学生数据及学习进度</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">学生总数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500 mt-1">本周活跃</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-blue-600">{stats.totalEnrollments}</p>
            <p className="text-sm text-gray-500 mt-1">总报名数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-purple-600">{stats.avgAttendance}%</p>
            <p className="text-sm text-gray-500 mt-1">平均出勤率</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索学生姓名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无学生数据</p>
              <p className="text-sm mt-1">数据库中没有找到任何学生</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学生信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">报名课程</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">完成作业</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出勤率</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">最后活跃</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`}
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={11} />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                          <BookOpen size={14} />
                          {student.enrolled_courses} 门
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                          <FileText size={14} />
                          {student.completed_assignments} 份
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                student.attendance_rate >= 80 ? 'bg-green-500' :
                                student.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendance_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-10">{student.attendance_rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(student.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock size={14} />
                          {student.last_active 
                            ? new Date(student.last_active).toLocaleDateString('zh-CN')
                            : '从未'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetail(student)}
                          className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedStudent.avatar || `https://i.pravatar.cc/150?u=${selectedStudent.id}`}
                    alt={selectedStudent.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={12} />
                      {selectedStudent.email}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-5 bg-blue-50 rounded-2xl">
                    <p className="text-2xl font-bold text-blue-600">{selectedStudent.enrolled_courses}</p>
                    <p className="text-xs text-gray-600 mt-1">报名课程</p>
                  </div>
                  <div className="text-center p-5 bg-green-50 rounded-2xl">
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.completed_assignments}</p>
                    <p className="text-xs text-gray-600 mt-1">完成作业</p>
                  </div>
                  <div className="text-center p-5 bg-purple-50 rounded-2xl">
                    <p className="text-2xl font-bold text-purple-600">{selectedStudent.attendance_rate}%</p>
                    <p className="text-xs text-gray-600 mt-1">出勤率</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 已报名课程 */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-blue-600" />
                      已报名课程 ({studentCourses.length})
                    </h3>
                    {studentCourses.length === 0 ? (
                      <p className="text-gray-400 text-sm py-4">暂无报名课程</p>
                    ) : (
                      <div className="space-y-2">
                        {studentCourses.map((enrollment) => (
                          <div key={enrollment.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="font-medium text-gray-900">{enrollment.course?.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">教师: {enrollment.course?.teacher?.name}</p>
                            </div>
                            <span className="text-xs text-gray-400">
                              报名: {new Date(enrollment.enrolled_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 作业提交 */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-green-600" />
                      最近作业提交 ({studentAssignments.length})
                    </h3>
                    {studentAssignments.length === 0 ? (
                      <p className="text-gray-400 text-sm py-4">暂无作业提交</p>
                    ) : (
                      <div className="space-y-2">
                        {studentAssignments.slice(0, 5).map((submission) => (
                          <div key={submission.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="font-medium text-gray-900">{submission.assignment?.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{submission.assignment?.course?.title}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${submission.score !== null ? 'text-green-600' : 'text-gray-400'}`}>
                                {submission.score !== null ? `${submission.score} 分` : '未批改'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(submission.submitted_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeacherStudents;
