
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Target, Zap, Award, BookOpen, 
  ChevronRight, Sparkles, TrendingUp,
  Search, RotateCcw, X, Send, Download,
  Keyboard, Filter, Play, GitBranch
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface KnowledgeNode {
  id: string;
  name: string;
  category: 'foundation' | 'advanced' | 'expert';
  x: number;
  y: number;
  value: number;
  mastery: number;
  prerequisites: string[];
  description: string;
  estimatedHours: number;
  resourcesCount: number;
  unlocked: boolean;
  courseId?: string;
}

interface KnowledgeLink {
  source: string;
  target: string;
  value: number;
}

interface KnowledgeGraphProps {
  onNavigate: (page: Page, id?: string) => void;
  currentUser?: UserProfile | null;
}

// 节点颜色配置
const NODE_COLORS = {
  foundation: {
    bg: 'bg-blue-500',
    glow: 'shadow-blue-500/50',
    border: 'border-blue-400',
    label: '基础'
  },
  advanced: {
    bg: 'bg-green-500',
    glow: 'shadow-green-500/50',
    border: 'border-green-400',
    label: '进阶'
  },
  expert: {
    bg: 'bg-purple-500',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-400',
    label: '实战'
  }
};

const KnowledgeGraphV2: React.FC<KnowledgeGraphProps> = ({ onNavigate, currentUser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [links, setLinks] = useState<KnowledgeLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pathNodes, setPathNodes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'unlocked' | 'path'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalNodes: 0,
    unlockedNodes: 0,
    masteryProgress: 0,
    estimatedTotalHours: 0
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState<{type: 'user' | 'ai', content: string}[]>([
    { type: 'ai', content: `你好！我是你的AI学习助手。我可以帮你：

1. 🎯 规划个性化学习路径
2. 🔍 推荐相关知识点
3. 📊 分析技能缺口
4. 💡 解答学习困惑

告诉我你的学习目标，我来为你定制最优学习方案！` }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'foundation' | 'advanced' | 'expert'>('all');
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 600 });

  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 初始化数据
  useEffect(() => {
    fetchKnowledgeData();
  }, [currentUser]);

  // 计算节点位置 - 使用分层布局
  const calculateNodePositions = useMemo(() => {
    const width = containerSize.width;
    const height = containerSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    return (index: number, total: number, category: string) => {
      // 根据分类分层布局 - 增加半径避免重叠
      const categoryIndex = category === 'foundation' ? 0 : category === 'advanced' ? 1 : 2;
      const layerRadius = [height * 0.25, height * 0.42, height * 0.58][categoryIndex];
      
      // 获取该分类的节点数
      const categoryCounts = { foundation: 0, advanced: 0, expert: 0 };
      // const categoryIndices = { foundation: 0, advanced: 0, expert: 0 };
      
      // 计算每个分类的节点数
      for (let i = 0; i < total; i++) {
        const cat = ['foundation', 'advanced', 'expert'][Math.floor(i / (total / 3))] as keyof typeof categoryCounts;
        categoryCounts[cat]++;
      }
      
      // 计算当前节点在其分类中的索引
      const cat = category as keyof typeof categoryCounts;
      const catTotal = categoryCounts[cat] || 1;
      const catIndex = index % Math.ceil(total / 3);
      
      // 计算角度 - 将每个分类分布在不同扇区
      const sectorAngle = (Math.PI * 2) / 3;
      const sectorStart = categoryIndex * sectorAngle - Math.PI / 2;
      const angleOffset = (catIndex / Math.max(catTotal - 1, 1)) * sectorAngle - sectorAngle / 2;
      const angle = sectorStart + angleOffset;
      
      return {
        x: centerX + Math.cos(angle) * layerRadius,
        y: centerY + Math.sin(angle) * layerRadius
      };
    };
  }, [containerSize]);

  const fetchKnowledgeData = async () => {
    // 从数据库获取知识节点
    const { data: kbData } = await supabase
      .from('app_kb_nodes')
      .select('*');
    
    // 获取用户学习进度
    const { data: progressData } = await supabase
      .from('app_user_progress')
      .select('*')
      .eq('user_id', currentUser?.id);

    // 构建节点数据
    const totalNodes = kbData?.length || 12;
    
    const processedNodes: KnowledgeNode[] = (kbData || []).map((node: any, index: number) => {
      const progress = progressData?.find((p: any) => p.course_id === node.course_id);
      const mastery = progress?.progress || 0;
      const pos = calculateNodePositions(index, totalNodes, node.type === 'concept' ? 'foundation' : node.type === 'skill' ? 'advanced' : 'expert');
      
      return {
        id: node.id,
        name: node.label,
        category: node.type === 'concept' ? 'foundation' : node.type === 'skill' ? 'advanced' : 'expert',
        x: pos.x,
        y: pos.y,
        value: node.difficulty || 2,
        mastery: mastery,
        prerequisites: node.prerequisites || [],
        description: node.description || '暂无描述',
        estimatedHours: node.estimated_hours || 2,
        resourcesCount: Math.floor(Math.random() * 5) + 1,
        unlocked: mastery > 0 || index < 3,
        courseId: node.course_id
      };
    });

    // 构建连接关系 - 只保留关键连接
    const processedLinks: KnowledgeLink[] = [];
    processedNodes.forEach((node) => {
      // 只添加前置依赖连接
      node.prerequisites.forEach((prereqId: string) => {
        if (processedNodes.find(n => n.id === prereqId)) {
          processedLinks.push({
            source: prereqId,
            target: node.id,
            value: 1
          });
        }
      });
    });

    setNodes(processedNodes);
    setLinks(processedLinks);
    setStats({
      totalNodes: processedNodes.length,
      unlockedNodes: processedNodes.filter(n => n.unlocked).length,
      masteryProgress: processedNodes.length > 0 
        ? Math.round(processedNodes.reduce((acc, n) => acc + n.mastery, 0) / processedNodes.length)
        : 0,
      estimatedTotalHours: processedNodes.reduce((acc, n) => acc + n.estimatedHours, 0)
    });
  };

  // 过滤节点
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (viewMode === 'unlocked' && !node.unlocked) return false;
      if (viewMode === 'path' && !pathNodes.includes(node.id)) return false;
      if (categoryFilter !== 'all' && node.category !== categoryFilter) return false;
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [nodes, viewMode, pathNodes, categoryFilter, searchQuery]);

  // 过滤连线 - 只显示与过滤后节点相关的连接
  const filteredLinks = useMemo(() => {
    const filteredIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => 
      filteredIds.has(link.source) && filteredIds.has(link.target)
    );
  }, [links, filteredNodes]);

  // 计算学习路径
  const calculateLearningPath = (targetNode: KnowledgeNode) => {
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [];
    
    const startNodes = nodes.filter(n => n.unlocked);
    startNodes.forEach(n => {
      queue.push({ nodeId: n.id, path: [n.id] });
      visited.add(n.id);
    });

    while (queue.length > 0) {
      const { nodeId, path: currentPath } = queue.shift()!;
      
      if (nodeId === targetNode.id) {
        setPathNodes(currentPath);
        return;
      }

      const dependentLinks = links.filter(l => l.source === nodeId);
      dependentLinks.forEach(link => {
        if (!visited.has(link.target)) {
          visited.add(link.target);
          queue.push({ nodeId: link.target, path: [...currentPath, link.target] });
        }
      });
    }

    setPathNodes([]);
  };

  // 节点点击处理
  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node);
    calculateLearningPath(node);
  };

  // AI助手处理
  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput.trim();
    setAiMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setAiInput('');
    setIsAiTyping(true);
    
    setTimeout(() => {
      let aiResponse = '';
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes('路径') || lowerMsg.includes('规划') || lowerMsg.includes('学习')) {
        const unlocked = nodes.filter(n => n.unlocked);
        const locked = nodes.filter(n => !n.unlocked);
        
        if (unlocked.length === 0) {
          aiResponse = `🎯 学习路径规划

作为初学者，我为你推荐以下学习顺序：

1️⃣ **基础入门**
   • 项目管理基础概念
   • 项目生命周期
   • 干系人管理基础

2️⃣ **核心方法**
   • 敏捷开发方法论
   • Scrum框架实践
   • 瀑布与敏捷对比

3️⃣ **实战应用**
   • 风险管理实战
   • 成本控制技巧
   • 团队领导力提升

建议先从「项目管理基础概念」开始学习！`;
        } else {
          const nextNodes = locked.filter(n => 
            n.prerequisites.every(p => unlocked.some(u => u.id === p))
          ).slice(0, 3);
          
          aiResponse = `🎯 基于你的学习进度，推荐下一步：

${nextNodes.map((n, i) => `${i+1}️⃣ **${n.name}**
   ${n.description.slice(0, 40)}...
   预计学时: ${n.estimatedHours}小时`).join('\n\n')}

继续加油！每掌握一个知识点，就能解锁更多高级内容！💪`;
        }
      } else if (lowerMsg.includes('推荐') || lowerMsg.includes('相关')) {
        const hotTopics = nodes
          .filter(n => n.mastery > 0)
          .sort((a, b) => b.mastery - a.mastery)
          .slice(0, 3);
        
        aiResponse = `🔍 根据你的兴趣，推荐以下内容：

${hotTopics.map((n, i) => `${i+1}️⃣ **${n.name}** (掌握度: ${n.mastery}%)
   ${n.description.slice(0, 50)}...`).join('\n\n')}

💡 小贴士：建议先完善掌握度较低的知识点，再挑战高难度内容！`;
      } else if (lowerMsg.includes('缺口') || lowerMsg.includes('分析') || lowerMsg.includes('不足')) {
        const lowMastery = nodes.filter(n => n.unlocked && n.mastery < 50);
        
        if (lowMastery.length === 0) {
          aiResponse = `🎉 太棒了！你目前掌握度都很好！

建议尝试学习新的未解锁知识点，扩展你的项目管理技能树！`;
        } else {
          aiResponse = `📊 技能缺口分析报告

需要加强的知识点 (${lowMastery.length}个)：

${lowMastery.slice(0, 5).map((n, i) => `${i+1}️⃣ **${n.name}** - 掌握度 ${n.mastery}%`).join('\n')}

💡 建议优先提升这些技能，它们可能是其他高级知识的前置条件！`;
        }
      } else {
        aiResponse = `💡 感谢你的提问！

关于"${userMessage}"，我可以为你提供以下帮助：

• 🎯 输入「学习路径」- 获取个性化学习规划
• 🔍 输入「推荐」- 获取相关知识点推荐  
• 📊 输入「技能缺口」- 分析你的薄弱环节
• 📚 点击图谱节点 - 查看详细信息和学习资源

有任何问题随时问我哦！`;
      }
      
      setIsAiTyping(false);
      setAiMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
    }, 1000);
  };

  // 导出知识图谱
  const exportGraph = () => {
    const data = {
      nodes: nodes.map(n => ({
        id: n.id,
        name: n.name,
        category: n.category,
        mastery: n.mastery,
        unlocked: n.unlocked,
        estimatedHours: n.estimatedHours
      })),
      links,
      stats,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 重置视图
  const resetView = () => {
    setViewMode('all');
    setSearchQuery('');
    setCategoryFilter('all');
    setSelectedNode(null);
    setPathNodes([]);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setShowAIAssistant(false);
        setShowShortcuts(false);
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 获取节点样式
  const getNodeStyle = (node: KnowledgeNode) => {
    const colors = NODE_COLORS[node.category];
    const isHovered = hoveredNode === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isInPath = pathNodes.includes(node.id);
    const isDimmed = searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let bgClass = colors.bg;
    if (node.mastery === 100) {
      bgClass = 'bg-gradient-to-br from-purple-400 to-purple-600';
    } else if (node.mastery > 0) {
      bgClass = 'bg-gradient-to-br from-blue-400 to-blue-600';
    } else if (!node.unlocked) {
      bgClass = 'bg-slate-600';
    }
    
    return {
      bgClass,
      isHovered,
      isSelected,
      isInPath,
      isDimmed,
      size: 60 + node.value * 8
    };
  };

  // 渲染SVG连线
  const renderLinks = () => {
    return filteredLinks.map((link, index) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return null;

      const isHighlighted = pathNodes.includes(link.source) && pathNodes.includes(link.target);
      const isHovered = hoveredNode === link.source || hoveredNode === link.target;
      
      return (
        <line
          key={`${link.source}-${link.target}-${index}`}
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetNode.x}
          y2={targetNode.y}
          stroke={isHighlighted ? '#8b5cf6' : isHovered ? '#64748b' : 'rgba(148, 163, 184, 0.3)'}
          strokeWidth={isHighlighted ? 3 : isHovered ? 2 : 1}
          strokeDasharray={targetNode.mastery > 0 ? '0' : '5,5'}
        />
      );
    });
  };

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      {/* 背景网格 */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(Page.DASHBOARD)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <GitBranch className="text-blue-400" size={24} />
                知识图谱
              </h1>
              <p className="text-xs text-slate-400">探索项目管理的知识宇宙，发现最优学习路径</p>
            </div>
          </div>

          {/* 搜索和控制 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="搜索知识点... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
              {(['all', 'unlocked', 'path'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === mode 
                      ? 'bg-blue-500 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'all' ? '全部' : mode === 'unlocked' ? '已解锁' : '路径'}
                </button>
              ))}
            </div>

            {/* 分类筛选 */}
            <div className="relative group">
              <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-slate-400 hover:text-white border border-slate-700">
                <Filter size={18} className={categoryFilter !== 'all' ? 'text-blue-400' : ''} />
              </button>
              <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50 min-w-[120px]">
                {(['all', 'foundation', 'advanced', 'expert'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      categoryFilter === cat ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {cat === 'all' ? '全部分类' : cat === 'foundation' ? '基础知识' : cat === 'advanced' ? '进阶技能' : '专家级'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetView}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white border border-slate-700"
              title="重置视图 (Ctrl+R)"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={exportGraph}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white border border-slate-700"
              title="导出图谱"
            >
              <Download size={18} />
            </button>

            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white border border-slate-700"
              title="快捷键 (?)"
            >
              <Keyboard size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 left-6 right-6 z-10 flex justify-center">
        <div className="bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl border border-slate-700 px-6 py-3 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">知识点</p>
              <p className="text-lg font-bold text-white">{stats.totalNodes}</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">已解锁</p>
              <p className="text-lg font-bold text-white">{stats.unlockedNodes}</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Award size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">掌握度</p>
              <p className="text-lg font-bold text-white">{stats.masteryProgress}%</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">预计学时</p>
              <p className="text-lg font-bold text-white">{stats.estimatedTotalHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pt-36 pb-6 px-6"
      >
        <div className="relative w-full h-full max-w-7xl mx-auto">
          {/* SVG 连线层 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {renderLinks()}
          </svg>

          {/* 节点层 */}
          {nodes.map((node, index) => {
            const { bgClass, isHovered, isSelected, isInPath, isDimmed, size } = getNodeStyle(node);
            const colors = NODE_COLORS[node.category];
            const isFiltered = filteredNodes.find(n => n.id === node.id);
            
            if (!isFiltered && searchQuery) {
              return (
                <div
                  key={node.id}
                  className="absolute rounded-full bg-slate-800 border border-slate-700 opacity-30"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: size,
                    height: size,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            }
            
            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute flex flex-col items-center justify-center rounded-full text-white text-xs font-bold transition-all duration-300 group z-10 ${
                  bgClass
                } ${
                  isHovered || isSelected ? `scale-125 shadow-2xl ${colors.glow}` : 'shadow-lg'
                } ${
                  isInPath ? 'ring-4 ring-purple-500/30' : ''
                } ${
                  isDimmed ? 'opacity-20' : 'opacity-100'
                }`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: size,
                  height: size,
                  transform: 'translate(-50%, -50%)',
                  animation: `float ${3 + index * 0.2}s ease-in-out infinite alternate`,
                  animationDelay: `${index * 0.1}s`,
                  boxShadow: isHovered || isSelected ? `0 0 40px ${node.mastery === 100 ? 'rgba(139, 92, 246, 0.5)' : node.mastery > 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 116, 139, 0.5)'}` : undefined
                }}
              >
                {/* 进度环 */}
                {node.mastery > 0 && node.mastery < 100 && (
                  <svg 
                    className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90"
                  >
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 2px)"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.3)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 2px)"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${node.mastery * 2.83} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                
                {/* 锁定图标 */}
                {!node.unlocked && (
                  <span className="absolute inset-0 flex items-center justify-center text-lg">🔒</span>
                )}
                
                {/* 节点内容 */}
                <span className={`relative z-10 text-center px-1 leading-tight ${node.unlocked ? '' : 'opacity-0'}`}>
                  {node.name.length > 4 ? node.name.slice(0, 4) + '...' : node.name}
                </span>
                
                {/* 悬停显示播放图标 */}
                <Play size={12} className={`relative z-10 mt-1 transition-opacity ${isHovered && node.unlocked ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}

          {/* 图例 */}
          <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-xl shadow-xl border border-slate-700 p-4 z-20">
            <h4 className="text-xs font-semibold text-white mb-3">图例说明</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-300">基础知识</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-300">进阶技能</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-300">实战应用</span>
              </div>
              <div className="w-full h-px bg-slate-700 my-2" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
                <span className="text-xs text-slate-300">已掌握</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                <span className="text-xs text-slate-300">学习中</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-xs text-slate-300">未解锁</span>
              </div>
            </div>
          </div>

          {/* 提示 */}
          <div className="absolute bottom-4 right-4 bg-slate-800/90 text-slate-300 text-xs px-4 py-2 rounded-full border border-slate-700 z-20">
            💡 点击节点查看详情，ESC 关闭面板
          </div>
        </div>
      </div>

      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="absolute right-6 top-32 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 z-30 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedNode.category === 'foundation' ? 'bg-blue-500/20 text-blue-400' :
                  selectedNode.category === 'advanced' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {NODE_COLORS[selectedNode.category].label}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{selectedNode.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">{selectedNode.description}</p>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">掌握程度</span>
                <span className="font-medium text-white">{selectedNode.mastery}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${selectedNode.mastery}%` }}
                />
              </div>
            </div>

            {/* 学习信息 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">预计学时</p>
                <p className="text-lg font-semibold text-white">{selectedNode.estimatedHours}h</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500">学习资源</p>
                <p className="text-lg font-semibold text-white">{selectedNode.resourcesCount}个</p>
              </div>
            </div>

            {/* 前置知识 */}
            {selectedNode.prerequisites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">前置知识</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.prerequisites.map(prereqId => {
                    const prereq = nodes.find(n => n.id === prereqId);
                    return prereq ? (
                      <span 
                        key={prereqId}
                        className={`text-xs px-2 py-1 rounded-lg ${
                          prereq.mastery > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {prereq.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              <button 
                onClick={() => selectedNode.courseId && onNavigate(Page.CLASSROOM, selectedNode.courseId)}
                disabled={!selectedNode.unlocked}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedNode.unlocked 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {selectedNode.unlocked ? (
                  <>
                    开始学习
                    <ChevronRight size={18} />
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    完成前置知识解锁
                  </>
                )}
              </button>
              
              {pathNodes.length > 0 && (
                <button 
                  onClick={() => setViewMode('path')}
                  className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-xl font-medium text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp size={16} />
                  查看完整学习路径 ({pathNodes.length}个节点)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Help Panel */}
      {showShortcuts && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard size={20} className="text-blue-400" />
                键盘快捷键
              </h3>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'ESC', desc: '关闭面板/取消选择' },
                { key: 'Ctrl + R', desc: '重置视图' },
                { key: '?', desc: '显示快捷键帮助' },
                { key: '点击节点', desc: '查看详情和学习路径' },
                { key: '悬停节点', desc: '预览节点信息' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <span className="text-sm text-slate-400">{item.desc}</span>
                  <kbd className="px-2 py-1 bg-slate-700 rounded-lg text-xs font-mono text-slate-300 border border-slate-600">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="absolute bottom-24 right-6 z-20 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      >
        <Sparkles size={24} className="text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
          AI
        </div>
      </button>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="absolute bottom-40 right-6 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 z-30 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-white" />
              <span className="text-white font-semibold">AI 学习助手</span>
            </div>
            <button
              onClick={() => setShowAIAssistant(false)}
              className="text-white/80 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700 px-3 py-2 rounded-xl flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="输入你的学习目标..."
                className="flex-1 px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAiSend}
                disabled={!aiInput.trim() || isAiTyping}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes float {
          0% { transform: translate(-50%, -50%) translateY(0px); }
          100% { transform: translate(-50%, -50%) translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default KnowledgeGraphV2;
