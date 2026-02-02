
import React, { useState } from 'react';
import { 
  FlaskConical, Calculator, Users, LayoutKanban, 
  ChevronLeft, Sparkles, ArrowRight, TrendingDown,
  TrendingUp, Gauge, ShieldAlert, Link2, GitBranch,
  DollarSign
} from 'lucide-react';
import { UserProfile } from '../types';
import MonteCarloSimulator from '../tools/MonteCarloSimulator';
import PlanningPoker from '../tools/PlanningPoker';
import KanbanFlowMetrics from '../tools/KanbanFlowMetrics';
import LearningCurve from '../tools/LearningCurve';
import EVMPrediction from '../tools/EVMPrediction';
import VelocityTracker from '../tools/VelocityTracker';
import FMEATool from '../tools/FMEATool';
import CCPMSchedule from '../tools/CCPMSchedule';
import FishboneDiagram from '../tools/FishboneDiagram';
import QualityCostTool from '../tools/QualityCost';

interface ToolsLabProps {
  onBack: () => void;
  currentUser?: UserProfile | null;
}

type ToolId = 
  | 'monte-carlo' | 'planning-poker' | 'kanban-flow' 
  | 'learning-curve' | 'evm-prediction' | 'velocity-tracker' | 'fmea'
  | 'ccpm' | 'fishbone' | 'quality-cost'
  | null;

const p1Tools = [
  {
    id: 'monte-carlo' as const,
    name: '蒙特卡洛模拟器',
    description: '基于PERT分布的风险量化分析，10,000次模拟预测项目完成概率',
    icon: Calculator,
    color: 'from-blue-500 to-indigo-600',
    badge: 'P1 核心'
  },
  {
    id: 'planning-poker' as const,
    name: '敏捷估算扑克',
    description: '团队协作估算工具，同步出牌暴露差异，达成共识',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    badge: 'P1 核心'
  },
  {
    id: 'kanban-flow' as const,
    name: 'Kanban流动指标',
    description: '可视化累积流图，计算Lead Time、Cycle Time和吞吐量',
    icon: LayoutKanban,
    color: 'from-green-500 to-teal-600',
    badge: 'P1 核心'
  }
];

const p2Tools = [
  {
    id: 'learning-curve' as const,
    name: '学习曲线模型',
    description: '基于经验曲线效应预测生产效率提升，优化工期估算',
    icon: TrendingDown,
    color: 'from-cyan-500 to-blue-600',
    badge: 'P2 决策支持'
  },
  {
    id: 'evm-prediction' as const,
    name: '挣值趋势预测',
    description: 'AI驱动的SPI/CPI趋势预测，智能分析项目健康状况',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-600',
    badge: 'P2 决策支持'
  },
  {
    id: 'velocity-tracker' as const,
    name: '迭代速率跟踪',
    description: '燃尽图、速率柱状图与移动平均线，数据驱动Sprint规划',
    icon: Gauge,
    color: 'from-amber-500 to-orange-600',
    badge: 'P2 决策支持'
  },
  {
    id: 'fmea' as const,
    name: 'FMEA风险分析',
    description: '故障模式与影响分析，RPN风险优先级排序',
    icon: ShieldAlert,
    color: 'from-red-500 to-rose-600',
    badge: 'P2 决策支持'
  }
];

const p3Tools = [
  {
    id: 'ccpm' as const,
    name: '关键链法调度',
    description: 'CCPM高级调度，资源约束与项目缓冲管理',
    icon: Link2,
    color: 'from-indigo-500 to-blue-600',
    badge: 'P3 高级工具'
  },
  {
    id: 'fishbone' as const,
    name: '鱼骨图分析',
    description: '结构化根因分析，人机料法环五维诊断',
    icon: GitBranch,
    color: 'from-teal-500 to-emerald-600',
    badge: 'P3 高级工具'
  },
  {
    id: 'quality-cost' as const,
    name: '质量成本模型',
    description: 'COQ分析 - 预防、评估与失败成本优化',
    icon: DollarSign,
    color: 'from-pink-500 to-rose-600',
    badge: 'P3 高级工具'
  }
];

const ToolsLab: React.FC<ToolsLabProps> = ({ onBack, currentUser }) => {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const renderTool = () => {
    const toolComponents: Record<string, React.ReactNode> = {
      'monte-carlo': <MonteCarloSimulator currentUser={currentUser} />,
      'planning-poker': <PlanningPoker currentUser={currentUser} />,
      'kanban-flow': <KanbanFlowMetrics currentUser={currentUser} />,
      'learning-curve': <LearningCurve currentUser={currentUser} />,
      'evm-prediction': <EVMPrediction currentUser={currentUser} />,
      'velocity-tracker': <VelocityTracker currentUser={currentUser} />,
      'fmea': <FMEATool currentUser={currentUser} />,
      'ccpm': <CCPMSchedule currentUser={currentUser} />,
      'fishbone': <FishboneDiagram currentUser={currentUser} />,
      'quality-cost': <QualityCostTool currentUser={currentUser} />,
    };

    const toolNames: Record<string, string> = {
      'monte-carlo': '蒙特卡洛模拟器',
      'planning-poker': '敏捷估算扑克',
      'kanban-flow': 'Kanban流动指标',
      'learning-curve': '学习曲线模型',
      'evm-prediction': '挣值趋势预测',
      'velocity-tracker': '迭代速率跟踪',
      'fmea': 'FMEA风险分析',
      'ccpm': '关键链法调度',
      'fishbone': '鱼骨图分析',
      'quality-cost': '质量成本模型',
    };

    if (!activeTool) return null;

    return (
      <div className="w-full h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={18} />
            返回工具库
          </button>
          <span className="font-medium text-gray-900">{toolNames[activeTool]}</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 overflow-hidden">
          {toolComponents[activeTool]}
        </div>
      </div>
    );
  };

  if (!activeTool) {
    return (
      <div className="w-full min-h-screen bg-[#F5F5F7] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                  <FlaskConical size={24} />
                </div>
                工具实验室
              </h1>
              <p className="text-gray-500 mt-2">
                10个项目管理实用工具，覆盖风险、估算、流程、成本全方位分析
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles size={20} />
              <span className="font-semibold">10个工具已全部上线</span>
            </div>
            <p className="text-purple-100">
              从蒙特卡洛模拟到质量成本分析，每个工具都支持数据持久化、历史记录和报告导出。
              所有工具均可在项目中实际应用。
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              第一批：核心分析工具
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {p1Tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              第二批：决策支持工具
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {p2Tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              第三批：高级分析工具
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {p3Tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
              ))}
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-100 rounded-2xl text-center">
            <p className="text-gray-600">
              所有工具数据存储在Supabase数据库中，支持历史记录查看和报告导出
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ProjectFlow Lab Tools v1.0 | 技术栈: React + TypeScript + Supabase + Recharts
            </p>
          </div>
        </div>
      </div>
    );
  }

  return renderTool();
};

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    badge: string;
  };
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg`}>
          <tool.icon size={28} />
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
          {tool.badge}
        </span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
        {tool.name}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">
        {tool.description}
      </p>
      <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-3 transition-all">
        开始使用
        <ArrowRight size={16} className="ml-1" />
      </div>
    </div>
  );
};

export default ToolsLab;
