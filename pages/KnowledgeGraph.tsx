import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ChevronLeft, Search, BookOpen, ExternalLink, X, Atom } from 'lucide-react';
import { Page } from '../types';

interface KnowledgeGraphProps {
    onBack: () => void;
    onNavigate: (page: Page, id?: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onBack, onNavigate }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!chartRef.current) return;

        const myChart = echarts.init(chartRef.current);

        // Mock Data for Knowledge Graph (Chinese)
        const categories = [
            { name: '核心概念' }, { name: '十大知识领域' }, { name: '过程/工具' }, { name: '输出/文档' }
        ];

        const nodes = [
            { id: '0', name: '项目整合管理', symbolSize: 80, category: 0, value: 100 },
            { id: '1', name: '范围管理', symbolSize: 60, category: 1, value: 80 },
            { id: '2', name: '进度管理', symbolSize: 60, category: 1, value: 80 },
            { id: '3', name: '成本管理', symbolSize: 60, category: 1, value: 80 },
            { id: '4', name: '质量管理', symbolSize: 60, category: 1, value: 80 },
            { id: '5', name: '资源管理', symbolSize: 60, category: 1, value: 80 },
            { id: '6', name: '沟通管理', symbolSize: 60, category: 1, value: 80 },
            { id: '7', name: '风险管理', symbolSize: 60, category: 1, value: 80 },
            { id: '8', name: '采购管理', symbolSize: 60, category: 1, value: 80 },
            { id: '9', name: '干系人管理', symbolSize: 60, category: 1, value: 80 },
            // Sub nodes
            { id: '10', name: 'WBS (工作分解)', symbolSize: 45, category: 3, value: 60 },
            { id: '11', name: 'CPM (关键路径)', symbolSize: 45, category: 2, value: 60 },
            { id: '12', name: 'EVM (挣值分析)', symbolSize: 45, category: 2, value: 60 },
            { id: '13', name: '项目章程', symbolSize: 45, category: 3, value: 60 },
        ];

        const links = [
            { source: '0', target: '1' }, { source: '0', target: '2' }, { source: '0', target: '3' },
            { source: '0', target: '4' }, { source: '0', target: '5' }, { source: '0', target: '6' },
            { source: '0', target: '7' }, { source: '0', target: '8' }, { source: '0', target: '9' },
            { source: '1', target: '10' }, // Scope -> WBS
            { source: '2', target: '11' }, // Schedule -> CPM
            { source: '3', target: '12' }, // Cost -> EVM
            { source: '0', target: '13' }, // Integration -> Charter
            { source: '2', target: '3' }, // Schedule <-> Cost
            { source: '5', target: '2' }, // Resource -> Schedule
        ];

        const option = {
            backgroundColor: '#0f172a', // slate-900
            tooltip: {},
            animationDuration: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    data: nodes.map(node => ({
                        ...node,
                        itemStyle: {
                            color: node.category === 0 ? '#3b82f6' : 
                                   node.category === 1 ? '#10b981' : 
                                   node.category === 2 ? '#f59e0b' : '#8b5cf6',
                            shadowBlur: 10,
                            shadowColor: 'rgba(0,0,0,0.5)'
                        },
                        label: { show: true, fontSize: 11, color: '#fff', fontWeight: 'bold' }
                    })),
                    links: links.map(link => ({
                        ...link,
                        lineStyle: { color: 'rgba(255,255,255,0.2)', width: 1, curveness: 0.1 }
                    })),
                    categories: categories,
                    roam: true,
                    label: {
                        position: 'right',
                        formatter: '{b}'
                    },
                    force: {
                        repulsion: 300,
                        gravity: 0.1,
                        edgeLength: [50, 150]
                    },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: { width: 4 }
                    }
                }
            ]
        };

        myChart.setOption(option);

        // Click Event
        myChart.on('click', (params: any) => {
            if (params.dataType === 'node') {
                setSelectedNode(params.data);
            }
        });

        // Resize handler
        const handleResize = () => myChart.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            myChart.dispose();
        };
    }, []);

    // Mock Content Dictionary (Chinese)
    const getNodeContent = (name: string) => {
        const dictionary: any = {
            '成本管理': {
                def: '项目成本管理包括为使项目在批准的预算内完成而对成本进行规划、估算、预算、融资、筹资、管理和控制的各个过程。',
                formula: 'CPI (成本绩效指数) = EV / AC',
                linkId: 'cost-control'
            },
            'EVM (挣值分析)': {
                def: '挣值管理 (EVM) 是一种将范围、进度和资源测量值综合起来，以评估项目绩效和进展的方法。它是项目监控中最重要的工具之一。',
                formula: 'SV (进度偏差) = EV - PV',
                linkId: 'cost-control'
            },
            '风险管理': {
                def: '项目风险管理包括规划风险管理、识别风险、开展风险分析、规划风险应对、实施风险应对和监督风险的各个过程。',
                formula: '风险值 = 概率 (Probability) * 影响 (Impact)',
                linkId: 'risk-mgmt'
            },
            '进度管理': {
                def: '项目进度管理包括为管理项目按时完成所需的各个过程。核心在于定义活动、排列顺序、估算持续时间和制定进度计划。',
                formula: '总浮动时间 = 最晚开始 (LS) - 最早开始 (ES)',
                linkId: 'schedule-time'
            },
            '范围管理': {
                def: '项目范围管理包括确保项目做且只做成功完成项目所需的全部工作的过程。管理范围主要在于定义和控制哪些工作包含在项目内，哪些不包含。',
                formula: '范围基准 = 范围说明书 + WBS + WBS词典',
                linkId: 'scope-wbs'
            },
            'WBS (工作分解)': {
                def: 'WBS 是将项目可交付成果和项目工作分解成较小的、更易于管理的组件的过程。WBS 最底层的组件称为工作包。',
                formula: '100% 规则：WBS 包含了项目所有的工作',
                linkId: 'scope-wbs'
            },
             '项目整合管理': {
                def: '项目整合管理包括对项目管理过程组的各种过程和项目管理活动进行识别、定义、组合、统一和协调的各个过程。',
                formula: '变更请求 -> CCB 审批 -> 更新基准',
                linkId: 'integration'
            }
        };
        return dictionary[name] || {
            def: `关于“${name}”的详细知识库条目正在更新中。请稍后查看。`,
            formula: '暂无核心公式',
            linkId: 'default'
        };
    };

    const details = selectedNode ? getNodeContent(selectedNode.name) : null;

    return (
        <div className="w-full h-screen bg-[#0f172a] relative overflow-hidden flex flex-col">
            {/* Top Bar (Floating) */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-start pointer-events-none">
                <button 
                    onClick={onBack}
                    className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Search Bar - Responsive Width */}
                <div className="pointer-events-auto relative group flex-1 md:flex-none max-w-[200px] md:max-w-xs ml-4 md:ml-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400"/>
                    </div>
                    <input 
                        type="text" 
                        placeholder="搜索..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/30 backdrop-blur-xl border border-white/10 text-white rounded-full pl-10 pr-4 py-2.5 w-full md:w-64 focus:w-full md:focus:w-80 transition-all outline-none text-sm placeholder-gray-500 shadow-xl"
                    />
                </div>
            </div>

            {/* ECharts Container */}
            <div ref={chartRef} className="w-full h-full" />

            {/* Responsive Info Panel (Right Sidebar on Desktop, Bottom Sheet on Mobile) */}
            <div 
                className={`
                    absolute bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl z-30 p-6 text-white transition-transform duration-500 cubic-bezier(0.19,1,0.22,1)
                    /* Desktop Styles */
                    md:top-0 md:right-0 md:h-full md:w-96 md:border-l
                    ${selectedNode ? 'md:translate-x-0' : 'md:translate-x-full'}
                    /* Mobile Styles */
                    bottom-0 left-0 right-0 rounded-t-3xl border-t h-[60vh] md:h-auto md:rounded-none
                    ${selectedNode ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                `}
            >
                {/* Mobile Drag Handle */}
                <div className="md:hidden w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6"></div>

                {selectedNode && (
                    <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Atom size={24} />
                            </div>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{selectedNode.name}</h2>
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6 w-fit">
                            PMBOK 知识领域
                        </span>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10 md:pb-0">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase">定义 (Definition)</h3>
                                <p className="text-sm text-gray-200 leading-relaxed text-justify">
                                    {details.def}
                                </p>
                            </div>

                            {details.formula !== '暂无核心公式' && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase">核心公式 (Formula)</h3>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-yellow-400">
                                        {details.formula}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-2xl border border-blue-500/20 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={16} className="text-blue-400"/>
                                    <span className="text-xs font-bold text-blue-300">推荐课程</span>
                                </div>
                                <p className="text-sm font-semibold mb-3">30天精通 {selectedNode.name}</p>
                                <button 
                                    onClick={() => onNavigate(Page.CLASSROOM, details.linkId)}
                                    className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                    开始学习 <ExternalLink size={12}/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeGraph;