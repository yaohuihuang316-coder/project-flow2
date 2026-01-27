
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ChevronLeft, Search, BookOpen, ExternalLink, Atom, Minimize2, Loader2 } from 'lucide-react';
import { Page } from '../types';
import { supabase } from '../lib/supabaseClient';

interface KnowledgeGraphProps {
    onBack: () => void;
    onNavigate: (page: Page, id?: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onBack, onNavigate }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });

    // --- Fetch Data from DB ---
    useEffect(() => {
        const fetchGraph = async () => {
            setIsLoading(true);
            const { data: nodes } = await supabase.from('app_kb_nodes').select('*');
            const { data: edges } = await supabase.from('app_kb_edges').select('*');

            if (nodes && edges) {
                const formattedNodes = nodes.map(n => ({
                    id: n.id,
                    name: n.label,
                    symbolSize: n.val || 40,
                    category: ['Concept', 'Core', 'Area', 'Tool', 'Output'].indexOf(n.category || 'Concept'),
                    value: n.val,
                    // Store extra data for click details
                    detail: { description: n.description, formula: n.formula, course_id: n.course_id }
                }));

                const formattedLinks = edges.map(e => ({
                    source: e.source,
                    target: e.target
                }));

                setGraphData({ nodes: formattedNodes, links: formattedLinks });
            }
            setIsLoading(false);
        };
        fetchGraph();
    }, []);

    // --- Render Chart ---
    useEffect(() => {
        if (!chartRef.current || isLoading || graphData.nodes.length === 0) return;

        const myChart = echarts.init(chartRef.current);
        chartInstance.current = myChart;

        const categories = [
            { name: 'Concept' }, { name: 'Core' }, { name: 'Area' }, { name: 'Tool' }, { name: 'Output' }
        ];

        const option: any = {
            backgroundColor: 'transparent',
            tooltip: {},
            animationDuration: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    data: graphData.nodes.map(node => ({
                        ...node,
                        itemStyle: {
                            color: node.category === 1 ? '#3b82f6' :
                                node.category === 2 ? '#10b981' :
                                    node.category === 3 ? '#f59e0b' :
                                        node.category === 4 ? '#8b5cf6' : '#64748b',
                            shadowBlur: 10,
                            shadowColor: 'rgba(0,0,0,0.5)'
                        },
                        label: { show: true, fontSize: 11, color: '#fff', fontWeight: 'bold' }
                    })),
                    links: graphData.links.map(link => ({
                        ...link,
                        lineStyle: { color: 'rgba(255,255,255,0.2)', width: 1, curveness: 0.1 }
                    })),
                    categories: categories,
                    roam: true,
                    label: { position: 'right', formatter: '{b}' },
                    force: { repulsion: 300, gravity: 0.1, edgeLength: [50, 150] },
                    emphasis: { focus: 'adjacency', lineStyle: { width: 4 } }
                }
            ]
        };

        myChart.setOption(option);
        myChart.on('click', (params: any) => {
            if (params.dataType === 'node') setSelectedNode(params.data);
        });

        const handleResize = () => myChart.resize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            myChart.dispose();
        };
    }, [graphData, isLoading]);

    // Pan to node on selection
    useEffect(() => {
        if (chartInstance.current) setTimeout(() => chartInstance.current?.resize(), 300);
    }, [selectedNode]);

    return (
        <div className="w-full h-screen bg-[#0f172a] relative overflow-hidden flex">
            {/* 1. Main Canvas Area */}
            <div className="flex-1 relative h-full flex flex-col">
                <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-start pointer-events-none">
                    <button onClick={onBack} className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="pointer-events-auto relative group flex-1 md:flex-none max-w-[200px] md:max-w-xs ml-4 md:ml-0">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索知识点..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/30 backdrop-blur-xl border border-white/10 text-white rounded-full pl-10 pr-4 py-2.5 w-full md:w-64 outline-none text-sm placeholder-gray-500 shadow-xl"
                        />
                    </div>
                </div>
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-white/50 gap-2"><Loader2 className="animate-spin" /> Loading Graph...</div>
                ) : (
                    <div ref={chartRef} className="flex-1 w-full h-full z-0" />
                )}
            </div>

            {/* 2. Desktop Sidebar */}
            <div className={`hidden md:block h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl transition-all duration-300 ease-out overflow-hidden ${selectedNode ? 'w-96 opacity-100' : 'w-0 opacity-0'}`}>
                <div className="w-96 h-full p-6 text-white flex flex-col">
                    {selectedNode && (
                        <div className="flex flex-col h-full animate-fade-in">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Atom size={24} />
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><Minimize2 size={20} /></button>
                            </div>
                            <h2 className="text-3xl font-bold mb-2">{selectedNode.name}</h2>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase">定义 (Definition)</h3>
                                    <p className="text-sm text-gray-200 leading-relaxed text-justify">
                                        {selectedNode.detail?.description || '暂无详细描述。请在后台知识图谱管理中补充。'}
                                    </p>
                                </div>
                                {selectedNode.detail?.formula && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase">核心公式</h3>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-yellow-400">{selectedNode.detail.formula}</div>
                                    </div>
                                )}
                                {selectedNode.detail?.course_id && (
                                    <div className="p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-2xl border border-blue-500/20 mt-4">
                                        <div className="flex items-center gap-2 mb-2"><BookOpen size={16} className="text-blue-400" /><span className="text-xs font-bold text-blue-300">推荐课程</span></div>
                                        <p className="text-sm font-semibold mb-3">深入学习 {selectedNode.name}</p>
                                        <button onClick={() => onNavigate(Page.CLASSROOM, selectedNode.detail.course_id)} className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">开始学习 <ExternalLink size={12} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
