import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AIAutoGradingProps {
  submission: {
    id: string;
    content: string;
    attachments: string[];
    assignmentTitle?: string;
    maxScore: number;
  };
  onGrade: (score: number, comment: string) => void;
}

interface AIGradeResult {
  score: number;
  comment: string;
  analysis: string;
}

const AIAutoGrading: React.FC<AIAutoGradingProps> = ({ submission, onGrade }) => {
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<AIGradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 模拟AI评分逻辑
  const performAIGrading = async (): Promise<AIGradeResult> => {
    // 这里应该调用真实的AI API
    // 现在使用模拟逻辑
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const content = submission.content || '';
    const contentLength = content.length;
    const hasAttachments = submission.attachments && submission.attachments.length > 0;
    
    // 基于内容长度和质量的简单评分逻辑
    let baseScore = 70;
    
    // 内容长度加分
    if (contentLength > 500) baseScore += 10;
    if (contentLength > 1000) baseScore += 10;
    
    // 关键词检查
    const keywords = ['项目', '管理', '分析', '计划', '实施', '总结', '优化'];
    const keywordMatches = keywords.filter(kw => content.includes(kw)).length;
    baseScore += keywordMatches * 2;
    
    // 有附件加分
    if (hasAttachments) baseScore += 5;
    
    // 确保分数在合理范围内
    const finalScore = Math.min(Math.max(baseScore, 60), 95);
    
    // 生成评语
    let comment = '';
    let analysis = '';
    
    if (finalScore >= 90) {
      comment = '优秀！作业完成质量很高，内容详实，思路清晰。对项目管理的理解深入，能够很好地运用所学知识。';
      analysis = '内容完整度：优秀\n逻辑清晰度：优秀\n知识运用：优秀\n建议：继续保持，可以尝试更多实际案例分析。';
    } else if (finalScore >= 80) {
      comment = '良好！作业完成度较高，内容较为完整。在项目管理的基本概念和方法上有较好的掌握。';
      analysis = '内容完整度：良好\n逻辑清晰度：良好\n知识运用：良好\n建议：可以在细节描述上更加深入，增加更多实际应用案例。';
    } else if (finalScore >= 70) {
      comment = '中等。作业基本完成，但内容深度有待提高。对项目管理的基本流程有一定理解。';
      analysis = '内容完整度：中等\n逻辑清晰度：中等\n知识运用：一般\n建议：加强对核心概念的理解，多参考优秀案例，完善作业内容。';
    } else {
      comment = '及格。作业基本完成，但存在明显不足。需要加强对项目管理基础知识的学习。';
      analysis = '内容完整度：待提高\n逻辑清晰度：待提高\n知识运用：需加强\n建议：重新学习相关知识点，参考教材和课件，补充完善作业内容。';
    }
    
    return {
      score: finalScore,
      comment,
      analysis
    };
  };

  const handleAutoGrade = async () => {
    setIsGrading(true);
    setError(null);
    setResult(null);
    
    try {
      const aiResult = await performAIGrading();
      setResult(aiResult);
    } catch (err) {
      setError('AI评分失败，请重试');
    } finally {
      setIsGrading(false);
    }
  };

  const handleApplyGrade = () => {
    if (result) {
      onGrade(result.score, result.comment);
      setResult(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">AI 智能批改</h3>
          <p className="text-sm text-gray-500">基于内容分析自动生成评分和评语</p>
        </div>
      </div>

      {!result && !isGrading && (
        <button
          onClick={handleAutoGrade}
          disabled={isGrading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        >
          <Sparkles size={18} />
          开始 AI 批改
        </button>
      )}

      {isGrading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          <p className="text-gray-600">AI 正在分析作业内容...</p>
          <p className="text-sm text-gray-400 mt-1">预计需要 2-3 秒</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">AI 评分</span>
              <span className="text-3xl font-bold text-purple-600">{result.score}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">评语</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{result.comment}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">详细分析</h4>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">{result.analysis}</pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyGrade}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              应用评分
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
            >
              重新评分
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAutoGrading;
