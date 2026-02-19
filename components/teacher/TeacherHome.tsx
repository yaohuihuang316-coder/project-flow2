import React from 'react';
import {
  Calendar, ChevronRight, Bell,
  Play, ClipboardList, MessageCircle, Video
} from 'lucide-react';
import { TeacherStats, TodayClass, TeacherCourse, TodoItem, TeacherTab } from '../../types/teacher';
import { UserProfile } from '../../types';

interface TeacherHomeProps {
  currentUser?: UserProfile | null;
  stats: TeacherStats;
  todayClasses: TodayClass[];
  todos: TodoItem[];
  myCourses: TeacherCourse[];
  loading: boolean;
  onStartClass: (classId: string) => void;
  onNavigate: (tab: TeacherTab) => void;
}

const TeacherHome: React.FC<TeacherHomeProps> = ({
  currentUser,
  stats,
  todayClasses,
  todos,
  myCourses,
  loading,
  onStartClass,
  onNavigate
}) => {
  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="space-y-6">
      {/* 头部问候 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}，{currentUser?.name || '老师'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
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
              {loading ? (
                <div className="text-center py-8 text-gray-400">加载中...</div>
              ) : todayClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">今日暂无课程</div>
              ) : (
                todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                      cls.status === 'ongoing'
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`text-center min-w-[60px] ${
                        cls.status === 'ongoing' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <div className="text-lg font-bold">{cls.time}</div>
                      <div className="text-xs">{cls.duration}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{cls.title}</h4>
                      <p className="text-sm text-gray-500">
                        {cls.classroom} · {cls.studentCount}人
                      </p>
                    </div>
                    {cls.status === 'ongoing' ? (
                      <button
                        onClick={() => onStartClass(cls.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1"
                      >
                        <Play size={14} fill="currentColor" /> 进入
                      </button>
                    ) : cls.status === 'completed' ? (
                      <span className="text-xs text-gray-400">已完成</span>
                    ) : (
                      <button
                        onClick={() => onStartClass(cls.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1"
                      >
                        <Play size={14} fill="currentColor" /> 开始
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 最近课程 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">我的课程</h3>
              <button
                onClick={() => onNavigate('courses')}
                className="text-sm text-blue-600 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCourses.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  className="p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                      <p className="text-sm text-gray-500">{course.studentCount} 名学生</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{course.progress}%</span>
                      </div>
                    </div>
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
                onClick={() => onNavigate('class')}
                className="py-3 bg-white text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Video size={18} /> 开始上课
              </button>
              <button
                onClick={() => onNavigate('assignments')}
                className="py-3 bg-blue-400/50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <ClipboardList size={18} /> 布置作业
              </button>
            </div>
          </div>

          {/* 统计概览 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">教学统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-blue-600">{stats.courseCount}</p>
                <p className="text-xs text-gray-500">我的课程</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-green-600">{stats.studentCount}</p>
                <p className="text-xs text-gray-500">学生总数</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-orange-600">{stats.pendingGrading}</p>
                <p className="text-xs text-gray-500">待批改</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-purple-600">{stats.weekHours}</p>
                <p className="text-xs text-gray-500">本周课时</p>
              </div>
            </div>
          </div>

          {/* 待办事项 */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">待办事项</h3>
            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-4 text-gray-400">暂无待办事项</div>
              ) : (
                todos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => {
                      if (todo.type === 'homework') onNavigate('assignments');
                    }}
                    className={`w-full p-4 rounded-2xl text-left transition-all active:scale-95 flex items-center gap-3 ${
                      todo.urgent
                        ? 'bg-red-50 border border-red-100'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        todo.type === 'homework'
                          ? 'bg-orange-100 text-orange-600'
                          : todo.type === 'question'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      {todo.type === 'homework' ? (
                        <ClipboardList size={20} />
                      ) : todo.type === 'question' ? (
                        <MessageCircle size={20} />
                      ) : (
                        <Bell size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-lg font-bold ${
                          todo.urgent ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {todo.count}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{todo.title}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;
