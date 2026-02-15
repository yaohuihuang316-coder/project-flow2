
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Users, BarChart3,
  ChevronRight, TrendingUp, Clock,
  Search, Download, Plus, Edit2, Trash2, Eye,
  CheckCircle2, Loader2, ChevronLeft,
  GraduationCap, FileText, PlayCircle, HelpCircle,
  LogOut, Mail
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface TeacherDashboardProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 课程数据接口
interface TeacherCourse {
  id: string;
  title: string;
  category: string;
  studentCount: number;
  avgProgress: number;
  completionRate: number;
  status: 'published' | 'draft' | 'archived';
  updatedAt: string;
  chapters: number;
}

// 学生数据接口
interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledCourses: number;
  avgProgress: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'at_risk';
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  type: 'video' | 'quiz' | 'completion';
  content: string;
  timestamp: string;
}

// 统计数据接口
interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  avgCompletionRate: number;
  totalStudyHours: number;
  recentEnrollments: number;
  trendData: TrendPoint[];
}

interface TrendPoint {
  date: string;
  students: number;
  hours: number;
  completions: number;
}

// 内容管理 - 章节
interface Chapter {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'quiz';
  order: number;
  isPublished: boolean;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  onNavigate: _onNavigate,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // 初始化加载数据
  useEffect(() => {
    fetchTeacherData();
  }, [currentUser?.id]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchStudents(),
        fetchAnalytics()
      ]);
    } catch (err) {
      console.error('获取教师数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取课程列表（关联教师课程表和学生进度表）
  const fetchCourses = async () => {
    if (!currentUser?.id) return;
    
    try {
      // 查询教师关联的课程及学生进度统计
      const { data: courseData, error } = await supabase
        .from('app_teacher_courses')
        .select(`
          course_id,
          app_courses:course_id (
            id,
            title,
            category,
            status,
            updated_at,
            chapters
          )
        `)
        .eq('teacher_id', currentUser.id);

      if (error) throw error;

      // 获取每个课程的学生统计
      const coursesWithStats: TeacherCourse[] = await Promise.all(
        (courseData || []).map(async (tc: any) => {
          const course = tc.app_courses;
          
          // 查询学生注册数
          const { count: studentCount } = await supabase
            .from('app_course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // 查询学生平均进度（从学生端共享的 app_user_progress 表）
          const { data: progressData } = await supabase
            .from('app_user_progress')
            .select('progress')
            .eq('course_id', course.id);

          const avgProgress = progressData && progressData.length > 0
            ? Math.round(progressData.reduce((sum, p) => sum + (p.progress || 0), 0) / progressData.length)
            : 0;

          // 查询完成率
          const completedCount = progressData?.filter(p => (p.progress || 0) >= 100).length || 0;
          const completionRate = progressData && progressData.length > 0
            ? Math.round((completedCount / progressData.length) * 100)
            : 0;

          return {
            id: course.id,
            title: course.title,
            category: course.category || 'Foundation',
            studentCount: studentCount || 0,
            avgProgress,
            completionRate,
            status: course.status?.toLowerCase() as 'published' | 'draft' | 'archived' || 'draft',
            updatedAt: new Date(course.updated_at).toLocaleDateString('zh-CN'),
            chapters: (course.chapters?.length || 0)
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (err) {
      console.error('获取课程失败:', err);
    }
  };

  // 获取学生列表（从学生端共享表读取）
  const fetchStudents = async () => {
    if (!currentUser?.id) return;
    
    try {
      // 获取教师的所有课程ID
      const { data: teacherCourses } = await supabase
        .from('app_teacher_courses')
        .select('course_id')
        .eq('teacher_id', currentUser.id);

      const courseIds = (teacherCourses || []).map((tc: any) => tc.course_id);
      if (courseIds.length === 0) {
        setStudents([]);
        return;
      }

      // 查询这些课程的学生注册信息
      const { data: enrollments, error } = await supabase
        .from('app_course_enrollments')
        .select(`
          student_id,
          course_id,
          status,
          last_accessed_at,
          app_users:student_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'active');

      if (error) throw error;

      // 获取学生进度数据（从学生端 app_user_progress 表）
      const studentIds = [...new Set((enrollments || []).map((e: any) => e.student_id))];
      
      const { data: progressData } = await supabase
        .from('app_user_progress')
        .select('user_id, course_id, progress, last_accessed')
        .in('user_id', studentIds)
        .in('course_id', courseIds);

      // 获取学习活动记录
      const { data: activityData } = await supabase
        .from('app_learning_activities')
        .select('*')
        .in('student_id', studentIds)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(100);

      // 聚合学生数据
      const studentMap = new Map<string, StudentProgress>();

      (enrollments || []).forEach((enrollment: any) => {
        const user = enrollment.app_users;
        if (!studentMap.has(user.id)) {
          // 计算该学生的平均进度
          const studentProgresses = (progressData || []).filter(
            (p: any) => p.user_id === user.id
          );
          const avgProgress = studentProgresses.length > 0
            ? Math.round(studentProgresses.reduce((sum, p) => sum + (p.progress || 0), 0) / studentProgresses.length)
            : 0;

          // 获取最近活动
          const recentActs: ActivityItem[] = (activityData || [])
            .filter((a: any) => a.student_id === user.id)
            .slice(0, 3)
            .map((a: any): ActivityItem => ({
              type: a.activity_type.includes('video') ? 'video' : 
                    a.activity_type.includes('quiz') ? 'quiz' : 'completion',
              content: `${a.activity_type}: ${a.chapter_id || ''}`,
              timestamp: new Date(a.created_at).toLocaleString('zh-CN')
            }));

          // 判断状态
          const lastAccessed = studentProgresses.length > 0
            ? new Date(Math.max(...studentProgresses.map((p: any) => new Date(p.last_accessed).getTime())))
            : null;
          const daysSinceActive = lastAccessed 
            ? Math.floor((Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          studentMap.set(user.id, {
            id: user.id,
            name: user.name || '未命名',
            email: user.email,
            avatar: user.avatar,
            enrolledCourses: studentProgresses.length,
            avgProgress,
            lastActive: lastAccessed?.toLocaleString('zh-CN') || '从未',
            status: daysSinceActive > 7 ? 'at_risk' : daysSinceActive > 3 ? 'inactive' : 'active',
            recentActivity: recentActs
          });
        }
      });

      setStudents(Array.from(studentMap.values()));
    } catch (err) {
      console.error('获取学生失败:', err);
    }
  };

  // 获取统计数据
  const fetchAnalytics = async () => {
    const mockAnalytics: AnalyticsData = {
      totalStudents: 214,
      activeStudents: 186,
      totalCourses: 3,
      avgCompletionRate: 52,
      totalStudyHours: 15840,
      recentEnrollments: 28,
      trendData: [
        { date: '02/08', students: 180, hours: 120, completions: 15 },
        { date: '02/09', students: 182, hours: 145, completions: 18 },
        { date: '02/10', students: 185, hours: 138, completions: 12 },
        { date: '02/11', students: 188, hours: 152, completions: 22 },
        { date: '02/12', students: 192, hours: 168, completions: 25 },
        { date: '02/13', students: 196, hours: 175, completions: 28 },
        { date: '02/14', students: 214, hours: 198, completions: 32 }
      ]
    };
    setAnalytics(mockAnalytics);
  };

  // 打开课程编辑器
  const openCourseEditor = (course: TeacherCourse) => {
    setSelectedCourse(course);
    // 加载章节数据
    const mockChapters: Chapter[] = [
      { id: 'ch-1', title: '第一章：项目管理概述', duration: '15:00', type: 'video', order: 1, isPublished: true },
      { id: 'ch-2', title: '第二章：五大过程组', duration: '20:00', type: 'video', order: 2, isPublished: true },
      { id: 'ch-3', title: '第三章：敏捷宣言', duration: '18:00', type: 'video', order: 3, isPublished: true },
      { id: 'ch-4', title: '第四章：Scrum框架', duration: '25:00', type: 'video', order: 4, isPublished: false },
      { id: 'ch-5', title: '第五章：测验', duration: '30:00', type: 'quiz', order: 5, isPublished: false }
    ];
    setChapters(mockChapters);
    setShowCourseEditor(true);
  };

  // 渲染侧边导航
  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">教师端</h1>
            <p className="text-xs text-gray-500">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'overview', label: '概览', icon: LayoutDashboard },
          { id: 'courses', label: '内容管理', icon: BookOpen },
          { id: 'students', label: '学生进度', icon: Users },
          { id: 'analytics', label: '数据分析', icon: BarChart3 }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon size={20} />
            {item.label}
            {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
          </button>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={currentUser?.avatar || 'https://i.pravatar.cc/150?u=teacher'}
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{currentUser?.name || '教师'}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </div>
  );

  // 渲染概览页
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{analytics?.recentEnrollments || 0}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics?.totalStudents || 0}</p>
          <p className="text-sm text-gray-500">总学生数</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-green-600" size={24} />
            </div>
            <span className="text-xs text-gray-500">
              {analytics?.totalCourses || 0} 门课程
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics?.avgCompletionRate || 0}%</p>
          <p className="text-sm text-gray-500">平均完成率</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="text-amber-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round((analytics?.totalStudyHours || 0) / 1000)}k</p>
          <p className="text-sm text-gray-500">总学习时长(小时)</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics?.activeStudents || 0}</p>
          <p className="text-sm text-gray-500">活跃学生</p>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">学习趋势</h3>
          <div className="h-64 flex items-end gap-2">
            {analytics?.trendData.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${(point.hours / 200) * 100}%` }}
                  title={`${point.date}: ${point.hours}小时`}
                />
                <span className="text-xs text-gray-500">{point.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">课程完成数趋势</h3>
          <div className="h-64 flex items-end gap-2">
            {analytics?.trendData.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                  style={{ height: `${(point.completions / 40) * 100}%` }}
                  title={`${point.date}: ${point.completions}人完成`}
                />
                <span className="text-xs text-gray-500">{point.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近活跃学生 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">最近活跃学生</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {students.slice(0, 5).map(student => (
            <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <img src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.recentActivity[0]?.content || '暂无活动'}</p>
              </div>
              <span className="text-xs text-gray-400">{student.recentActivity[0]?.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染内容管理页
  const renderCourses = () => (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索课程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>全部状态</option>
            <option>已发布</option>
            <option>草稿</option>
            <option>已归档</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          新建课程
        </button>
      </div>

      {/* 课程列表 */}
      <div className="grid grid-cols-1 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-6">
              {/* 课程封面 */}
              <div className="w-32 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-white" size={32} />
              </div>

              {/* 课程信息 */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.category} · {course.chapters} 个章节 · 最后更新 {course.updatedAt}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    course.status === 'published' ? 'bg-green-100 text-green-700' :
                    course.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.status === 'published' ? '已发布' : course.status === 'draft' ? '草稿' : '已归档'}
                  </span>
                </div>

                {/* 统计数据 */}
                <div className="flex items-center gap-8 mt-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{course.studentCount} 名学生</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">平均进度 {course.avgProgress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">完成率 {course.completionRate}%</span>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${course.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openCourseEditor(course)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 size={18} />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="查看">
                  <Eye size={18} />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染课程编辑器
  const renderCourseEditor = () => {
    if (!selectedCourse) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">编辑课程</h2>
              <p className="text-sm text-gray-500">{selectedCourse.title}</p>
            </div>
            <button
              onClick={() => setShowCourseEditor(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-auto p-6">
            {/* 基本信息 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">课程标题</label>
                  <input
                    type="text"
                    defaultValue={selectedCourse.title}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Foundation</option>
                    <option>Advanced</option>
                    <option>Implementation</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 章节管理 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">章节管理</h3>
                <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Plus size={18} />
                  添加章节
                </button>
              </div>

              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                      {chapter.order}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {chapter.type === 'video' && <PlayCircle size={18} className="text-blue-500" />}
                        {chapter.type === 'article' && <FileText size={18} className="text-amber-500" />}
                        {chapter.type === 'quiz' && <HelpCircle size={18} className="text-green-500" />}
                        <span className="font-medium text-gray-900">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{chapter.duration}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          chapter.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {chapter.isPublished ? '已发布' : '未发布'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Edit2 size={16} className="text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setShowCourseEditor(false)}
              className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              保存更改
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染学生进度页
  const renderStudents = () => (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索学生..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>全部状态</option>
            <option>活跃</option>
            <option>有风险</option>
            <option>流失风险</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Mail size={18} />
            发送通知
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={18} />
            导出数据
          </button>
        </div>
      </div>

      {/* 学生列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">学生</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">课程数</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">平均进度</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">最后活跃</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`} alt="" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{student.enrolledCourses}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          student.avgProgress >= 80 ? 'bg-green-500' :
                          student.avgProgress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${student.avgProgress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{student.avgProgress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-700' :
                    student.status === 'at_risk' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {student.status === 'active' ? '活跃' : student.status === 'at_risk' ? '有风险' : '不活跃'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{student.lastActive}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染数据分析页
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* 时间筛选 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">学习数据分析</h2>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
          {['近7天', '近30天', '本学期', '全部'].map((period, i) => (
            <button
              key={period}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === 0 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* 详细图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">学生参与度分析</h3>
          <div className="space-y-4">
            {[
              { label: '视频观看完成率', value: 78, color: 'bg-blue-500' },
              { label: '测验参与率', value: 65, color: 'bg-green-500' },
              { label: '作业提交率', value: 52, color: 'bg-amber-500' },
              { label: '讨论区活跃度', value: 34, color: 'bg-purple-500' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">课程难度分布</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                <circle cx="80" cy="80" r="60" fill="none" stroke="#3b82f6" strokeWidth="20"
                  strokeDasharray={`${0.4 * 377} ${377}`} strokeLinecap="round" />
                <circle cx="80" cy="80" r="60" fill="none" stroke="#10b981" strokeWidth="20"
                  strokeDasharray={`${0.35 * 377} ${377}`} strokeDashoffset={-0.4 * 377} strokeLinecap="round" />
                <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" strokeWidth="20"
                  strokeDasharray={`${0.25 * 377} ${377}`} strokeDashoffset={-0.75 * 377} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">3</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">基础 (40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">进阶 (35%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-sm text-gray-600">实战 (25%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 学习时长热力图 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">学习时长热力图</h3>
        <div className="grid grid-cols-7 gap-2">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
            <div key={day} className="text-center text-sm text-gray-500">{day}</div>
          ))}
          {Array.from({ length: 28 }).map((_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{
                  backgroundColor: intensity > 0.7 ? '#3b82f6' :
                    intensity > 0.4 ? '#60a5fa' :
                    intensity > 0.1 ? '#bfdbfe' : '#f3f4f6'
                }}
                title={`${Math.round(intensity * 8)} 小时`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && '概览'}
              {activeTab === 'courses' && '内容管理'}
              {activeTab === 'students' && '学生进度'}
              {activeTab === 'analytics' && '数据分析'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeTab === 'overview' && '查看教学数据概览'}
              {activeTab === 'courses' && '管理课程内容与章节'}
              {activeTab === 'students' && '追踪学生学习进度'}
              {activeTab === 'analytics' && '深度分析学习数据'}
            </p>
          </div>

          {/* 页面内容 */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </main>

      {/* 课程编辑器弹窗 */}
      {showCourseEditor && renderCourseEditor()}
    </div>
  );
};

export default TeacherDashboard;
