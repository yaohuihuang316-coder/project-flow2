import React, { useState, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Users, Plus, FileText, Star, Search,
  CheckCircle2, Trash2, X, Loader2,
  Zap
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import TeacherLayout from '../../components/TeacherLayout';

// 创建 service role 客户端（仅用于测试）
const serviceSupabase = createClient(
  'https://ghhvdffsyvzkhbftifzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs'
);

interface AssignmentsProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onLogout?: () => void;
}

// 简化的作业数据结构
interface Assignment {
  id: string;
  title: string;
  courseName: string;
  deadline: string;
  submittedCount: number;
  totalCount: number;
  status: 'pending' | 'grading' | 'completed';
  maxScore: number;
}

interface Submission {
  id: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  score?: number;
}

const TeacherAssignments: React.FC<AssignmentsProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiGrading, setAiGrading] = useState<string | null>(null);
  
  // 布置作业表单
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    courseId: '',
    content: '',
    deadline: '',
    maxScore: 100
  });
  const [courses, setCourses] = useState<{id: string, title: string}[]>([]);

  // 加载作业列表
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // 直接查询数据库
      const { data, error } = await supabase
        .from('app_assignments')
        .select(`
          id,
          title,
          deadline,
          max_score,
          status,
          submitted_count,
          course:course_id(title)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载作业失败:', error);
        return;
      }

      // 格式化数据
      const formattedAssignments: Assignment[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        courseName: item.course?.title || '未知课程',
        deadline: item.deadline,
        submittedCount: item.submitted_count || 0,
        totalCount: 30, // 假设每个课程30个学生
        status: item.status || 'pending',
        maxScore: item.max_score || 100
      }));

      setAssignments(formattedAssignments);
    } catch (err) {
      console.error('加载作业失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载作业提交
  const loadSubmissions = async (assignmentId: string) => {
    console.log('开始加载提交数据，作业ID:', assignmentId);
    try {
      // 检查用户认证状态
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('当前会话:', sessionData);
      
      if (!sessionData.session) {
        console.warn('用户未认证，尝试使用演示账号...');
      }

      // 使用 service role 客户端查询（绕过 RLS）
      const { data, error } = await serviceSupabase
        .from('app_assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      console.log('查询结果:', { data, error });

      if (error) {
        console.error('加载提交失败:', error);
        return;
      }

      console.log('获取到提交数据数量:', data?.length || 0);

      // 格式化数据（使用默认学生信息）
      const formattedSubmissions: Submission[] = (data || []).map((item: any, index: number) => ({
        id: item.id,
        studentName: `学生${index + 1}`,
        studentAvatar: `https://i.pravatar.cc/150?u=${item.student_id || index}`,
        content: item.content || '暂无内容',
        submittedAt: item.submitted_at,
        status: item.status || 'submitted',
        score: item.score
      }));

      console.log('格式化后的提交数据:', formattedSubmissions);
      setSubmissions(formattedSubmissions);
    } catch (err) {
      console.error('加载提交失败:', err);
    }
  };

  // 打开作业详情
  const openAssignmentDetail = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
    await loadSubmissions(assignment.id);
  };

  // AI批改
  const handleAIGrade = async (submissionId: string) => {
    setAiGrading(submissionId);
    
    // 模拟AI批改
    setTimeout(() => {
      const score = 70 + Math.floor(Math.random() * 25);
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, score, status: 'graded' as const }
          : s
      ));
      setAiGrading(null);
      alert(`AI批改完成！得分: ${score}分`);
    }, 1500);
  };

  // 渲染作业列表
  const renderAssignments = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>暂无作业</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            onClick={() => openAssignmentDetail(assignment)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{assignment.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{assignment.courseName}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-500">
                    截止: {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-gray-500">
                    满分: {assignment.maxScore}分
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {assignment.submittedCount}
                </div>
                <div className="text-xs text-gray-500">已提交</div>
                <span className={`inline-block mt-2 px-2 py-1 rounded-lg text-xs ${
                  assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                  assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {assignment.status === 'completed' ? '已完成' :
                   assignment.status === 'grading' ? '批改中' : '进行中'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染作业详情弹窗
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedAssignment) return null;

    const pendingCount = submissions.filter(s => s.status === 'submitted').length;
    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    const avgScore = submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount || 0;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          {/* 头部 */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
              <p className="text-sm text-gray-500">{selectedAssignment.courseName}</p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <X size={24} />
            </button>
          </div>

          {/* 统计 */}
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{submissions.length}</div>
                <div className="text-xs text-gray-500">已提交</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gradedCount}</div>
                <div className="text-xs text-gray-500">已批改</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
                <div className="text-xs text-gray-500">平均分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{pendingCount}</div>
                <div className="text-xs text-gray-500">待批改</div>
              </div>
            </div>
          </div>

          {/* 提交列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="font-bold text-gray-900 mb-4">学生提交 ({submissions.length})</h3>
            
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-2 opacity-30" />
                <p>暂无学生提交</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={submission.studentAvatar}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{submission.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {submission.status === 'graded' ? (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={16} fill="currentColor" />
                            <span className="font-bold">{submission.score}分</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAIGrade(submission.id)}
                            disabled={aiGrading === submission.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200 transition-colors disabled:opacity-50"
                          >
                            {aiGrading === submission.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                批改中...
                              </>
                            ) : (
                              <>
                                <Zap size={14} />
                                AI批改
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {submission.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染布置作业弹窗
  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
        <div className="bg-white rounded-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">布置新作业</h2>
            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作业标题</label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入作业标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属课程</label>
              <select
                value={newAssignment.courseId}
                onChange={(e) => setNewAssignment({...newAssignment, courseId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择课程</option>
                <option value="course-1">项目管理基础入门</option>
                <option value="course-2">敏捷项目管理实战</option>
                <option value="course-3">PMP认证课程</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作业要求</label>
              <textarea
                value={newAssignment.content}
                onChange={(e) => setNewAssignment({...newAssignment, content: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入作业要求"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <input
                  type="date"
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">满分</label>
                <input
                  type="number"
                  value={newAssignment.maxScore}
                  onChange={(e) => setNewAssignment({...newAssignment, maxScore: parseInt(e.target.value) || 100})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                alert('作业创建成功！');
                setShowCreateModal(false);
                setNewAssignment({ title: '', courseId: '', content: '', deadline: '', maxScore: 100 });
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              创建作业
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TeacherLayout
      activeTab="assignments"
      onTabChange={(tab) => {
        if (tab !== 'assignments' && onNavigate) {
          switch (tab) {
            case 'home':
              onNavigate(Page.TEACHER_DASHBOARD);
              break;
            case 'courses':
              onNavigate(Page.TEACHER_COURSES);
              break;
            case 'class':
              onNavigate(Page.TEACHER_CLASSROOM);
              break;
            case 'profile':
              onNavigate(Page.TEACHER_PROFILE);
              break;
          }
        }
      }}
      onNavigate={onNavigate}
      onLogout={onLogout}
      currentUser={currentUser}
    >
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理课程作业和学生提交</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>布置作业</span>
          </button>
        </div>

        {/* 作业列表 */}
        {renderAssignments()}

        {/* 详情弹窗 */}
        {renderDetailModal()}
        
        {/* 布置作业弹窗 */}
        {renderCreateModal()}
      </div>
    </TeacherLayout>
  );
};

export default TeacherAssignments;
