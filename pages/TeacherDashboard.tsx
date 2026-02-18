
import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User, LogOut,
  Clock, Calendar, Bell, ChevronRight, Play, Square,
  Monitor, Users, CheckCircle2, MessageCircle,
  Send, Plus, FileText, Star, MoreHorizontal, Filter,
  ArrowLeft, PenLine, Trash2, Download, Loader2
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface TeacherDashboardProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 今日课程
interface TodayClass {
  id: string;
  title: string;
  time: string;
  duration: string;
  classroom: string;
  studentCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

// 待办事项
interface TodoItem {
  id: string;
  type: 'homework' | 'question' | 'notice';
  title: string;
  count: number;
  urgent?: boolean;
}

// 课程
interface Course {
  id: string;
  title: string;
  category: string;
  studentCount: number;
  progress: number;
  image: string;
  nextClass?: string;
}

// 作业
interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  deadline: string;
  submittedCount: number;
  totalCount: number;
  status: 'pending' | 'grading' | 'completed';
}

// 学生提交的作业
interface StudentSubmission {
  id: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  score?: number;
  comment?: string;
  status: 'submitted' | 'graded';
}

// 学生提问
interface StudentQuestion {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseName: string;
  content: string;
  timestamp: string;
  replies: number;
  status: 'unanswered' | 'answered';
}

// 签到学生
interface AttendanceStudent {
  id: string;
  name: string;
  avatar: string;
  status: 'present' | 'late' | 'absent';
  checkInTime?: string;
}

// 底部导航 Tab 类型
type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate: _onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('home');
  const [,] = useState(false);
  
  // 上课模块状态
  const [isClassActive, setIsClassActive] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [classTimer, setClassTimer] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // 作业模块状态
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showAssignmentDetail, setShowAssignmentDetail] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<StudentSubmission | null>(null);
  
  // 学生互动状态
  const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // 真实数据状态
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
    pendingGrading: 0,
    weekHours: 0
  });
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions] = useState<StudentSubmission[]>([]);
  const [questions] = useState<StudentQuestion[]>([]);
  const [attendanceList] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      
      try {
        // 1. 获取课程数
        const { count: courseCount } = await supabase
          .from('app_courses')
          .select('*', { count: 'exact', head: true });

        // 2. 获取总学生数（去重）
        const { data: enrollments } = await supabase
          .from('app_course_enrollments')
          .select('student_id');
        const uniqueStudents = new Set(enrollments?.map(e => e.student_id));

        // 3. 获取待批改作业数
        const { count: pendingGrading } = await supabase
          .from('app_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', currentUser.id)
          .eq('status', 'grading');

        // 4. 获取本周课时
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const { data: weekSessions } = await supabase
          .from('app_class_sessions')
          .select('duration')
          .eq('teacher_id', currentUser.id)
          .gte('scheduled_start', weekStart.toISOString());
        const weekHours = (weekSessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0) / 3600;

        setStats({
          courseCount: courseCount || 0,
          studentCount: uniqueStudents.size,
          pendingGrading: pendingGrading || 0,
          weekHours: Math.round(weekHours * 10) / 10
        });
      } catch (err) {
        console.error('获取统计数据失败:', err);
      }
    };

    fetchStats();
  }, [currentUser?.id]);

  // 获取今日课程
  useEffect(() => {
    const fetchTodayClasses = async () => {
      if (!currentUser?.id) return;
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: sessions } = await supabase
          .from('app_class_sessions')
          .select('*, app_courses(title)')
          .eq('teacher_id', currentUser.id)
          .gte('scheduled_start', today.toISOString())
          .lt('scheduled_start', tomorrow.toISOString())
          .order('scheduled_start', { ascending: true });

        const formattedClasses: TodayClass[] = (sessions || []).map(s => ({
          id: s.id,
          title: s.title,
          time: new Date(s.scheduled_start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          duration: s.duration ? `${Math.round(s.duration / 60)}分钟` : '45分钟',
          classroom: s.classroom || '线上课堂',
          studentCount: s.max_students || 30,
          status: s.status === 'ongoing' ? 'ongoing' : s.status === 'completed' ? 'completed' : 'upcoming'
        }));

        setTodayClasses(formattedClasses);
      } catch (err) {
        console.error('获取今日课程失败:', err);
      }
    };

    fetchTodayClasses();
  }, [currentUser?.id]);

  // 获取待办事项
  useEffect(() => {
    const fetchTodos = async () => {
      if (!currentUser?.id) return;
      
      try {
        const todoItems: TodoItem[] = [];

        // 1. 待批改作业
        const { count: pendingHomework } = await supabase
          .from('app_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', currentUser.id)
          .eq('status', 'grading');

        if (pendingHomework && pendingHomework > 0) {
          todoItems.push({
            id: 't1',
            type: 'homework',
            title: '待批改作业',
            count: pendingHomework,
            urgent: true
          });
        }

        // 2. 未回复提问（模拟数据，实际应查询社区表）
        todoItems.push({
          id: 't2',
          type: 'question',
          title: '学生提问',
          count: 0
        });

        // 3. 课程通知
        todoItems.push({
          id: 't3',
          type: 'notice',
          title: '课程通知',
          count: 0
        });

        setTodos(todoItems);
      } catch (err) {
        console.error('获取待办事项失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [currentUser?.id]);

  // 获取我的课程
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const { data: courses } = await supabase
          .from('app_courses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        const formattedCourses: Course[] = (courses || []).map(c => ({
          id: c.id,
          title: c.title,
          category: c.category || 'Foundation',
          studentCount: c.student_count || 0,
          progress: Math.floor(Math.random() * 40) + 50, // 临时使用随机进度
          image: c.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
          nextClass: '待定'
        }));

        setMyCourses(formattedCourses);
      } catch (err) {
        console.error('获取课程失败:', err);
      }
    };

    fetchMyCourses();
  }, []);

  // 获取作业列表
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!currentUser?.id) return;
      
      try {
        const { data: assignmentsData } = await supabase
          .from('app_assignments')
          .select('*, app_courses(title)')
          .eq('teacher_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const formattedAssignments: Assignment[] = (assignmentsData || []).map(a => ({
          id: a.id,
          title: a.title,
          courseId: a.course_id,
          courseName: a.app_courses?.title || '未知课程',
          deadline: new Date(a.deadline).toLocaleDateString('zh-CN'),
          submittedCount: a.submitted_count || 0,
          totalCount: a.total_count || 0,
          status: a.status as 'pending' | 'grading' | 'completed'
        }));

        setAssignments(formattedAssignments);
      } catch (err) {
        console.error('获取作业失败:', err);
      }
    };

    fetchAssignments();
  }, [currentUser?.id]);

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

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始上课
  const startClass = (classId: string) => {
    setActiveClassId(classId);
    setIsClassActive(true);
    setClassTimer(0);
    setActiveTab('class');
  };

  // 结束上课
  const endClass = () => {
    setIsClassActive(false);
    setActiveClassId(null);
    setClassTimer(0);
    setIsScreenSharing(false);
  };

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // ==================== 侧边栏导航（桌面端） ====================
  const renderSidebar = () => {
    const navItems = [
      { id: 'home' as const, icon: Home, label: '首页' },
      { id: 'courses' as const, icon: BookOpen, label: '课程' },
      { id: 'class' as const, icon: Video, label: '上课' },
      { id: 'assignments' as const, icon: ClipboardList, label: '作业' },
      { id: 'profile' as const, icon: User, label: '我的' },
    ];

    return (
      <aside className="hidden lg:flex w-64 bg-white h-screen sticky top-0 border-r border-gray-200 flex-col">
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">教师端</h1>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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
        
        {/* Desktop Logout */}
        {onLogout && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
              <span>退出登录</span>
            </button>
          </div>
        )}
      </aside>
    );
  };

  // ==================== 底部导航（移动端） ====================
  const renderBottomNav = () => {
    const navItems = [
      { id: 'home', icon: Home, label: '首页' },
      { id: 'courses', icon: BookOpen, label: '课程' },
      { id: 'class', icon: Video, label: '上课', highlight: true },
      { id: 'assignments', icon: ClipboardList, label: '作业' },
      { id: 'profile', icon: User, label: '我的' },
    ];

    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TeacherTab)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${
                  item.highlight ? '-mt-4' : ''
                }`}
              >
                {item.highlight ? (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                    isActive ? 'bg-blue-600 shadow-blue-500/30' : 'bg-gray-100'
                  }`}>
                    <Icon size={28} className={isActive ? 'text-white' : 'text-gray-500'} />
                  </div>
                ) : (
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                )}
                <span className={`text-[10px] font-medium transition-colors ${
                  item.highlight ? 'text-gray-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-2 w-full"></div>
      </div>
    );
  };

  // ==================== 首页 ====================
  const renderHome = () => (
    <div className="space-y-6">
      {/* 头部问候 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}，{currentUser?.name || '老师'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>
          <img 
            src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'} 
            alt="Avatar" 
            className="w-10 h-10 rounded-xl object-cover"
          />
        </div>
      </div>

      {/* Desktop: Two column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 今日课程时间表 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                今日课程
              </h3>
              <button className="text-sm text-blue-600 font-medium">查看全部</button>
            </div>
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                    cls.status === 'ongoing' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-center min-w-[60px] ${cls.status === 'ongoing' ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className="text-lg font-bold">{cls.time}</div>
                    <div className="text-xs">{cls.duration}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{cls.title}</h4>
                    <p className="text-sm text-gray-500">{cls.classroom} · {cls.studentCount}人</p>
                  </div>
                  {cls.status === 'ongoing' ? (
                    <button 
                      onClick={() => startClass(cls.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1"
                    >
                      <Play size={14} fill="currentColor" /> 进入
                    </button>
                  ) : cls.status === 'completed' ? (
                    <span className="text-xs text-gray-400">已完成</span>
                  ) : (
                    <span className="text-xs text-gray-400">待开始</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 最近学生提问 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">学生提问</h3>
              <button 
                onClick={() => setActiveTab('courses')}
                className="text-sm text-blue-600 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {questions.slice(0, 3).map((q) => (
                <div 
                  key={q.id} 
                  onClick={() => { setSelectedQuestion(q); setShowQuestionDetail(true); }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <img src={q.studentAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{q.studentName}</span>
                      <span className="text-xs text-gray-400">{q.timestamp}</span>
                      {q.status === 'unanswered' && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{q.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{q.courseName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6 mt-6 lg:mt-0">
          {/* 快速操作 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2">快速开始</h3>
            <p className="text-blue-100 text-sm mb-4">准备好开始今天的教学了吗？</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setActiveTab('class')}
                className="py-3 bg-white text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Video size={18} /> 开始上课
              </button>
              <button 
                onClick={() => setActiveTab('assignments')}
                className="py-3 bg-blue-400/50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <ClipboardList size={18} /> 布置作业
              </button>
            </div>
          </div>

          {/* 待办事项 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">待办事项</h3>
            <div className="space-y-3">
              {todos.map((todo) => (
                <button 
                  key={todo.id} 
                  onClick={() => {
                    if (todo.type === 'homework') setActiveTab('assignments');
                  }}
                  className={`w-full p-4 rounded-2xl text-left transition-all active:scale-95 flex items-center gap-3 ${
                    todo.urgent ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    todo.type === 'homework' ? 'bg-orange-100 text-orange-600' :
                    todo.type === 'question' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {todo.type === 'homework' ? <ClipboardList size={20} /> :
                     todo.type === 'question' ? <MessageCircle size={20} /> :
                     <Bell size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-bold ${todo.urgent ? 'text-red-600' : 'text-gray-900'}`}>{todo.count}</p>
                    <p className="text-xs text-gray-500 truncate">{todo.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== 我的课程 ====================
  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的课程</h1>
        <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <Filter size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 课程统计 - 使用真实数据 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:max-w-3xl">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : stats.courseCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">我的课程</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : stats.studentCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">学生总数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : stats.pendingGrading}
          </p>
          <p className="text-xs text-gray-500 mt-1">待批改</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : stats.weekHours}
          </p>
          <p className="text-xs text-gray-500 mt-1">本周课时</p>
        </div>
      </div>

      {/* 课程列表 - Desktop: Grid, Mobile: Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {myCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            <div className="relative h-40 lg:h-48">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs text-white">
                  {course.category}
                </span>
                <h3 className="text-white font-bold mt-1 text-lg">{course.title}</h3>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  <span>{course.studentCount} 名学生</span>
                </div>
                <span className="text-sm text-blue-600 font-medium">{course.nextClass}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{course.progress}%</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => startClass(course.id)}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> 开始上课
                </button>
                <button className="px-4 py-2.5 bg-gray-100 rounded-xl text-gray-600">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==================== 上课模块 ====================
  const renderClass = () => {
    if (!isClassActive) {
      return (
        <div className="space-y-6 pb-24">
          <h1 className="text-2xl font-bold text-gray-900">开始上课</h1>
          
          {/* 待开始课程 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">今日待上课程</h3>
            <div className="space-y-3">
              {todayClasses.filter(c => c.status !== 'completed').map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <BookOpen size={28} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{cls.title}</h4>
                    <p className="text-sm text-gray-500">{cls.time} · {cls.classroom}</p>
                  </div>
                  <button 
                    onClick={() => startClass(cls.id)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
                  >
                    <Play size={16} fill="currentColor" /> 开始
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock size={28} className="text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">课程回放</h4>
              <p className="text-xs text-gray-500 mt-1">查看历史课程录像</p>
            </button>
            <button className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={28} className="text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">课件管理</h4>
              <p className="text-xs text-gray-500 mt-1">上传和管理课件</p>
            </button>
          </div>
        </div>
      );
    }

    // 课堂进行中界面
    const activeCourse = myCourses.find(c => c.id === activeClassId);
    const presentCount = attendanceList.filter(s => s.status === 'present').length;
    const lateCount = attendanceList.filter(s => s.status === 'late').length;
    const absentCount = attendanceList.filter(s => s.status === 'absent').length;

    return (
      <div className="space-y-4 pb-24">
        {/* 课堂头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{activeCourse?.title || '课堂进行中'}</h2>
              <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                <Clock size={14} /> 已进行 {formatTime(classTimer)}
              </p>
            </div>
            <button 
              onClick={endClass}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Square size={14} fill="currentColor" /> 结束
            </button>
          </div>
          
          {/* 快捷工具 */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                isScreenSharing ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
              }`}
            >
              <Monitor size={18} /> {isScreenSharing ? '停止共享' : '屏幕共享'}
            </button>
            <button className="flex-1 py-3 bg-white/20 rounded-xl font-medium flex items-center justify-center gap-2 text-white">
              <Users size={18} /> 邀请学生
            </button>
          </div>
        </div>

        {/* 白板区域（简化版） */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <PenLine size={18} className="text-blue-500" /> 课堂白板
            </h3>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-100 rounded-lg text-gray-600"><PenLine size={16} /></button>
              <button className="p-2 bg-gray-100 rounded-lg text-gray-600"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <PenLine size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">点击开始书写板书</p>
              <p className="text-xs mt-1">支持手写、插入图片、添加文字</p>
            </div>
          </div>
        </div>

        {/* 学生签到 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-green-500" /> 学生签到
            </h3>
            <div className="flex gap-3 text-sm">
              <span className="text-green-600">出勤 {presentCount}</span>
              <span className="text-yellow-600">迟到 {lateCount}</span>
              <span className="text-red-600">缺勤 {absentCount}</span>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attendanceList.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                <img src={student.avatar} alt="" className="w-10 h-10 rounded-full" />
                <span className="flex-1 font-medium text-gray-900">{student.name}</span>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  student.status === 'present' ? 'bg-green-100 text-green-700' :
                  student.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {student.status === 'present' ? '已签到' : student.status === 'late' ? '迟到' : '缺勤'}
                </span>
                {student.checkInTime && <span className="text-xs text-gray-400">{student.checkInTime}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 互动工具 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: MessageCircle, label: '提问', color: 'bg-blue-100 text-blue-600' },
            { icon: CheckCircle2, label: '投票', color: 'bg-green-100 text-green-600' },
            { icon: ClipboardList, label: '随堂测', color: 'bg-purple-100 text-purple-600' },
            { icon: MoreHorizontal, label: '更多', color: 'bg-gray-100 text-gray-600' },
          ].map((tool, idx) => (
            <button key={idx} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color}`}>
                <tool.icon size={20} />
              </div>
              <span className="text-xs text-gray-600">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ==================== 作业管理 ====================
  const renderAssignments = () => {
    if (showCreateAssignment) {
      return (
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCreateAssignment(false)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">布置作业</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作业标题</label>
              <input 
                type="text" 
                placeholder="请输入作业标题"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所属课程</label>
              <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500">
                <option>项目管理基础</option>
                <option>敏捷开发实践</option>
                <option>风险管理专题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">作业内容</label>
              <textarea 
                rows={4}
                placeholder="请输入作业要求和内容..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">附件</label>
              <button className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex flex-col items-center gap-2">
                <Plus size={24} />
                <span className="text-sm">点击上传附件</span>
              </button>
            </div>
            <button 
              onClick={() => setShowCreateAssignment(false)}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium"
            >
              发布作业
            </button>
          </div>
        </div>
      );
    }

    if (showAssignmentDetail && selectedAssignment) {
      return (
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAssignmentDetail(false)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">{selectedAssignment.title}</h1>
              <p className="text-xs text-gray-500">{selectedAssignment.courseName}</p>
            </div>
          </div>

          {/* 提交统计 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{selectedAssignment.submittedCount}/{selectedAssignment.totalCount}</p>
                <p className="text-sm text-gray-500">已提交/总人数</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {Math.round((selectedAssignment.submittedCount / selectedAssignment.totalCount) * 100)}%
                </p>
                <p className="text-sm text-gray-500">提交率</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${(selectedAssignment.submittedCount / selectedAssignment.totalCount) * 100}%` }} 
              />
            </div>
          </div>

          {/* 学生提交列表 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">学生提交</h3>
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => setGradingStudent(sub)}
                  className="p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={sub.studentAvatar} alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{sub.studentName}</h4>
                      <p className="text-xs text-gray-500">{sub.submittedAt}</p>
                    </div>
                    {sub.status === 'graded' ? (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold">{sub.score}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-lg">待批改</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{sub.content}</p>
                  {sub.attachments.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {sub.attachments.map((att, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-500 flex items-center gap-1">
                          <FileText size={12} /> {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 评分弹窗
    if (gradingStudent) {
      return (
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setGradingStudent(null)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">批改作业</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <img src={gradingStudent.studentAvatar} alt="" className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="font-bold text-gray-900">{gradingStudent.studentName}</h3>
                <p className="text-sm text-gray-500">{gradingStudent.submittedAt}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-gray-700">{gradingStudent.content}</p>
              {gradingStudent.attachments.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {gradingStudent.attachments.map((att, idx) => (
                    <button key={idx} className="px-3 py-2 bg-white rounded-xl text-sm text-gray-600 flex items-center gap-2">
                      <FileText size={14} /> {att}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  defaultValue={gradingStudent.score || ''}
                  placeholder="0-100"
                  className="w-24 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold"
                />
                <span className="text-gray-500">分</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">评语</label>
              <textarea 
                rows={3}
                defaultValue={gradingStudent.comment || ''}
                placeholder="请输入评语..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button 
              onClick={() => setGradingStudent(null)}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium"
            >
              提交批改
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
          <button 
            onClick={() => setShowCreateAssignment(true)}
            className="px-4 py-2 bg-blue-600 rounded-xl text-white flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">布置作业</span>
          </button>
        </div>

        {/* 作业状态筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
          {['全部', '批改中', '待开始', '已完成'].map((filter, idx) => (
            <button 
              key={filter}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                idx === 0 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* 作业列表 - Desktop: Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <div 
              key={assignment.id} 
              onClick={() => { setSelectedAssignment(assignment); setShowAssignmentDetail(true); }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.courseName}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  assignment.status === 'grading' ? 'bg-orange-100 text-orange-600' :
                  assignment.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {assignment.status === 'grading' ? '批改中' : assignment.status === 'pending' ? '进行中' : '已完成'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> 截止 {assignment.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} /> {assignment.submittedCount}/{assignment.totalCount} 提交
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    assignment.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(assignment.submittedCount / assignment.totalCount) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==================== 个人中心 ====================
  const renderProfile = () => (
    <div className="space-y-6">
      {/* Desktop: Two column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Left: User info */}
        <div className="lg:col-span-1">
          {/* 用户信息卡片 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 text-white lg:sticky lg:top-8">
            <div className="flex items-center gap-4">
              <img 
                src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'} 
                alt="Avatar" 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
              />
              <div>
                <h2 className="text-xl font-bold">{currentUser?.name || '教师'}</h2>
                <p className="text-blue-100 text-sm">{currentUser?.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-white/20 rounded-lg text-xs">高级教师</span>
                  <span className="px-2 py-1 bg-white/20 rounded-lg text-xs">5年教龄</span>
                </div>
              </div>
            </div>
          </div>

          {/* 教学统计 */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-gray-900">128</p>
              <p className="text-sm text-gray-500">累计授课</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-gray-900">4.9</p>
              <p className="text-sm text-gray-500">学生评分</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-gray-900">856</p>
              <p className="text-sm text-gray-500">学生总数</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-gray-900">92%</p>
              <p className="text-sm text-gray-500">课程好评率</p>
            </div>
          </div>
        </div>

        {/* Right: Menu and logout */}
        <div className="lg:col-span-2 mt-6 lg:mt-0 space-y-6">
          {/* 功能菜单 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { icon: BookOpen, label: '我的课程', value: '4门' },
              { icon: FileText, label: '教学资源', value: '32个' },
              { icon: Clock, label: '授课记录', value: '' },
              { icon: Download, label: '资料下载', value: '' },
              { icon: MessageCircle, label: '帮助与反馈', value: '' },
            ].map((item, idx) => (
              <button 
                key={item.label}
                className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 ${
                  idx !== 4 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <item.icon size={20} className="text-gray-600" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
                <span className="text-sm text-gray-400">{item.value}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>

          {/* 退出登录 - Mobile only */}
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-medium lg:hidden"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );

  // ==================== 提问详情弹窗 ====================
  const renderQuestionDetail = () => {
    if (!showQuestionDetail || !selectedQuestion) return null;

    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {/* 头部 */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <button 
              onClick={() => setShowQuestionDetail(false)}
              className="p-2 bg-gray-100 rounded-xl"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">问题详情</h1>
          </div>

          {/* 问题内容 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-start gap-3">
              <img src={selectedQuestion.studentAvatar} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{selectedQuestion.studentName}</span>
                  <span className="text-xs text-gray-400">{selectedQuestion.timestamp}</span>
                </div>
                <div className="mt-2 p-4 bg-gray-50 rounded-2xl rounded-tl-none">
                  <p className="text-gray-700">{selectedQuestion.content}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedQuestion.courseName}</p>
              </div>
            </div>

            {/* 回复区域 */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">回复</h4>
              <textarea 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                placeholder="请输入您的回复..."
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => {
                setReplyContent('');
                setShowQuestionDetail(false);
              }}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Send size={18} /> 发送回复
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 主渲染 ====================
  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHome();
      case 'courses': return renderCourses();
      case 'class': return renderClass();
      case 'assignments': return renderAssignments();
      case 'profile': return renderProfile();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      {renderSidebar()}
      
      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile: max-w-lg constraint, Desktop: full width */}
        <div className="lg:max-w-none max-w-lg mx-auto min-h-screen">
          <div className="p-4 lg:p-8 pb-24 lg:pb-8">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {renderBottomNav()}
      {renderQuestionDetail()}
    </div>
  );
};

export default TeacherDashboard;
