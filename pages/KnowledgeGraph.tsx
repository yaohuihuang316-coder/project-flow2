
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ChevronLeft, Search, BookOpen, ExternalLink, Atom, Minimize2, Loader2, GraduationCap } from 'lucide-react';
import { Page, KnowledgeNode, KnowledgeEdge } from '../types';
import { supabase } from '../lib/supabaseClient';

interface KnowledgeGraphProps {
    onBack: () => void;
    onNavigate: (page: Page, id?: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onBack, onNavigate }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
    const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
    const [courseInfo, setCourseInfo] = useState<any>(null);

    // 节点类型配置
    const NODE_TYPE_CONFIG: Record<string, { icon: string; shape: string; color: string }> = {
        concept: { icon: '💡', shape: 'circle', color: '#64748b' },
        core: { icon: '📚', shape: 'roundRect', color: '#3b82f6' },
        skill: { icon: '📊', shape: 'rect', color: '#8b5cf6' },
        tool: { icon: '🔧', shape: 'diamond', color: '#f59e0b' },
        certification: { icon: '💎', shape: 'pin', color: '#fbbf24' }
    };

    // 层级颜色配置
    const LEVEL_COLORS: Record<number, string> = {
        1: '#3b82f6', // Foundation - 蓝色
        2: '#8b5cf6', // Advanced - 紫色
        3: '#f97316'  // Implementation - 橙色
    };

    // 获取数据
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 获取节点
                const { data: nodesData } = await supabase
                    .from('app_kb_nodes')
                    .select('*');

                // 获取边
                const { data: edgesData } = await supabase
                    .from('app_kb_edges')
                    .select('*');

                if (nodesData) {
                    const formattedNodes: KnowledgeNode[] = nodesData.map(n => ({
                        id: n.id,
                        label: n.label,
                        category: n.category,
                        courseId: n.course_id,
                        courseCategory: n.course_category,
                        nodeLevel: n.node_level || 1,
                        nodeType: n.node_type || 'concept',
                        description: n.description,
                        formula: n.formula,
                        learningHours: n.learning_hours || 2,
                        difficulty: n.difficulty || 1,
                        prerequisites: n.prerequisites || [],
                        val: n.val || 40
                    }));
                    setNodes(formattedNodes);
                }

                if (edgesData) {
                    const formattedEdges: KnowledgeEdge[] = edgesData.map(e => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        relationType: e.relation_type || 'related',
                        strength: e.strength || 1
                    }));
                    setEdges(formattedEdges);
                }
            } catch (error) {
                console.error('Failed to fetch graph data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // 获取课程信息
    useEffect(() => {
        const fetchCourseInfo = async () => {
            if (!selectedNode?.courseId) {
                setCourseInfo(null);
                return;
            }

            const { data } = await supabase
                .from('app_courses')
                .select('id, title, image, duration, author')
                .eq('id', selectedNode.courseId)
                .single();

            setCourseInfo(data);
        };

        fetchCourseInfo();
    }, [selectedNode]);

    // 渲染图表
    useEffect(() => {
        if (!chartRef.current || isLoading || nodes.length === 0) return;

        const myChart = echarts.init(chartRef.current);
        chartInstance.current = myChart;

        // 格式化节点数据
        const graphNodes = nodes.map(node => {
            const typeConfig = NODE_TYPE_CONFIG[node.nodeType] || NODE_TYPE_CONFIG.concept;
            const levelColor = LEVEL_COLORS[node.nodeLevel] || LEVEL_COLORS[1];
            
            return {
                id: node.id,
                name: node.label,
                symbolSize: node.val || 40 + (node.nodeLevel * 10),
                symbol: typeConfig.shape,
                value: node.nodeLevel,
                category: node.nodeType,
                itemStyle: {
                    color: levelColor,
                    shadowBlur: 15,
                    shadowColor: levelColor + '80'
                },
                label: {
                    show: true,
                    fontSize: 11 + node.nodeLevel,
                    color: '#fff',
                    fontWeight: 'bold',
                    formatter: `{icon|${typeConfig.icon}} {name|${node.label}}`,
                    rich: {
                        icon: { fontSize: 14, padding: [0, 4] },
                        name: { fontSize: 11 }
                    }
                },
                // 存储原始数据用于点击
                originalData: node
            };
        });

        // 格式化边数据
        const graphEdges = edges.map(edge => {
            const colors: Record<string, string> = {
                prerequisite: '#ef4444',
                related: '#94a3b8',
                leads_to: '#22c55e',
                part_of: '#3b82f6'
            };
            
            const dashStyles: Record<string, number[]> = {
                prerequisite: [5, 5],
                related: [],
                leads_to: [],
                part_of: [2, 2]
            };

            return {
                source: edge.source,
                target: edge.target,
                lineStyle: {
                    color: colors[edge.relationType] || '#94a3b8',
                    width: edge.strength || 1,
                    type: dashStyles[edge.relationType] ? 'dashed' : 'solid',
                    dashOffset: 0
                }
            };
        });

        const option: any = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        const node = params.data.originalData as KnowledgeNode;
                        return `
                            <div style="padding: 8px;">
                                <div style="font-weight: bold; margin-bottom: 4px;">${node.label}</div>
                                <div style="font-size: 12px; color: #666;">
                                    ${NODE_TYPE_CONFIG[node.nodeType]?.icon} ${node.nodeType}<br/>
                                    难度: ${'⭐'.repeat(node.difficulty)}<br/>
                                    ${node.courseCategory ? `分类: ${node.courseCategory}` : ''}
                                </div>
                            </div>
                        `;
                    }
                    return '';
                }
            },
            legend: {
                data: ['concept', 'core', 'skill', 'tool', 'certification'],
                textStyle: { color: '#94a3b8' },
                bottom: 20
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    data: graphNodes,
                    links: graphEdges,
                    categories: [
                        { name: 'concept', itemStyle: { color: '#64748b' } },
                        { name: 'core', itemStyle: { color: '#3b82f6' } },
                        { name: 'skill', itemStyle: { color: '#8b5cf6' } },
                        { name: 'tool', itemStyle: { color: '#f59e0b' } },
                        { name: 'certification', itemStyle: { color: '#fbbf24' } }
                    ],
                    roam: true,
                    draggable: true,
                    force: {
                        repulsion: 400,
                        gravity: 0.1,
                        edgeLength: [80, 200],
                        layoutAnimation: true
                    },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: { width: 4 }
                    },
                    lineStyle: {
                        curveness: 0.2,
                        opacity: 0.6
                    }
                }
            ]
        };

        myChart.setOption(option);

        // 点击事件
        myChart.on('click', (params: any) => {
            if (params.dataType === 'node') {
                setSelectedNode(params.data.originalData);
            }
        });

        // 搜索高亮
        if (searchQuery) {
            myChart.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                name: searchQuery
            });
        }

        const handleResize = () => myChart.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            myChart.dispose();
        };
    }, [nodes, edges, isLoading, searchQuery]);

    // 处理搜索
    const handleSearch = () => {
        if (!chartInstance.current || !searchQuery) return;
        
        // 找到匹配的节点
        const matchedNode = nodes.find(n => 
            n.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (matchedNode) {
            setSelectedNode(matchedNode);
            // 可以在这里添加图表定位逻辑
        }
    };

    return (
        <div className="w-full h-screen bg-[#0f172a] relative overflow-hidden flex">
            {/* 主画布区域 */}
            <div className="flex-1 relative h-full flex flex-col">
                {/* 顶部工具栏 */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-start pointer-events-none">
                    <button 
                        onClick={onBack} 
                        className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="pointer-events-auto flex gap-3">
                        {/* 图例 */}
                        <div className="hidden md:flex items-center gap-4 bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span className="text-xs text-white/80">基础</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                <span className="text-xs text-white/80">进阶</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                <span className="text-xs text-white/80">实战</span>
                            </div>
                        </div>
                        
                        {/* 搜索框 */}
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜索知识点..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-black/30 backdrop-blur-xl border border-white/10 text-white rounded-full pl-10 pr-4 py-2.5 w-48 md:w-64 outline-none text-sm placeholder-gray-500 shadow-xl focus:border-white/30 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-white/50 gap-2">
                        <Loader2 className="animate-spin" /> 加载知识图谱...
                    </div>
                ) : (
                    <div ref={chartRef} className="flex-1 w-full h-full z-0" />
                )}
            </div>

            {/* 侧边栏详情 */}
            <div className={`hidden md:block h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl transition-all duration-300 ease-out overflow-hidden ${selectedNode ? 'w-[420px] opacity-100' : 'w-0 opacity-0'}`}>
                <div className="w-[420px] h-full p-6 text-white flex flex-col">
                    {selectedNode && (
                        <div className="flex flex-col h-full animate-fade-in">
                            {/* 头部 */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-2xl`}
                                         style={{ backgroundColor: LEVEL_COLORS[selectedNode.nodeLevel] }}>
                                        {NODE_TYPE_CONFIG[selectedNode.nodeType]?.icon}
                                    </div>
                                    <div>
                                        <span className="text-xs text-white/50 uppercase tracking-wider">
                                            {selectedNode.courseCategory} · Level {selectedNode.nodeLevel}
                                        </span>
                                        <h2 className="text-2xl font-bold">{selectedNode.label}</h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNode(null)} 
                                    className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                                >
                                    <Minimize2 size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {/* 元信息 */}
                                <div className="flex gap-4">
                                    <div className="bg-white/5 rounded-xl px-4 py-2 text-center">
                                        <div className="text-xs text-white/50">难度</div>
                                        <div className="text-amber-400">{'⭐'.repeat(selectedNode.difficulty)}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl px-4 py-2 text-center">
                                        <div className="text-xs text-white/50">学时</div>
                                        <div className="font-bold">{selectedNode.learningHours}h</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl px-4 py-2 text-center">
                                        <div className="text-xs text-white/50">类型</div>
                                        <div className="font-bold capitalize">{selectedNode.nodeType}</div>
                                    </div>
                                </div>

                                {/* 定义 */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                                        <Atom size={14} /> 定义
                                    </h3>
                                    <p className="text-sm text-gray-200 leading-relaxed">
                                        {selectedNode.description || '暂无详细描述。'}
                                    </p>
                                </div>

                                {/* 公式 */}
                                {selectedNode.formula && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">
                                            核心公式
                                        </h3>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-yellow-400">
                                            {selectedNode.formula}
                                        </div>
                                    </div>
                                )}

                                {/* 前置知识 */}
                                {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">
                                            前置知识
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedNode.prerequisites.map((preId, idx) => {
                                                const preNode = nodes.find(n => n.id === preId);
                                                return (
                                                    <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-xs">
                                                        {preNode?.label || preId}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 关联课程 */}
                                {courseInfo && (
                                    <div className="p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-2xl border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <GraduationCap size={16} className="text-blue-400" />
                                            <span className="text-xs font-bold text-blue-300">关联课程</span>
                                        </div>
                                        
                                        {courseInfo.image && (
                                            <img 
                                                src={courseInfo.image} 
                                                alt={courseInfo.title}
                                                className="w-full h-32 object-cover rounded-xl mb-3"
                                            />
                                        )}
                                        
                                        <h4 className="font-bold mb-1">{courseInfo.title}</h4>
                                        <p className="text-xs text-white/60 mb-3">
                                            {courseInfo.author} · {courseInfo.duration}
                                        </p>
                                        
                                        <button 
                                            onClick={() => onNavigate(Page.CLASSROOM, selectedNode.courseId || '')}
                                            className="w-full py-2.5 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                        >
                                            进入课程 <ExternalLink size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* 如果没有关联课程 */}
                                {!courseInfo && selectedNode.courseId && (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <BookOpen size={24} className="mx-auto text-gray-500 mb-2" />
                                        <p className="text-sm text-gray-400">课程信息加载中...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 移动端底部面板 */}
            {selectedNode && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-30 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-white">{selectedNode.label}</h2>
                        <button onClick={() => setSelectedNode(null)} className="text-gray-400">
                            <Minimize2 size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">{selectedNode.description}</p>
                    {courseInfo && (
                        <button 
                            onClick={() => onNavigate(Page.CLASSROOM, selectedNode.courseId || '')}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            进入课程学习
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default KnowledgeGraph;
