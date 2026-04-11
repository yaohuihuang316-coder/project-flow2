interface SimulationReportData {
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

interface SimulationReportResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  learningPath: string;
}

export function generateHTMLReport(
  data: SimulationReportData,
  report: SimulationReportResponse
): string {
  const decisionRows = data.stageHistory
    .map(
      (stage, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${stage.stageTitle}</td>
          <td>${stage.decisionText}</td>
          <td>${stage.score}</td>
          <td>${stage.isOptimal ? '最优' : '可优化'}</td>
        </tr>
      `
    )
    .join('');

  const renderList = (items: string[]) =>
    items.map(item => `<li>${item}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ProjectFlow 模拟演练报告</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f5f7fb;
      color: #1f2937;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
    }
    .hero {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff;
      padding: 32px;
      border-radius: 24px;
      margin-bottom: 24px;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: 32px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .meta span {
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      font-size: 13px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
    h2 {
      margin: 0 0 16px;
      font-size: 20px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      line-height: 1.8;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #475569;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 13px;
      margin-top: 24px;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .card {
        box-shadow: none;
        border: 1px solid #e5e7eb;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <h1>模拟演练报告</h1>
      <p>${data.scenarioTitle}</p>
      <div class="meta">
        <span>难度：${data.difficulty}</span>
        <span>分类：${data.category}</span>
        <span>得分：${data.totalScore}/${data.maxScore}</span>
        <span>完成度：${data.percentage}%</span>
      </div>
    </section>

    <section class="card">
      <h2>AI 总结</h2>
      <p>${report.summary}</p>
    </section>

    <section class="grid">
      <section class="card">
        <h2>优势表现</h2>
        <ul>${renderList(report.strengths)}</ul>
      </section>
      <section class="card">
        <h2>待改进项</h2>
        <ul>${renderList(report.weaknesses)}</ul>
      </section>
    </section>

    <section class="card">
      <h2>学习建议</h2>
      <ul>${renderList(report.suggestions)}</ul>
    </section>

    <section class="card">
      <h2>学习路径</h2>
      <p>${report.learningPath}</p>
    </section>

    <section class="card">
      <h2>决策明细</h2>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>阶段</th>
            <th>决策</th>
            <th>得分</th>
            <th>评价</th>
          </tr>
        </thead>
        <tbody>${decisionRows}</tbody>
      </table>
    </section>

    <div class="footer">
      <p>ProjectFlow 自动生成报告</p>
      <p>${new Date().toLocaleString('zh-CN')}</p>
    </div>
  </div>
</body>
</html>`;
}
