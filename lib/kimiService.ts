// Kimi (Moonshot) API 服务
// 用于生成模拟演练的智能报告总结

// 从环境变量获取 API Key
const getMoonshotApiKey = () => {
    try {
        return (import.meta as any).env?.VITE_MOONSHOT_API_KEY || '';
    } catch {
        return '';
    }
};
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

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

export interface KimiReportResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  learningPath: string;
}

/**
 * 使用Kimi API生成模拟演练报告
 */
export async function generateSimulationReport(
  data: SimulationReportData
): Promise<KimiReportResponse> {
  const apiKey = getMoonshotApiKey();
  if (!apiKey) {
    console.warn('Moonshot API key not configured, using fallback report');
    return generateFallbackReport(data);
  }

  const prompt = buildSimulationPrompt(data);

  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: `你是一位资深的项目管理培训专家，擅长分析学员在模拟演练中的表现，并提供专业的反馈和建议。
请根据学员的决策数据，生成一份结构化的评估报告，包含：
1. 总体表现总结（100字以内）
2. 优势点（3-4条）
3. 待改进点（2-3条）
4. 具体建议（3-4条）
5. 后续学习路径建议（100字以内）

请用专业、鼓励的语气，输出JSON格式。`
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return {
          summary: parsed.summary || parsed.总体表现总结 || '',
          strengths: parsed.strengths || parsed.优势点 || [],
          weaknesses: parsed.weaknesses || parsed.待改进点 || [],
          suggestions: parsed.suggestions || parsed.具体建议 || [],
          learningPath: parsed.learningPath || parsed.后续学习路径建议 || '',
        };
      } catch (e) {
        console.warn('Failed to parse JSON response, using raw content');
        return {
          summary: content.slice(0, 200),
          strengths: [],
          weaknesses: [],
          suggestions: [],
          learningPath: '',
        };
      }
    }

    return generateFallbackReport(data);
  } catch (error) {
    console.error('Kimi API error:', error);
    return generateFallbackReport(data);
  }
}

/**
 * 构建模拟演练分析的prompt
 */
function buildSimulationPrompt(data: SimulationReportData): string {
  const decisionAnalysis = data.stageHistory.map((stage, idx) => {
    return `阶段${idx + 1}: ${stage.stageTitle}
- 决策: ${stage.decisionText}
- 得分: ${stage.score}分
- 是否最优: ${stage.isOptimal ? '是' : '否'}
- 反馈: ${stage.feedback}`;
  }).join('\n\n');

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

请生成JSON格式的评估报告，包含字段: summary, strengths(数组), weaknesses(数组), suggestions(数组), learningPath`;
}

/**
 * 生成本地回退报告（当API不可用时）
 */
function generateFallbackReport(data: SimulationReportData): KimiReportResponse {
  const optimalCount = data.stageHistory.filter(s => s.isOptimal).length;
  const totalStages = data.stageHistory.length;
  
  let summary = '';
  if (data.percentage >= 90) {
    summary = `表现卓越！你在"${data.scenarioTitle}"模拟中展现了出色的项目管理能力，${optimalCount}/${totalStages}个决策达到最优。`;
  } else if (data.percentage >= 70) {
    summary = `表现良好。你在模拟中做出了大部分合理决策，但仍有优化空间。`;
  } else {
    summary = `完成了模拟演练。建议回顾项目管理最佳实践，提升决策质量。`;
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  data.stageHistory.forEach(stage => {
    if (stage.isOptimal) {
      strengths.push(`在"${stage.stageTitle}"阶段做出了最优决策`);
    } else if (stage.score < 50) {
      weaknesses.push(`"${stage.stageTitle}"阶段决策有待改进`);
    }
  });

  if (strengths.length === 0) strengths.push('完成了全部模拟流程');
  if (weaknesses.length === 0) weaknesses.push('部分决策非最优，有提升空间');

  return {
    summary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    suggestions: [
      '回顾每个阶段的决策反馈，理解最优解思路',
      '学习相关项目管理知识体系',
      '多参与模拟演练，积累经验',
    ],
    learningPath: '建议继续完成同类别场景，巩固所学知识。',
  };
}

/**
 * 生成美观的HTML报告
 */
export function generateHTMLReport(
  data: SimulationReportData,
  kimiReport: KimiReportResponse
): string {
  const decisionRows = data.stageHistory.map((stage, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; color: #374151;">${idx + 1}</td>
      <td style="padding: 12px; color: #111; font-weight: 500;">${stage.stageTitle}</td>
      <td style="padding: 12px; color: #374151;">${stage.decisionText}</td>
      <td style="padding: 12px;">
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; ${stage.isOptimal ? 'background: #d1fae5; color: #065f46;' : 'background: #fef3c7; color: #92400e;'}">
          ${stage.isOptimal ? '✓ 最优' : '○ 一般'}
        </span>
      </td>
      <td style="padding: 12px; color: ${stage.score >= 20 ? '#059669' : stage.score >= 10 ? '#d97706' : '#dc2626'}; font-weight: 600;">${stage.score}分</td>
    </tr>
  `).join('');

  const strengthsList = kimiReport.strengths.map(s => `<li style="margin-bottom: 8px; color: #065f46;">✓ ${s}</li>`).join('');
  const weaknessesList = kimiReport.weaknesses.map(w => `<li style="margin-bottom: 8px; color: #92400e;">○ ${w}</li>`).join('');
  const suggestionsList = kimiReport.suggestions.map(s => `<li style="margin-bottom: 8px; color: #1e40af;">→ ${s}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProjectFlow 模拟演练报告</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: #f3f4f6;
            color: #1f2937;
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border-radius: 24px;
            padding: 48px;
            color: white;
            margin-bottom: 32px;
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
        }
        .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; opacity: 0.9; }
        .score-section { 
            display: flex; 
            align-items: center; 
            gap: 48px; 
            margin-top: 32px;
        }
        .score-circle { 
            width: 140px; 
            height: 140px; 
            border-radius: 50%; 
            background: rgba(255,255,255,0.2);
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            border: 4px solid rgba(255,255,255,0.3);
        }
        .score-value { font-size: 36px; font-weight: 700; }
        .score-label { font-size: 12px; opacity: 0.8; }
        .scenario-info { flex: 1; }
        .scenario-info h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .meta-tags { display: flex; gap: 12px; margin-top: 16px; }
        .tag { 
            padding: 6px 16px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 20px; 
            font-size: 13px; 
        }
        .card { 
            background: white; 
            border-radius: 20px; 
            padding: 32px; 
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .card h3 { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            display: flex; 
            align-items: center; 
            gap: 12px;
        }
        .card h3 .icon { 
            width: 36px; 
            height: 36px; 
            border-radius: 10px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 18px;
        }
        .ai-summary { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; }
        .ai-summary h3 { color: #166534; }
        .ai-summary h3 .icon { background: #dcfce7; }
        .ai-content { color: #166534; line-height: 1.8; font-size: 15px; }
        
        .strengths h3 { color: #166534; }
        .strengths h3 .icon { background: #dcfce7; }
        .strengths ul { list-style: none; padding: 0; }
        
        .weaknesses h3 { color: #92400e; }
        .weaknesses h3 .icon { background: #fef3c7; }
        .weaknesses ul { list-style: none; padding: 0; }
        
        .suggestions h3 { color: #1e40af; }
        .suggestions h3 .icon { background: #dbeafe; }
        .suggestions ul { list-style: none; padding: 0; }
        
        .learning-path h3 { color: #7c3aed; }
        .learning-path h3 .icon { background: #ede9fe; }
        .learning-path-content { 
            background: #faf5ff; 
            border: 1px solid #ddd6fe; 
            border-radius: 16px; 
            padding: 24px;
            color: #5b21b6;
        }
        
        .decisions-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .decisions-table th { 
            text-align: left; 
            padding: 12px; 
            background: #f9fafb; 
            color: #6b7280; 
            font-weight: 500;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .footer { 
            text-align: center; 
            padding: 32px; 
            color: #9ca3af; 
            font-size: 13px;
        }
        .footer .logo { 
            font-size: 20px; 
            font-weight: 700; 
            color: #3b82f6; 
            margin-bottom: 8px;
        }
        
        .print-btn {
            position: fixed;
            bottom: 32px;
            right: 32px;
            padding: 16px 32px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
            transition: all 0.2s;
        }
        .print-btn:hover { background: #2563eb; transform: translateY(-2px); }
        
        @media print {
            body { background: white; }
            .print-btn { display: none; }
            .container { padding: 0; }
            .card { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 模拟演练报告</h1>
            <p class="subtitle">AI 驱动的项目管理能力评估</p>
            
            <div class="score-section">
                <div class="score-circle">
                    <div class="score-value">${data.percentage}%</div>
                    <div class="score-label">综合得分</div>
                </div>
                <div class="scenario-info">
                    <h2>${data.scenarioTitle}</h2>
                    <p style="opacity: 0.9; font-size: 14px;">${data.scenarioDescription}</p>
                    <div class="meta-tags">
                        <span class="tag">难度: ${data.difficulty}</span>
                        <span class="tag">分类: ${data.category}</span>
                        <span class="tag">${data.totalScore}/${data.maxScore} 分</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card ai-summary">
            <h3><span class="icon">🤖</span>AI 评估总结</h3>
            <div class="ai-content">
                <p style="margin-bottom: 16px;"><strong>${kimiReport.summary}</strong></p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="card strengths">
                <h3><span class="icon">💪</span>优势表现</h3>
                <ul>${strengthsList}</ul>
            </div>
            
            <div class="card weaknesses">
                <h3><span class="icon">📈</span>待改进</h3>
                <ul>${weaknessesList}</ul>
            </div>
        </div>
        
        <div class="card suggestions">
            <h3><span class="icon">💡</span>改进建议</h3>
            <ul>${suggestionsList}</ul>
        </div>
        
        <div class="card learning-path">
            <h3><span class="icon">🗺️</span>学习路径</h3>
            <div class="learning-path-content">
                <p>${kimiReport.learningPath}</p>
            </div>
        </div>
        
        <div class="card">
            <h3 style="margin-bottom: 20px;">📋 决策详情</h3>
            <table class="decisions-table">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>阶段</th>
                        <th>决策</th>
                        <th>评价</th>
                        <th>得分</th>
                    </tr>
                </thead>
                <tbody>${decisionRows}</tbody>
            </table>
        </div>
        
        <div class="footer">
            <div class="logo">ProjectFlow</div>
            <p>项目管理学习平台 · 本报告由 AI 自动生成</p>
            <p style="margin-top: 4px;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ 打印 / 保存 PDF</button>
</body>
</html>`;
}
