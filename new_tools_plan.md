# 🚀 10个新工具完整开发方案

> **技术栈**: React + TypeScript + Supabase + Google Gemini AI  
> **核心原则**: 可用工具 >>> 展示工具 | 必要时调用AI增强用户体验

---

## 📋 工具优先级与分配

### 🔥 第一批：核心分析工具（P1 - 立即开发）

1. **蒙特卡洛模拟器** - 风险量化利器
2. **敏捷估算扑克** - 团队协作游戏化
3. **Kanban流动指标** - 效率可视化

### ⚡ 第二批：决策支持工具（P2 - 后续开发）

4. **学习曲线模型** - 工期优化
5. **挣值趋势预测** - AI驱动预测
6. **迭代速率跟踪** - 数据驱动
7. **FMEA工具** - 风险预防

### 🎯 第三批：高级工具（P3 - 选择性开发）

8. **关键链法(CCPM)** - 高级调度
9. **问题树/鱼骨图** - 根因分析
10. **质量成本模型** - 财务优化

---

## 🎯 工具 #1: 蒙特卡洛模拟器

### 业务价值
**解决痛点**: 传统三点估算只能给出单一值，无法量化不确定性  
**用户收益**: 用数据说话 - "项目有75%概率在90天内完成"

### 核心技术

```typescript
// Monte Carlo核心算法
interface TaskInput {
  id: string;
  name: string;
  optimistic: number;  // 乐观估计
  mostLikely: number;  // 最可能
  pessimistic: number; // 悲观估计
}

// 使用PERT分布采样
function pertSample(o: number, m: number, p: number): number {
  const mean = (o + 4*m + p) / 6;
  const stddev = (p - o) / 6;
  // Box-Muller transform生成正态分布
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

// 运行10,000次模拟
function runSimulation(tasks: TaskInput[], iterations = 10000): number[] {
  const results: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const totalDuration = tasks.reduce((sum, task) => {
      return sum + pertSample(task.optimistic, task.mostLikely, task.pessimistic);
    }, 0);
    results.push(totalDuration);
  }
  return results.sort((a, b) => a - b);
}

// 计算置信区间
function getConfidenceIntervals(sorted: number[]) {
  return {
    p10: sorted[Math.floor(sorted.length * 0.1)],
    p50: sorted[Math.floor(sorted.length * 0.5)], // 中位数
    p75: sorted[Math.floor(sorted.length * 0.75)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    mean: sorted.reduce((a, b) => a + b) / sorted.length
  };
}
```

### 数据库Schema

```sql
CREATE TABLE lab_monte_carlo_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    project_name TEXT NOT NULL,
    tasks JSONB NOT NULL, -- 任务数组
    simulation_results JSONB, -- 结果数据
    iterations INT DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### UI设计

**左侧**: 任务输入表格  
| 任务 | 乐观(天) | 最可能 | 悲观 | 操作 |
|------|---------|--------|------|------|
| 设计 | [5] | [10] | [15] | 🗑️ |

**右侧**: 实时概率分布图（Recharts直方图）

**底部**: 结果卡片  
> ✅ **P50**: 42天 | **P75**: 51天 | **P90**: 63天  
> ℹ️ "有90%的概率在63天内完成"

### AI增强（可选）

```typescript
// 让AI分析结果并给出建议
const analyzeResults = async (tasks, results) => {
  const prompt = `
项目任务：${JSON.stringify(tasks)}
模拟结果：P50=${results.p50}天, P90=${results.p90}天
请分析：1)哪些任务风险最高 2)如何降低不确定性 3)建议的缓冲时间
  `;
  return await callGeminiAI(prompt);
};
```

---

## 🃏 工具 #2: 敏捷估算扑克

### 业务价值
**痛点**: 传统会议中，资深成员先发言会影响其他人  
**解决**: 同时出牌 → 暴露差异 → 讨论对齐

### 核心交互

```typescript
// Fibonacci序列选项
const points = ['?', '0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '☕'];

interface EstimationRound {
  storyId: string;
  storyTitle: string;
  votes: { [userId: string]: string }; // userId -> 选择的点数
  isRevealed: boolean;
}

// 检测是否达成一致
function checkConsensus(votes: Record<string, string>): boolean {
  const nonCoffeeVotes = Object.values(votes).filter(v => v !== '?' && v !== '☕');
  const uniqueVotes = new Set(nonCoffeeVotes);
  return uniqueVotes.size === 1; // 所有人选同一个数字
}

// 计算平均值（用于未达成一致时）
function calculateAverage(votes: Record<string, string>): number {
  const numericVotes = Object.values(votes)
    .filter(v => !isNaN(Number(v)))
    .map(Number);
  return numericVotes.reduce((a, b) => a + b) / numericVotes.length;
}
```

### 数据库Schema

```sql
CREATE TABLE lab_planning_poker_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name TEXT NOT NULL,
    stories JSONB NOT NULL, -- 用户故事列表
    estimates JSONB, -- 最终估算结果
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### UI流程

1. **准备阶段**: 输入用户故事列表
2. **投票阶段**: 显示Fibonacci卡片，用户选择
3. **揭示**: 所有人齐翻牌，显示差异
4. **讨论**: 如果不一致，显示"最高vs最低估计者需讨论"
5. **重投**: 重新投票直到一致

**动画效果**: 翻牌CSS动画

```css
@keyframes flipCard {
  from { transform: rotateY(180deg); }
  to { transform: rotateY(0); }
}
```

### 单人模式

由于是单人使用，可以模拟3-5个"虚拟团队成员"自动投票：

```typescript
function simulateTeamVotes(storyComplexity: 'simple' | 'medium' | 'complex'): string[] {
  const basePoints = { simple: '3', medium: '8', complex: '20' };
  const base = basePoints[storyComplexity];
  // 随机生成接近的其他估算
  return ['5', base, '8', base, '13']; //  模拟5人投票
}
```

---

## 📊 工具 #3: Kanban流动指标

### 业务价值
**可见性**: 将隐形的流程瓶颈可视化  
**决策**: 用数据回答"我们应该限制WIP吗？"

### 核心指标

```typescript
interface KanbanMetrics {
  // 累积流图 (CFD)
  cfd: { date: string; backlog: number; inProgress: number; done: number }[];
  
  // 流动效率
  leadTime: number;      // 从Backlog到Done的时间
  cycleTime: number;     // 从开始工作到完成的时间
  throughput: number;    // 单位时间内完成的任务数
  
  // WIP
  currentWIP: number;
  wipLimit: number;
  wipViolations: number; // 违反次数
}

// Little's Law: LeadTime = WIP / Throughput
function calculateLeadTime(wip: number, throughput: number): number {
  return wip / throughput;
}
```

### 数据库Schema

```sql
CREATE TABLE lab_kanban_flow_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_name TEXT,
    daily_snapshots JSONB, -- 每日WIP快照
    completed_items JSONB, -- 已完成项目及其时间戳
    wip_limit INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### UI组件

**顶部**: 关键指标卡片  
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Lead Time    │ │ Cycle Time   │ │ Throughput   │
│ 8.5 天      │ │ 4.2 天      │ │ 12 项/周    │
└──────────────┘ └──────────────┘ └──────────────┘
```

**中部**: 累积流图 (CFD) - AreaChart堆叠面积图

**底部**: WIP趋势 - LineChart显示每日WIP

### AI分析

```typescript
const analyzeFlowMetrics = async (metrics: KanbanMetrics) => {
  const prompt = `
Kanban指标：
- Lead Time: ${metrics.leadTime}天
- Cycle Time: ${metrics.cycleTime}天
- Throughput: ${metrics.throughput}项/周
- WIP: ${metrics.currentWIP} (限制${metrics.wipLimit})

请分析：1) 是否有瓶颈 2) WIP限制是否合理 3) 改进建议
  `;
  return await callGeminiAI(prompt);
};
```

---

## 📚 工具 #4-10: 简要方案

### 4⃣ 学习曲线模型

**公式**: `T_n = T_1 * n^(-log2(LR))`  
其中LR=学习率(0.8表示每double数量，时间减少20%)

**UI**: 输入首次任务时间 → 预测第10次、第100次的时间

---

### 5⃣ 挣值趋势预测（AI驱动）

**输入**: 历史SPI/CPI数据  
**AI**: 用Gemini预测未来3个月趋势  
**输出**: 带置信区间的预测曲线

```typescript
const prompt = `
历史挣值数据（月度）：
${JSON.stringify(historicalEVM)}
请预测未来3个月的SPI和CPI，并给出置信区间
`;
```

---

### 6⃣ 迭代速率跟踪器

**核心**: 记录每个Sprint的Story Points完成数  
**图表**: 燃尽图 +速率柱状图 + 移动平均线  
**预测**: 基于最近3个sprint的平均速率

---

### 7⃣ FMEA工具

**表格**: 故障模式 | 严重度(1-10) | 发生率 | 检出率  
**自动计算**: RPN = 严重度 × 发生率 × 检出率  
**排序**: 按RPN降序，高亮RPN>100的项

---

### 8⃣ 关键链法(CCPM)

**基于CPM**: 添加"资源约束"考虑  
**缓冲**: 自动计算项目缓冲 = 关键链长度 × 50%  
**UI**: 类似CPM网络图，但标注缓冲区

---

### 9⃣ 问题树/鱼骨图

**交互**: 拖拽式构建  
**AI**: "自动建议根因" - 输入问题描述，AI给出可能原因树

```typescript
const prompt = `问题：${problemDescription}
请用鱼骨图格式(人、机、料、法、环)列出可能原因`;
```

---

### 🔟 质量成本模型

**分类**: 预防成本 | 评估成本 | 内部失败 | 外部失败  
**公式**: COQ = (质量成本总和 / 总销售额) × 100%  
**基准**: 显示行业标准值对比

---

## 🛠️ 统一技术架构

### 组件结构模板

```typescript
const ToolComponent = () => {
  const toast = useToast(); // 使用Toast系统
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolId, setToolId] = useState<string | null>(null);
  
  // 数据库加载
  useEffect(() => {
    loadFromDatabase();
  }, []);
  
  const loadFromDatabase = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_tool_table')
      .select('*')
      .limit(1);
    
    if (error) {
      toast.error('数据加载失败');
      return;
    }
    
    if (data && data.length > 0) {
      setToolId(data[0].id);
      setData(data[0].tool_data);
    } else {
      // 创建新记录
      const { data: newData } = await supabase
        .from('lab_tool_table')
        .insert({ tool_data: [] })
        .select()
        .single();
      setToolId(newData.id);
    }
    setLoading(false);
  };
  
  const saveToDatabase = async (newData: DataType[]) => {
    const { error } = await supabase
      .from('lab_tool_table')
      .update({ tool_data: newData })
      .eq('id', toolId);
      
   if (error) {
      toast.error('保存失败');
    } else {
      toast.success('保存成功！');
    }
  };
  
  return loading ? <ToolSkeleton /> : <ActualContent />;
};
```

### 数据库表命名规范

```
lab_monte_carlo_simulations
lab_planning_poker_sessions
lab_kanban_flow_data
lab_learning_curve_models
lab_evm_predictions
lab_velocity_trackers
lab_fmea_analyses
lab_ccpm_schedules
lab_fishbone_diagrams
lab_quality_cost_models
```

---

## 🎨 UI一致性指南

### 按钮规范
- **主操作**: `bg-blue-600 hover:bg-blue-700`
- **危险操作**: `bg-red-500 hover:bg-red-600`
- **次要操作**: `border border-gray-300 hover:bg-gray-50`

### 卡片规范
```tsx
<div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
```

### 图表颜色
```typescript
const CHART_COLORS = {
  primary: '#3B82F6',   // Blue
  success: '#10B981',   // Green
  warning: '#F59E0B',   // Orange
  danger: '#EF4444',    // Red
  info: '#8B5CF6'       // Purple
};
```

---

## 📝 实施checklist

每个工具开发完成需满足：

- [ ] 完整的CRUD功能
- [ ] Supabase数据持久化
- [ ] Loading skeleton
- [ ] Toast成功/失败通知
- [ ] PDF导出功能
- [ ] Markdown导出（如适用）
- [ ] AI集成（如适用）
- [ ] 响应式布局
- [ ] TypeScript类型安全
- [ ] 添加到LAB_CATEGORIES配置

---

## 🚀 开发顺序建议

### Week 1: 蒙特卡洛模拟器
- Day 1-2: 核心算法 + UI
- Day 3: 数据库集成
- Day 4: 图表可视化
- Day 5: PDF导出 + AI分析

### Week 2: 敏捷扑克 + Kanban
- Day 1-2: 扑克游戏逻辑
- Day 3-4: Kanban指标计算
- Day 5: 两者的UI优化

### Week 3+: 剩余工具
按优先级逐个实现

---

## 💡 关键成功因素

1. **复用现有代码**: OKR/Retro/WBS的数据库集成模式直接复制
2. **AI合理使用**: 不是所有工具都需要AI，仅在增值明显时使用
3. **用户体验优先**: Skeleton + Toast比完美算法更重要
4. **测试数据准备**: 每个工具预设1-2个示例数据集

---

**准备好了吗？告诉我从哪个工具开始！** 🎯
