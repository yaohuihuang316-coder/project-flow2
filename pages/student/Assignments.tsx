import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Calendar, Clock, CheckCircle2,
  FileText, Upload, X, Star, Loader2,
  BookOpen, Search, ArrowLeft, Paperclip, Download
} from 'lucide-react';
import { Page, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import RichTextEditor from '../../components/RichTextEditor';
import FileUpload, { UploadFile } from '../../components/FileUpload';

interface StudentAssignmentsProps {
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
}

// 作业类型
interface Assignment {
  id: string;
  title: string;
  course_id: string;
  course_name: string;
  content: string;
  deadline: string;
  max_score: number;
  attachments: string[];
  status: 'pending' | 'submitted' | 'graded' | 'expired';
  score?: number;
  comment?: string;
  submitted_at?: string;
}

// 提交记录
interface Submission {
  id: string;
  assignment_id: string;
  content: string;
  attachments: string[];
  submitted_at: string;
  score?: number;
  comment?: string;
  status: 'submitted' | 'graded' | 'late';
}

// 筛选类型
type AssignmentFilter = 'all' | 'pending' | 'submitted' | 'graded' | 'expired';

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({
  currentUser,
  onNavigate
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 提交弹窗状态
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFiles, setSubmitFiles] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 详情弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);

  // 加载作业数据
  useEffect(() => {
    loadAssignments();
  }, [currentUser?.id]);

  const loadAssignments = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      // 1. 获取学生报名的课程
      const { data: enrollments, error: enrollError } = await supabase
        .from('app_course_enrollments')
        .select('course_id')
        .eq('student_id', currentUser.id);
      
      if (enrollError) throw enrollError;
      
      const courseIds = enrollments?.map(e => e.course_id) || [];
      if (courseIds.length === 0) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      // 2. 获取这些课程的作业
      const { data: assignmentsData, error: assignError } = await supabase
        .from('app_assignments')
        .select(`
          *,
          course:course_id (title)
        `)
        .in('course_id', courseIds)
        .order('deadline', { ascending: true });
      
      if (assignError) throw assignError;

      // 3. 获取学生的提交记录
      const { data: submissionsData, error: subError } = await supabase
        .from('app_student_submissions')
        .select('*')
        .eq('student_id', currentUser.id);
      
      if (subError) throw subError;

      // 4. 处理数据关联
      const submissionsMap: Record<string, Submission> = {};
      submissionsData?.forEach((sub: any) => {
        submissionsMap[sub.assignment_id] = {
          id: sub.id,
          assignment_id: sub.assignment_id,
          content: sub.content,
          attachments: sub.attachments || [],
          submitted_at: sub.submitted_at,
          score: sub.score,
          comment: sub.comment,
          status: sub.status
        };
      });
      setSubmissions(submissionsMap);

      // 5. 格式化作业列表
      const now = new Date();
      const formattedAssignments: Assignment[] = (assignmentsData || []).map((assignment: any) => {
        const submission = submissionsMap[assignment.id];
        const deadline = new Date(assignment.deadline);
        
        let status: Assignment['status'] = 'pending';
        if (submission) {
          status = submission.status === 'graded' ? 'graded' : 'submitted';
        } else if (deadline < now) {
          status = 'expired';
        }

        return {
          id: assignment.id,
          title: assignment.title,
          course_id: assignment.course_id,
          course_name: assignment.course?.title || '未知课程',
          content: assignment.content,
          deadline: assignment.deadline,
          max_score: assignment.max_score,
          attachments: assignment.attachments || [],
          status,
          score: submission?.score,
          comment: submission?.comment,
          submitted_at: submission?.submitted_at
        };
      });

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('加载作业失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选作业
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      if (filter !== 'all' && assignment.status !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          assignment.title.toLowerCase().includes(query) ||
          assignment.course_name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [assignments, filter, searchQuery]);

  // 统计
  const stats = useMemo(() => ({
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    graded: assignments.filter(a => a.status === 'graded').length,
    expired: assignments.filter(a => a.status === 'expired').length,
    avgScore: assignments.filter(a => a.score !== undefined).reduce((sum, a) => sum + (a.score || 0), 0) / 
              assignments.filter(a => a.score !== undefined).length || 0
  }), [assignments]);

  // 打开提交弹窗
  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    
    // 如果已有提交，加载之前的内容
    const existingSubmission = submissions[assignment.id];
    if (existingSubmission) {
      setSubmitContent(existingSubmission.content);
      setSubmitFiles(existingSubmission.attachments.map((url, idx) => ({
        id: `existing-${idx}`,
        name: `附件 ${idx + 1}`,
        size: 0,
        type: 'document',
        url,
        status: 'done'
      })));
    } else {
      setSubmitContent('');
      setSubmitFiles([]);
    }
    
    setShowSubmitModal(true);
  };

  // 打开详情弹窗
  const openDetailModal = (assignment: Assignment) => {
    setDetailAssignment(assignment);
    setShowDetailModal(true);
  };

  // 提交作业
  const handleSubmit = async () => {
    if (!selectedAssignment || !currentUser?.id) return;
    if (!submitContent.trim() && submitFiles.length === 0) {
      alert('请填写提交内容或上传附件');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachmentUrls = submitFiles
        .filter(f => f.status === 'done' && f.url)
        .map(f => f.url!);

      const submissionData = {
        assignment_id: selectedAssignment.id,
        student_id: currentUser.id,
        content: submitContent,
        attachments: attachmentUrls,
        submitted_at: new Date().toISOString(),
        status: new Date(selectedAssignment.deadline) < new Date() ? 'late' : 'submitted'
      };

      const { error } = await supabase
        .from('app_student_submissions')
        .upsert(submissionData, {
          onConflict: 'assignment_id,student_id'
        });

      if (error) throw error;

      // 刷新数据
      await loadAssignments();
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      setSubmitContent('');
      setSubmitFiles([]);
    } catch (error) {
      console.error('提交作业失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化日期
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return '已过期';
    if (days === 0) return '今天截止';
    if (days === 1) return '明天截止';
    return `${days}天后截止`;
  };

  // 获取状态样式
  const getStatusStyle = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-600';
      case 'submitted':
        return 'bg-blue-100 text-blue-600';
      case 'graded':
        return 'bg-green-100 text-green-600';
      case 'expired':
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusText = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return '待提交';
      case 'submitted':
        return '已提交';
      case 'graded':
        return '已批改';
      case 'expired':
        return '已过期';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.(Page.DASHBOARD)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">我的作业</h1>
                <p className="text-sm text-gray-500">共 {stats.total} 个作业</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">待提交</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            <p className="text-xs text-gray-500">已提交</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            <p className="text-xs text-gray-500">已批改</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-purple-600">
              {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-500">平均分</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索作业或课程..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待提交' },
                { key: 'submitted', label: '已提交' },
                { key: 'graded', label: '已批改' },
                { key: 'expired', label: '已过期' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as AssignmentFilter)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 作业列表 */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">暂无作业</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(assignment.status)}`}>
                        {getStatusText(assignment.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <BookOpen size={14} />
                      {assignment.course_name}
                    </p>
                  </div>
                  {assignment.score !== undefined && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={18} fill="currentColor" />
                      <span className="text-lg font-bold">{assignment.score}</span>
                      <span className="text-sm text-gray-400">/ {assignment.max_score}</span>
                    </div>
                  )}
                </div>

                <div 
                  className="text-sm text-gray-600 mb-4 line-clamp-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: assignment.content }}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      截止: {new Date(assignment.deadline).toLocaleDateString('zh-CN')}
                    </span>
                    <span className={`flex items-center gap-1 ${
                      new Date(assignment.deadline) < new Date() && assignment.status === 'pending'
                        ? 'text-red-500'
                        : ''
                    }`}>
                      <Clock size={14} />
                      {formatDeadline(assignment.deadline)}
                    </span>
                    {assignment.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip size={14} />
                        {assignment.attachments.length} 个附件
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetailModal(assignment)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      查看详情
                    </button>
                    {assignment.status === 'pending' || assignment.status === 'expired' ? (
                      <button
                        onClick={() => openSubmitModal(assignment)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        {assignment.status === 'expired' ? '补交' : '提交'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openSubmitModal(assignment)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        查看提交
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 提交弹窗 */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {submissions[selectedAssignment.id] ? '查看提交' : '提交作业'}
                </h2>
                <p className="text-sm text-gray-500">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 作业要求 */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <h4 className="font-medium text-gray-900 mb-2">作业要求</h4>
                <div 
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedAssignment.content }}
                />
                {selectedAssignment.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedAssignment.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Download size={14} />
                        附件 {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* 提交内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提交内容
                </label>
                <RichTextEditor
                  content={submitContent}
                  onChange={setSubmitContent}
                  placeholder="请在此输入你的答案..."
                  minHeight="150px"
                  maxHeight="250px"
                />
              </div>

              {/* 附件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Paperclip size={16} className="inline mr-1" />
                  附件 (可选)
                </label>
                <FileUpload
                  files={submitFiles}
                  onFilesChange={setSubmitFiles}
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024}
                />
              </div>

              {/* 批改结果 */}
              {submissions[selectedAssignment.id]?.score !== undefined && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    批改结果
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-green-600">
                      {submissions[selectedAssignment.id].score}
                    </span>
                    <span className="text-gray-500">/ {selectedAssignment.max_score} 分</span>
                  </div>
                  {submissions[selectedAssignment.id].comment && (
                    <p className="text-sm text-gray-600">
                      评语: {submissions[selectedAssignment.id].comment}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 space-y-3">
              {!submissions[selectedAssignment.id] && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!submitContent.trim() && submitFiles.length === 0)}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      确认提交
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetailModal && detailAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">作业详情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{detailAssignment.title}</h3>
                <p className="text-sm text-gray-500">{detailAssignment.course_name}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full ${getStatusStyle(detailAssignment.status)}`}>
                  {getStatusText(detailAssignment.status)}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                  满分 {detailAssignment.max_score} 分
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <h4 className="font-medium text-gray-900 mb-2">作业要求</h4>
                <div 
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: detailAssignment.content }}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>截止日期: {new Date(detailAssignment.deadline).toLocaleString('zh-CN')}</span>
                </div>
                {detailAssignment.submitted_at && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle2 size={16} />
                    <span>提交时间: {new Date(detailAssignment.submitted_at).toLocaleString('zh-CN')}</span>
                  </div>
                )}
              </div>

              {detailAssignment.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">作业附件</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailAssignment.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <FileText size={16} />
                        附件 {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openSubmitModal(detailAssignment);
                }}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium"
              >
                {detailAssignment.status === 'pending' ? '去提交' : '查看提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
