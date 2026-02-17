import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from '../../types';
import { 
  Clock, Search, CheckCircle, XCircle, 
  Calendar, Play, MapPin, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from './AdminLayout';

interface ClassSession {
  id: string;
  course_id: string;
  course_title: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  max_students: number;
  checkin_code?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'Teacher');
    setTeachers(data || []);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: sessionsData, error } = await supabase
        .from('app_class_sessions')
        .select(`
          *,
          course:course_id (title),
          teacher:teacher_id (name)
        `)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;

      const formattedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        course_title: session.course?.title || '未知课程',
        teacher_name: session.teacher?.name || '未知教师'
      }));

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
      .select(`
        *,
        student:student_id (name, avatar)
      `)
      .eq('session_id', sessionId)
      .order('checkin_time', { ascending: true });
    
    setAttendance(data || []);
  };

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'in_progress') {
        updates.actual_start = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.actual_end = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_class_sessions')
        .update(updates)
        .eq('id', sessionId);
      
      if (error) throw error;
      fetchSessions();
    } catch (err) {
      alert('更新失败: ' + (err as Error).message);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('确定要删除这个课堂记录吗？')) return;
    
    try {
      const { error } = await supabase
        .from('app_class_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      fetchSessions();
    } catch (err) {
      alert('删除失败: ' + (err as Error).message);
    }
  };

  const handleViewDetail = (session: ClassSession) => {
    setSelectedSession(session);
    fetchAttendance(session.id);
    setShowDetailModal(true);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.course_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesTeacher = teacherFilter === 'all' || session.teacher_id === teacherFilter;
    return matchesSearch && matchesStatus && matchesTeacher;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"><Calendar size={12} /> 待开始</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><Play size={12} /> 进行中</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> 已完成</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><XCircle size={12} /> 已取消</span>;
      default:
        return null;
    }
  };

  const stats = {
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    inProgress: sessions.filter(s => s.status === 'in_progress').length,
    completed: sessions.filter(s => s.status === 'completed').length
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
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="text-orange-600" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">课堂考勤管理</h1>
          </div>
          <p className="text-gray-500 ml-13">查看和管理所有教师的课堂安排及考勤记录</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">课堂总数</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
            <p className="text-sm text-gray-500 mt-1">待开始</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-green-600">{stats.inProgress}</p>
            <p className="text-sm text-gray-500 mt-1">进行中</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl font-bold text-gray-600">{stats.completed}</p>
            <p className="text-sm text-gray-500 mt-1">已完成</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索课堂或课程..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
              >
                <option value="all">全部状态</option>
                <option value="scheduled">待开始</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无课堂数据</p>
              <p className="text-sm mt-1">数据库中没有找到任何课堂记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课堂信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">所属课程</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">教师</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间安排</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">签到码</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{session.title}</p>
                          {session.location && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <MapPin size={12} />
                              {session.location}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-blue-600 font-medium">{session.course_title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">{session.teacher_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">{new Date(session.scheduled_start).toLocaleDateString('zh-CN')}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {new Date(session.scheduled_start).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
                            {' - '}
                            {new Date(session.scheduled_end).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                      <td className="px-6 py-4">
                        {session.checkin_code ? (
                          <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-mono font-bold tracking-wider">
                            {session.checkin_code}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {session.status === 'scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(session.id, 'in_progress')}
                              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                            >
                              开始
                            </button>
                          )}
                          {session.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(session.id, 'completed')}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              结束
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetail(session)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            考勤
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle size={16} />
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
        {showDetailModal && selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">课堂考勤记录</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedSession.title} - {selectedSession.course_title}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 flex items-center gap-6 text-sm">
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-mono font-bold">
                    签到码: {selectedSession.checkin_code || '无'}
                  </span>
                  <span className="text-gray-600">应到: <b className="text-gray-900">{selectedSession.max_students}</b></span>
                  <span className="text-gray-600">实到: <b className="text-green-600">{attendance.filter(a => a.status === 'present').length}</b></span>
                  <span className="text-gray-600">出勤率: <b className="text-blue-600">{selectedSession.max_students > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / selectedSession.max_students) * 100) : 0}%</b></span>
                </div>
                
                {attendance.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users size={28} className="text-gray-300" />
                    </div>
                    <p>暂无考勤记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((record) => (
                      <div key={record.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <img 
                            src={record.student?.avatar || `https://i.pravatar.cc/150?u=${record.student_id}`}
                            alt={record.student?.name}
                            className="w-8 h-8 rounded-full ring-2 ring-white"
                          />
                          <span className="font-medium text-gray-900">{record.student?.name || '未知学生'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.status === 'present' ? '出勤' :
                             record.status === 'late' ? '迟到' : '缺勤'}
                          </span>
                          <span className="text-gray-500 w-16">
                            {record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) : '-'}
                          </span>
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
