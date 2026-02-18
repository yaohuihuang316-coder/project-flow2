

import React, { useState, useMemo, useEffect } from 'react';
import {
  Home, BookOpen, Video, ClipboardList, User,
  Users, Plus, FileText,
  Star, Search,
  CheckCircle2, Trash2,
  CheckSquare, Square, Calendar, X,
  FileSpreadsheet, Loader2,
  Paperclip
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import * as assignmentService from '../../lib/assignmentService';
import * as courseService from '../../lib/courseService';
import GradingModal from '../../components/teacher/GradingModal';
import GradeStats from '../../components/teacher/GradeStats';
import RichTextEditor from '../../components/RichTextEditor';
import FileUpload, { UploadFile } from '../../components/FileUpload';

// import { useAssignments, useSubmissions, createAssignment, gradeSubmission } from '../../lib/teacherHooks';

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

// 表单类型
interface AssignmentForm {
  title: string;
  courseId: string;
  content: string;
  deadline: string;
  maxScore: number;
  attachments: UploadFile[];
}

interface GradeForm {
  score: number;
  comment: string;
}

type AssignmentFilter = 'all' | 'grading' | 'pending' | 'completed';

// 底部导航 Tab 类型
type TeacherTab = 'home' | 'courses' | 'class' | 'assignments' | 'profile';

// ==================== AssignmentCreateModal 组件 ====================
interface AssignmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: AssignmentForm) => void;
  courses: Course[];
}

const AssignmentCreateModal: React.FC<AssignmentCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courses
}) => {
  const [form, setForm] = useState<AssignmentForm>({
    title: '',
    courseId: '',
    content: '',
    deadline: '',
    maxScore: 100,
    attachments: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.deadline) return;
    onSubmit(form);
    setForm({ title: '', courseId: '', content: '', deadline: '', maxScore: 100, attachments: [] });
  };

  const handleClose = () => {
    setForm({ title: '', courseId: '', content: '', deadline: '', maxScore: 100, attachments: [] });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">布置新作业</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作业标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入作业标题"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属课程 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">请选择课程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.studentCount}人)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作业内容 <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="请输入作业要求、内容说明、评分标准等..."
              minHeight="180px"
              maxHeight="300px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">满分分数</label>
              <input
                type="number"
                min={1}
                max={200}
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Paperclip size={16} className="inline mr-1" />
              附件 (可选)
            </label>
            <FileUpload
              files={form.attachments}
              onFilesChange={(attachments) => setForm({ ...form, attachments })}
              maxFiles={5}
              maxSize={10 * 1024 * 1024}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-5 border-t border-gray-100 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.courseId || !form.deadline}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            发布作业
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== AssignmentDetailModal 组件 ====================
interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  submissions: StudentSubmission[];
  onGrade: (submission: StudentSubmission) => void;
  onBatchGrade: (submissionIds: string[], score: number) => void;
  onExport: () => void;
}

const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submissions,
  onGrade,
  onBatchGrade,
  onExport
}) => {
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showBatchAction, setShowBatchAction] = useState(false);

  if (!isOpen || !assignment) return null;

  const currentSubs = submissions.filter(s => s.assignmentId === assignment.id);
  const gradedCount = currentSubs.filter(s => s.status === 'graded').length;
  const avgScore = currentSubs.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount || 0;
  const submitRate = Math.round((assignment.submittedCount / assignment.totalCount) * 100);

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const toggleSelectAll = () => {
    const ungradedSubs = currentSubs.filter(s => s.status !== 'graded');
    if (selectedSubmissions.length === ungradedSubs.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(ungradedSubs.map(s => s.id));
    }
  };

  const handleBatchPass = () => {
    onBatchGrade(selectedSubmissions, assignment.maxScore);
    setSelectedSubmissions([]);
    setShowBatchAction(false);
  };

  const handleBatchScore80 = () => {
    onBatchGrade(selectedSubmissions, 80);
    setSelectedSubmissions([]);
    setShowBatchAction(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-bold text-gray-900 truncate">{assignment.title}</h2>
            <p className="text-xs text-gray-500">{assignment.courseName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              title="导出成绩"
            >
              <FileSpreadsheet size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {/* 统计卡片 */}
          <div className="p-5 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-2xl">
                <p className="text-xl font-bold text-gray-900">{assignment.submittedCount}</p>
                <p className="text-xs text-gray-500 mt-1">已提交</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-2xl">
                <p className="text-xl font-bold text-blue-600">{gradedCount}</p>
                <p className="text-xs text-gray-500 mt-1">已批改</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-2xl">
                <p className="text-xl font-bold text-green-600">{avgScore > 0 ? avgScore.toFixed(1) : '-'}</p>
                <p className="text-xs text-gray-500 mt-1">平均分</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-2xl">
                <p className="text-xl font-bold text-purple-600">{submitRate}%</p>
                <p className="text-xs text-gray-500 mt-1">提交率</p>
              </div>
            </div>

            {/* 成绩统计图表 */}
            <GradeStats 
              submissions={currentSubs} 
              maxScore={assignment.maxScore} 
            />

            {/* 作业要求 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">作业要求</h3>
              <div 
                className="text-sm text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: assignment.content || '<p class="text-gray-400 italic">暂无内容</p>' 
                }}
              />
              
              {/* 附件列表 */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Paperclip size={12} />
                    附件 ({assignment.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignment.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FileText size={12} />
                        附件 {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  截止: {assignment.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  满分: {assignment.maxScore}分
                </span>
              </div>
            </div>
          </div>

          {/* 学生提交列表 */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">学生提交 ({currentSubs.length})</h3>
              {currentSubs.some(s => s.status !== 'graded') && (
                <button
                  onClick={() => setShowBatchAction(!showBatchAction)}
                  className={`text-sm font-medium transition-colors ${showBatchAction ? 'text-red-500' : 'text-blue-600'
                    }`}
                >
                  {showBatchAction ? '取消' : '批量操作'}
                </button>
              )}
            </div>

            {/* 批量操作栏 */}
            {showBatchAction && selectedSubmissions.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-gray-600">已选 {selectedSubmissions.length} 项</span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={handleBatchScore80}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
                  >
                    批量80分
                  </button>
                  <button
                    onClick={handleBatchPass}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} />
                    满分通过
                  </button>
                </div>
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
                  全选未批改
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
                        onGrade(sub);
                      }
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-colors ${showBatchAction && sub.status !== 'graded' ? 'bg-gray-50 hover:bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
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
      </div>
    </div>
  );
};

// ==================== 主组件 ====================
const Assignments: React.FC<AssignmentsProps> = ({
  currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  // 视图状态
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'course'>('title');
  const [activeTab, setActiveTab] = useState<TeacherTab>('assignments');

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // 选中状态
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);

  // 批量选择状态(作业列表用)
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [showBatchDelete, setShowBatchDelete] = useState(false);

  // 数据加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 课程数据
  const [courses, setCourses] = useState<Course[]>([]);

  // 作业数据
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // 学生提交数据
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      // 加载课程数据
      const coursesData = await courseService.getTeacherCourses(currentUser.id);
      const formattedCourses: Course[] = coursesData.map(course => ({
        id: course.id,
        title: course.title,
        studentCount: course.student_count
      }));
      setCourses(formattedCourses);

      // 加载作业数据
      const assignmentsData = await assignmentService.getTeacherAssignments(currentUser.id);
      const formattedAssignments: Assignment[] = assignmentsData.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        courseId: assignment.course_id,
        courseName: formattedCourses.find(c => c.id === assignment.course_id)?.title || '',
        content: assignment.content,
        deadline: assignment.deadline,
        createdAt: assignment.created_at,
        submittedCount: assignment.submitted_count || 0,
        totalCount: assignment.total_count || 0,
        status: assignment.status,
        maxScore: assignment.max_score,
        attachments: assignment.attachments || []
      }));
      setAssignments(formattedAssignments);
    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 过滤作业 - 支持按标题或课程搜索
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      if (filter !== 'all' && assignment.status !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (searchType === 'title') {
          return assignment.title.toLowerCase().includes(query);
        } else {
          return assignment.courseName.toLowerCase().includes(query);
        }
      }
      return true;
    });
  }, [assignments, filter, searchQuery, searchType]);

  // 创建作业
  const handleCreateAssignment = async (form: AssignmentForm) => {
    try {
      // 提取已上传的附件 URL
      const attachmentUrls = form.attachments
        .filter(f => f.status === 'done' && f.url)
        .map(f => f.url!);

      const newAssignment = await assignmentService.createAssignment({
        title: form.title,
        course_id: form.courseId,
        content: form.content,
        deadline: form.deadline.replace('T', ' '),
        max_score: form.maxScore,
        attachments: attachmentUrls
      });

      const course = courses.find(c => c.id === form.courseId);
      const formattedAssignment: Assignment = {
        id: newAssignment.id,
        title: newAssignment.title,
        courseId: newAssignment.course_id,
        courseName: course?.title || '',
        content: newAssignment.content,
        deadline: newAssignment.deadline,
        createdAt: newAssignment.created_at,
        submittedCount: 0,
        totalCount: course?.studentCount || 0,
        status: newAssignment.status,
        maxScore: newAssignment.max_score,
        attachments: newAssignment.attachments || []
      };

      setAssignments([formattedAssignment, ...assignments]);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('创建作业失败:', err);
      alert('创建作业失败: ' + (err.message || '未知错误'));
    }
  };

  // 单个批改
  const handleGradeSubmit = async (form: GradeForm) => {
    if (!selectedSubmission || !selectedAssignment) return;

    try {
      await assignmentService.gradeSubmission(
        selectedSubmission.id,
        form.score,
        form.comment
      );

      setSubmissions(submissions.map(s =>
        s.id === selectedSubmission.id
          ? { ...s, score: form.score, comment: form.comment, status: 'graded' as const }
          : s
      ));

      // 更新作业状态
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === selectedAssignment.id);
      const newGradedCount = assignmentSubmissions.filter(s => s.status === 'graded' || s.id === selectedSubmission.id).length;

      setAssignments(assignments.map(a =>
        a.id === selectedAssignment.id
          ? { ...a, status: newGradedCount === a.totalCount ? 'completed' : 'grading' }
          : a
      ));

      setShowGradeModal(false);
      setSelectedSubmission(null);
    } catch (err: any) {
      console.error('批改作业失败:', err);
      alert('批改作业失败: ' + (err.message || '未知错误'));
    }
  };

  // 批量批改
  const handleBatchGrade = async (submissionIds: string[], score: number) => {
    if (!selectedAssignment) return;

    try {
      await assignmentService.batchGradeSubmissions(submissionIds, score, '批量批改');

      setSubmissions(submissions.map(s =>
        submissionIds.includes(s.id)
          ? { ...s, score, comment: '批量批改', status: 'graded' as const }
          : s
      ));

      // 更新作业状态
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === selectedAssignment.id);
      const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded').length + submissionIds.length;

      setAssignments(assignments.map(a =>
        a.id === selectedAssignment.id
          ? { ...a, status: gradedCount >= a.totalCount ? 'completed' : 'grading' }
          : a
      ));
    } catch (err: any) {
      console.error('批量批改失败:', err);
      alert('批量批改失败: ' + (err.message || '未知错误'));
    }
  };

  // 删除单个作业
  const handleDeleteAssignment = async (assignmentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('确定要删除这个作业吗?此操作不可恢复。')) return;

    try {
      await assignmentService.deleteAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      // 同时删除相关提交
      setSubmissions(submissions.filter(s => s.assignmentId !== assignmentId));
    } catch (err: any) {
      console.error('删除作业失败:', err);
      alert('删除作业失败: ' + (err.message || '未知错误'));
    }
  };

  // 批量选择作业
  const toggleAssignmentSelection = (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssignments(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  // 批量删除作业
  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedAssignments.length} 个作业吗？此操作不可恢复。`)) {
      setAssignments(assignments.filter(a => !selectedAssignments.includes(a.id)));
      setSubmissions(submissions.filter(s => !selectedAssignments.includes(s.assignmentId)));
      setSelectedAssignments([]);
      setShowBatchDelete(false);
    }
  };

  // 导出成绩为CSV
  const handleExportGrades = () => {
    if (!selectedAssignment) return;

    const currentSubs = submissions.filter(s => s.assignmentId === selectedAssignment.id);
    const csvContent = [
      ['学生姓名', '提交时间', '分数', '评语', '状态'].join(','),
      ...currentSubs.map(s => [
        s.studentName,
        s.submittedAt,
        s.score ?? '',
        `"${(s.comment || '').replace(/"/g, '""')}"`,
        s.status === 'graded' ? '已批改' : s.status === 'late' ? '迟交' : '待批改'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedAssignment.title}_成绩表.csv`;
    link.click();
  };

  // 打开作业详情
  const openAssignmentDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  // 打开批改弹窗
  const openGradeModal = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setShowGradeModal(true);
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
          onNavigate(Page.TEACHER_COURSES);
          break;
        case 'class':
          onNavigate(Page.TEACHER_CLASSROOM);
          break;
        case 'assignments':
          // 当前页面，不跳转
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
                className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-all ${item.highlight ? '-mt-4' : ''
                  }`}
              >
                {item.highlight ? (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-blue-600 shadow-blue-500/30' : 'bg-gray-100'
                    }`}>
                    <Icon size={28} className={isActive ? 'text-white' : 'text-gray-500'} />
                  </div>
                ) : (
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                )}
                <span className={`text-[10px] font-medium transition-colors ${item.highlight ? 'text-gray-600' : isActive ? 'text-blue-600' : 'text-gray-400'
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

  // ==================== 主内容区域 ====================
  const renderMainContent = () => (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* 页面头部 */}
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchType === 'title' ? '搜索作业标题...' : '搜索课程名称...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'title' | 'course')}
            className="px-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="title">按标题</option>
            <option value="course">按课程</option>
          </select>
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
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === item.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 批量操作栏 */}
      {showBatchDelete && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <span className="text-sm text-gray-700">已选 {selectedAssignments.length} 个作业</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                setShowBatchDelete(false);
                setSelectedAssignments([]);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedAssignments.length === 0}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 size={14} />
              批量删除
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-transform"
        >
          <Plus size={20} />
          布置新作业
        </button>
        <button
          onClick={() => {
            setShowBatchDelete(!showBatchDelete);
            setSelectedAssignments([]);
          }}
          className={`px-4 py-4 rounded-2xl font-medium flex items-center gap-2 transition-colors ${showBatchDelete
            ? 'bg-orange-100 text-orange-600'
            : 'bg-white text-gray-700 border border-gray-200'
            }`}
        >
          <CheckSquare size={20} />
          批量管理
        </button>
      </div>

      {/* 作业列表 */}
      <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 sm:col-span-2 lg:col-span-3">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">暂无作业</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => openAssignmentDetail(assignment)}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform h-full flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                {showBatchDelete ? (
                  <button
                    onClick={(e) => toggleAssignmentSelection(assignment.id, e)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {selectedAssignments.includes(assignment.id) ? (
                      <CheckSquare size={20} className="text-blue-600" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                  </button>
                ) : null}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">{assignment.courseName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${assignment.status === 'grading' ? 'bg-orange-100 text-orange-600' :
                    assignment.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                    {assignment.status === 'grading' ? '待批改' : assignment.status === 'pending' ? '进行中' : '已结束'}
                  </span>
                  {!showBatchDelete && (
                    <button
                      onClick={(e) => handleDeleteAssignment(assignment.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{assignment.content}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
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

              <div className="flex items-center gap-3 mt-auto">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${assignment.status === 'completed' ? 'bg-green-500' :
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
                      if (item.id !== 'assignments') onNavigate?.(item.page);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
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
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="text-center py-16 text-red-500">
                <p>{error}</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
                  重试
                </button>
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </main>
      </div>

      {/* 移动端底部导航 */}
      <div className="lg:hidden">
        {renderBottomNav()}
      </div>

      {/* 弹窗组件 */}
      <AssignmentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAssignment}
        courses={courses}
      />

      <AssignmentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        assignment={selectedAssignment}
        submissions={submissions}
        onGrade={openGradeModal}
        onBatchGrade={handleBatchGrade}
        onExport={handleExportGrades}
      />

      <GradingModal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        maxScore={selectedAssignment?.maxScore || 100}
        onSave={(score, comment) => {
          handleGradeSubmit({ score, comment });
        }}
      />
    </div>
  );
};

export default Assignments;
