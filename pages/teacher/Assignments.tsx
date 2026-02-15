
import React, { useState } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Users, ChevronLeft, Plus, FileText,
  Star, MoreHorizontal, Search,
  CheckCircle2, Trash2, Download,
  CheckSquare, Square, Calendar
} from 'lucide-react';
import { Page, UserProfile } from '../../types';

interface AssignmentsProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 作业类型
interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  content: string;
  deadline: string;
  createdAt: string;
  submittedCount: number;
  totalCount: number;
  status: 'pending' | 'grading' | 'completed';
  maxScore: number;
  attachments: string[];
}

// 学生提交
interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  assignmentId: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  score?: number;
  comment?: string;
  status: 'submitted' | 'graded' | 'late';
}

// 课程类型
interface Course {
  id: string;
  title: string;
  studentCount: number;
}

type AssignmentView = 'list' | 'create' | 'detail' | 'grade';
type AssignmentFilter = 'all' | 'grading' | 'pending' | 'completed';

const Assignments: React.FC<AssignmentsProps> = ({
  currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  // 视图状态
  const [currentView, setCurrentView] = useState<AssignmentView>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 批量操作状态
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showBatchAction, setShowBatchAction] = useState(false);
  
  // 表单状态
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    courseId: '',
    content: '',
    deadline: '',
    maxScore: 100
  });
  
  // 批改状态
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    comment: ''
  });

  // 模拟课程数据
  const [courses] = useState<Course[]>([
    { id: 'course1', title: '项目管理基础', studentCount: 32 },
    { id: 'course2', title: '敏捷开发实践', studentCount: 28 },
    { id: 'course3', title: '风险管理专题', studentCount: 30 },
    { id: 'course4', title: '项目沟通管理', studentCount: 25 },
  ]);

  // 模拟作业数据
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 'a1',
      title: '项目计划书撰写',
      courseId: 'course1',
      courseName: '项目管理基础',
      content: '请根据所学知识，撰写一份完整的项目计划书，包含项目背景、目标、范围、WBS分解、甘特图、风险评估等内容。字数要求：3000字以上。',
      deadline: '2026-02-16 23:59',
      createdAt: '2026-02-10',
      submittedCount: 28,
      totalCount: 32,
      status: 'grading',
      maxScore: 100,
      attachments: ['项目计划书模板.docx']
    },
    {
      id: 'a2',
      title: '敏捷看板设计',
      courseId: 'course2',
      courseName: '敏捷开发实践',
      content: '设计一个敏捷开发团队的看板，包含待办、进行中、已完成等列，并说明每个列的WIP限制。',
      deadline: '2026-02-18 23:59',
      createdAt: '2026-02-11',
      submittedCount: 15,
      totalCount: 28,
      status: 'pending',
      maxScore: 100,
      attachments: []
    },
    {
      id: 'a3',
      title: '风险评估报告',
      courseId: 'course3',
      courseName: '风险管理专题',
      content: '选择一个实际项目案例，进行风险识别、定性和定量分析，并制定应对策略。',
      deadline: '2026-02-15 23:59',
      createdAt: '2026-02-08',
      submittedCount: 30,
      totalCount: 30,
      status: 'completed',
      maxScore: 100,
      attachments: ['风险评估模板.xlsx']
    },
    {
      id: 'a4',
      title: '沟通计划制定',
      courseId: 'course4',
      courseName: '项目沟通管理',
      content: '为虚拟项目制定详细的沟通管理计划，包括干系人分析、沟通渠道、会议安排等。',
      deadline: '2026-02-20 23:59',
      createdAt: '2026-02-12',
      submittedCount: 8,
      totalCount: 25,
      status: 'pending',
      maxScore: 100,
      attachments: []
    },
    {
      id: 'a5',
      title: 'WBS分解练习',
      courseId: 'course1',
      courseName: '项目管理基础',
      content: '对一个软件项目进行WBS分解，要求分解到工作包级别，至少包含三级分解。',
      deadline: '2026-02-14 23:59',
      createdAt: '2026-02-07',
      submittedCount: 32,
      totalCount: 32,
      status: 'completed',
      maxScore: 50,
      attachments: ['WBS示例.pdf']
    }
  ]);

  // 模拟学生提交数据
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 's1',
      studentId: 'st1',
      studentName: '张明',
      studentAvatar: 'https://i.pravatar.cc/150?u=1',
      assignmentId: 'a1',
      submittedAt: '2026-02-14 20:30',
      content: '已完成项目计划书，包含WBS分解和甘特图。项目背景部分详细分析了市场需求，目标设定符合SMART原则。',
      attachments: ['项目计划书.pdf', '甘特图.xlsx'],
      status: 'submitted'
    },
    {
      id: 's2',
      studentId: 'st2',
      studentName: '李华',
      studentAvatar: 'https://i.pravatar.cc/150?u=2',
      assignmentId: 'a1',
      submittedAt: '2026-02-14 19:15',
      content: '项目计划书已提交，请老师批阅。本次作业主要聚焦在软件开发项目的管理上。',
      attachments: ['计划书.docx'],
      score: 85,
      comment: '整体结构清晰，但风险评估部分需要补充。建议在项目执行阶段加强监控。',
      status: 'graded'
    },
    {
      id: 's3',
      studentId: 'st3',
      studentName: '王芳',
      studentAvatar: 'https://i.pravatar.cc/150?u=3',
      assignmentId: 'a1',
      submittedAt: '2026-02-14 21:00',
      content: '这是我的项目计划书，包含了详细的时间安排和资源分配计划。',
      attachments: ['计划书.pdf'],
      status: 'submitted'
    },
    {
      id: 's4',
      studentId: 'st4',
      studentName: '陈小明',
      studentAvatar: 'https://i.pravatar.cc/150?u=4',
      assignmentId: 'a1',
      submittedAt: '2026-02-15 00:30',
      content: '因为网络原因延迟提交，作业内容已完成。',
      attachments: ['项目计划书.pdf'],
      status: 'late'
    },
    {
      id: 's5',
      studentId: 'st5',
      studentName: '刘小红',
      studentAvatar: 'https://i.pravatar.cc/150?u=5',
      assignmentId: 'a1',
      submittedAt: '2026-02-14 18:00',
      content: '项目计划书提交，包含了完整的项目管理流程。',
      attachments: ['计划书.docx'],
      score: 92,
      comment: '优秀！内容全面，分析深入，尤其是风险应对策略部分很有见地。',
      status: 'graded'
    }
  ]);

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 过滤作业
  const filteredAssignments = assignments.filter(assignment => {
    if (filter !== 'all' && assignment.status !== filter) return false;
    if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // 获取当前作业的提交列表
  const getCurrentSubmissions = () => {
    if (!selectedAssignment) return [];
    return submissions.filter(s => s.assignmentId === selectedAssignment.id);
  };

  // 提交新作业
  const handleCreateAssignment = () => {
    if (!assignmentForm.title || !assignmentForm.courseId || !assignmentForm.deadline) return;
    
    const course = courses.find(c => c.id === assignmentForm.courseId);
    const newAssignment: Assignment = {
      id: `a${Date.now()}`,
      title: assignmentForm.title,
      courseId: assignmentForm.courseId,
      courseName: course?.title || '',
      content: assignmentForm.content,
      deadline: assignmentForm.deadline,
      createdAt: new Date().toISOString().split('T')[0],
      submittedCount: 0,
      totalCount: course?.studentCount || 0,
      status: 'pending',
      maxScore: assignmentForm.maxScore,
      attachments: []
    };
    
    setAssignments([newAssignment, ...assignments]);
    setAssignmentForm({ title: '', courseId: '', content: '', deadline: '', maxScore: 100 });
    setCurrentView('list');
  };

  // 提交批改
  const handleGradeSubmit = () => {
    if (!selectedSubmission) return;
    
    setSubmissions(submissions.map(s => 
      s.id === selectedSubmission.id 
        ? { ...s, score: gradeForm.score, comment: gradeForm.comment, status: 'graded' as const }
        : s
    ));
    
    // 更新作业提交统计
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === selectedSubmission.assignmentId);
    const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded' || (s.id === selectedSubmission.id)).length;
    
    setAssignments(assignments.map(a => 
      a.id === selectedSubmission.assignmentId 
        ? { ...a, status: gradedCount === a.totalCount ? 'completed' : 'grading' }
        : a
    ));
    
    setSelectedSubmission(null);
    setGradeForm({ score: 0, comment: '' });
    setCurrentView('detail');
  };

  // 批量选择提交
  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const currentSubs = getCurrentSubmissions();
    const ungradedSubs = currentSubs.filter(s => s.status !== 'graded');
    if (selectedSubmissions.length === ungradedSubs.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(ungradedSubs.map(s => s.id));
    }
  };

  // 批量通过
  const handleBatchPass = () => {
    setSubmissions(submissions.map(s => 
      selectedSubmissions.includes(s.id) 
        ? { ...s, score: selectedAssignment?.maxScore || 100, comment: '批量通过', status: 'graded' as const }
        : s
    ));
    setSelectedSubmissions([]);
    setShowBatchAction(false);
  };

  // 删除作业
  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
    if (selectedAssignment?.id === assignmentId) {
      setCurrentView('list');
      setSelectedAssignment(null);
    }
  };

  // ==================== 底部导航 ====================
  const renderBottomNav = () => {
    const navItems = [
      { id: 'home', icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
      { id: 'courses', icon: BookOpen, label: '课程', page: Page.TEACHER_COURSES },
      { id: 'class', icon: Video, label: '上课', highlight: true, page: Page.TEACHER_DASHBOARD },
      { id: 'assignments', icon: ClipboardList, label: '作业', page: Page.TEACHER_DASHBOARD },
      { id: 'profile', icon: User, label: '我的', page: Page.TEACHER_DASHBOARD },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.id === 'assignments';
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'assignments') {
                    setCurrentView('list');
                    setSelectedAssignment(null);
                  } else if (onNavigate) {
                    onNavigate(item.page);
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

  // ==================== 作业列表视图 ====================
  const renderAssignmentList = () => (
    <div className="space-y-6 pb-24">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}，{currentUser?.name || '老师'}</h1>
        </div>
        <img 
          src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'} 
          alt="Avatar" 
          className="w-10 h-10 rounded-xl object-cover"
        />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {assignments.filter(a => a.status === 'grading').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">待批改</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {assignments.filter(a => a.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">进行中</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">
            {assignments.filter(a => a.status === 'completed').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">已结束</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索作业..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'grading', label: '待批改' },
            { key: 'pending', label: '进行中' },
            { key: 'completed', label: '已结束' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as AssignmentFilter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === item.key 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 布置作业按钮 */}
      <button
        onClick={() => setCurrentView('create')}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-transform"
      >
        <Plus size={20} />
        布置新作业
      </button>

      {/* 作业列表 */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size=  {32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">暂无作业</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => {
                setSelectedAssignment(assignment);
                setCurrentView('detail');
              }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.courseName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    assignment.status === 'grading' ? 'bg-orange-100 text-orange-600' :
                    assignment.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {assignment.status === 'grading' ? '待批改' : assignment.status === 'pending' ? '进行中' : '已结束'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAssignment(assignment.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{assignment.content}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className={new Date(assignment.deadline) < new Date() ? 'text-red-500' : ''} />
                  截止 {assignment.deadline.split(' ')[0]}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {assignment.submittedCount}/{assignment.totalCount} 提交
                </span>
                <span className="flex items-center gap-1">
                  <Star size={14} />
                  满分 {assignment.maxScore}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      assignment.status === 'completed' ? 'bg-green-500' :
                      assignment.status === 'grading' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(assignment.submittedCount / assignment.totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {Math.round((assignment.submittedCount / assignment.totalCount) * 100)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ==================== 创建作业视图 ====================
  const renderCreateAssignment = () => (
    <div className="space-y-6 pb-24">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setCurrentView('list');
            setAssignmentForm({ title: '', courseId: '', content: '', deadline: '', maxScore: 100 });
          }}
          className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">布置作业</h1>
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">作业标题 <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="请输入作业标题"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">所属课程 <span className="text-red-500">*</span></label>
          <select
            value={assignmentForm.courseId}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">请选择课程</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title} ({course.studentCount}人)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">作业内容 <span className="text-red-500">*</span></label>
          <textarea
            rows={6}
            placeholder="请输入作业要求、内容说明、评分标准等..."
            value={assignmentForm.content}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">截止日期 <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={assignmentForm.deadline}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">满分分数</label>
            <input
              type="number"
              min={1}
              max={200}
              value={assignmentForm.maxScore}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: parseInt(e.target.value) || 100 })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">附件 (可选)</label>
          <button className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
            <Plus size={24} />
            <span className="text-sm">点击上传附件或拖拽文件到此处</span>
          </button>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={handleCreateAssignment}
            disabled={!assignmentForm.title || !assignmentForm.courseId || !assignmentForm.deadline}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            发布作业
          </button>
          <button
            onClick={() => {
              setCurrentView('list');
              setAssignmentForm({ title: '', courseId: '', content: '', deadline: '', maxScore: 100 });
            }}
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );

  // ==================== 作业详情视图 ====================
  const renderAssignmentDetail = () => {
    if (!selectedAssignment) return null;
    const currentSubs = getCurrentSubmissions();
    const gradedCount = currentSubs.filter(s => s.status === 'graded').length;
    const avgScore = currentSubs.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount || 0;

    return (
      <div className="space-y-6 pb-24">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedAssignment(null);
              setSelectedSubmissions([]);
              setShowBatchAction(false);
            }}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{selectedAssignment.title}</h1>
            <p className="text-xs text-gray-500">{selectedAssignment.courseName}</p>
          </div>
          <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <MoreHorizontal size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{selectedAssignment.submittedCount}</p>
              <p className="text-xs text-gray-500 mt-1">已提交</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{gradedCount}</p>
              <p className="text-xs text-gray-500 mt-1">已批改</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{avgScore > 0 ? avgScore.toFixed(1) : '-'}</p>
              <p className="text-xs text-gray-500 mt-1">平均分</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(selectedAssignment.submittedCount / selectedAssignment.totalCount) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            提交率 {Math.round((selectedAssignment.submittedCount / selectedAssignment.totalCount) * 100)}%
          </p>
        </div>

        {/* 作业信息 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">作业要求</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{selectedAssignment.content}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              截止: {selectedAssignment.deadline}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} />
              满分: {selectedAssignment.maxScore}分
            </span>
          </div>
        </div>

        {/* 学生提交列表 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">学生提交 ({currentSubs.length})</h3>
            {currentSubs.some(s => s.status !== 'graded') && (
              <button
                onClick={() => setShowBatchAction(!showBatchAction)}
                className="text-sm text-blue-600 font-medium"
              >
                {showBatchAction ? '取消' : '批量操作'}
              </button>
            )}
          </div>

          {/* 批量操作栏 */}
          {showBatchAction && selectedSubmissions.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
              <span className="text-sm text-gray-600">已选 {selectedSubmissions.length} 项</span>
              <button
                onClick={handleBatchPass}
                className="ml-auto px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <CheckCircle2 size={14} />
                批量通过
              </button>
            </div>
          )}

          {/* 全选 */}
          {showBatchAction && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                {selectedSubmissions.length === currentSubs.filter(s => s.status !== 'graded').length ? (
                  <CheckSquare size={18} className="text-blue-600" />
                ) : (
                  <Square size={18} />
                )}
                全选
              </button>
            </div>
          )}

          <div className="space-y-3">
            {currentSubs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无学生提交</p>
              </div>
            ) : (
              currentSubs.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => {
                    if (showBatchAction && sub.status !== 'graded') {
                      toggleSubmissionSelection(sub.id);
                    } else {
                      setSelectedSubmission(sub);
                      setGradeForm({ score: sub.score || 0, comment: sub.comment || '' });
                      setCurrentView('grade');
                    }
                  }}
                  className="p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {showBatchAction && sub.status !== 'graded' && (
                      <div onClick={(e) => { e.stopPropagation(); toggleSubmissionSelection(sub.id); }}>
                        {selectedSubmissions.includes(sub.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                      </div>
                    )}
                    <img src={sub.studentAvatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-sm">{sub.studentName}</h4>
                        {sub.status === 'late' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded">迟交</span>
                        )}
                      </div>
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
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">{sub.content}</p>
                  {sub.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {sub.attachments.map((att, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-500 flex items-center gap-1">
                          <FileText size={12} /> {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== 批改视图 ====================
  const renderGradeView = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="space-y-6 pb-24">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentView('detail');
              setSelectedSubmission(null);
            }}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">批改作业</h1>
        </div>

        {/* 学生信息 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <img src={selectedSubmission.studentAvatar} alt="" className="w-14 h-14 rounded-full" />
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{selectedSubmission.studentName}</h3>
              <p className="text-sm text-gray-500">提交时间: {selectedSubmission.submittedAt}</p>
              {selectedSubmission.status === 'late' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">迟交</span>
              )}
            </div>
          </div>
        </div>

        {/* 作业内容 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">提交内容</h3>
          <p className="text-gray-700 whitespace-pre-line">{selectedSubmission.content}</p>
          
          {selectedSubmission.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">附件</p>
              <div className="flex gap-2 flex-wrap">
                {selectedSubmission.attachments.map((att, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 flex items-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <FileText size={16} />
                    {att}
                    <Download size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 评分表单 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-bold text-gray-900">评分与评语</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">评分 (0-{selectedAssignment?.maxScore || 100})</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={selectedAssignment?.maxScore || 100}
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: parseInt(e.target.value) || 0 })}
                className="w-28 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold"
              />
              <span className="text-gray-500">分</span>
              {/* 快速评分按钮 */}
              <div className="flex gap-2 ml-auto">
                {[60, 80, 90, 100].map(score => (
                  <button
                    key={score}
                    onClick={() => setGradeForm({ ...gradeForm, score })}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">评语</label>
            <textarea
              rows={4}
              placeholder="请输入评语..."
              value={gradeForm.comment}
              onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 resize-none transition-all"
            />
            {/* 快捷评语 */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {['完成得很好', '内容充实，分析深入', '需要补充更多细节', '继续努力'].map(comment => (
                <button
                  key={comment}
                  onClick={() => setGradeForm({ ...gradeForm, comment })}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                >
                  {comment}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleGradeSubmit}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 size={18} />
              提交批改
            </button>
            <button
              onClick={() => {
                setCurrentView('detail');
                setSelectedSubmission(null);
              }}
              className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-all"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 主渲染 ====================
  const renderContent = () => {
    switch (currentView) {
      case 'list':
        return renderAssignmentList();
      case 'create':
        return renderCreateAssignment();
      case 'detail':
        return renderAssignmentDetail();
      case 'grade':
        return renderGradeView();
      default:
        return renderAssignmentList();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default Assignments;
