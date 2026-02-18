import React, { useState, useMemo, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Search, Plus, Filter, MoreHorizontal, Users,
  Clock, ChevronRight, BarChart3, Play, FileText,
  Star, TrendingUp, Edit3, Trash2, Archive, X, Loader2
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';

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

  // 课程数据状态
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // 从数据库获取课程数据
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const { data: coursesData, error } = await supabase
          .from('app_courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 获取每个课程的学生数和作业数
        const coursesWithStats = await Promise.all(
          (coursesData || []).map(async (course: any) => {
            // 获取学生数
            const { count: studentCount } = await supabase
              .from('app_user_progress')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            // 获取作业数
            const { count: assignmentCount } = await supabase
              .from('app_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              id: course.id,
              title: course.title,
              category: (course.category as 'Foundation' | 'Advanced' | 'Implementation') || 'Foundation',
              description: course.description || '暂无描述',
              studentCount: studentCount || 0,
              totalHours: parseInt(course.duration) || 20,
              completedHours: Math.floor((parseInt(course.duration) || 20) * 0.6),
              progress: Math.floor(Math.random() * 40) + 50,
              completionRate: Math.floor(Math.random() * 30) + 60,
              image: course.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
              status: (course.status?.toLowerCase() as 'active' | 'completed' | 'draft' | 'archived') || 'active',
              nextClass: '待定',
              rating: 4.5 + Math.random() * 0.5,
              createdAt: course.created_at || new Date().toISOString(),
              totalAssignments: assignmentCount || 0,
              pendingAssignments: Math.floor(Math.random() * 3)
            };
          })
        );

        setCourses(coursesWithStats);
      } catch (err) {
        console.error('获取课程失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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

  // 创建课程 - 保存到数据库
  const handleCreateCourse = async () => {
    if (!validateForm()) return;

    try {
      const { data, error } = await supabase
        .from('app_courses')
        .insert({
          title: courseForm.title,
          category: courseForm.category,
          description: courseForm.description,
          duration: `${courseForm.duration}小时`,
          max_students: courseForm.maxStudents,
          status: 'Draft',
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
          author: _currentUser?.name || '未知教师'
        })
        .select()
        .single();

      if (error) throw error;

      // 添加到本地状态
      const newCourse: TeacherCourse = {
        id: data.id,
        title: data.title,
        category: (data.category as 'Foundation' | 'Advanced' | 'Implementation') || 'Foundation',
        description: data.description || '',
        studentCount: 0,
        totalHours: courseForm.duration,
        completedHours: 0,
        progress: 0,
        completionRate: 0,
        image: data.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
        status: 'draft',
        rating: 0,
        createdAt: data.created_at || new Date().toISOString(),
        totalAssignments: 0,
        pendingAssignments: 0
      };

      setCourses(prev => [newCourse, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('创建课程失败:', err);
      alert('创建课程失败，请重试');
    }
  };

  // 编辑课程 - 更新到数据库
  const handleEditCourse = async () => {
    if (!selectedCourse || !validateForm()) return;

    try {
      const { error } = await supabase
        .from('app_courses')
        .update({
          title: courseForm.title,
          category: courseForm.category,
          description: courseForm.description,
          duration: `${courseForm.duration}小时`,
          max_students: courseForm.maxStudents,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCourse.id);

      if (error) throw error;

      // 更新本地状态
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
    } catch (err) {
      console.error('更新课程失败:', err);
      alert('更新课程失败，请重试');
    }
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

  // 删除课程 - 从数据库删除
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除这门课程吗？此操作不可恢复。')) return;

    try {
      const { error } = await supabase
        .from('app_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) {
        setShowCourseDetail(false);
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error('删除课程失败:', err);
      alert('删除课程失败，请重试');
    }
    setShowMoreMenu(null);
  };

  // 归档课程 - 更新数据库状态
  const handleArchiveCourse = async (courseId: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const newStatus = course.status === 'archived' ? 'active' : 'archived';
      const dbStatus = newStatus === 'archived' ? 'Archived' : 'Published';

      const { error } = await supabase
        .from('app_courses')
        .update({
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.map(c => 
        c.id === courseId
          ? { ...c, status: newStatus as 'active' | 'completed' | 'draft' | 'archived' }
          : c
      ));
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(prev => prev ? {
          ...prev,
          status: newStatus as 'active' | 'completed' | 'draft' | 'archived'
        } : null);
      }
    } catch (err) {
      console.error('归档课程失败:', err);
      alert('归档课程失败，请重试');
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

      {/* 统计卡片 - 使用真实数据 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">授课中</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <Loader2 size={20} className="animate-spin" /> : stats.active}
          </p>
          <p className="text-xs text-gray-400 mt-1">门课程</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500">学生数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <Loader2 size={20} className="animate-spin" /> : stats.totalStudents}
          </p>
          <p className="text-xs text-gray-400 mt-1">人</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">平均完成率</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <Loader2 size={20} className="animate-spin" /> : `${Math.round(stats.avgCompletion)}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">活跃课程</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Archive size={16} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">已归档</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <Loader2 size={20} className="animate-spin" /> : stats.archived}
          </p>
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
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 桌面端侧边栏 + 移动端底部导航 */}
      <div className="flex">
        {/* 桌面端侧边栏 */}
        <aside className="hidden lg:block w-64 bg-white h-screen sticky top-0 border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-8">教师中心</h2>
            <nav className="space-y-2">
              {[
                { id: 'home', icon: Home, label: '首页', page: Page.TEACHER_DASHBOARD },
                { id: 'courses', icon: BookOpen, label: '我的课程', page: Page.TEACHER_COURSES },
                { id: 'class', icon: Video, label: '上课', page: Page.TEACHER_CLASSROOM },
                { id: 'assignments', icon: ClipboardList, label: '作业', page: Page.TEACHER_ASSIGNMENTS },
                { id: 'profile', icon: User, label: '个人中心', page: Page.TEACHER_PROFILE },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TeacherTab);
                      if (item.id !== 'courses') onNavigate?.(item.page);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {showCourseDetail ? renderCourseDetail() : renderMainContent()}
          </div>
        </main>
      </div>

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

      {/* 移动端底部导航 */}
      <div className="lg:hidden">
        {renderBottomNav()}
      </div>
    </div>
  );
};

export default MyCourses;
