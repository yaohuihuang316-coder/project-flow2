
import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Calculator, Users, Kanban, 
  ChevronLeft, ArrowRight, TrendingDown,
  TrendingUp, Link2, GitBranch,
  DollarSign, Lock, Crown, Loader2, AlertCircle,
  Wrench, Cog, AlertTriangle, BarChart3, Layers
} from 'lucide-react';
import { UserProfile, MembershipTier, Page } from '../types';
import { MEMBERSHIP_CONFIG, hasTier } from '../lib/membership';
import { supabase } from '../lib/supabaseClient';
import MonteCarloSimulator from '../tools/MonteCarloSimulator';
import PlanningPoker from '../tools/PlanningPoker';
import KanbanFlowMetrics from '../tools/KanbanFlowMetrics';
import LearningCurve from '../tools/LearningCurve';
import EVMPrediction from '../tools/EVMPrediction';
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
  | 'learning-curve' | 'evm-prediction'
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

// 数据库工具类型
interface DbTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  required_tier: string;
  difficulty: string;
  usage_count: number;
  config: any;
  created_at: string;
}

// 图标映射表
const iconMapping: Record<string, React.ElementType> = {
  'Calculator': Calculator,
  'Users': Users,
  'Kanban': Kanban,
  'TrendingDown': TrendingDown,
  'TrendingUp': TrendingUp,
  'Link2': Link2,
  'GitBranch': GitBranch,
  'DollarSign': DollarSign,
  'Wrench': Wrench,
  'Cog': Cog,
  'AlertTriangle': AlertTriangle,
  'BarChart3': BarChart3,
  'Layers': Layers,
  'FlaskConical': FlaskConical,
};

// 根据分类获取颜色配置
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'pro': 'from-blue-500 to-indigo-600',
    'pro_plus': 'from-amber-500 to-orange-600',
    'basic': 'from-green-500 to-teal-600',
    'risk': 'from-red-500 to-rose-600',
    'evm': 'from-violet-500 to-purple-600',
    'agile': 'from-orange-500 to-red-500',
    'resource': 'from-cyan-500 to-blue-600',
    'cpm': 'from-indigo-500 to-blue-600',
  };
  return colorMap[category] || 'from-gray-500 to-gray-600';
};

// 根据分类获取badge
const getCategoryBadge = (category: string): string => {
  const badgeMap: Record<string, string> = {
    'pro': 'PRO',
    'pro_plus': 'Pro+',
    'basic': 'FREE',
    'risk': 'PRO',
    'evm': 'PRO',
    'agile': 'PRO',
    'resource': 'Pro+',
    'cpm': 'Pro+',
  };
  return badgeMap[category] || 'PRO';
};

// 将数据库工具转换为前端ToolConfig
const mapDbToolToConfig = (dbTool: DbTool): ToolConfig => {
  // 将数据库ID映射为前端ToolId格式
  const mapId = (id: string): ToolId => {
    const idMap: Record<string, ToolId> = {
      'monte-carlo': 'monte-carlo',
      'planning-poker': 'planning-poker',
      'kanban-flow': 'kanban-flow',
      'learning-curve': 'learning-curve',
      'evm-prediction': 'evm-prediction',
      'ccpm': 'ccpm',
      'fishbone': 'fishbone',
      'quality-cost': 'quality-cost',
    };
    return idMap[id] || id as ToolId;
  };

  return {
    id: mapId(dbTool.id),
    name: dbTool.name,
    description: dbTool.description,
    icon: iconMapping[dbTool.icon] || Wrench,
    color: getCategoryColor(dbTool.category),
    badge: getCategoryBadge(dbTool.category),
    requiredTier: (dbTool.required_tier as MembershipTier) || 'pro',
    category: (dbTool.category === 'pro_plus' ? 'pro_plus' : 'pro') as 'pro' | 'pro_plus',
  };
};

// 默认工具数据（当数据库无法连接时的回退）
const defaultTools: ToolConfig[] = [
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
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userTier = currentUser?.membershipTier || 'free';

  // 从数据库获取工具列表
  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('app_tools')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tools:', error);
        // 如果出错，使用默认工具数据
        setTools(defaultTools);
        setError('无法从数据库加载工具，显示默认工具列表');
      } else if (data && data.length > 0) {
        const mappedTools = data.map(mapDbToolToConfig);
        setTools(mappedTools);
      } else {
        // 数据库为空，使用默认数据
        setTools(defaultTools);
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setTools(defaultTools);
      setError('无法从数据库加载工具，显示默认工具列表');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查用户是否有权限使用工具
  const canUseTool = (tool: ToolConfig): boolean => {
    return hasTier(currentUser || null, tool.requiredTier);
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
      'ccpm': '关键链法调度',
      'fishbone': '鱼骨图分析',
      'quality-cost': '质量成本模型',
    };

    if (!activeTool) return null;

    return (
      <div className="w-full h-screen flex flex-col bg-[#F5F5F7]">
        {/* 工具页面顶部导航栏 */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">返回工具库</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${tools.find(t => t.id === activeTool)?.color || 'from-gray-400 to-gray-500'}`} />
            <span className="font-semibold text-gray-900">{toolNames[activeTool]}</span>
          </div>
          
          <div className="w-24" />
        </div>
        
        {/* 工具内容区域 */}
        <div className="flex-1 overflow-auto">
          {toolComponents[activeTool] || (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium">工具内容开发中</p>
              <p className="text-sm mt-2">该工具暂不可用</p>
            </div>
          )}
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
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all"
              title="返回上一页"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">返回</span>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                  <FlaskConical size={24} />
                </div>
                工具实验室
              </h1>
              <p className="text-gray-500 mt-2">
                8个专业项目管理工具，覆盖风险、估算、流程、成本全方位分析
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">已解锁</div>
              <div className="text-2xl font-bold text-purple-600">{unlockedCount}/{totalCount}</div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin mb-4 text-purple-600" size={32} />
              <p className="text-gray-500">加载工具列表...</p>
            </div>
          ) : (
            <>
              {/* 当前会员等级提示 */}
              <div className={`rounded-2xl p-5 mb-8 text-white shadow-lg ${MEMBERSHIP_CONFIG[userTier].gradient}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Crown size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{MEMBERSHIP_CONFIG[userTier].name}</div>
                      <div className="text-sm text-white/80">
                        {userTier === 'free' && '完成5门课程解锁工具实验室（Pro会员）'}
                        {userTier === 'pro' && `已解锁5个专业工具，完成10门课程解锁全部${totalCount}个工具`}
                        {userTier === 'pro_plus' && `已解锁全部${totalCount}个专业工具`}
                      </div>
                    </div>
                  </div>
                  {userTier !== 'pro_plus' && onNavigate && (
                    <button 
                      onClick={() => onNavigate(Page.MEMBERSHIP)}
                      className="px-5 py-2.5 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      升级会员
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Pro 工具 */}
              <ToolSection 
                title="专业工具" 
                subtitle={`Pro 会员可用 · ${toolsByCategory.pro.length}个工具`}
                tools={toolsByCategory.pro}
                userTier={userTier}
                onToolClick={handleToolClick}
                color="bg-purple-500"
              />

              {/* Pro+ 工具 */}
              <ToolSection 
                title="高级工具" 
                subtitle={`Pro+ 会员可用 · ${toolsByCategory.pro_plus.length}个工具`}
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
            </>
          )}
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
      className={`bg-white rounded-2xl border p-5 transition-all relative overflow-hidden ${
        isLocked 
          ? 'border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md' 
          : 'border-gray-200 hover:border-purple-200 hover:shadow-lg cursor-pointer group'
      }`}
    >
      {/* 锁定遮罩 - 优化为右上角角标形式 */}
      {isLocked && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-l from-gray-100 to-transparent pl-8 pr-3 py-1.5 rounded-bl-xl">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                {requiredConfig.name} 解锁
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${isLocked ? 'opacity-60 grayscale' : ''}`}>
          <tool.icon size={24} />
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
          isLocked 
            ? 'bg-gray-100 text-gray-400' 
            : tool.category === 'pro_plus'
              ? 'bg-amber-50 text-amber-600 border border-amber-100'
              : 'bg-purple-50 text-purple-600 border border-purple-100'
        }`}>
          {tool.badge}
        </span>
      </div>
      
      <h3 className={`text-lg font-bold mb-2 transition-colors ${
        isLocked ? 'text-gray-400' : 'text-gray-900 group-hover:text-purple-600'
      }`}>
        {tool.name}
      </h3>
      
      <p className={`text-sm leading-relaxed mb-4 ${
        isLocked ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {tool.description}
      </p>
      
      <div className={`flex items-center text-sm font-medium transition-all ${
        isLocked ? 'text-gray-400' : 'text-purple-600'
      }`}>
        {isLocked ? (
          <span className="flex items-center gap-1.5">
            升级解锁
            <Lock size={14} />
          </span>
        ) : (
          <span className="flex items-center gap-1.5 group-hover:gap-2 transition-all">
            开始使用
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* 头部图标 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock size={28} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">工具已锁定</h3>
          <p className="text-gray-500 text-sm">
            "{tool.name}" 需要 <span className="font-semibold text-gray-700">{requiredConfig.name}</span> 才能使用
          </p>
        </div>

        {/* 等级对比 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">当前等级</span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${MEMBERSHIP_CONFIG[currentTier].color}`}>
              {MEMBERSHIP_CONFIG[currentTier].name}
            </span>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">所需等级</span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${requiredConfig.gradient}`}>
              {requiredConfig.name}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          {onNavigate && (
            <button
              onClick={() => {
                onClose();
                onNavigate(Page.MEMBERSHIP);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]"
            >
              升级会员
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-[0.98]"
          >
            稍后升级
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolsLab;
