
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Share2, Target, Zap, Award, BookOpen, 
  ChevronRight, Sparkles, TrendingUp,
  Search, RotateCcw, X, Send, Download,
  Keyboard, Filter
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface KnowledgeNode {
  id: string;
  name: string;
  category: 'foundation' | 'advanced' | 'expert';
  x?: number;
  y?: number;
  symbolSize: number;
  value: number;
  mastery: number;
  prerequisites: string[];
  description: string;
  estimatedHours: number;
  resourcesCount: number;
  unlocked: boolean;
}

interface KnowledgeLink {
  source: string;
  target: string;
  value: number;
  lineStyle?: {
    color: string;
    width: number;
    curveness: number;
  };
}

interface KnowledgeGraphProps {
  onNavigate: (page: Page, id?: string) => void;
  currentUser?: UserProfile | null;
}

const KnowledgeGraphV2: React.FC<KnowledgeGraphProps> = ({ onNavigate, currentUser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // 初始化数据
  useEffect(() => {
    fetchKnowledgeData();
  }, [currentUser]);

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

    // 构建节点数据 - 居中布局
    const containerWidth = containerRef.current?.clientWidth || 1200;
    const containerHeight = containerRef.current?.clientHeight || 800;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const processedNodes: KnowledgeNode[] = (kbData || []).map((node: any, index: number) => {
      const progress = progressData?.find((p: any) => p.course_id === node.course_id);
      const mastery = progress?.progress || 0;
      const totalNodes = kbData?.length || 1;
      const angle = (index / totalNodes) * Math.PI * 2;
      const radius = Math.min(containerWidth, containerHeight) * 0.35;
      
      return {
        id: node.id,
        name: node.label,
        category: node.type === 'concept' ? 'foundation' : node.type === 'skill' ? 'advanced' : 'expert',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.7,
        symbolSize: node.difficulty * 15 + 20,
        value: node.difficulty,
        mastery: mastery,
        prerequisites: node.prerequisites || [],
        description: node.description || '暂无描述',
        estimatedHours: node.estimated_hours || 2,
        resourcesCount: Math.floor(Math.random() * 5) + 1,
        unlocked: mastery > 0 || index < 3 // 前3个默认解锁
      };
    });

    // 构建连接关系
    const processedLinks: KnowledgeLink[] = [];
    processedNodes.forEach((node, i) => {
      node.prerequisites.forEach((prereqId: string) => {
        processedLinks.push({
          source: prereqId,
          target: node.id,
          value: 1,
          lineStyle: {
            color: node.mastery > 0 ? '#10b981' : '#94a3b8',
            width: node.mastery > 0 ? 3 : 1,
            curveness: 0.2
          }
        });
      });
      // 添加一些辅助连接，形成网络
      if (i > 0 && i % 3 === 0) {
        processedLinks.push({
          source: processedNodes[i - 1].id,
          target: node.id,
          value: 0.5,
          lineStyle: {
            color: '#e2e8f0',
            width: 1,
            curveness: 0.3
          }
        });
      }
    });

    setNodes(processedNodes);
    setLinks(processedLinks);
    setStats({
      totalNodes: processedNodes.length,
      unlockedNodes: processedNodes.filter(n => n.unlocked).length,
      masteryProgress: Math.round(processedNodes.reduce((acc, n) => acc + n.mastery, 0) / processedNodes.length),
      estimatedTotalHours: processedNodes.reduce((acc, n) => acc + n.estimatedHours, 0)
    });
  };

  // Canvas 绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景网格
      drawGrid(ctx, canvas.width, canvas.height);

      // 过滤节点（根据搜索、视图模式和分类）
      const filteredNodes = nodes.filter(node => {
        if (viewMode === 'unlocked' && !node.unlocked) return false;
        if (viewMode === 'path' && !pathNodes.includes(node.id)) return false;
        if (categoryFilter !== 'all' && node.category !== categoryFilter) return false;
        if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      
      // 绘制连接线（只显示过滤后节点相关的连接）
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          // 搜索模式下只显示匹配节点的连接
          if (searchQuery && !filteredNodes.find(n => n.id === sourceNode.id) && !filteredNodes.find(n => n.id === targetNode.id)) {
            return;
          }
          drawLink(ctx, sourceNode, targetNode, link, hoveredNode, pathNodes);
        }
      });

      // 绘制节点
      nodes.forEach(node => {
        if (node.x && node.y) {
          const isDimmed = Boolean(searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()));
          drawNode(ctx, node, time, hoveredNode, selectedNode?.id, isDimmed);
        }
      });

      // 绘制标签
      nodes.forEach(node => {
        if (node.x && node.y) {
          const isDimmed = Boolean(searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()));
          drawLabel(ctx, node, hoveredNode, isDimmed);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [nodes, links, hoveredNode, selectedNode, pathNodes, viewMode, searchQuery, categoryFilter]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawLink = (
    ctx: CanvasRenderingContext2D, 
    source: KnowledgeNode, 
    target: KnowledgeNode, 
    link: KnowledgeLink,
    hoveredId: string | null,
    pathIds: string[]
  ) => {
    const isHighlighted = pathIds.includes(source.id) && pathIds.includes(target.id);
    const isHovered = hoveredId === source.id || hoveredId === target.id;
    
    ctx.beginPath();
    ctx.moveTo(source.x!, source.y!);
    
    // 贝塞尔曲线
    const cpX = (source.x! + target.x!) / 2;
    const cpY = (source.y! + target.y!) / 2 - 50;
    ctx.quadraticCurveTo(cpX, cpY, target.x!, target.y!);
    
    ctx.strokeStyle = isHighlighted ? '#8b5cf6' : isHovered ? '#64748b' : link.lineStyle?.color || '#cbd5e1';
    ctx.lineWidth = isHighlighted ? 4 : isHovered ? 2 : link.lineStyle?.width || 1;
    ctx.stroke();

    // 流动动画效果
    if (source.mastery > 0 && target.mastery > 0) {
      const gradient = ctx.createLinearGradient(source.x!, source.y!, target.x!, target.y!);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D, 
    node: KnowledgeNode, 
    time: number,
    hoveredId: string | null,
    selectedId: string | undefined,
    isDimmed: boolean = false
  ) => {
    const isHovered = hoveredId === node.id;
    const isSelected = selectedId === node.id;
    const isUnlocked = node.unlocked;
    
    // 保存当前状态
    ctx.save();
    
    // 设置透明度（用于搜索高亮）
    if (isDimmed) {
      ctx.globalAlpha = 0.15;
    }
    
    const baseRadius = node.symbolSize / 2;
    const pulseRadius = baseRadius + Math.sin(time * 2) * (isHovered ? 5 : 2);
    
    // 外发光效果
    if (isHovered || isSelected || node.mastery === 100) {
      const glowRadius = pulseRadius + 15;
      const gradient = ctx.createRadialGradient(
        node.x!, node.y!, baseRadius,
        node.x!, node.y!, glowRadius
      );
      const glowColor = node.mastery === 100 ? '139, 92, 246' : isSelected ? '59, 130, 246' : '99, 102, 241';
      gradient.addColorStop(0, `rgba(${glowColor}, 0.3)`);
      gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 节点主体
    const nodeGradient = ctx.createRadialGradient(
      node.x! - baseRadius/3, node.y! - baseRadius/3, 0,
      node.x!, node.y!, baseRadius
    );
    
    if (node.mastery === 100) {
      nodeGradient.addColorStop(0, '#a78bfa');
      nodeGradient.addColorStop(1, '#7c3aed');
    } else if (node.mastery > 0) {
      nodeGradient.addColorStop(0, '#60a5fa');
      nodeGradient.addColorStop(1, '#3b82f6');
    } else if (isUnlocked) {
      nodeGradient.addColorStop(0, '#fbbf24');
      nodeGradient.addColorStop(1, '#f59e0b');
    } else {
      nodeGradient.addColorStop(0, '#e2e8f0');
      nodeGradient.addColorStop(1, '#cbd5e1');
    }

    ctx.fillStyle = nodeGradient;
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#6366f1' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.stroke();

    // 进度环
    if (node.mastery > 0 && node.mastery < 100) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, baseRadius + 5, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * node.mastery / 100));
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 锁定图标
    if (!isUnlocked) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', node.x!, node.y!);
    }
    
    ctx.restore();
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, node: KnowledgeNode, hoveredId: string | null, isDimmed: boolean = false) => {
    const isHovered = hoveredId === node.id;
    
    ctx.save();
    if (isDimmed) {
      ctx.globalAlpha = 0.15;
    }
    
    ctx.fillStyle = '#1e293b';
    ctx.font = isHovered ? 'bold 14px sans-serif' : '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const textY = node.y! + node.symbolSize / 2 + 8;
    
    // 文字背景
    const textWidth = ctx.measureText(node.name).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(node.x! - textWidth/2 - 4, textY - 2, textWidth + 8, 20);
    
    ctx.fillStyle = node.unlocked ? '#1e293b' : '#94a3b8';
    ctx.fillText(node.name, node.x!, textY);
    
    ctx.restore();
  };

  // 鼠标事件处理
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找悬停的节点
    const hovered = nodes.find(node => {
      if (!node.x || !node.y) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.symbolSize / 2;
    });

    setHoveredNode(hovered?.id || null);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  }, [nodes]);

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      const node = nodes.find(n => n.id === hoveredNode);
      if (node) {
        setSelectedNode(node);
        // 计算学习路径
        calculateLearningPath(node);
      }
    }
  }, [hoveredNode, nodes]);

  const calculateLearningPath = (targetNode: KnowledgeNode) => {
    // 使用 BFS 找到从已解锁节点到目标节点的最短路径
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [];
    
    // 找到所有已解锁的节点作为起点
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

      // 找到所有依赖此节点的其他节点
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

  // AI助手处理
  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput.trim();
    setAiMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setAiInput('');
    setIsAiTyping(true);
    
    // 模拟AI思考
    setTimeout(() => {
      let aiResponse = '';
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes('路径') || lowerMsg.includes('规划') || lowerMsg.includes('学习')) {
        // 根据用户掌握程度推荐学习路径
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
        // 推荐相关知识点
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
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchQuery('');
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(Page.DASHBOARD)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="text-blue-600" size={24} />
                知识图谱 3D
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">AI驱动</span>
              </h1>
              <p className="text-xs text-gray-500">探索项目管理的知识宇宙，发现最优学习路径</p>
            </div>
          </div>

          {/* 搜索和控制 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索知识点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['all', 'unlocked', 'path'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'all' ? '全部' : mode === 'unlocked' ? '已解锁' : '路径'}
                </button>
              ))}
            </div>

            {/* 分类筛选 */}
            <div className="relative group">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1">
                <Filter size={18} className={categoryFilter !== 'all' ? 'text-blue-600' : 'text-gray-600'} />
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50 min-w-[120px]">
                {(['all', 'foundation', 'advanced', 'expert'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      categoryFilter === cat ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {cat === 'all' ? '全部分类' : cat === 'foundation' ? '基础知识' : cat === 'advanced' ? '进阶技能' : '专家级'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetView}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="重置视图 (Ctrl+R)"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={exportGraph}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="导出图谱"
            >
              <Download size={18} />
            </button>

            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="快捷键 (?)"
            >
              <Keyboard size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 left-6 right-6 z-10 flex justify-center">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">知识点</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalNodes}</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-gray-200" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已解锁</p>
              <p className="text-lg font-bold text-gray-900">{stats.unlockedNodes}</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-gray-200" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">掌握度</p>
              <p className="text-lg font-bold text-gray-900">{stats.masteryProgress}%</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-gray-200" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">预计学时</p>
              <p className="text-lg font-bold text-gray-900">{stats.estimatedTotalHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas - 居中显示 */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="absolute inset-0 cursor-default"
        style={{ top: '140px' }}
      />

      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="absolute right-6 top-32 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 z-30 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedNode.category === 'foundation' ? 'bg-blue-100 text-blue-600' :
                  selectedNode.category === 'advanced' ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {selectedNode.category === 'foundation' ? '基础' : 
                   selectedNode.category === 'advanced' ? '进阶' : '专家'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{selectedNode.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{selectedNode.description}</p>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">掌握程度</span>
                <span className="font-medium text-gray-900">{selectedNode.mastery}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${selectedNode.mastery}%` }}
                />
              </div>
            </div>

            {/* 学习信息 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">预计学时</p>
                <p className="text-lg font-semibold text-gray-900">{selectedNode.estimatedHours}h</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">学习资源</p>
                <p className="text-lg font-semibold text-gray-900">{selectedNode.resourcesCount}个</p>
              </div>
            </div>

            {/* 前置知识 */}
            {selectedNode.prerequisites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">前置知识</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.prerequisites.map(prereqId => {
                    const prereq = nodes.find(n => n.id === prereqId);
                    return prereq ? (
                      <span 
                        key={prereqId}
                        className={`text-xs px-2 py-1 rounded-lg ${
                          prereq.mastery > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
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
                onClick={() => onNavigate(Page.LEARNING_PATH, selectedNode.id)}
                disabled={!selectedNode.unlocked}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedNode.unlocked 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                  onClick={() => onNavigate(Page.LEARNING_PATH, selectedNode.id)}
                  className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl font-medium text-sm hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Keyboard size={20} className="text-blue-600" />
                键盘快捷键
              </h3>
              <button 
                onClick={() => setShowShortcuts(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'ESC', desc: '关闭面板/取消选择' },
                { key: 'Ctrl + R', desc: '重置视图' },
                { key: 'Ctrl + F', desc: '清空搜索并聚焦' },
                { key: '?', desc: '显示快捷键帮助' },
                { key: '点击节点', desc: '查看详情和学习路径' },
                { key: '悬停节点', desc: '预览节点信息' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{item.desc}</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
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
        <div className="absolute bottom-40 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 overflow-hidden animate-fade-in">
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                placeholder="输入你的学习目标..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* 图例 */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-4 z-20">
        <h4 className="text-xs font-semibold text-gray-900 mb-3">节点状态</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" />
            <span className="text-xs text-gray-600">已掌握</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
            <span className="text-xs text-gray-600">学习中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" />
            <span className="text-xs text-gray-600">已解锁</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-600">未解锁</span>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="absolute bottom-6 right-6 bg-black/80 text-white text-xs px-4 py-2 rounded-full z-20">
        💡 点击节点查看详情，拖拽探索知识图谱
      </div>
    </div>
  );
};

export default KnowledgeGraphV2;
