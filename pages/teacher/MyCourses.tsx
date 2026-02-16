import React, { useState, useMemo } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Search, Plus, Filter, MoreHorizontal, Users,
  Clock, ChevronRight, BarChart3, Play, FileText,
  Star, TrendingUp, Edit3, Trash2, Archive, X
} from 'lucide-react';
import { Page, UserProfile } from '../../types';

interface MyCoursesProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 课程状态类型
type CourseStatus = 'active' | 'completed' | 'draft' | 'archived';

// 课程数据接口
interface TeacherCourse {
  id: string;
  title: string;
  category: 'Foundation' | 'Advanced' | 'Implementation';
  description: string;
  studentCount: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  completionRate: number;
  image: string;
  status: CourseStatus;
  nextClass?: string;
  rating: number;
  createdAt: string;
  totalAssignments: number;
  pendingAssignments: number;
}

// 课程表单接口
interface CourseForm {
  title: string;
  category: 'Foundation' | 'Advanced' | 'Implementation';
  description: string;
  duration: number;
  maxStudents: number;
}

// 底部导航 Tab 类型
type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

const MyCourses: React.FC<MyCoursesProps> = ({
  currentUser: _currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'students' | 'progress'>('recent');
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);

  // 课程表单状态
  const [courseForm, setCourseForm] = useState<CourseForm>({
    title: '',
    category: 'Foundation',
    description: '',
    duration: 20,
    maxStudents: 30
  });

  // 表单错误状态
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CourseForm, string>>>({});

  // 模拟课程数据
  const [courses, setCourses] = useState<TeacherCourse[]>([
    {
      id: 'course1',
      title: '项目管理基础',
      category: 'Foundation',
      description: '系统学习项目管理的核心理念与实践方法，掌握项目启动、规划、执行、监控与收尾的全过程管理技能。',
      studentCount: 32,
      totalHours: 24,
      completedHours: 18,
      progress: 75,
      completionRate: 82,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
      status: 'active',
      nextClass: '明天 09:00',
      rating: 4.8,
      createdAt: '2026-01-15',
      totalAssignments: 6,
      pendingAssignments: 2
    },
    {
      id: 'course2',
      title: '敏捷开发实践',
      category: 'Advanced',
      description: '深入理解敏捷开发方法论，学习Scrum和Kanban框架，提升团队协作与交付效率。',
      studentCount: 28,
      totalHours: 20,
      completedHours: 12,
      progress: 60,
      completionRate: 68,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      status: 'active',
      nextClass: '今天 14:00',
      rating: 4.9,
      createdAt: '2026-01-20',
      totalAssignments: 5,
      pendingAssignments: 3
    },
    {
      id: 'course3',
      title: '风险管理专题',
      category: 'Implementation',
      description: '全面学习项目风险识别、评估与应对策略，建立有效的风险管理体系。',
      studentCount: 30,
      totalHours: 16,
      completedHours: 7,
      progress: 45,
      completionRate: 55,
      image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
      status: 'active',
      nextClass: '今天 16:00',
      rating: 4.7,
      createdAt: '2026-02-01',
      totalAssignments: 4,
      pendingAssignments: 1
    },
    {
      id: 'course4',
      title: '项目沟通管理',
      category: 'Foundation',
      description: '掌握项目沟通技巧与 stakeholder 管理方法，提升团队协作效率。',
      studentCount: 25,
      totalHours: 12,
      completedHours: 11,
      progress: 90,
      completionRate: 92,
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
      status: 'active',
      nextClass: '周三 10:00',
      rating: 4.6,
      createdAt: '2026-01-10',
      totalAssignments: 4,
      pendingAssignments: 0
    },
    {
      id: 'course5',
      title: '项目质量管理',
      category: 'Advanced',
      description: '学习项目质量规划、保证与控制方法，确保项目交付成果符合预期标准。',
      studentCount: 22,
      totalHours: 18,
      completedHours: 18,
      progress: 100,
      completionRate: 95,
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
      status: 'completed',
      rating: 4.9,
      createdAt: '2025-12-01',
      totalAssignments: 5,
      pendingAssignments: 0
    },
    {
      id: 'course6',
      title: '采购与合同管理',
      category: 'Implementation',
      description: '学习项目采购流程与合同管理实务，掌握供应商选择与合同谈判技巧。',
      studentCount: 0,
      totalHours: 14,
      completedHours: 0,
      progress: 0,
      completionRate: 0,
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
      status: 'draft',
      rating: 0,
      createdAt: '2026-02-10',
      totalAssignments: 0,
      pendingAssignments: 0
    },
    {
      id: 'course7',
      title: '项目成本管理（旧版）',
      category: 'Foundation',
      description: '旧版课程，已不再使用。',
      studentCount: 0,
      totalHours: 16,
      completedHours: 16,
      progress: 100,
      completionRate: 100,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      status: 'archived',
      rating: 4.2,
      createdAt: '2024-09-01',
      totalAssignments: 0,
      pendingAssignments: 0
    }
  ]);

  // 重置表单
  const resetForm = () => {
    setCourseForm({
      title: '',
      category: 'Foundation',
      description: '',
      duration: 20,
      maxStudents: 30
    });
    setFormErrors({});
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CourseForm, string>> = {};
    
    if (!courseForm.title.trim()) {
      errors.title = '请输入课程标题';
    }
    if (!courseForm.description.trim()) {
      errors.description = '请输入课程描述';
    }
    if (courseForm.duration < 1) {
      errors.duration = '课时数必须大于0';
    }
    if (courseForm.maxStudents < 1) {
      errors.maxStudents = '学生数必须大于0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建课程
  const handleCreateCourse = () => {
    if (!validateForm()) return;

    const newCourse: TeacherCourse = {
      id: `course${Date.now()}`,
      title: courseForm.title,
      category: courseForm.category,
      description: courseForm.description,
      studentCount: 0,
      totalHours: courseForm.duration,
      completedHours: 0,
      progress: 0,
      completionRate: 0,
      image: `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400`,
      status: 'draft',
      rating: 0,
      createdAt: new Date().toISOString().split('T')[0],
      totalAssignments: 0,
      pendingAssignments: 0
    };

    setCourses(prev => [newCourse, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  // 编辑课程
  const handleEditCourse = () => {
    if (!selectedCourse || !validateForm()) return;

    setCourses(prev => prev.map(course => 
      course.id === selectedCourse.id
        ? {
            ...course,
            title: courseForm.title,
            category: courseForm.category,
            description: courseForm.description,
            totalHours: courseForm.duration
          }
        : course
    ));

    setSelectedCourse(prev => prev ? {
      ...prev,
      title: courseForm.title,
      category: courseForm.category,
      description: courseForm.description,
      totalHours: courseForm.duration
    } : null);

    setShowEditModal(false);
    resetForm();
  };

  // 打开编辑模态框
  const openEditModal = (course: TeacherCourse) => {
    setCourseForm({
      title: course.title,
      category: course.category,
      description: course.description,
      duration: course.totalHours,
      maxStudents: course.studentCount || 30
    });
    setShowEditModal(true);
    setShowMoreMenu(null);
  };

  // 删除课程
  const handleDeleteCourse = (courseId: string) => {
    if (confirm('确定要删除这门课程吗？此操作不可恢复。')) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) {
        setShowCourseDetail(false);
        setSelectedCourse(null);
      }
    }
    setShowMoreMenu(null);
  };

  // 归档课程
  const handleArchiveCourse = (courseId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId
        ? { ...course, status: course.status === 'archived' ? 'active' : 'archived' }
        : course
    ));
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(prev => prev ? {
        ...prev,
        status: prev.status === 'archived' ? 'active' : 'archived'
      } : null);
    }
    setShowMoreMenu(null);
  };

  // 过滤和排序课程
  const filteredCourses = useMemo(() => {
    let result = courses;

    // 搜索过滤
    if (searchQuery) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      result = result.filter(course => course.status === statusFilter);
    }

    // 排序
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'students':
          return b.studentCount - a.studentCount;
        case 'progress':
          return b.progress - a.progress;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [courses, searchQuery, statusFilter, sortBy]);

  // 统计数据
  const stats = useMemo(() => {
    const active = courses.filter(c => c.status === 'active').length;
    const completed = courses.filter(c => c.status === 'completed').length;
    const draft = courses.filter(c => c.status === 'draft').length;
    const archived = courses.filter(c => c.status === 'archived').length;
    const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
    const avgCompletion = courses.filter(c => c.status === 'active').reduce((sum, c) => sum + c.completionRate, 0) / active || 0;

    return { active, completed, draft, archived, totalStudents, avgCompletion };
  }, [courses]);

  // 获取状态标签样式
  const getStatusStyle = (status: CourseStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'archived':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusText = (status: CourseStatus) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'draft':
        return '草稿';
      case 'archived':
        return '已归档';
    }
  };

  // 处理Tab切换
  const handleTabChange = (tab: TeacherTab) => {
    setActiveTab(tab);
    if (onNavigate) {
      switch (tab) {
        case 'home':
          onNavigate(Page.TEACHER_DASHBOARD);
          break;
        case 'courses':
          // 当前页面，不跳转
          break;
        case 'class':
          onNavigate(Page.TEACHER_CLASSROOM);
          break;
        case 'assignments':
          onNavigate(Page.TEACHER_ASSIGNMENTS);
          break;
        case 'profile':
          onNavigate(Page.TEACHER_PROFILE);
          break;
      }
    }
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
                onClick={() => handleTabChange(item.id as TeacherTab)}
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

  // ==================== 课程详情页 ====================
  const renderCourseDetail = () => {
    if (!selectedCourse) return null;

    return (
      <div className="space-y-6 pb-24">
        {/* 返回按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCourseDetail(false)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <ChevronRight size={20} className="text-gray-600 rotate-180" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{selectedCourse.title}</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(showMoreMenu === selectedCourse.id ? null : selectedCourse.id)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
            
            {/* 更多操作菜单 */}
            {showMoreMenu === selectedCourse.id && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                <button
                  onClick={() => openEditModal(selectedCourse)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 size={16} />
                  编辑课程
                </button>
                <button
                  onClick={() => handleArchiveCourse(selectedCourse.id)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Archive size={16} />
                  {selectedCourse.status === 'archived' ? '取消归档' : '归档课程'}
                </button>
                <button
                  onClick={() => handleDeleteCourse(selectedCourse.id)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  删除课程
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 课程封面 */}
        <div className="relative h-48 rounded-3xl overflow-hidden">
          <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusStyle(selectedCourse.status)}`}>
              {getStatusText(selectedCourse.status)}
            </span>
            <h2 className="text-white font-bold text-xl mt-2">{selectedCourse.title}</h2>
            <p className="text-white/80 text-sm">{selectedCourse.category}</p>
          </div>
        </div>

        {/* 课程统计 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Users size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{selectedCourse.studentCount}</p>
            <p className="text-[10px] text-gray-500">学生数</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Clock size={20} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{selectedCourse.totalHours}</p>
            <p className="text-[10px] text-gray-500">总课时</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <TrendingUp size={20} className="text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{selectedCourse.completionRate}%</p>
            <p className="text-[10px] text-gray-500">完成率</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <Star size={20} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{selectedCourse.rating || '-'}</p>
            <p className="text-[10px] text-gray-500">评分</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">课程进度</h3>
            <span className="text-blue-600 font-bold">{selectedCourse.progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${selectedCourse.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            已完成 {selectedCourse.completedHours} / {selectedCourse.totalHours} 课时
          </p>
        </div>

        {/* 课程描述 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">课程简介</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{selectedCourse.description}</p>
        </div>

        {/* 作业统计 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">作业情况</h3>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{selectedCourse.totalAssignments}</p>
              <p className="text-xs text-gray-500">总作业</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{selectedCourse.pendingAssignments}</p>
              <p className="text-xs text-gray-500">待批改</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {selectedCourse.totalAssignments - selectedCourse.pendingAssignments}
              </p>
              <p className="text-xs text-gray-500">已批改</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate?.(Page.TEACHER_CLASSROOM)}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play size={18} fill="currentColor" /> 开始上课
          </button>
          <button className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <FileText size={18} /> 管理课件
          </button>
        </div>
      </div>
    );
  };

  // ==================== 课程表单模态框 ====================
  const renderCourseFormModal = (
    isEdit: boolean,
    show: boolean,
    onClose: () => void,
    onSubmit: () => void
  ) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? '编辑课程' : '创建新课程'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入课程标题"
                className={`w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  formErrors.title ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {formErrors.title && (
                <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程分类 <span className="text-red-500">*</span>
              </label>
              <select 
                value={courseForm.category}
                onChange={(e) => setCourseForm(prev => ({ 
                  ...prev, 
                  category: e.target.value as CourseForm['category'] 
                }))}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Foundation">Foundation（基础）</option>
                <option value="Advanced">Advanced（进阶）</option>
                <option value="Implementation">Implementation（实战）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="请输入课程描述..."
                className={`w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all ${
                  formErrors.description ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总课时 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="课时数"
                  min={1}
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    formErrors.duration ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {formErrors.duration && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预计学生数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={courseForm.maxStudents}
                  onChange={(e) => setCourseForm(prev => ({ 
                    ...prev, 
                    maxStudents: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="学生数"
                  min={1}
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    formErrors.maxStudents ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {formErrors.maxStudents && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.maxStudents}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程封面</label>
              <button className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                <Plus size={24} />
                <span className="text-sm">点击上传封面</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all"
            >
              {isEdit ? '保存修改' : '创建课程'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== 主页面 ====================
  const renderMainContent = () => (
    <div className="space-y-6 pb-24">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的课程</h1>
          <p className="text-sm text-gray-500 mt-1">管理您的所有课程</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span className="hidden sm:inline font-medium">创建课程</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">授课中</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          <p className="text-xs text-gray-400 mt-1">门课程</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500">学生数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-xs text-gray-400 mt-1">人</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">平均完成率</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgCompletion)}%</p>
          <p className="text-xs text-gray-400 mt-1">活跃课程</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Archive size={16} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">已归档</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.archived}</p>
          <p className="text-xs text-gray-400 mt-1">门课程</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="space-y-3">
        {/* 搜索框 */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索课程..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '进行中' },
            { key: 'completed', label: '已完成' },
            { key: 'draft', label: '草稿' },
            { key: 'archived', label: '已归档' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key as CourseStatus | 'all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 排序选项 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="recent">最近创建</option>
              <option value="students">学生数量</option>
              <option value="progress">课程进度</option>
            </select>
          </div>
          <span className="text-sm text-gray-500">
            共 {filteredCourses.length} 门课程
          </span>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? '未找到匹配的课程' : statusFilter !== 'all' ? `暂无${
                statusFilter === 'active' ? '进行中' :
                statusFilter === 'completed' ? '已完成' :
                statusFilter === 'draft' ? '草稿' :
                statusFilter === 'archived' ? '已归档' : ''
              }的课程` : '还没有课程'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">
              {searchQuery ? '试试其他关键词搜索' : '点击下方按钮创建您的第一门课程'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all"
              >
                创建课程
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
            >
              {/* 课程封面 */}
              <div 
                onClick={() => { setSelectedCourse(course); setShowCourseDetail(true); }}
                className="relative h-36"
              >
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusStyle(course.status)}`}>
                    {getStatusText(course.status)}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{course.title}</h3>
                  <p className="text-white/80 text-xs">{course.category}</p>
                </div>
              </div>

              {/* 课程信息 */}
              <div className="p-4">
                {/* 统计行 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Users size={14} />
                      {course.studentCount} 人
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={14} />
                      {course.totalHours} 课时
                    </span>
                  </div>
                  {course.rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <Star size={14} fill="currentColor" />
                      {course.rating}
                    </span>
                  )}
                </div>

                {/* 进度条 */}
                {course.status === 'active' && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">课程进度</span>
                      <span className="text-blue-600 font-medium">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 学生完成率 */}
                {course.status === 'active' && course.studentCount > 0 && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">学生完成率</span>
                    <span className="text-xs font-medium text-green-600">{course.completionRate}%</span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.(Page.TEACHER_CLASSROOM);
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Play size={14} fill="currentColor" /> 上课
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(showMoreMenu === course.id ? null : course.id);
                    }}
                    className="relative px-3 py-2 bg-gray-100 rounded-xl text-gray-600 active:scale-95 transition-transform"
                  >
                    <MoreHorizontal size={16} />
                    
                    {/* 更多操作菜单 */}
                    {showMoreMenu === course.id && (
                      <div 
                        className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEditModal(course)}
                          className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 size={14} />
                          编辑
                        </button>
                        <button
                          onClick={() => handleArchiveCourse(course.id)}
                          className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Archive size={14} />
                          {course.status === 'archived' ? '取消归档' : '归档'}
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(null);
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreMenu]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-6">
      {/* 主内容 */}
      {showCourseDetail ? renderCourseDetail() : renderMainContent()}

      {/* 创建课程模态框 */}
      {renderCourseFormModal(
        false,
        showCreateModal,
        () => setShowCreateModal(false),
        handleCreateCourse
      )}

      {/* 编辑课程模态框 */}
      {renderCourseFormModal(
        true,
        showEditModal,
        () => setShowEditModal(false),
        handleEditCourse
      )}

      {/* 底部导航 */}
      {renderBottomNav()}
    </div>
  );
};

export default MyCourses;
