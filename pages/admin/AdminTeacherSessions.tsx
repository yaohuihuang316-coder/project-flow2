import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { Search, Plus, Clock, Calendar, BookOpen, User, Users, MapPin, Trash2, Loader2, CheckCircle, Play } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface ClassSession {
  id: string;
  course_id: string;
  course_title: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: string;
  location?: string;
  max_students: number;
  checkin_code?: string;
  attendance_count: number;
  created_at: string;
}

interface AdminTeacherSessionsProps {
  onNavigate: (page: Page, param?: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const AdminTeacherSessions: React.FC<AdminTeacherSessionsProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    course_id: '', 
    scheduled_start: '',
    scheduled_end: '',
    location: '',
    max_students: 50,
    status: 'upcoming'
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from('app_courses').select('id, title');
    setCourses(data || []);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: sessionsData, error } = await supabase
        .from('app_class_sessions')
        .select('*')
        .order('scheduled_start', { ascending: false });

      if (error) throw error;

      const coursesData = await supabase.from('app_courses').select('id, title');
      const teachersData = await supabase.from('app_users').select('id, name').in('role', ['Manager', 'Editor']);

      const formattedSessions = (sessionsData || []).map((session: any) => {
        const course = coursesData.data?.find(c => c.id === session.course_id);
        const teacher = teachersData.data?.find(t => t.id === session.teacher_id);
        return {
          ...session,
          course_title: course?.title || '未知课程',
          teacher_name: teacher?.name || '未知教师'
        };
      });

      setSessions(formattedSessions);
    } catch (err) {
      console.error('获取课堂失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (sessionId: string) => {
    const { data } = await supabase
      .from('app_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .order('check_in_time', { ascending: true });
    
    if (data && data.length > 0) {
      const studentIds = data.map(a => a.student_id);
      const { data: studentsData } = await supabase
        .from('app_users')
        .select('id, name, avatar')
        .in('id', studentIds);
      
      const attendanceWithStudents = data.map(a => {
        const student = studentsData?.find(s => s.id === a.student_id);
        return { ...a, student: student || { name: '未知学生', avatar: null } };
      });
      
      setAttendance(attendanceWithStudents);
    } else {
      setAttendance([]);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        id: editingSession?.id || crypto.randomUUID(),
        teacher_id: currentUser?.id,
      };

      if (editingSession) {
        await supabase.from('app_class_sessions').update(payload).eq('id', editingSession.id);
      } else {
        await supabase.from('app_class_sessions').insert([payload]);
      }
      
      setIsModalOpen(false);
      setEditingSession(null);
      setFormData({ title: '', course_id: '', scheduled_start: '', scheduled_end: '', location: '', max_students: 50, status: 'upcoming' });
      fetchSessions();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除此课堂吗？')) return;
    
    try {
      await supabase.from('app_class_sessions').delete().eq('id', sessionId);
      fetchSessions();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'ongoing') updates.actual_start = new Date().toISOString();
      if (newStatus === 'completed') updates.actual_end = new Date().toISOString();
      
      await supabase.from('app_class_sessions').update(updates).eq('id', sessionId);
      fetchSessions();
    } catch (err) {
      alert('更新失败');
    }
  };

  const openAttendanceModal = async (session: ClassSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSession(session);
    await fetchAttendance(session.id);
    setShowAttendanceModal(true);
  };

  const openEditModal = (session: ClassSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      course_id: session.course_id || '',
      scheduled_start: session.scheduled_start ? new Date(session.scheduled_start).toISOString().slice(0, 16) : '',
      scheduled_end: session.scheduled_end ? new Date(session.scheduled_end).toISOString().slice(0, 16) : '',
      location: session.location || '',
      max_students: session.max_students || 50,
      status: session.status,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSession(null);
    setFormData({ title: '', course_id: '', scheduled_start: '', scheduled_end: '', location: '', max_students: 50, status: 'upcoming' });
    setIsModalOpen(true);
  };

  const filteredSessions = sessions.filter(session => {
    const matchSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       session.course_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || session.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ongoing': return 'bg-green-50 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '待开始';
      case 'ongoing': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const statuses = ['All', 'upcoming', 'ongoing', 'completed'];

  return (
    <AdminLayout 
      currentPage={Page.ADMIN_TEACHER_SESSIONS} 
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
                placeholder="搜索课堂或课程..."
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
            <Plus size={18} /> 添加课堂
          </button>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
          ) : filteredSessions.length > 0 ? filteredSessions.map(session => (
            <div
              key={session.id}
              onClick={() => openEditModal(session)}
              className="group bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${session.status === 'ongoing' ? 'bg-green-500' : session.status === 'completed' ? 'bg-gray-400' : 'bg-blue-400'}`}></div>
              <div className="flex items-center gap-5 pl-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{session.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{session.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1 text-blue-600"><BookOpen size={10} /> {session.course_title}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><User size={10} /> {session.teacher_name}</span>
                    {session.location && <span className="flex items-center gap-1"><MapPin size={10} /> {session.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end pl-3 sm:pl-0">
                <div className="text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.scheduled_start).toLocaleDateString('zh-CN')}</span>
                </div>
                {session.checkin_code && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">
                    {session.checkin_code}
                  </span>
                )}
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusStyle(session.status)}`}>
                  {getStatusText(session.status)}
                </div>
                {/* Quick Actions */}
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {session.status === 'upcoming' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(session.id, 'ongoing'); }}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                      title="开始"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  {session.status === 'ongoing' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(session.id, 'completed'); }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="结束"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => openAttendanceModal(session, e)}
                    className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  >
                    考勤
                  </button>
                  <button 
                    onClick={(e) => handleDelete(session.id, e)} 
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Clock size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold">暂无课堂</p>
              <p className="text-sm text-gray-500 mt-1">点击上方按钮添加课堂</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                立即添加
              </button>
            </div>
          )}
        </div>

        {/* Session Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSession ? '编辑课堂' : '添加课堂'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">课堂标题 *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="如：第1章 项目管理基础" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">所属课程</label>
                  <select value={formData.course_id} onChange={(e) => setFormData({...formData, course_id: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value="">选择课程</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">开始时间</label>
                    <input type="datetime-local" value={formData.scheduled_start} onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">结束时间</label>
                    <input type="datetime-local" value={formData.scheduled_end} onChange={(e) => setFormData({...formData, scheduled_end: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">地点</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="如：A101" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">容量</label>
                    <input type="number" value={formData.max_students} onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">取消</button>
                <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800">{editingSession ? '保存' : '添加'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Modal */}
        {showAttendanceModal && selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">考勤记录</h2>
                  <p className="text-sm text-gray-500">{selectedSession.title}</p>
                </div>
                <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {attendance.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无考勤记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record) => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={record.student?.avatar || `https://i.pravatar.cc/150?u=${record.student_id}`} alt={record.student?.name} className="w-8 h-8 rounded-full ring-2 ring-white" />
                          <span className="font-medium text-gray-900">{record.student?.name || '未知学生'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {record.status === 'present' ? '出勤' : record.status === 'late' ? '迟到' : '缺勤'}
                          </span>
                          <span className="text-gray-500">{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) : '-'}</span>
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

export default AdminTeacherSessions;
