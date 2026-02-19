import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Monitor, Users,
  MessageCircle, PenLine, Trash2, ArrowLeft, BarChart3,
  Plus, X, QrCode, Copy, RefreshCw, Maximize2, Minimize2,
  FileText
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface ActiveClassroomProps {
  sessionId: string;
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onEndClass?: () => void;
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

// 生成6位数字签到码
const generateCheckInCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ActiveClassroom: React.FC<ActiveClassroomProps> = ({
  sessionId,
  onNavigate,
  onEndClass
}) => {
  // 课堂状态
  const [classTimer, setClassTimer] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareViewers] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 签到码
  const [checkInCode, setCheckInCode] = useState<string>('');
  const [, setCodeExpiresAt] = useState<Date | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  // 签到学生列表
  const [attendanceList, setAttendanceList] = useState<AttendanceStudent[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  
  // 白板
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushWidth, setBrushWidth] = useState(3);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  
  // 互动工具
  const [activeTab, setActiveTab] = useState<'attendance' | 'questions' | 'polls' | 'notes'>('attendance');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [classNotes, setClassNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  
  // 弹窗状态
  const [showPollModal, setShowPollModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  
  // 课堂信息
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // 加载课堂信息
  useEffect(() => {
    const loadSessionInfo = async () => {
      const { data } = await supabase
        .from('app_class_sessions')
        .select(`
          *,
          course:course_id (title, image)
        `)
        .eq('id', sessionId)
        .single();
      
      if (data) {
        setSessionInfo(data);
        // 如果已有签到码，使用现有的
        if (data.check_in_code) {
          setCheckInCode(data.check_in_code);
          setCodeExpiresAt(data.check_in_expires_at ? new Date(data.check_in_expires_at) : null);
        } else {
          // 生成新签到码
          generateNewCode();
        }
      }
    };
    
    loadSessionInfo();
  }, [sessionId]);

  // 生成新签到码
  const generateNewCode = async () => {
    const newCode = generateCheckInCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期
    
    setCheckInCode(newCode);
    setCodeExpiresAt(expiresAt);
    
    // 保存到数据库
    await supabase
      .from('app_class_sessions')
      .update({
        check_in_code: newCode,
        check_in_expires_at: expiresAt.toISOString()
      })
      .eq('id', sessionId);
  };

  // 复制签到码
  const copyCheckInCode = () => {
    navigator.clipboard.writeText(checkInCode);
    // 可以添加toast提示
  };

  // 课堂计时器
  useEffect(() => {
    const interval = setInterval(() => {
      setClassTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 实时订阅签到数据
  useEffect(() => {
    const loadAttendance = async () => {
      const { data } = await supabase
        .from('app_attendance')
        .select(`
          *,
          student:student_id (id, name, avatar)
        `)
        .eq('session_id', sessionId);
      
      if (data) {
        const list: AttendanceStudent[] = data.map(record => ({
          id: record.student?.id || record.id,
          name: record.student?.name || '未知学生',
          avatar: record.student?.avatar || `https://i.pravatar.cc/150?u=${record.student_id}`,
          status: (record.status === 'present' ? 'present' : record.status === 'late' ? 'late' : 'absent') as 'present' | 'late' | 'absent',
          checkInTime: record.checked_in_at 
            ? new Date(record.checked_in_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            : undefined
        }));
        setAttendanceList(list);
        updateStats(list);
      }
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
      }, () => {
        loadAttendance();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  // 更新统计
  const updateStats = (list: AttendanceStudent[]) => {
    setPresentCount(list.filter(s => s.status === 'present').length);
    setLateCount(list.filter(s => s.status === 'late').length);
    setAbsentCount(list.filter(s => s.status === 'absent').length);
  };

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

  // 结束课堂
  const handleEndClass = async () => {
    if (!confirm('确定要结束本节课堂吗？')) return;
    
    await supabase
      .from('app_class_sessions')
      .update({
        status: 'completed',
        actual_end: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    onEndClass?.();
  };

  // 白板绘制
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    if (!isDrawing || !currentStroke) return;
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
        votes: 0
      })),
      totalVotes: 0,
      isActive: true
    };
    
    setActivePoll(poll);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setShowPollModal(false);
  };

  // 添加课堂笔记
  const addNote = () => {
    if (!newNote.trim()) return;
    setClassNotes([...classNotes, newNote]);
    setNewNote('');
  };

  // 渲染签到面板
  const renderAttendancePanel = () => (
    <div className="space-y-4">
      {/* 签到统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
          <p className="text-xs text-green-600 mt-1">已签到</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
          <p className="text-xs text-yellow-600 mt-1">迟到</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-xs text-red-600 mt-1">缺勤</p>
        </div>
      </div>

      {/* 签到码显示 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode size={24} />
            <span className="font-bold text-lg">课堂签到码</span>
          </div>
          <button
            onClick={generateNewCode}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="重新生成"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/20 rounded-xl p-4 text-center">
            <span className="text-4xl font-mono font-bold tracking-widest">{checkInCode}</span>
          </div>
          <button
            onClick={copyCheckInCode}
            className="p-4 bg-white rounded-xl text-blue-600 hover:bg-gray-100 transition-colors"
            title="复制签到码"
          >
            <Copy size={24} />
          </button>
        </div>
        <p className="text-sm text-blue-100 mt-3 text-center">
          学生可在学生端输入此6位数字进行签到
        </p>
      </div>

      {/* 学生列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">签到学生 ({attendanceList.length})</h3>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {attendanceList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-2 opacity-30" />
              <p>暂无学生签到</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attendanceList.map((student) => (
                <div key={student.id} className="p-3 flex items-center gap-3">
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
          )}
        </div>
      </div>
    </div>
  );

  // 渲染提问面板
  const renderQuestionsPanel = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-4">学生提问</h3>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-30" />
            <p>暂无提问</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((q) => (
              <div key={q.id} className={`p-4 rounded-xl ${q.isAnswered ? 'bg-gray-50' : 'bg-blue-50'}`}>
                <div className="flex items-start gap-3">
                  <img src={q.studentAvatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{q.studentName}</span>
                      <span className="text-xs text-gray-400">{q.timestamp}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{q.content}</p>
                    {!q.isAnswered && (
                      <button
                        onClick={() => {
                          setQuestions(questions.map(qs => 
                            qs.id === q.id ? { ...qs, isAnswered: true } : qs
                          ));
                        }}
                        className="text-xs text-blue-600 mt-2 hover:underline"
                      >
                        标记已回答
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 渲染投票面板
  const renderPollsPanel = () => (
    <div className="space-y-4">
      {!activePoll ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">暂无进行中的投票</p>
          <button
            onClick={() => setShowPollModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            发起投票
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">当前投票</h3>
            <button
              onClick={() => setActivePoll(null)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              结束投票
            </button>
          </div>
          <p className="text-gray-700 mb-4">{activePoll.question}</p>
          <div className="space-y-3">
            {activePoll.options.map((option) => (
              <div key={option.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{option.text}</span>
                  <span className="text-gray-500">{option.votes} 票</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${activePoll.totalVotes > 0 ? (option.votes / activePoll.totalVotes) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            共 {activePoll.totalVotes} 人参与
          </p>
        </div>
      )}
    </div>
  );

  // 渲染笔记面板
  const renderNotesPanel = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-4">课堂笔记</h3>
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {classNotes.map((note, idx) => (
            <div key={idx} className="p-3 bg-yellow-50 rounded-xl text-sm text-gray-700">
              {note}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addNote()}
            placeholder="添加笔记..."
            className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.(Page.TEACHER_CLASSROOM)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{sessionInfo?.course?.title || '课堂进行中'}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={14} />
              已进行 {formatTime(classTimer)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={handleEndClass}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
          >
            结束课堂
          </button>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧：教学区域 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 功能按钮 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${
                isScreenSharing ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Monitor size={24} />
              <span className="text-sm font-medium">{isScreenSharing ? '停止共享' : '屏幕共享'}</span>
            </button>
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-colors ${
                showWhiteboard ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <PenLine size={24} />
              <span className="text-sm font-medium">白板</span>
            </button>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="p-4 rounded-2xl bg-white hover:bg-gray-50 flex flex-col items-center gap-2 transition-colors"
            >
              <QrCode size={24} />
              <span className="text-sm font-medium">签到码</span>
            </button>
            <button
              onClick={() => setShowPollModal(true)}
              className="p-4 rounded-2xl bg-white hover:bg-gray-50 flex flex-col items-center gap-2 transition-colors"
            >
              <BarChart3 size={24} />
              <span className="text-sm font-medium">投票</span>
            </button>
          </div>

          {/* 屏幕共享区域 */}
          {isScreenSharing && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4 aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Monitor size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">正在共享屏幕</p>
                <p className="text-sm text-gray-400 mt-1">{screenShareViewers} 人正在观看</p>
              </div>
            </div>
          )}

          {/* 白板区域 */}
          {showWhiteboard && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">课堂白板</h3>
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
                  <button 
                    onClick={clearWhiteboard}
                    className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="relative h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  width={800}
                  height={256}
                />
              </div>
            </div>
          )}
        </div>

        {/* 右侧：互动面板 */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* 标签页 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'attendance', label: '签到', icon: Users },
              { id: 'questions', label: '提问', icon: MessageCircle },
              { id: 'polls', label: '投票', icon: BarChart3 },
              { id: 'notes', label: '笔记', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                  activeTab === id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {/* 面板内容 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'attendance' && renderAttendancePanel()}
            {activeTab === 'questions' && renderQuestionsPanel()}
            {activeTab === 'polls' && renderPollsPanel()}
            {activeTab === 'notes' && renderNotesPanel()}
          </div>
        </div>
      </div>

      {/* 签到码弹窗 */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">课堂签到码</h2>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 mb-6">
              <span className="text-6xl font-mono font-bold text-white tracking-widest">
                {checkInCode}
              </span>
            </div>
            <p className="text-gray-500 mb-6">
              学生可在学生端输入此6位数字进行签到
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyCheckInCode}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                复制签到码
              </button>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 投票创建弹窗 */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">发起投票</h2>
              <button
                onClick={() => setShowPollModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投票问题
                </label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  placeholder="请输入投票问题"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选项
                </label>
                <div className="space-y-2">
                  {newPollOptions.map((option, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newPollOptions];
                        newOptions[idx] = e.target.value;
                        setNewPollOptions(newOptions);
                      }}
                      placeholder={`选项 ${idx + 1}`}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <button
                  onClick={() => setNewPollOptions([...newPollOptions, ''])}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  + 添加选项
                </button>
              </div>
              <button
                onClick={createPoll}
                disabled={!newPollQuestion.trim() || newPollOptions.some(opt => !opt.trim())}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                发起投票
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveClassroom;
