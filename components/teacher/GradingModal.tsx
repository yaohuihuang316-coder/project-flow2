import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  score?: number;
  comment?: string;
  status: 'submitted' | 'graded' | 'late';
}

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  maxScore: number;
  onSave: (score: number, comment: string) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// 评语模板
const commentTemplates = [
  { label: '优秀', text: '作业完成得非常出色，思路清晰，答案准确。继续保持！' },
  { label: '良好', text: '作业完成较好，基本掌握了知识点，还有少量细节需要完善。' },
  { label: '及格', text: '作业基本完成，但存在一些错误，建议复习相关知识点。' },
  { label: '需改进', text: '作业完成度不足，需要重新学习课程内容并完成作业。' },
  { label: '鼓励', text: '看到你的进步，继续努力！有问题随时向老师请教。' },
];

const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  submission,
  maxScore,
  onSave,
  onNavigate,
  hasPrev,
  hasNext
}) => {
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'grading'>('content');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (submission) {
      setScore(submission.score ?? 0);
      setComment(submission.comment ?? '');
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const handleSave = () => {
    onSave(score, comment);
    onClose();
  };

  const applyTemplate = (templateText: string) => {
    setComment(prev => prev ? `${prev}\n${templateText}` : templateText);
    setShowTemplates(false);
  };

  const getScoreLevel = (s: number) => {
    const percentage = s / maxScore;
    if (percentage >= 0.9) return { label: '优秀', color: 'text-green-600 bg-green-50' };
    if (percentage >= 0.8) return { label: '良好', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 0.6) return { label: '及格', color: 'text-yellow-600 bg-yellow-50' };
    return { label: '需改进', color: 'text-red-600 bg-red-50' };
  };

  const scoreLevel = getScoreLevel(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">批改作业</h2>
              <p className="text-xs text-gray-500">{submission.studentName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 导航按钮 */}
            {onNavigate && (
              <div className="flex items-center gap-1 mr-4">
                <button
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrev}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              保存批改
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            作业内容
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'grading' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            批改评分
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'content' ? (
            <div className="h-full overflow-y-auto p-6">
              {/* 学生信息 */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                <img
                  src={submission.studentAvatar || `https://i.pravatar.cc/150?u=${submission.studentId}`}
                  alt={submission.studentName}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{submission.studentName}</h3>
                  <p className="text-sm text-gray-500">
                    提交时间: {new Date(submission.submittedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                {submission.status === 'graded' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle size={14} />
                    已批改
                  </div>
                )}
              </div>

              {/* 作业内容 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">提交内容</h4>
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-700 whitespace-pre-wrap">
                  {submission.content || '无文字内容'}
                </div>
              </div>

              {/* 附件 */}
              {submission.attachments.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">附件 ({submission.attachments.length})</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {submission.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <FileText size={20} className="text-blue-500" />
                        <span className="text-sm text-gray-700 truncate flex-1">
                          附件 {idx + 1}
                        </span>
                        <Download size={16} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {/* 评分区域 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">评分</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${scoreLevel.color}`}>
                    {scoreLevel.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={maxScore}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>{maxScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxScore}
                      value={score}
                      onChange={(e) => setScore(Math.min(maxScore, Math.max(0, Number(e.target.value))))}
                      className="w-20 px-3 py-2 text-center text-lg font-bold bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">/ {maxScore}</span>
                  </div>
                </div>

                {/* 快速评分按钮 */}
                <div className="flex gap-2 mt-4">
                  {[60, 70, 80, 90, 100].map((quickScore) => (
                    <button
                      key={quickScore}
                      onClick={() => setScore(Math.min(maxScore, quickScore))}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {quickScore}分
                    </button>
                  ))}
                </div>
              </div>

              {/* 评语区域 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">评语</h4>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showTemplates ? '隐藏模板' : '使用模板'}
                  </button>
                </div>

                {/* 评语模板 */}
                {showTemplates && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">点击快速添加评语:</p>
                    <div className="flex flex-wrap gap-2">
                      {commentTemplates.map((template) => (
                        <button
                          key={template.label}
                          onClick={() => applyTemplate(template.text)}
                          className="px-3 py-1.5 text-sm bg-white hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入评语..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 resize-none"
                />
                
                <p className="text-xs text-gray-400 mt-2 text-right">
                  {comment.length} 字
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingModal;
