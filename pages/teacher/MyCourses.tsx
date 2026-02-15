import React, { useState, useMemo } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Search, Plus, Filter, MoreHorizontal, Users,
  Clock, ChevronRight, BarChart3, Play, FileText,
  Star, TrendingUp
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
  category: string;
  description: string;
  studentCount: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  completionRate: number; // 学生完成率
  image: string;
  status: CourseStatus;
  nextClass?: string;
  rating: number;
  createdAt: string;
  totalAssignments: number;
  pendingAssignments: number;
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

  // 模拟课程数据
  const [courses] = useState<TeacherCourse[]>([
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
    }
  ]);

  // 过滤和排序课程
  const filteredCourses = useMemo(() => {
    let result = courses;

    // 搜索过滤
    if (searchQuery) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
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
    const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
    const avgCompletion = courses.filter(c => c.status === 'active').reduce((sum, c) => sum + c.completionRate, 0) / active || 0;

    return { active, completed, draft, totalStudents, avgCompletion };
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
          // 可以跳转到上课页面
          break;
        case 'assignments':
          // 可以跳转到作业页面
          break;
        case 'profile':
          onNavigate(Page.PROFILE);
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCourseDetail(false)}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <ChevronRight size={20} className="text-gray-600 rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{selectedCourse.title}</h1>
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
          <button className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Play size={18} fill="currentColor" /> 开始上课
          </button>
          <button className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2">
            <FileText size={18} /> 管理课件
          </button>
        </div>
      </div>
    );
  };

  // ==================== 创建课程模态框 ====================
  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">创建新课程</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 bg-gray-100 rounded-xl"
            >
              <Plus size={20} className="text-gray-600 rotate-45" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程标题</label>
              <input
                type="text"
                placeholder="请输入课程标题"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程分类</label>
              <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Foundation</option>
                <option>Advanced</option>
                <option>Implementation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程描述</label>
              <textarea
                rows={3}
                placeholder="请输入课程描述..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">总课时</label>
                <input
                  type="number"
                  placeholder="课时数"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预计学生数</label>
                <input
                  type="number"
                  placeholder="学生数"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程封面</label>
              <button className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex flex-col items-center gap-2">
                <Plus size={24} />
                <span className="text-sm">点击上传封面</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(false)}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium mt-4"
          >
            创建课程
          </button>
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
          onClick={() => setShowCreateModal(true)}
          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
        >
          <Plus size={24} />
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
              <Star size={16} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">已完成</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
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
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '进行中' },
            { key: 'completed', label: '已完成' },
            { key: 'draft', label: '草稿' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key as CourseStatus | 'all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 排序选项 */}
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
      </div>

      {/* 课程列表 */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">暂无课程</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
            >
              创建课程
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => { setSelectedCourse(course); setShowCourseDetail(true); }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
            >
              {/* 课程封面 */}
              <div className="relative h-36">
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
                      // 开始上课
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Play size={14} fill="currentColor" /> 上课
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 更多操作
                    }}
                    className="px-3 py-2 bg-gray-100 rounded-xl text-gray-600"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-6">
      {/* 主内容 */}
      {showCourseDetail ? renderCourseDetail() : renderMainContent()}

      {/* 创建课程模态框 */}
      {renderCreateModal()}

      {/* 底部导航 */}
      {renderBottomNav()}
    </div>
  );
};

export default MyCourses;
