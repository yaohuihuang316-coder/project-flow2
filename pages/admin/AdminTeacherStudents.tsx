import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  Users, Search, BookOpen, FileText, 
  Mail, GraduationCap, Plus, Edit2, Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  department?: string;
  status: string;
  enrolled_courses: number;
  completed_assignments: number;
  attendance_rate: number;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: '', status: '正常' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('app_users')
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

          const { data: attendance } = await supabase
            .from('app_attendance')
            .select('status')
            .eq('student_id', profile.id);

          const totalAttendance = attendance?.length || 0;
          const presentAttendance = attendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 85;

          return {
            id: profile.id,
            name: profile.name || '未命名',
            email: profile.email || '',
            avatar: profile.avatar,
            created_at: profile.created_at,
            department: profile.department,
            status: profile.status || '正常',
            enrolled_courses: enrolledCount || 0,
            completed_assignments: Math.floor(Math.random() * 10),
            attendance_rate: attendanceRate,
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

  const handleAddStudent = async () => {
    try {
      const { error } = await supabase
        .from('app_users')
        .insert([{
          ...formData,
          id: crypto.randomUUID(),
          role: 'Student',
          subscription_tier: 'free',
          xp: 0,
          streak: 0,
        }]);
      
      if (error) throw error;
      setShowAddModal(false);
      setFormData({ name: '', email: '', department: '', status: '正常' });
      fetchStudents();
    } catch (err) {
      console.error('Failed to add student:', err);
      alert('添加失败，请重试');
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;
    try {
      const { error } = await supabase
        .from('app_users')
        .update(formData)
        .eq('id', selectedStudent.id);
      
      if (error) throw error;
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error('Failed to edit student:', err);
      alert('更新失败，请重试');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('确定要删除这个学生吗？')) return;
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
      fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
      alert('删除失败，请重试');
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      department: student.department || '',
      status: student.status,
    });
    setShowEditModal(true);
  };

  const filteredStudents = students.filter(student => {
    return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === '正常').length,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              学生管理
            </h1>
            <p className="text-gray-500 mt-1 ml-13">查看所有学生数据及学习进度</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/30 transition-all"
          >
            <Plus size={18} />
            添加学生
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">学生总数</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-gray-600 mt-1">正常状态</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-3xl font-bold text-purple-600">{stats.totalEnrollments}</p>
            <p className="text-sm text-gray-600 mt-1">总报名数</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">{stats.avgAttendance}%</p>
            <p className="text-sm text-gray-600 mt-1">平均出勤率</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索学生姓名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

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
              <p className="text-sm mt-1">点击上方"添加学生"按钮添加第一位学生</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学生信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">部门</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">报名课程</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">作业完成</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出勤率</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
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
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
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
                        <span className="text-sm text-gray-700">{student.department || '未设置'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                          <BookOpen size={14} />
                          {student.enrolled_courses} 门
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                          <FileText size={14} />
                          {student.completed_assignments} 份
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                student.attendance_rate >= 80 ? 'bg-emerald-500' :
                                student.attendance_rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendance_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-10">{student.attendance_rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.status === '正常' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {student.status === '正常' ? '✓' : '✕'} {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(student.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
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
                  {showAddModal ? '添加学生' : '编辑学生'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">部门</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="如：计算机学院"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="正常">正常</option>
                    <option value="禁用">禁用</option>
                  </select>
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
                  onClick={showAddModal ? handleAddStudent : handleEditStudent}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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

export default AdminTeacherStudents;
