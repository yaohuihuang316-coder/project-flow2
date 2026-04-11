import { createDeepSeekCompletion, parseJsonFromText } from './deepseekService';

export { generateHTMLReport } from './simulationReportHtml';

export interface SimulationReportData {
  scenarioTitle: string;
  scenarioDescription: string;
  difficulty: string;
  category: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  stageHistory: {
    stageTitle: string;
    decisionText: string;
    score: number;
    feedback: string;
    isOptimal: boolean;
  }[];
  learningObjectives: string[];
}

export interface SimulationReportResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  learningPath: string;
}

export async function generateSimulationReport(
  data: SimulationReportData
): Promise<SimulationReportResponse> {
  const prompt = buildSimulationPrompt(data);

  try {
    const content = await createDeepSeekCompletion({
      responseFormat: 'json_object',
      messages: [
        {
          role: 'system',
          content: `你是一位资深的项目管理培训专家，擅长分析学员在模拟演练中的表现，并提供专业反馈和改进建议。
请根据学员的决策数据，输出 JSON 格式报告，包含以下字段：
summary, strengths, weaknesses, suggestions, learningPath。
要求：
1. summary 控制在 100 字以内
2. strengths 返回 3 到 4 条
3. weaknesses 返回 2 到 3 条
4. suggestions 返回 3 到 4 条
5. learningPath 控制在 100 字以内
6. 语气专业、鼓励、可执行`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const parsed = parseJsonFromText<Record<string, any>>(content);
    return {
      summary: parsed.summary || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      learningPath: parsed.learningPath || '',
    };
  } catch (error) {
    console.error('DeepSeek simulation report error:', error);
    return generateFallbackReport(data);
  }
}

function buildSimulationPrompt(data: SimulationReportData): string {
  const decisionAnalysis = data.stageHistory
    .map(
      (stage, idx) => `阶段${idx + 1}: ${stage.stageTitle}
- 决策: ${stage.decisionText}
- 得分: ${stage.score}分
- 是否最优: ${stage.isOptimal ? '是' : '否'}
- 反馈: ${stage.feedback}`
    )
    .join('\n\n');

  return `请分析以下项目管理模拟演练的表现：

【场景信息】
标题: ${data.scenarioTitle}
难度: ${data.difficulty}
分类: ${data.category}
描述: ${data.scenarioDescription}

【总体得分】
${data.totalScore}/${data.maxScore} (${data.percentage}%)

【决策详情】
${decisionAnalysis}

【学习目标】
${data.learningObjectives.join('、')}

请返回 JSON。`;
}

function generateFallbackReport(data: SimulationReportData): SimulationReportResponse {
  const optimalCount = data.stageHistory.filter(stage => stage.isOptimal).length;
  const totalStages = data.stageHistory.length;

  let summary = '';
  if (data.percentage >= 90) {
    summary = `表现出色，你在 ${data.scenarioTitle} 中做出了 ${optimalCount}/${totalStages} 个高质量决策。`;
  } else if (data.percentage >= 70) {
    summary = `整体表现良好，你已经具备稳定的项目判断力，但还有进一步优化空间。`;
  } else {
    summary = `你已完成本次模拟，建议复盘关键节点并继续强化项目管理决策能力。`;
  }

  const strengths = data.stageHistory
    .filter(stage => stage.isOptimal)
    .slice(0, 4)
    .map(stage => `在“${stage.stageTitle}”阶段做出了较优决策。`);

  const weaknesses = data.stageHistory
    .filter(stage => !stage.isOptimal)
    .slice(0, 3)
    .map(stage => `“${stage.stageTitle}”阶段的判断还有提升空间。`);

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ['完整完成了整场模拟流程。'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['部分选择仍可从成本、进度和风险角度继续优化。'],
    suggestions: [
      '复盘每个阶段的反馈，重点理解高分决策背后的逻辑。',
      '把本次模拟中失分最多的场景单独拿出来重复练习。',
      '结合课程知识点补强范围管理、风险管理和沟通管理。',
    ],
    learningPath: '建议继续完成同类型实战案例，并结合项目管理基础课程做针对性补强。',
  };
}
