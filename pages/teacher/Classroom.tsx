
import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Clock, Play, Square, Monitor, Users, CheckCircle2,
  MessageCircle, PenLine, Trash2,
  ArrowLeft, BarChart3, Plus, X, QrCode,
  MoreHorizontal, FileText, Send, Download, Copy
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface TeacherClassroomProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 课程状态
enum ClassStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed'
}

// 课程类型
interface CourseClass {
  id: string;
  title: string;
  time: string;
  duration: string;
  classroom: string;
  studentCount: number;
  status: ClassStatus;
  image: string;
}

// 签到学生
interface AttendanceStudent {
  id: string;
  name: string;
  avatar: string;
  status: 'present' | 'late' | 'absent';
  checkInTime?: string;
}

// 白板笔触
interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

// 互动问题
interface Question {
  id: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  timestamp: string;
  upvotes: number;
  isAnswered: boolean;
}

// 投票
interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
}

// 底部导航 Tab 类型
type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

// ==================== 自定义 Hooks ====================

// 获取教师的课程列表
function useTeacherCourses(teacherId?: string) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_courses')
        .select('*')
        .eq('author', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

// 获取课堂会话列表
function useClassSessions(teacherId?: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_class_sessions')
        .select(`
          *,
          course:course_id (title, image)
        `)
        .eq('teacher_id', teacherId)
        .order('scheduled_start', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}

// 实时订阅签到数据
function useAttendanceRealtime(sessionId?: string) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    // 初始加载
    const loadAttendance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_attendance')
        .select(`
          *,
          student:student_id (id, name, avatar)
        `)
        .eq('session_id', sessionId);
      
      if (!error) {
        setAttendance(data || []);
      }
      setLoading(false);
    };
    loadAttendance();

    // 实时订阅
    const subscription = supabase
      .channel(`attendance:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_attendance',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAttendance(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setAttendance(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        } else if (payload.eventType === 'DELETE') {
          setAttendance(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  return { attendance, loading };
}

// 创建课堂会话（预留功能 - 将来实现创建新课堂）
// @ts-expect-error - 预留函数，暂时未使用
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _createClassSession(_sessionData: any) {
  const { data, error } = await supabase
    .from('app_class_sessions')
    .insert(_sessionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

const TeacherClassroom: React.FC<TeacherClassroomProps> = ({
  currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  // 使用真实数据 Hooks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { courses: _courses, loading: coursesLoading } = useTeacherCourses(currentUser?.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessions, loading: _sessionsLoading, refetch: refetchSessions } = useClassSessions(currentUser?.id);
  
  // 上课状态管理
  const [activeTab, setActiveTab] = useState<TeacherTab>('class');
  const [isClassActive, setIsClassActive] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [classTimer, setClassTimer] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareType, setScreenShareType] = useState<'screen' | 'window' | 'ppt'>('screen');
  const [screenShareViewers, setScreenShareViewers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 更新课堂会话状态
  const updateClassSession = async (sessionId: string, updates: any) => {
    const { data, error } = await supabase
      .from('app_class_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // 白板状态
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushWidth, setBrushWidth] = useState(3);

  // 互动工具状态
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  
  // 随堂测状态
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  
  // 课堂笔记状态
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [classNotes, setClassNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  
  // 公告状态
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  
  // 邀请学生状态
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink] = useState('');

  // 将会话数据转换为课程列表展示
  const courseClasses: CourseClass[] = sessions.map(session => {
    const startTime = new Date(session.scheduled_start);
    const now = new Date();
    const isToday = startTime.toDateString() === now.toDateString();
    
    let status = ClassStatus.UPCOMING;
    if (session.status === 'completed' || session.ended_at) {
      status = ClassStatus.COMPLETED;
    } else if (session.status === 'in_progress' || session.started_at) {
      status = ClassStatus.ONGOING;
    } else if (startTime < now && !session.ended_at) {
      status = ClassStatus.ONGOING;
    }
    
    const timeStr = isToday 
      ? startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : startTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return {
      id: session.id,
      title: session.course?.title || session.title || '未命名课程',
      time: timeStr,
      duration: session.duration || '45分钟',
      classroom: session.classroom || '在线课堂',
      studentCount: session.max_students || 30,
      status,
      image: session.course?.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'
    };
  });

  // 使用真实签到数据
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { attendance: attendanceData, loading: _attendanceLoading } = useAttendanceRealtime(activeSessionId || undefined);
  
  // 转换签到数据为展示格式
  const attendanceList: AttendanceStudent[] = attendanceData.map(record => ({
    id: record.student?.id || record.id,
    name: record.student?.name || '未知学生',
    avatar: record.student?.avatar || `https://i.pravatar.cc/150?u=${record.student_id}`,
    status: record.status === 'present' ? 'present' : record.status === 'late' ? 'late' : 'absent',
    checkInTime: record.checked_in_at 
      ? new Date(record.checked_in_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : undefined
  }));

  // 模拟提问数据
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', studentName: '陈小明', studentAvatar: 'https://i.pravatar.cc/150?u=4', content: '老师，WBS分解的最小单元应该到什么程度比较合适？', timestamp: '5分钟前', upvotes: 3, isAnswered: false },
    { id: 'q2', studentName: '刘小红', studentAvatar: 'https://i.pravatar.cc/150?u=5', content: 'Scrum和Kanban的主要区别是什么？', timestamp: '12分钟前', upvotes: 5, isAnswered: true },
    { id: 'q3', studentName: '赵小强', studentAvatar: 'https://i.pravatar.cc/150?u=6', content: '定性风险分析和定量风险分析分别在什么阶段进行？', timestamp: '18分钟前', upvotes: 2, isAnswered: false },
  ]);

  // 课堂计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClassActive) {
      interval = setInterval(() => {
        setClassTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClassActive]);

  // 模拟屏幕共享观看人数变化
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScreenSharing && isClassActive) {
      // 初始观看人数基于签到人数
      setScreenShareViewers(Math.max(5, attendanceList.length));
      
      interval = setInterval(() => {
        setScreenShareViewers(prev => {
          // 随机波动 -2 到 +3
          const change = Math.floor(Math.random() * 6) - 2;
          return Math.max(0, prev + change);
        });
      }, 5000);
    } else {
      setScreenShareViewers(0);
    }
    return () => clearInterval(interval);
  }, [isScreenSharing, isClassActive, attendanceList.length]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始上课
  const startClass = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // 更新会话状态为进行中
      await updateClassSession(sessionId, {
        status: 'ongoing',
        actual_start: new Date().toISOString()
      });
      
      setActiveSessionId(sessionId);
      setIsClassActive(true);
      setClassTimer(0);
      
      // 刷新会话列表
      await refetchSessions();
    } catch (err) {
      console.error('Failed to start class:', err);
      alert('开始上课失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 结束上课
  const endClass = async () => {
    if (!confirm('确定要结束本节课堂吗？')) return;
    
    setIsLoading(true);
    try {
      // 更新会话状态为已完成
      if (activeSessionId) {
        await updateClassSession(activeSessionId, {
          status: 'completed',
          actual_end: new Date().toISOString()
        });
      }
      
      setIsClassActive(false);
      setActiveSessionId(null);
      setClassTimer(0);
      setIsScreenSharing(false);
      setStrokes([]);
      setActivePoll(null);
      
      // 刷新会话列表
      await refetchSessions();
    } catch (err) {
      console.error('Failed to end class:', err);
      alert('结束上课失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 白板绘制处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isClassActive) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentStroke({
      id: Date.now().toString(),
      points: [{ x, y }],
      color: brushColor,
      width: brushWidth
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !isClassActive) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x, y }]
    });
  };

  const handleMouseUp = () => {
    if (currentStroke) {
      setStrokes([...strokes, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  // 清空白板
  const clearWhiteboard = () => {
    setStrokes([]);
  };

  // 创建投票
  const createPoll = () => {
    if (!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())) return;
    
    const poll: Poll = {
      id: Date.now().toString(),
      question: newPollQuestion,
      options: newPollOptions.map((text, idx) => ({
        id: `opt-${idx}`,
        text,
        votes: Math.floor(Math.random() * 10) // 模拟投票数据
      })),
      totalVotes: 0,
      isActive: true
    };
    
    poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    setActivePoll(poll);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setShowPollModal(false);
  };

  // 标记问题已回答
  const markQuestionAnswered = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isAnswered: true } : q
    ));
  };

  // 获取当前课程
  const getCurrentClass = () => {
    return courseClasses.find(c => c.id === activeSessionId);
  };

  // 统计签到数据
  const getAttendanceStats = () => {
    const present = attendanceList.filter(s => s.status === 'present').length;
    const late = attendanceList.filter(s => s.status === 'late').length;
    const absent = attendanceList.filter(s => s.status === 'absent').length;
    return { present, late, absent, total: attendanceList.length };
  };

  // 手动为学生签到
  const manualCheckIn = async (studentId: string, status: 'present' | 'late') => {
    if (!activeSessionId) return;
    
    try {
      const { error } = await supabase
        .from('app_attendance')
        .upsert({
          session_id: activeSessionId,
          student_id: studentId,
          status: status,
          checked_in_at: new Date().toISOString(),
          check_in_method: 'manual'
        }, {
          onConflict: 'session_id,student_id'
        });
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to check in student:', err);
    }
  };

  // ==================== 侧边栏导航（桌面端） ====================
  const renderSidebar = () => {
    const navItems = [
      { id: 'home', icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
      { id: 'courses', icon: BookOpen, label: '课程', page: Page.TEACHER_COURSES },
      { id: 'class', icon: Video, label: '上课', page: null },
      { id: 'assignments', icon: ClipboardList, label: '作业', page: Page.TEACHER_ASSIGNMENTS },
      { id: 'profile', icon: User, label: '我的', page: Page.TEACHER_PROFILE },
    ];

    return (
      <aside className="hidden lg:block w-64 bg-white h-screen sticky top-0 border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">教师端</h1>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // 如果正在上课，提示确认
                    if (isClassActive && item.id !== 'class') {
                      if (!confirm('课堂正在进行中，确定要离开吗？')) {
                        return;
                      }
                      // 结束课堂状态
                      setIsClassActive(false);
                      setActiveSessionId(null);
                      setClassTimer(0);
                    }
                    
                    setActiveTab(item.id as TeacherTab);
                    if (item.id !== 'class' && item.page && onNavigate) {
                      onNavigate(item.page);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    );
  };

  // ==================== 待开始课程列表 ====================
  const renderUpcomingClasses = () => {
    const upcomingClasses = courseClasses.filter(c => c.status !== ClassStatus.COMPLETED);
    
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            待开始的课程
          </h3>
          <span className="text-sm text-gray-500">{upcomingClasses.length} 节</span>
        </div>
        
        {(coursesLoading || sessions.length === 0 && _sessionsLoading) ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>加载课程中...</p>
              </div>
            ) : upcomingClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
            <p>暂无待开始的课程</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div 
                key={cls.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  cls.status === ClassStatus.ONGOING 
                    ? 'bg-blue-50 border border-blue-100' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <img 
                  src={cls.image} 
                  alt={cls.title}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{cls.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Clock size={14} />
                    <span>{cls.time}</span>
                    <span>·</span>
                    <span>{cls.classroom}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Users size={12} />
                    <span>{cls.studentCount} 人</span>
                  </div>
                </div>
                {cls.status === ClassStatus.ONGOING ? (
                  <button 
                    onClick={() => startClass(cls.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 animate-pulse disabled:opacity-50"
                  >
                    <Play size={14} fill="currentColor" /> {isLoading ? '加载中...' : '继续'}
                  </button>
                ) : (
                  <button 
                    onClick={() => startClass(cls.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Play size={14} fill="currentColor" /> {isLoading ? '加载中...' : '开始'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== 课堂进行中界面 ====================
  const renderActiveClass = () => {
    const currentClass = getCurrentClass();
    const stats = getAttendanceStats();

    return (
      <div className="space-y-4 pb-24">
        {/* 课堂头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (confirm('确定要退出课堂吗？课堂将保持进行状态。')) {
                    setIsClassActive(false);
                  }
                }}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold">{currentClass?.title || '课堂进行中'}</h2>
                <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                  <Clock size={14} /> 已进行 {formatTime(classTimer)}
                </p>
              </div>
            </div>
            <button 
              onClick={endClass}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition-colors"
            >
              <Square size={14} fill="currentColor" /> 结束
            </button>
          </div>
          
          {/* 快捷工具 */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                isScreenSharing ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Monitor size={18} /> 
              {isScreenSharing ? `停止共享 (${screenShareViewers}人观看)` : '开始共享'}
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex-1 py-3 bg-white/20 rounded-xl font-medium flex items-center justify-center gap-2 text-white hover:bg-white/30 transition-colors"
            >
              <Users size={18} /> 邀请学生
            </button>
          </div>
          
          {/* 屏幕共享类型选择 */}
          {isScreenSharing && (
            <div className="mt-3 flex gap-2">
              {[
                { type: 'screen', label: '整个屏幕', icon: Monitor },
                { type: 'window', label: '应用窗口', icon: Play },
                { type: 'ppt', label: 'PPT演示', icon: PenLine },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setScreenShareType(type as any)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    screenShareType === type 
                      ? 'bg-white text-blue-600' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 屏幕共享区域 */}
        {isScreenSharing && (
          <div className="bg-gray-900 rounded-3xl p-4 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Monitor size={18} className="text-green-400" /> 
                正在共享
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {screenShareType === 'screen' ? '整个屏幕' : screenShareType === 'window' ? '应用窗口' : 'PPT演示'}
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {screenShareViewers} 人观看
                </span>
                <button 
                  onClick={() => setIsScreenSharing(false)}
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* 模拟共享内容 */}
            <div className="relative bg-gray-800 rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {screenShareType === 'ppt' ? (
                // PPT 演示模式
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-8">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PenLine size={40} />
                      </div>
                      <h4 className="text-2xl font-bold mb-2">项目管理基础</h4>
                      <p className="text-white/80">第三章：进度管理与控制</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-400">幻灯片 3 / 15</span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20">上一页</button>
                      <button className="px-3 py-1 bg-blue-600 rounded-lg text-white text-sm hover:bg-blue-700">下一页</button>
                    </div>
                  </div>
                </div>
              ) : screenShareType === 'window' ? (
                // 应用窗口模式
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="h-8 bg-gray-200 flex items-center px-3 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="ml-2 text-xs text-gray-500">代码编辑器</span>
                    </div>
                    <div className="p-4 font-mono text-sm text-gray-700">
                      <div className="text-purple-600">function</div>
                      <div className="pl-4">
                        <span className="text-blue-600">calculateProgress</span>
                        <span className="text-gray-500">(tasks)</span>
                      </div>
                      <div className="pl-4 text-gray-400">{'{ ... }'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                // 整个屏幕模式
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <Monitor size={48} className="text-white/80" />
                    </div>
                    <p className="text-lg font-medium">正在共享屏幕</p>
                    <p className="text-sm text-white/60 mt-1">学生可以看到您的屏幕内容</p>
                  </div>
                </div>
              )}
              
              {/* 观看人数浮层 */}
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {screenShareViewers} 人观看
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              屏幕共享模拟 · 实际实现需要 WebRTC 技术支持
            </p>
          </div>
        )}

        {/* 白板区域 */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <PenLine size={18} className="text-blue-500" /> 课堂白板
            </h3>
            <div className="flex items-center gap-2">
              {/* 颜色选择 */}
              <div className="flex gap-1">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#1F2937'].map(color => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      brushColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              {/* 画笔粗细 */}
              <div className="flex gap-1">
                {[2, 4, 6].map(width => (
                  <button
                    key={width}
                    onClick={() => setBrushWidth(width)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      brushWidth === width ? 'bg-gray-200' : ''
                    }`}
                  >
                    <div 
                      className="rounded-full bg-gray-600"
                      style={{ width: width, height: width }}
                    />
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button 
                onClick={clearWhiteboard}
                className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {/* 画布区域 */}
          <div className="relative h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
            <canvas
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={(canvas) => {
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    // 清空画布
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // 绘制所有笔触
                    strokes.forEach(stroke => {
                      ctx.beginPath();
                      ctx.strokeStyle = stroke.color;
                      ctx.lineWidth = stroke.width;
                      ctx.lineCap = 'round';
                      ctx.lineJoin = 'round';
                      stroke.points.forEach((point, idx) => {
                        if (idx === 0) {
                          ctx.moveTo(point.x, point.y);
                        } else {
                          ctx.lineTo(point.x, point.y);
                        }
                      });
                      ctx.stroke();
                    });
                    
                    // 绘制当前笔触
                    if (currentStroke) {
                      ctx.beginPath();
                      ctx.strokeStyle = currentStroke.color;
                      ctx.lineWidth = currentStroke.width;
                      ctx.lineCap = 'round';
                      ctx.lineJoin = 'round';
                      currentStroke.points.forEach((point, idx) => {
                        if (idx === 0) {
                          ctx.moveTo(point.x, point.y);
                        } else {
                          ctx.lineTo(point.x, point.y);
                        }
                      });
                      ctx.stroke();
                    }
                  }
                }
              }}
              width={800}
              height={300}
            />
            {strokes.length === 0 && !currentStroke && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                <div className="text-center">
                  <PenLine size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">在上方选择颜色和粗细，开始书写板书</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-2 text-center">
            支持手写板书、选择颜色、调整画笔粗细
          </p>
        </div>

        {/* 学生签到 - 简化版 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-green-500" /> 学生签到
            </h3>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600 font-medium">出勤 {stats.present}</span>
              <span className="text-yellow-600 font-medium">迟到 {stats.late}</span>
              <span className="text-red-600 font-medium">缺勤 {stats.absent}</span>
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attendanceList.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>暂无学生签到数据</p>
              </div>
            ) : (
              attendanceList.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <img src={student.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <span className="flex-1 font-medium text-gray-900">{student.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    student.status === 'present' ? 'bg-green-100 text-green-700' :
                    student.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {student.status === 'present' ? '已签到' : student.status === 'late' ? '迟到' : '缺勤'}
                  </span>
                  {student.checkInTime && (
                    <span className="text-xs text-gray-400">{student.checkInTime}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 互动工具 */}
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => setShowQuestionModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-200 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <MessageCircle size={20} />
            </div>
            <span className="text-xs font-medium text-gray-900">提问</span>
            <span className="text-[10px] text-gray-500">{questions.filter(q => !q.isAnswered).length} 未答</span>
          </button>
          
          <button 
            onClick={() => setShowPollModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-green-200 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
              <BarChart3 size={20} />
            </div>
            <span className="text-xs font-medium text-gray-900">投票</span>
            <span className="text-[10px] text-gray-500">{activePoll ? '进行中' : '发起'}</span>
          </button>
          
          <button 
            onClick={() => setShowQuizModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-purple-200 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <ClipboardList size={20} />
            </div>
            <span className="text-xs font-medium text-gray-900">随堂测</span>
            <span className="text-[10px] text-gray-500">{activeQuiz ? '进行中' : '发起'}</span>
          </button>
          
          <button 
            onClick={() => setShowMoreModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-orange-200 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <MoreHorizontal size={20} />
            </div>
            <span className="text-xs font-medium text-gray-900">更多</span>
            <span className="text-[10px] text-gray-500">工具箱</span>
          </button>
        </div>

        {/* 当前投票结果 */}
        {activePoll && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-500" /> 当前投票
              </h3>
              <button 
                onClick={() => setActivePoll(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                结束投票
              </button>
            </div>
            <p className="text-gray-700 mb-4">{activePoll.question}</p>
            <div className="space-y-3">
              {activePoll.options.map((option) => (
                <div key={option.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{option.text}</span>
                    <span className="text-gray-500">{option.votes} 票 ({activePoll.totalVotes > 0 ? Math.round((option.votes / activePoll.totalVotes) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${activePoll.totalVotes > 0 ? (option.votes / activePoll.totalVotes) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">共 {activePoll.totalVotes} 人参与投票</p>
          </div>
        )}
      </div>
    );
  };

  // ==================== 提问弹窗 ====================
  const renderQuestionModal = () => {
    if (!showQuestionModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">学生提问</h3>
            <button 
              onClick={() => setShowQuestionModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* 问题列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>暂无学生提问</p>
              </div>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`p-4 rounded-2xl transition-colors ${
                    q.isAnswered ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img src={q.studentAvatar} alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{q.studentName}</span>
                        <span className="text-xs text-gray-400">{q.timestamp}</span>
                        {q.isAnswered && <span className="text-xs text-green-600">已回答</span>}
                      </div>
                      <p className="text-gray-700 mt-1">{q.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users size={12} /> {q.upvotes} 人关注
                        </span>
                        {!q.isAnswered && (
                          <button 
                            onClick={() => markQuestionAnswered(q.id)}
                            className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                          >
                            <CheckCircle2 size={12} /> 标记已回答
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== 投票弹窗 ====================
  const renderPollModal = () => {
    if (!showPollModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">发起投票</h3>
            <button 
              onClick={() => setShowPollModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* 表单 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">投票问题</label>
              <input 
                type="text" 
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                placeholder="请输入投票问题"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
              <div className="space-y-2">
                {newPollOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newPollOptions];
                        newOptions[idx] = e.target.value;
                        setNewPollOptions(newOptions);
                      }}
                      placeholder={`选项 ${idx + 1}`}
                      className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                    />
                    {newPollOptions.length > 2 && (
                      <button 
                        onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                        className="p-3 bg-red-50 text-red-600 rounded-xl"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setNewPollOptions([...newPollOptions, ''])}
                className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> 添加选项
              </button>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={createPoll}
              disabled={!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              发起投票
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 手动签到弹窗 ====================
  const renderAttendanceModal = () => {
    if (!showAttendanceModal) return null;

    // 模拟学生列表（实际应从选课数据获取）
    const mockStudents = [
      { id: 'st1', name: '张明', avatar: 'https://i.pravatar.cc/150?u=1' },
      { id: 'st2', name: '李华', avatar: 'https://i.pravatar.cc/150?u=2' },
      { id: 'st3', name: '王芳', avatar: 'https://i.pravatar.cc/150?u=3' },
      { id: 'st4', name: '陈小明', avatar: 'https://i.pravatar.cc/150?u=4' },
      { id: 'st5', name: '刘小红', avatar: 'https://i.pravatar.cc/150?u=5' },
      { id: 'st6', name: '赵小强', avatar: 'https://i.pravatar.cc/150?u=6' },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">手动签到</h3>
            <button 
              onClick={() => setShowAttendanceModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* 学生列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {mockStudents.map((student) => {
                const existingRecord = attendanceList.find(a => a.id === student.id);
                const isPresent = existingRecord?.status === 'present';
                const isLate = existingRecord?.status === 'late';
                
                return (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={student.avatar} alt="" className="w-10 h-10 rounded-full" />
                    <span className="flex-1 font-medium text-gray-900">{student.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => manualCheckIn(student.id, 'present')}
                        disabled={isPresent}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isPresent 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200'
                        }`}
                      >
                        {isPresent ? '已签到' : '签到'}
                      </button>
                      <button
                        onClick={() => manualCheckIn(student.id, 'late')}
                        disabled={isLate}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isLate 
                            ? 'bg-yellow-100 text-yellow-700 cursor-default' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200'
                        }`}
                      >
                        {isLate ? '已迟到' : '迟到'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 底部提示 */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              点击按钮为学生标记出勤状态，已签到的学生会显示为已签到
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 随堂测弹窗 ====================
  const renderQuizModal = () => {
    if (!showQuizModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">发起随堂测</h3>
            <button 
              onClick={() => setShowQuizModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeQuiz ? (
              // 显示进行中的随堂测结果
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{activeQuiz.question}</h4>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    结束测验
                  </button>
                </div>
                <div className="space-y-2">
                  {activeQuiz.options.map((opt: string, idx: number) => {
                    const responseCount = quizResponses.filter((r: any) => r.option === idx).length;
                    const total = quizResponses.length || 1;
                    const percentage = Math.round((responseCount / total) * 100);
                    const isCorrect = idx === activeQuiz.correctOption;
                    
                    return (
                      <div key={idx} className={`p-3 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}>
                            {opt} {isCorrect && '(正确答案)'}
                          </span>
                          <span className="text-gray-500">{responseCount}人 ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  共 {quizResponses.length} 人参与 · 正确率: {Math.round((quizResponses.filter((r: any) => r.option === activeQuiz.correctOption).length / (quizResponses.length || 1)) * 100)}%
                </p>
              </div>
            ) : (
              // 创建新随堂测
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">题目</label>
                  <input 
                    type="text" 
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="请输入题目"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
                  <div className="space-y-2">
                    {quizOptions.map((option, idx) => (
                      <div key={idx} className="flex gap-2">
                        <button
                          onClick={() => setCorrectOption(idx)}
                          className={`w-8 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                            correctOption === idx 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input 
                          type="text" 
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...quizOptions];
                            newOptions[idx] = e.target.value;
                            setQuizOptions(newOptions);
                          }}
                          placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    点击选项前的字母标记为正确答案
                  </p>
                </div>
              </>
            )}
          </div>

          {!activeQuiz && (
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={() => {
                  if (!quizQuestion.trim() || quizOptions.some(opt => !opt.trim())) {
                    alert('请填写题目和所有选项');
                    return;
                  }
                  setActiveQuiz({
                    question: quizQuestion,
                    options: quizOptions,
                    correctOption: correctOption,
                    id: Date.now().toString()
                  });
                  setQuizResponses([]);
                  // 模拟学生答题
                  setTimeout(() => {
                    setQuizResponses([
                      { studentId: 's1', option: correctOption },
                      { studentId: 's2', option: correctOption },
                      { studentId: 's3', option: 1 },
                      { studentId: 's4', option: correctOption },
                      { studentId: 's5', option: 2 },
                    ]);
                  }, 2000);
                }}
                disabled={!quizQuestion.trim() || quizOptions.some(opt => !opt.trim())}
                className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                发起随堂测
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== 更多工具弹窗 ====================
  const renderMoreModal = () => {
    if (!showMoreModal) return null;

    const tools = [
      { 
        icon: FileText, 
        label: '课堂笔记', 
        desc: '记录课堂重点',
        color: 'bg-blue-100 text-blue-600',
        onClick: () => {
          setShowMoreModal(false);
          setShowNoteModal(true);
        }
      },
      { 
        icon: Send, 
        label: '发布公告', 
        desc: '向学生发送通知',
        color: 'bg-green-100 text-green-600',
        onClick: () => {
          setShowMoreModal(false);
          setShowAnnouncementModal(true);
        }
      },
      { 
        icon: Download, 
        label: '导出数据', 
        desc: '下载课堂统计',
        color: 'bg-orange-100 text-orange-600',
        onClick: () => {
          // 导出签到数据
          const data = attendanceList.map(a => ({
            name: a.name,
            status: a.status,
            time: a.checkInTime || '-'
          }));
          const csv = ['姓名,状态,签到时间', ...data.map(d => `${d.name},${d.status},${d.time}`)].join('\n');
          const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `签到数据_${new Date().toLocaleDateString()}.csv`;
          a.click();
          alert('签到数据已导出');
        }
      },
      { 
        icon: Copy, 
        label: '复制课堂链接', 
        desc: '分享给学生',
        color: 'bg-purple-100 text-purple-600',
        onClick: () => {
          navigator.clipboard.writeText(window.location.href);
          alert('课堂链接已复制到剪贴板');
        }
      },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">更多工具</h3>
            <button 
              onClick={() => setShowMoreModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {tools.map((tool, idx) => (
              <button
                key={idx}
                onClick={() => {
                  tool.onClick();
                  setShowMoreModal(false);
                }}
                className="p-4 bg-gray-50 rounded-2xl text-left hover:bg-gray-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${tool.color}`}>
                  <tool.icon size={20} />
                </div>
                <div className="font-medium text-sm text-gray-900">{tool.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{tool.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== 课堂笔记弹窗 ====================
  const renderNoteModal = () => {
    if (!showNoteModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">课堂笔记</h3>
            <button 
              onClick={() => setShowNoteModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* 笔记列表 */}
            {classNotes.length > 0 && (
              <div className="mb-4 space-y-2">
                {classNotes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-xl text-sm text-gray-700">
                    {note}
                  </div>
                ))}
              </div>
            )}
            
            {/* 添加笔记 */}
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="记录课堂重点..."
              className="w-full h-32 p-4 bg-gray-50 rounded-xl border-0 resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (newNote.trim()) {
                  setClassNotes([...classNotes, newNote]);
                  setNewNote('');
                  alert('笔记已保存');
                }
              }}
              disabled={!newNote.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300"
            >
              保存笔记
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // ==================== 公告弹窗 ====================
  const renderAnnouncementModal = () => {
    if (!showAnnouncementModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">发布公告</h3>
            <button 
              onClick={() => setShowAnnouncementModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div className="p-4">
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="输入公告内容..."
              className="w-full h-40 p-4 bg-gray-50 rounded-xl border-0 resize-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (announcementText.trim()) {
                  alert('公告已发送给学生');
                  setAnnouncementText('');
                  setShowAnnouncementModal(false);
                }
              }}
              disabled={!announcementText.trim()}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium disabled:bg-gray-300"
            >
              发送公告
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // ==================== 邀请学生弹窗 ====================
  const renderInviteModal = () => {
    if (!showInviteModal) return null;
    
    const link = inviteLink || `${window.location.origin}/join/${activeSessionId || 'class'}`;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">邀请学生</h3>
            <button 
              onClick={() => setShowInviteModal(false)}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="w-32 h-32 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <QrCode size={64} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">扫描二维码加入课堂</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 mb-4">
            <input 
              type="text" 
              value={link}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                alert('链接已复制');
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
            >
              复制
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 主渲染 ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 桌面端侧边栏 */}
        {renderSidebar()}
        
        {/* 主内容 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="max-w-lg lg:max-w-none mx-auto">
            {/* 页面标题 */}
            {!isClassActive && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">上课</h1>
                  <p className="text-sm text-gray-500 mt-1">管理和进行您的课堂教学</p>
                </div>
                <img 
                  src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              </div>
            )}

            {/* 主内容区 */}
            {isClassActive ? renderActiveClass() : (
              <div className="space-y-6 pb-24 lg:pb-0">
                {renderUpcomingClasses()}
                
                {/* 快捷入口 */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center hover:border-blue-200 transition-colors">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Clock size={28} className="text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">课程回放</h4>
                    <p className="text-xs text-gray-500 mt-1">查看历史课程录像</p>
                  </button>
                  <button className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center hover:border-green-200 transition-colors">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 size={28} className="text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">课堂统计</h4>
                    <p className="text-xs text-gray-500 mt-1">查看课堂数据分析</p>
                  </button>
                </div>

                {/* 最近完成 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">最近完成</h3>
                  {courseClasses.filter(c => c.status === ClassStatus.COMPLETED).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">暂无已完成的课程</p>
                  ) : (
                    <div className="space-y-3">
                      {courseClasses.filter(c => c.status === ClassStatus.COMPLETED).map(cls => (
                        <div key={cls.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <img src={cls.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{cls.title}</h4>
                            <p className="text-xs text-gray-500">{cls.time}</p>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">已完成</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* 移动端底部导航 - 已移除，由 TeacherLayout 统一管理 */}
      {/* <div className="lg:hidden">{renderBottomNav()}</div> */}
      {renderQuestionModal()}
      {renderPollModal()}
      {renderAttendanceModal()}
      {renderQuizModal()}
      {renderMoreModal()}
      {renderNoteModal()}
      {renderAnnouncementModal()}
      {renderInviteModal()}
    </div>
  );
};

export default TeacherClassroom;
