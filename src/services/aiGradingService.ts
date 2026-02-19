import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghhvdffsyvzkhbftifzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaHZkZmZzeXZ6a2hiZnRpZnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAxMjY0NCwiZXhwIjoyMDgyNTg4NjQ0fQ.L-sqETv0f0BY-m5ny_E3yEDf0VoS2MRmIxYK98dVHNs';

const supabase = createClient(supabaseUrl, supabaseKey);

// AI批改服务
export class AIGradingService {
  // 使用简单的规则引擎模拟AI批改
  static async gradeSubmission(submissionId: string, assignmentId: string) {
    try {
      // 1. 获取作业信息
      const { data: assignment, error: assignmentError } = await supabase
        .from('app_assignments')
        .select('title, description, max_score, teacher_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignment) {
        throw new Error('获取作业信息失败');
      }

      // 2. 获取学生提交内容
      const { data: submission, error: submissionError } = await supabase
        .from('app_assignment_submissions')
        .select('content, student_id')
        .eq('id', submissionId)
        .single();

      if (submissionError || !submission) {
        throw new Error('获取提交内容失败');
      }

      // 3. AI评分逻辑（基于内容长度、关键词匹配等）
      const result = await this.analyzeContent(
        submission.content,
        assignment.description,
        assignment.max_score || 100
      );

      // 4. 更新提交记录
      const { error: updateError } = await supabase
        .from('app_assignment_submissions')
        .update({
          score: result.score,
          comment: result.comment,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: assignment.teacher_id,
          ai_graded: true,
          ai_feedback: result.detailedFeedback
        })
        .eq('id', submissionId);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        score: result.score,
        comment: result.comment
      };

    } catch (err: any) {
      console.error('AI批改失败:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  // 分析内容并评分
  private static async analyzeContent(
    content: string,
    assignmentDesc: string,
    maxScore: number
  ): Promise<{
    score: number;
    comment: string;
    detailedFeedback: string;
  }> {
    // 基础分数（内容长度评分）
    let baseScore = Math.min(60, content.length / 10);
    
    // 关键词匹配加分
    const keywords = this.extractKeywords(assignmentDesc);
    let keywordMatches = 0;
    
    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
    
    const keywordScore = Math.min(20, keywordMatches * 5);
    
    // 结构完整性评分
    let structureScore = 0;
    if (content.includes('。') || content.includes('.')) structureScore += 5;
    if (content.includes('：') || content.includes(':')) structureScore += 5;
    if (content.length > 100) structureScore += 5;
    if (content.length > 300) structureScore += 5;
    
    // 计算总分
    let totalScore = Math.min(maxScore, Math.round(baseScore + keywordScore + structureScore));
    
    // 确保最低分不低于40分（鼓励性评分）
    totalScore = Math.max(40, totalScore);
    
    // 生成评语
    const { comment, detailedFeedback } = this.generateFeedback(
      totalScore,
      maxScore,
      keywordMatches,
      keywords.length,
      content.length
    );

    return {
      score: totalScore,
      comment,
      detailedFeedback
    };
  }

  // 提取关键词
  private static extractKeywords(description: string): string[] {
    // 简单的关键词提取（实际项目中可以使用NLP库）
    const commonWords = ['的', '了', '和', '是', '在', '有', '我', '都', '个', '与', '及', '等'];
    
    // 从作业描述中提取可能的评分要点
    const keywords: string[] = [];
    
    // 匹配引号中的内容
    const quoteMatches = description.match(/["""']([^"""']+)["""']/g);
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        const word = match.replace(/["""']/g, '').trim();
        if (word.length > 1 && !commonWords.includes(word)) {
          keywords.push(word);
        }
      });
    }
    
    // 匹配加粗或强调的内容
    const boldMatches = description.match(/<strong>([^<]+)<\/strong>/g);
    if (boldMatches) {
      boldMatches.forEach(match => {
        const word = match.replace(/<\/?strong>/g, '').trim();
        if (word.length > 1 && !commonWords.includes(word)) {
          keywords.push(word);
        }
      });
    }
    
    // 如果没有提取到关键词，使用默认关键词
    if (keywords.length === 0) {
      return ['项目', '管理', '计划', '分析', '方案'];
    }
    
    return [...new Set(keywords)]; // 去重
  }

  // 生成评语
  private static generateFeedback(
    score: number,
    maxScore: number,
    keywordMatches: number,
    totalKeywords: number,
    contentLength: number
  ): { comment: string; detailedFeedback: string } {
    let comment = '';
    let detailedFeedback = '';

    if (score >= 90) {
      comment = '优秀！作业完成质量很高。';
      detailedFeedback = `得分：${score}/${maxScore}分\n\n` +
        `✅ 优点：\n` +
        `- 内容完整，思路清晰\n` +
        `- 很好地覆盖了作业要求的关键点\n` +
        `- 表达流畅，逻辑性强\n\n` +
        `💡 建议：继续保持，可以尝试更深入地分析相关问题。`;
    } else if (score >= 80) {
      comment = '良好！作业完成得不错。';
      detailedFeedback = `得分：${score}/${maxScore}分\n\n` +
        `✅ 优点：\n` +
        `- 基本完成了作业要求\n` +
        `- 内容较为充实（${contentLength}字）\n` +
        `- 涵盖了 ${keywordMatches}/${totalKeywords} 个关键要点\n\n` +
        `💡 建议：可以在细节方面进一步完善，增加更多实际案例。`;
    } else if (score >= 70) {
      comment = '中等！基本达到要求，还有提升空间。';
      detailedFeedback = `得分：${score}/${maxScore}分\n\n` +
        `✅ 优点：\n` +
        `- 完成了基本作业要求\n` +
        `- 内容长度适中\n\n` +
        `⚠️ 需要改进：\n` +
        `- 建议增加更多关键要点的分析\n` +
        `- 可以进一步展开论述\n` +
        `- 注意结构的完整性`;
    } else if (score >= 60) {
      comment = '及格！勉强达到要求，需要努力。';
      detailedFeedback = `得分：${score}/${maxScore}分\n\n` +
        `⚠️ 问题：\n` +
        `- 内容较为简单，深度不够\n` +
        `- 缺少关键要点的分析\n` +
        `- 建议重新阅读作业要求\n\n` +
        `💡 建议：\n` +
        `- 参考课程教材相关内容\n` +
        `- 与同学讨论交流\n` +
        `- 如有疑问请咨询老师`;
    } else {
      comment = '需要改进！未达到基本要求。';
      detailedFeedback = `得分：${score}/${maxScore}分\n\n` +
        `❌ 主要问题：\n` +
        `- 内容过于简单或偏离主题\n` +
        `- 缺少必要的分析和论证\n` +
        `- 未能体现对知识点的理解\n\n` +
        `💡 建议：\n` +
        `- 仔细阅读作业要求\n` +
        `- 复习相关课程内容\n` +
        `- 建议重新完成作业`;
    }

    return { comment, detailedFeedback };
  }

  // 批量AI批改
  static async batchGradeSubmissions(assignmentId: string) {
    try {
      // 获取所有未批改的提交
      const { data: submissions, error } = await supabase
        .from('app_assignment_submissions')
        .select('id, assignment_id')
        .eq('assignment_id', assignmentId)
        .eq('status', 'submitted');

      if (error) {
        throw error;
      }

      if (!submissions || submissions.length === 0) {
        return {
          success: true,
          message: '没有需要批改的作业',
          gradedCount: 0
        };
      }

      // 逐个批改
      let gradedCount = 0;
      for (const submission of submissions) {
        const result = await this.gradeSubmission(submission.id, submission.assignment_id);
        if (result.success) {
          gradedCount++;
        }
      }

      return {
        success: true,
        message: `成功批改 ${gradedCount} 份作业`,
        gradedCount
      };

    } catch (err: any) {
      console.error('批量批改失败:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

export default AIGradingService;
