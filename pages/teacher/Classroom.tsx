
import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Clock, Play, Square, Monitor, Users, CheckCircle2,
  MessageCircle, PenLine, Trash2,
  ArrowLeft, BarChart3, Plus, X
} from 'lucide-react';
import { Page, UserProfile } from '../../types';

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

const TeacherClassroom: React.FC<TeacherClassroomProps> = ({
  currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  // 上课状态管理
  const [activeTab, setActiveTab] = useState<TeacherTab>('class');
  const [isClassActive, setIsClassActive] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [classTimer, setClassTimer] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // 白板状态
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushWidth, setBrushWidth] = useState(3);

  // 互动工具状态
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  // 模拟课程数据
  const [courseClasses, setCourseClasses] = useState<CourseClass[]>([
    { 
      id: 'c1', 
      title: '项目管理基础', 
      time: '09:00', 
      duration: '45分钟', 
      classroom: 'A101', 
      studentCount: 32, 
      status: ClassStatus.COMPLETED,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'
    },
    { 
      id: 'c2', 
      title: '敏捷开发实践', 
      time: '14:00', 
      duration: '45分钟', 
      classroom: 'B203', 
      studentCount: 28, 
      status: ClassStatus.ONGOING,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400'
    },
    { 
      id: 'c3', 
      title: '风险管理专题', 
      time: '16:00', 
      duration: '45分钟', 
      classroom: 'A105', 
      studentCount: 30, 
      status: ClassStatus.UPCOMING,
      image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400'
    },
    { 
      id: 'c4', 
      title: '项目沟通管理', 
      time: '明天 10:00', 
      duration: '45分钟', 
      classroom: 'C301', 
      studentCount: 25, 
      status: ClassStatus.UPCOMING,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400'
    },
  ]);

  // 模拟学生签到数据
  const [attendanceList] = useState<AttendanceStudent[]>([
    { id: 'st1', name: '张明', avatar: 'https://i.pravatar.cc/150?u=1', status: 'present', checkInTime: '13:58' },
    { id: 'st2', name: '李华', avatar: 'https://i.pravatar.cc/150?u=2', status: 'present', checkInTime: '13:59' },
    { id: 'st3', name: '王芳', avatar: 'https://i.pravatar.cc/150?u=3', status: 'late', checkInTime: '14:05' },
    { id: 'st4', name: '陈小明', avatar: 'https://i.pravatar.cc/150?u=4', status: 'present', checkInTime: '13:57' },
    { id: 'st5', name: '刘小红', avatar: 'https://i.pravatar.cc/150?u=5', status: 'present', checkInTime: '13:55' },
    { id: 'st6', name: '赵小强', avatar: 'https://i.pravatar.cc/150?u=6', status: 'absent' },
    { id: 'st7', name: '周小敏', avatar: 'https://i.pravatar.cc/150?u=7', status: 'present', checkInTime: '14:00' },
    { id: 'st8', name: '吴小波', avatar: 'https://i.pravatar.cc/150?u=8', status: 'present', checkInTime: '13:56' },
  ]);

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
  const startClass = (classId: string) => {
    setActiveClassId(classId);
    setIsClassActive(true);
    setClassTimer(0);
    // 更新课程状态
    setCourseClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, status: ClassStatus.ONGOING } : c
    ));
  };

  // 结束上课
  const endClass = () => {
    if (confirm('确定要结束本节课堂吗？')) {
      setIsClassActive(false);
      setActiveClassId(null);
      setClassTimer(0);
      setIsScreenSharing(false);
      setStrokes([]);
      setActivePoll(null);
      // 更新课程状态
      if (activeClassId) {
        setCourseClasses(prev => prev.map(c => 
          c.id === activeClassId ? { ...c, status: ClassStatus.COMPLETED } : c
        ));
      }
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
    return courseClasses.find(c => c.id === activeClassId);
  };

  // 统计签到数据
  const getAttendanceStats = () => {
    const present = attendanceList.filter(s => s.status === 'present').length;
    const late = attendanceList.filter(s => s.status === 'late').length;
    const absent = attendanceList.filter(s => s.status === 'absent').length;
    return { present, late, absent, total: attendanceList.length };
  };

  // ==================== 底部导航 ====================
  const renderBottomNav = () => {
    const navItems = [
      { id: 'home', icon: Home, label: '首页' },
      { id: 'courses', icon: BookOpen, label: '课程' },
      { id: 'class', icon: Video, label: '上课', highlight: true },
      { id: 'assignments', icon: ClipboardList, label: '作业' },
      { id: 'profile', icon: User, label: '我的' },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TeacherTab);
                  if (item.id !== 'class' && onNavigate) {
                    const pageMap: Record<string, Page> = {
                      'home': Page.TEACHER_DASHBOARD,
                      'courses': Page.TEACHER_COURSES,
                      'assignments': Page.TEACHER_DASHBOARD,
                      'profile': Page.PROFILE
                    };
                    onNavigate(pageMap[item.id]);
                  }
                }}
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
        
        {upcomingClasses.length === 0 ? (
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1 animate-pulse"
                  >
                    <Play size={14} fill="currentColor" /> 继续
                  </button>
                ) : (
                  <button 
                    onClick={() => startClass(cls.id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-1"
                  >
                    <Play size={14} fill="currentColor" /> 开始
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
                onClick={() => setIsClassActive(false)}
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
                isScreenSharing ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Monitor size={18} /> {isScreenSharing ? '停止共享' : '屏幕共享'}
            </button>
            <button className="flex-1 py-3 bg-white/20 rounded-xl font-medium flex items-center justify-center gap-2 text-white hover:bg-white/30 transition-colors">
              <Users size={18} /> 邀请学生
            </button>
          </div>
        </div>

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

        {/* 学生签到 */}
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
          
          {/* 签到进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>签到率</span>
              <span>{Math.round(((stats.present + stats.late) / stats.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                style={{ width: `${((stats.present + stats.late) / stats.total) * 100}%` }} 
              />
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attendanceList.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
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
            ))}
          </div>
        </div>

        {/* 互动工具 */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowQuestionModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-200 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <MessageCircle size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">学生提问</span>
            <span className="text-xs text-gray-500">{questions.filter(q => !q.isAnswered).length} 个未回答</span>
          </button>
          
          <button 
            onClick={() => setShowPollModal(true)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-green-200 transition-colors"
          >
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <BarChart3 size={24} />
            </div>
            <span className="text-sm font-medium text-gray-900">课堂投票</span>
            <span className="text-xs text-gray-500">{activePoll ? '进行中' : '发起投票'}</span>
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

  // ==================== 主渲染 ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
        <div className="p-6">
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
            <div className="space-y-6 pb-24">
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
      </div>
      
      {renderBottomNav()}
      {renderQuestionModal()}
      {renderPollModal()}
    </div>
  );
};

export default TeacherClassroom;
