import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TeacherDetailProps {
  teacherId: string;
  onClose: () => void;
}

const AdminTeacherDetail: React.FC<TeacherDetailProps> = ({ teacherId, onClose }) => {
  const [teacher, setTeacher] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'sessions'>('courses');

  useEffect(() => {
    loadTeacherData();
  }, [teacherId]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // 获取教师信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .single();
      
      setTeacher(profile);

      // 获取课程列表
      const { data: coursesData } = await supabase
        .from('app_courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      
      setCourses(coursesData || []);

      // 获取作业列表
      const { data: assignmentsData } = await supabase
        .from('app_assignments')
        .select(`
          *,
          course:course_id (title)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      
      setAssignments(assignmentsData || []);

      // 获取课堂记录
      const { data: sessionsData } = await supabase
        .from('app_class_sessions')
        .select(`
          *,
          course:course_id (title)
        `)
        .eq('teacher_id', teacherId)
        .order('scheduled_start', { ascending: false });
      
      setSessions(sessionsData || []);

    } catch (err) {
      console.error('加载教师数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <img 
              src={teacher?.avatar || `https://i.pravatar.cc/150?u=${teacherId}`}
              alt={teacher?.name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{teacher?.name || '未命名教师'}</h2>
              <p className="text-gray-500">{teacher?.email}</p>
              <p className="text-sm text-gray-400">注册时间: {new Date(teacher?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
            <p className="text-sm text-gray-500">课程数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{assignments.length}</p>
            <p className="text-sm text-gray-500">作业数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{sessions.length}</p>
            <p className="text-sm text-gray-500">课堂数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {courses.reduce((sum, c) => sum + (c.student_count || 0), 0)}
            </p>
            <p className="text-sm text-gray-500">学生总数</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'courses', label: '课程', icon: BookOpen },
            { id: 'assignments', label: '作业', icon: FileText },
            { id: 'sessions', label: '课堂', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'courses' && (
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无课程</p>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{course.title}</h4>
                        <p className="text-sm text-gray-500">{course.student_count || 0} 名学生</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        course.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {course.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无作业</p>
              ) : (
                assignments.map(assignment => (
                  <div key={assignment.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{assignment.title}</h4>
                        <p className="text-sm text-gray-500">{assignment.course?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {assignment.submitted_count || 0}/{assignment.total_students || 0} 提交
                        </p>
                        <p className="text-xs text-gray-400">截止: {new Date(assignment.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无课堂记录</p>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{session.course?.title || '未命名课堂'}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(session.scheduled_start).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        session.status === 'in_progress' ? 'bg-green-100 text-green-600' : 
                        session.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {session.status === 'in_progress' ? '进行中' : 
                         session.status === 'completed' ? '已完成' : '待开始'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTeacherDetail;
