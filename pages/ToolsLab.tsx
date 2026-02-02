
import React, { useState } from 'react';
import { 
  FlaskConical, Calculator, Users, Kanban, 
  ChevronLeft, Sparkles, ArrowRight, TrendingDown,
  TrendingUp, Gauge, ShieldAlert, Link2, GitBranch,
  DollarSign, Lock, Crown, AlertCircle
} from 'lucide-react';
import { UserProfile, MembershipTier, Page } from '../types';
import { MEMBERSHIP_CONFIG, hasTier } from '../lib/membership';
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
  onNavigate?: (page: Page) => void;
}

type ToolId = 
  | 'monte-carlo' | 'planning-poker' | 'kanban-flow' 
  | 'learning-curve' | 'evm-prediction' | 'velocity-tracker' | 'fmea'
  | 'ccpm' | 'fishbone' | 'quality-cost'
  | null;

// 工具配置，包含会员等级要求
interface ToolConfig {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  requiredTier: MembershipTier;
  category: 'basic' | 'pro' | 'pro_plus';
}

// 10个工具按会员等级分配
const tools: ToolConfig[] = [
  // Pro 会员工具 (5个) - 5门课程解锁
  {
    id: 'monte-carlo',
    name: '蒙特卡洛模拟器',
    description: '基于PERT分布的风险量化分析，10,000次模拟预测项目完成概率',
    icon: Calculator,
    color: 'from-blue-500 to-indigo-600',
    badge: 'PRO',
    requiredTier: 'pro',
    category: 'pro'
  },
  {
    id: 'planning-poker',
    name: '敏捷估算扑克',
    description: '团队协作估算工具，同步出牌暴露差异，达成共识',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    badge: 'PRO',
    requiredTier: 'pro',
    category: 'pro'
  },
  {
    id: 'kanban-flow',
    name: 'Kanban流动指标',
    description: '可视化累积流图，计算Lead Time、Cycle Time和吞吐量',
    icon: Kanban,
    color: 'from-green-500 to-teal-600',
    badge: 'PRO',
    requiredTier: 'pro',
    category: 'pro'
  },
  {
    id: 'learning-curve',
    name: '学习曲线模型',
    description: '基于经验曲线效应预测生产效率提升，优化工期估算',
    icon: TrendingDown,
    color: 'from-cyan-500 to-blue-600',
    badge: 'PRO',
    requiredTier: 'pro',
    category: 'pro'
  },
  {
    id: 'evm-prediction',
    name: '挣值趋势预测',
    description: 'AI驱动的SPI/CPI趋势预测，智能分析项目健康状况',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-600',
    badge: 'PRO',
    requiredTier: 'pro',
    category: 'pro'
  },
  // Pro+ 会员工具 (5个) - 10门课程解锁
  // Pro+ 会员工具 (5个) - 10门课程解锁
  {
    id: 'ccpm',
    name: '关键链法调度',
    description: 'CCPM高级调度，资源约束与项目缓冲管理',
    icon: Link2,
    color: 'from-indigo-500 to-blue-600',
    badge: 'Pro+',
    requiredTier: 'pro_plus',
    category: 'pro_plus'
  },
  {
    id: 'fishbone',
    name: '鱼骨图分析',
    description: '结构化根因分析，人机料法环五维诊断',
    icon: GitBranch,
    color: 'from-teal-500 to-emerald-600',
    badge: 'Pro+',
    requiredTier: 'pro_plus',
    category: 'pro_plus'
  },
  {
    id: 'quality-cost',
    name: '质量成本模型',
    description: 'COQ分析 - 预防、评估与失败成本优化',
    icon: DollarSign,
    color: 'from-pink-500 to-rose-600',
    badge: 'Pro+',
    requiredTier: 'pro_plus',
    category: 'pro_plus'
  }
];

const ToolsLab: React.FC<ToolsLabProps> = ({ onBack, currentUser, onNavigate }) => {
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<ToolConfig | null>(null);

  const userTier = currentUser?.membershipTier || 'free';

  // 检查用户是否有权限使用工具
  const canUseTool = (tool: ToolConfig): boolean => {
    return hasTier(currentUser, tool.requiredTier);
  };

  // 处理工具点击
  const handleToolClick = (tool: ToolConfig) => {
    if (canUseTool(tool)) {
      setActiveTool(tool.id);
    } else {
      setShowUpgradeModal(tool);
    }
  };

  // 按分类分组工具
  const toolsByCategory = {
    pro: tools.filter(t => t.category === 'pro'),
    pro_plus: tools.filter(t => t.category === 'pro_plus')
  };

  // 计算解锁进度
  const unlockedCount = tools.filter(t => canUseTool(t)).length;
  const totalCount = tools.length;

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
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
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
            <div className="text-right">
              <div className="text-sm text-gray-500">已解锁</div>
              <div className="text-2xl font-bold text-purple-600">{unlockedCount}/{totalCount}</div>
            </div>
          </div>

          {/* 当前会员等级提示 */}
          <div className={`rounded-2xl p-4 mb-8 text-white ${MEMBERSHIP_CONFIG[userTier].gradient}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={24} />
                <div>
                  <div className="font-semibold">{MEMBERSHIP_CONFIG[userTier].name}</div>
                  <div className="text-sm opacity-80">
                    {userTier === 'free' && '完成5门课程解锁工具实验室（Pro会员）'}
                    {userTier === 'pro' && '已解锁5个专业工具，完成10门课程解锁全部'}
                    {userTier === 'pro_plus' && '已解锁全部10个工具'}
                  </div>
                </div>
              </div>
              {userTier !== 'pro_plus' && onNavigate && (
                <button 
                  onClick={() => onNavigate(Page.MEMBERSHIP)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                >
                  升级会员
                </button>
              )}
            </div>
          </div>

          {/* Pro 工具 (5个) */}
          <ToolSection 
            title="专业工具" 
            subtitle="Pro 会员可用"
            tools={toolsByCategory.pro}
            userTier={userTier}
            onToolClick={handleToolClick}
            color="bg-purple-500"
          />

          {/* Pro+ 工具 (5个) */}
          <ToolSection 
            title="高级工具" 
            subtitle="完成10门课程解锁"
            tools={toolsByCategory.pro_plus}
            userTier={userTier}
            onToolClick={handleToolClick}
            color="bg-amber-500"
          />

          <div className="mt-12 p-6 bg-gray-100 rounded-2xl text-center">
            <p className="text-gray-600">
              所有工具数据存储在Supabase数据库中，支持历史记录查看和报告导出
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ProjectFlow Lab Tools v1.0 | 技术栈: React + TypeScript + Supabase + Recharts
            </p>
          </div>
        </div>

        {/* 升级提示弹窗 */}
        {showUpgradeModal && (
          <UpgradeModal 
            tool={showUpgradeModal}
            currentTier={userTier}
            onClose={() => setShowUpgradeModal(null)}
            onNavigate={onNavigate}
          />
        )}
      </div>
    );
  }

  return renderTool();
};

// 工具分组组件
interface ToolSectionProps {
  title: string;
  subtitle: string;
  tools: ToolConfig[];
  userTier: MembershipTier;
  onToolClick: (tool: ToolConfig) => void;
  color: string;
}

const ToolSection: React.FC<ToolSectionProps> = ({ 
  title, subtitle, tools, userTier, onToolClick, color 
}) => {
  if (tools.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        {title}
        <span className="text-sm font-normal text-gray-400">({subtitle})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            userTier={userTier}
            onClick={() => onToolClick(tool)} 
          />
        ))}
      </div>
    </div>
  );
};

// 工具卡片组件
interface ToolCardProps {
  tool: ToolConfig;
  userTier: MembershipTier;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, userTier, onClick }) => {
  const isLocked = !hasTier({ membershipTier: userTier } as UserProfile, tool.requiredTier);
  const requiredConfig = MEMBERSHIP_CONFIG[tool.requiredTier];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border p-6 shadow-sm transition-all relative overflow-hidden ${
        isLocked 
          ? 'border-gray-200 opacity-75 cursor-pointer hover:opacity-100' 
          : 'border-gray-200 hover:shadow-xl cursor-pointer group'
      }`}
    >
      {/* 锁定遮罩 */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Lock size={32} className="mx-auto text-gray-400 mb-2" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${requiredConfig.gradient} inline-block`}>
              {requiredConfig.name} 解锁
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg`}>
          <tool.icon size={28} />
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          isLocked ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-600'
        }`}>
          {tool.badge}
        </span>
      </div>
      <h3 className={`text-xl font-bold mb-2 transition-colors ${
        isLocked ? 'text-gray-400' : 'text-gray-900 group-hover:text-purple-600'
      }`}>
        {tool.name}
      </h3>
      <p className={`text-sm leading-relaxed mb-4 ${
        isLocked ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {tool.description}
      </p>
      <div className={`flex items-center font-medium text-sm transition-all ${
        isLocked ? 'text-gray-400' : 'text-purple-600 group-hover:gap-3'
      }`}>
        {isLocked ? (
          <>
            升级解锁
            <Lock size={14} className="ml-1" />
          </>
        ) : (
          <>
            开始使用
            <ArrowRight size={16} className="ml-1" />
          </>
        )}
      </div>
    </div>
  );
};

// 升级提示弹窗
interface UpgradeModalProps {
  tool: ToolConfig;
  currentTier: MembershipTier;
  onClose: () => void;
  onNavigate?: (page: Page) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  tool, currentTier, onClose, onNavigate 
}) => {
  const requiredConfig = MEMBERSHIP_CONFIG[tool.requiredTier];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">工具已锁定</h3>
          <p className="text-gray-500">
            "{tool.name}" 需要 {requiredConfig.name} 才能使用
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">当前等级</span>
            <span className="px-2 py-1 bg-gray-200 rounded-lg text-xs font-medium">
              {MEMBERSHIP_CONFIG[currentTier].name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">所需等级</span>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium text-white ${requiredConfig.gradient}`}>
              {requiredConfig.name}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {onNavigate && (
            <button
              onClick={() => {
                onClose();
                onNavigate(Page.MEMBERSHIP);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              升级会员
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            稍后升级
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolsLab;
