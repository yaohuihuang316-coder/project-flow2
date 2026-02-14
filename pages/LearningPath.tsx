
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BookOpen, Clock, Target, CheckCircle2, Lock,
  ChevronRight, Sparkles, TrendingUp, Award, Zap, PlayCircle,
  GraduationCap, Lightbulb, FileText, Video, HelpCircle,
  Share2, Bookmark, Loader2
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface LearningPathProps {
  nodeId?: string;
  currentUser?: UserProfile | null;
  onNavigate?: (page: Page, param?: string) => void;
  onBack?: () => void;
}

// 知识点数据结构
interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'skill' | 'tool' | 'certification';
  description: string;
  difficulty: number;
  estimatedHours: number;
  courseId?: string;
  courseCategory?: string;
  prerequisites: string[];
  masteryLevel: number;
  unlocked: boolean;
}

// 学习路径节点
interface PathNode {
  node: KnowledgeNode;
  isCurrent: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
}

// 相关资源
interface RelatedResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'tool';
  duration?: string;
  completed: boolean;
}

// 学习统计
interface LearningStats {
  totalNodes: number;
  completedNodes: number;
  totalHours: number;
  estimatedCompletionDate: string;
}

const LearningPath: React.FC<LearningPathProps> = ({ 
  nodeId, 
  currentUser, 
  onNavigate, 
  onBack 
}) => {
  const [currentNode, setCurrentNode] = useState<KnowledgeNode | null>(null);
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  const [, setPrerequisiteNodes] = useState<KnowledgeNode[]>([]);
  const [relatedNodes, setRelatedNodes] = useState<KnowledgeNode[]>([]);
  const [resources, setResources] = useState<RelatedResource[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'path' | 'resources' | 'related'>('path');
  const [, setUserMastery] = useState<Record<string, number>>({});

  // 获取数据
  useEffect(() => {
    if (nodeId) {
      fetchLearningPathData(nodeId);
    }
  }, [nodeId, currentUser?.id]);

  const fetchLearningPathData = async (targetNodeId: string) => {
    setIsLoading(true);
    try {
      // 1. 获取所有知识节点
      const { data: kbData, error: kbError } = await supabase
        .from('app_kb_nodes')
        .select('*');

      if (kbError) throw kbError;

      // 2. 获取用户掌握度
      const { data: masteryData } = await supabase
        .from('app_user_kb_mastery')
        .select('*')
        .eq('user_id', currentUser?.id);

      const masteryMap: Record<string, number> = {};
      masteryData?.forEach((m: any) => {
        masteryMap[m.node_id] = m.mastery_level;
      });
      setUserMastery(masteryMap);

      // 3. 构建节点映射
      const nodeMap = new Map<string, KnowledgeNode>();
      kbData?.forEach((n: any) => {
        const mastery = masteryMap[n.id] || 0;
        nodeMap.set(n.id.toString(), {
          id: n.id.toString(),
          label: n.label,
          type: n.type,
          description: n.description || '',
          difficulty: n.difficulty || 1,
          estimatedHours: n.estimated_hours || 0,
          courseId: n.course_id,
          courseCategory: n.course_category,
          prerequisites: n.prerequisites || [],
          masteryLevel: mastery,
          unlocked: mastery > 0 || (n.prerequisites || []).length === 0
        });
      });

      // 4. 设置当前节点
      const target = nodeMap.get(targetNodeId);
      if (target) {
        setCurrentNode(target);

        // 5. 计算学习路径（从已解锁节点到目标节点的路径）
        const path = calculateLearningPath(target, nodeMap);
        setPathNodes(path);

        // 6. 获取前置知识节点详情
        const prereqs = target.prerequisites
          .map(prereqId => nodeMap.get(prereqId))
          .filter((n): n is KnowledgeNode => n !== undefined);
        setPrerequisiteNodes(prereqs);

        // 7. 获取相关节点（同类别或同难度的其他节点）
        const related = Array.from(nodeMap.values())
          .filter(n => 
            n.id !== target.id && 
            (n.courseCategory === target.courseCategory || 
             Math.abs(n.difficulty - target.difficulty) <= 1)
          )
          .slice(0, 4);
        setRelatedNodes(related);

        // 8. 生成学习资源
        const generatedResources = generateResources(target);
        setResources(generatedResources);

        // 9. 计算统计
        calculateStats(path);
      }
    } catch (err) {
      console.error('获取学习路径数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算学习路径
  const calculateLearningPath = (
    targetNode: KnowledgeNode, 
    nodeMap: Map<string, KnowledgeNode>
  ): PathNode[] => {
    const path: PathNode[] = [];
    const visited = new Set<string>();
    
    // BFS 找最短路径
    const queue: { nodeId: string; path: string[] }[] = 
      Array.from(nodeMap.values())
        .filter(n => n.unlocked && !targetNode.prerequisites.includes(n.id))
        .map(n => ({ nodeId: n.id, path: [n.id] }));

    let shortestPath: string[] = [];
    
    while (queue.length > 0) {
      const { nodeId: currentId, path: currentPath } = queue.shift()!;
      
      if (currentId === targetNode.id) {
        shortestPath = currentPath;
        break;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // 找到依赖当前节点的所有节点
      nodeMap.forEach(node => {
        if (node.prerequisites.includes(currentId) && !visited.has(node.id)) {
          queue.push({ nodeId: node.id, path: [...currentPath, node.id] });
        }
      });
    }

    // 如果没有找到路径，直接使用前置知识链
    if (shortestPath.length === 0) {
      shortestPath = [...collectPrerequisites(targetNode, nodeMap), targetNode.id];
    }

    // 构建 PathNode 数组
    shortestPath.forEach((id, index) => {
      const node = nodeMap.get(id);
      if (node) {
        path.push({
          node,
          isCurrent: id === targetNode.id,
          isCompleted: node.masteryLevel >= 80,
          isLocked: !node.unlocked && index > 0,
          order: index + 1
        });
      }
    });

    return path;
  };

  // 收集所有前置知识
  const collectPrerequisites = (
    node: KnowledgeNode, 
    nodeMap: Map<string, KnowledgeNode>
  ): string[] => {
    const prereqs: string[] = [];
    const visited = new Set<string>();
    
    const collect = (n: KnowledgeNode) => {
      n.prerequisites.forEach(prereqId => {
        if (!visited.has(prereqId)) {
          visited.add(prereqId);
          prereqs.push(prereqId);
          const prereqNode = nodeMap.get(prereqId);
          if (prereqNode) collect(prereqNode);
        }
      });
    };
    
    collect(node);
    return prereqs;
  };

  // 生成学习资源
  const generateResources = (node: KnowledgeNode): RelatedResource[] => {
    const resources: RelatedResource[] = [
      {
        id: 'r1',
        title: `${node.label} - 核心概念讲解`,
        type: 'video',
        duration: '15:00',
        completed: node.masteryLevel > 0
      },
      {
        id: 'r2',
        title: `深入理解${node.label}`,
        type: 'article',
        duration: '10分钟阅读',
        completed: node.masteryLevel >= 50
      },
      {
        id: 'r3',
        title: `${node.label}实战练习`,
        type: 'quiz',
        duration: '20分钟',
        completed: node.masteryLevel >= 80
      }
    ];

    if (node.type === 'tool') {
      resources.push({
        id: 'r4',
        title: `${node.label}工具使用指南`,
        type: 'tool',
        completed: node.masteryLevel >= 60
      });
    }

    return resources;
  };

  // 计算统计
  const calculateStats = (
    path: PathNode[]
  ) => {
    const totalNodes = path.length;
    const completedNodes = path.filter(p => p.isCompleted).length;
    const totalHours = path.reduce((acc, p) => acc + p.node.estimatedHours, 0);
    
    // 预计完成日期（假设每天学习1小时）
    const remainingHours = totalHours - (completedNodes * 2); // 粗略估计
    const daysToComplete = Math.ceil(remainingHours / 1);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);

    setStats({
      totalNodes,
      completedNodes,
      totalHours,
      estimatedCompletionDate: completionDate.toLocaleDateString('zh-CN')
    });
  };

  // 开始课程学习
  const startLearning = (courseId?: string) => {
    if (courseId && onNavigate) {
      onNavigate(Page.CLASSROOM, courseId);
    }
  };

  // 跳转到知识图谱
  const goToKnowledgeGraph = () => {
    if (onNavigate) {
      onNavigate(Page.KNOWLEDGE_GRAPH);
    }
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['入门', '基础', '进阶', '高级', '专家'];
    return labels[difficulty - 1] || '基础';
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concept': return <Lightbulb size={16} className="text-amber-500" />;
      case 'skill': return <Zap size={16} className="text-blue-500" />;
      case 'tool': return <Target size={16} className="text-green-500" />;
      case 'certification': return <Award size={16} className="text-purple-500" />;
      default: return <BookOpen size={16} className="text-gray-500" />;
    }
  };

  // 获取类型名称
  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      concept: '概念',
      skill: '技能',
      tool: '工具',
      certification: '认证'
    };
    return names[type] || '知识';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载学习路径...</p>
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <HelpCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">未找到该知识点</p>
          <button
            onClick={onBack || goToKnowledgeGraph}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回知识图谱
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack || goToKnowledgeGraph}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={24} />
                  学习路径
                </h1>
                <p className="text-xs text-gray-500">基于知识图谱的智能学习规划</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="收藏"
              >
                <Bookmark size={20} className="text-gray-400" />
              </button>
              <button
                onClick={() => {}}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="分享"
              >
                <Share2 size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 当前知识点卡片 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(currentNode.type)}
                <span className="text-white/80 text-sm font-medium">
                  {getTypeName(currentNode.type)} · {getDifficultyLabel(currentNode.difficulty)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentNode.masteryLevel >= 80 ? 'bg-green-500 text-white' :
                currentNode.masteryLevel > 0 ? 'bg-blue-500 text-white' :
                'bg-white/20 text-white'
              }`}>
                {currentNode.masteryLevel >= 80 ? '已掌握' :
                 currentNode.masteryLevel > 0 ? '学习中' : '未开始'}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{currentNode.label}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{currentNode.description}</p>
            
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>预计学时: {currentNode.estimatedHours}小时</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Target size={16} />
                <span>难度: {'★'.repeat(currentNode.difficulty)}{'☆'.repeat(5 - currentNode.difficulty)}</span>
              </div>
              {currentNode.courseId && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen size={16} />
                  <span>关联课程</span>
                </div>
              )}
            </div>

            {/* 掌握度进度条 */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">掌握程度</span>
                <span className="font-medium text-gray-900">{currentNode.masteryLevel}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${currentNode.masteryLevel}%` }}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => startLearning(currentNode.courseId)}
                disabled={!currentNode.unlocked}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  currentNode.unlocked
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentNode.unlocked ? (
                  <>
                    <PlayCircle size={20} />
                    {currentNode.masteryLevel > 0 ? '继续学习' : '开始学习'}
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    先完成前置知识
                  </>
                )}
              </button>
              
              {currentNode.masteryLevel >= 80 && (
                <button
                  onClick={() => {}}
                  className="px-6 py-3 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  已掌握
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedNodes}/{stats.totalNodes}</p>
                  <p className="text-xs text-gray-500">已完成节点</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
                  <p className="text-xs text-gray-500">总学习时长</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round((stats.completedNodes / stats.totalNodes) * 100)}%</p>
                  <p className="text-xs text-gray-500">总体进度</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.estimatedCompletionDate}</p>
                  <p className="text-xs text-gray-500">预计完成</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 标签页切换 */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'path', label: '学习路径', icon: TrendingUp },
            { id: 'resources', label: '学习资源', icon: FileText },
            { id: 'related', label: '相关知识', icon: Share2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 学习路径视图 */}
        {activeTab === 'path' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">完整学习路径</h3>
              <span className="text-sm text-gray-500">建议按顺序完成</span>
            </div>
            
            <div className="space-y-3">
              {pathNodes.map((pathNode, index) => (
                <div
                  key={pathNode.node.id}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                    pathNode.isCurrent
                      ? 'bg-blue-50 border-blue-300'
                      : pathNode.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : pathNode.isLocked
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* 序号/状态 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    pathNode.isCompleted
                      ? 'bg-green-500 text-white'
                      : pathNode.isCurrent
                      ? 'bg-blue-600 text-white'
                      : pathNode.isLocked
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pathNode.isCompleted ? (
                      <CheckCircle2 size={20} />
                    ) : pathNode.isLocked ? (
                      <Lock size={16} />
                    ) : (
                      <span className="font-bold">{pathNode.order}</span>
                    )}
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-semibold ${
                          pathNode.isCurrent ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {pathNode.node.label}
                          {pathNode.isCurrent && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              当前
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {pathNode.node.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {pathNode.node.estimatedHours}小时
                          </span>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(pathNode.node.type)}
                            {getTypeName(pathNode.node.type)}
                          </span>
                        </div>
                      </div>
                      
                      {!pathNode.isLocked && pathNode.node.courseId && (
                        <button
                          onClick={() => startLearning(pathNode.node.courseId)}
                          className="flex-shrink-0 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                        >
                          {pathNode.isCompleted ? '复习' : '学习'}
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* 进度条 */}
                    {!pathNode.isLocked && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pathNode.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pathNode.node.masteryLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 连接线 */}
                  {index < pathNodes.length - 1 && (
                    <div className="absolute left-9 top-14 w-0.5 h-6 bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 学习资源视图 */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">推荐学习资源</h3>
              <span className="text-sm text-gray-500">{resources.filter(r => r.completed).length}/{resources.length} 已完成</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(resource => (
                <div
                  key={resource.id}
                  className={`p-4 rounded-xl border transition-all ${
                    resource.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      resource.completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {resource.type === 'video' && <Video size={24} className={resource.completed ? 'text-green-600' : 'text-gray-600'} />}
                      {resource.type === 'article' && <FileText size={24} className={resource.completed ? 'text-green-600' : 'text-gray-600'} />}
                      {resource.type === 'quiz' && <HelpCircle size={24} className={resource.completed ? 'text-green-600' : 'text-gray-600'} />}
                      {resource.type === 'tool' && <Target size={24} className={resource.completed ? 'text-green-600' : 'text-gray-600'} />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${resource.completed ? 'text-green-900' : 'text-gray-900'}`}>
                        {resource.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {resource.duration}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          resource.completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {resource.completed ? '已完成' : '未开始'}
                        </span>
                      </div>
                    </div>
                    {resource.completed && (
                      <CheckCircle2 size={20} className="text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 相关知识视图 */}
        {activeTab === 'related' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">相关知识点</h3>
              <span className="text-sm text-gray-500">扩展你的知识网络</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedNodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => onNavigate?.(Page.LEARNING_PATH, node.id)}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getTypeIcon(node.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{node.label}</h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {node.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{getTypeName(node.type)}</span>
                          <span>·</span>
                          <span>{getDifficultyLabel(node.difficulty)}</span>
                          <span>·</span>
                          <span>{node.estimatedHours}小时</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  
                  {node.masteryLevel > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">掌握度</span>
                        <span className="font-medium text-gray-700">{node.masteryLevel}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${node.masteryLevel}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {relatedNodes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Share2 size={48} className="mx-auto mb-4 opacity-30" />
                <p>暂无相关知识点</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningPath;
