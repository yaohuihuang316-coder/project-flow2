
import React, { useState } from 'react';
import { 
  FlaskConical, Calculator, Users, LayoutKanban, 
  ChevronLeft, Sparkles, ArrowRight
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import MonteCarloSimulator from '../tools/MonteCarloSimulator';
import PlanningPoker from '../tools/PlanningPoker';
import KanbanFlowMetrics from '../tools/KanbanFlowMetrics';

interface ToolsLabProps {
  onBack: () => void;
  currentUser?: UserProfile | null;
}

type ToolId = 'monte-carlo' | 'planning-poker' | 'kanban-flow' | null;

const tools = [
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

const ToolsLab: React.FC<ToolsLabProps> = ({ onBack, currentUser }) => {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  // Render active tool
  if (activeTool === 'monte-carlo') {
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
          <span className="font-medium text-gray-900">蒙特卡洛模拟器</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 overflow-hidden">
          <MonteCarloSimulator currentUser={currentUser} />
        </div>
      </div>
    );
  }

  if (activeTool === 'planning-poker') {
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
          <span className="font-medium text-gray-900">敏捷估算扑克</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 overflow-hidden">
          <PlanningPoker currentUser={currentUser} />
        </div>
      </div>
    );
  }

  if (activeTool === 'kanban-flow') {
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
          <span className="font-medium text-gray-900">Kanban流动指标</span>
          <div className="w-20" />
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanFlowMetrics currentUser={currentUser} />
        </div>
      </div>
    );
  }

  // Tool Library Home
  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              项目管理实用工具集合，助力数据驱动决策
            </p>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={20} />
            <span className="font-semibold">新功能上线</span>
          </div>
          <p className="text-purple-100">
            新增3个核心分析工具：蒙特卡洛模拟器、敏捷估算扑克、Kanban流动指标。
            所有工具均支持数据持久化和报告导出。
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
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
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">即将上线</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '学习曲线模型', desc: '工期优化预测' },
              { name: '挣值趋势预测', desc: 'AI驱动分析' },
              { name: '迭代速率跟踪', desc: 'Sprint燃尽图' },
              { name: 'FMEA工具', desc: '风险预防分析' },
            ].map((item) => (
              <div key={item.name} className="bg-gray-100 rounded-2xl p-4 opacity-60">
                <p className="font-medium text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsLab;
