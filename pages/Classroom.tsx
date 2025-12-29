import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, MessageSquare, Play, 
  MoreHorizontal, Minimize2, Maximize2, List, FileText, Download, CheckCircle, Send
} from 'lucide-react';

interface ClassroomProps {
    courseId?: string;
}

// 课程数据字典 - 映射 LearningHub 中的所有 ID
const COURSE_DATA: Record<string, any> = {
    // --- 1. Existing IDs ---
    'agile': {
        title: '敏捷项目管理实战 (Agile Practice)',
        module: 'Module 2',
        subTitle: 'Scrum 框架与站会流程',
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '敏捷宣言与原则', time: '10:00', active: false },
            { title: 'Scrum 角色详解 (PO, SM, Team)', time: '25:00', active: false },
            { title: '每日站会 (Daily Stand-up) 实操', time: '15:30', active: true },
            { title: '冲刺回顾会 (Retrospective)', time: '20:10', active: false },
        ],
        resources: [
            { name: 'ScrumGuide_2024.pdf', size: '1.2 MB' },
            { name: 'Kanban_Template.fig', size: '5 MB' },
        ]
    },
    'stakeholder': {
        title: '干系人分析与沟通 (Stakeholder)',
        module: 'Module 5',
        subTitle: '权力/利益矩阵模型详解',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '识别干系人：谁在影响项目？', time: '12:00', active: false },
            { title: '权力/利益矩阵 (Power/Interest Grid)', time: '18:45', active: true },
            { title: '制定沟通管理计划', time: '22:10', active: false },
            { title: '管理干系人期望', time: '15:00', active: false },
        ],
        resources: [
            { name: 'Stakeholder_Matrix.xlsx', size: '300 KB' },
            { name: 'Comm_Plan_Template.docx', size: '1.5 MB' },
        ]
    },
    // --- 2. New IDs from LearningHub Expansion ---
    'pmp-basic': {
        title: 'PMP 项目管理精讲',
        module: 'Module 1',
        subTitle: 'PMBOK 指南第七版概览',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '项目管理五大过程组', time: '45:00', active: true },
            { title: '十大知识领域概览', time: '30:00', active: false },
            { title: '项目经理的能力三角', time: '20:00', active: false },
        ],
        resources: [{ name: 'PMBOK_Summary.pdf', size: '5.2 MB' }]
    },
    'risk-mgmt': {
        title: '风险管理实务',
        module: 'Module 4',
        subTitle: '风险登记册与定性分析',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '识别风险：头脑风暴法', time: '15:00', active: false },
            { title: '概率与影响矩阵 (P-I Matrix)', time: '25:00', active: true },
            { title: '规划风险应对策略', time: '30:00', active: false },
        ],
        resources: [{ name: 'Risk_Register_Template.xls', size: '400 KB' }]
    },
    'cost-control': {
        title: '成本控制与预算',
        module: 'Module 6',
        subTitle: '挣值管理 (EVM) 计算实战',
        image: 'https://images.unsplash.com/photo-1554224155-98406852d0aa?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '成本估算方法', time: '20:00', active: false },
            { title: 'PV, EV, AC 核心概念', time: '35:00', active: true },
            { title: 'CPI 与 SPI 指标分析', time: '25:00', active: false },
        ],
        resources: [{ name: 'EVM_Calculator.xlsx', size: '1 MB' }]
    },
    'quality-qa': {
        title: '质量管理 (QA/QC)',
        module: 'Module 7',
        subTitle: '质量控制工具与技术',
        image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '规划质量管理', time: '18:00', active: false },
            { title: '帕累托图与因果图', time: '22:00', active: true },
            { title: '质量核对单', time: '15:00', active: false },
        ],
        resources: [{ name: 'Quality_Checklist.pdf', size: '200 KB' }]
    },
    'hr-leadership': {
        title: '团队建设与领导力',
        module: 'Module 8',
        subTitle: '塔克曼团队发展阶段',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '形成期与震荡期', time: '25:00', active: true },
            { title: '冲突管理技巧', time: '30:00', active: false },
            { title: '激励理论', time: '20:00', active: false },
        ],
        resources: [{ name: 'Leadership_Styles.pdf', size: '1.5 MB' }]
    },
    'procurement': {
        title: '采购与合同管理',
        module: 'Module 9',
        subTitle: '合同类型详解',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '总价合同 vs 成本补偿合同', time: '35:00', active: true },
            { title: '采购工作说明书 (SOW)', time: '20:00', active: false },
            { title: '索赔管理', time: '15:00', active: false },
        ],
        resources: [{ name: 'Contract_Templates.zip', size: '3 MB' }]
    },
    'integration': {
        title: '项目整合管理',
        module: 'Module 10',
        subTitle: '变更控制流程',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '制定项目章程', time: '20:00', active: false },
            { title: '指导与管理项目工作', time: '25:00', active: false },
            { title: '实施整体变更控制', time: '40:00', active: true },
        ],
        resources: [{ name: 'Change_Request_Form.docx', size: '100 KB' }]
    },
    'scope-wbs': {
        title: '范围管理与 WBS',
        module: 'Module 3',
        subTitle: '创建工作分解结构',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '收集需求', time: '30:00', active: false },
            { title: '定义范围', time: '20:00', active: false },
            { title: 'WBS 分解原则', time: '35:00', active: true },
        ],
        resources: [{ name: 'WBS_Example.xlsx', size: '500 KB' }]
    },
    'schedule-time': {
        title: '进度管理与规划',
        module: 'Module 4',
        subTitle: '关键路径法 (CPM)',
        image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '排列活动顺序', time: '20:00', active: false },
            { title: '估算活动持续时间', time: '25:00', active: false },
            { title: '关键路径计算', time: '45:00', active: true },
        ],
        resources: [{ name: 'Schedule_Network_Diagram.pdf', size: '800 KB' }]
    },
    'ethics': {
        title: 'PMI 道德行为准则',
        module: 'Module 11',
        subTitle: '职业责任',
        image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80',
        chapters: [
            { title: '责任与尊重', time: '20:00', active: true },
            { title: '公正与诚实', time: '20:00', active: false },
        ],
        resources: [{ name: 'Code_of_Ethics.pdf', size: '1 MB' }]
    },
    // --- Default Fallback ---
    'default': {
        title: '定义项目范围 (Scope Management)',
        module: 'Module 3',
        subTitle: '创建工作分解结构 (WBS)',
        image: 'https://picsum.photos/1920/1080',
        chapters: [
            { title: '课程介绍与导学', time: '12:00', active: false },
            { title: '项目章程的制定核心', time: '45:00', active: false },
            { title: '定义项目范围 (当前)', time: '32:15', active: true },
            { title: 'WBS 工作分解结构实战', time: '28:40', active: false },
            { title: '制定进度计划', time: '55:00', active: false },
        ],
        resources: [
            { name: '课程讲义.pdf', size: '2.4 MB' },
            { name: 'WBS_Template.xlsx', size: '120 KB' },
            { name: '实战案例源码.zip', size: '15 MB' },
        ]
    }
};

const Classroom: React.FC<ClassroomProps> = ({ courseId = 'default' }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'notes' | 'resources'>('catalog');
  const [focusMode, setFocusMode] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // 根据 courseId 获取数据，如果没有匹配则使用 default
  const data = COURSE_DATA[courseId] || COURSE_DATA['default'];

  return (
    <div className={`pt-16 min-h-screen transition-colors duration-700 ease-in-out ${focusMode ? 'bg-[#050505]' : 'bg-[#F5F5F7]'}`}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        
        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col relative z-10">
            {/* Ambient Glow Background Effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full pointer-events-none transition-opacity duration-1000 ${focusMode ? 'opacity-20' : 'opacity-40'}`}></div>

            {/* Toolbar */}
            <div className={`h-16 px-8 flex items-center justify-between z-20 ${focusMode ? 'text-white/50' : 'text-gray-500'}`}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest border border-current px-2 py-0.5 rounded-md">{data.module}</span>
                    <h2 className={`text-lg font-semibold tracking-tight ${focusMode ? 'text-white' : 'text-gray-900'}`}>{data.subTitle}</h2>
                </div>
                <button 
                    onClick={() => setFocusMode(!focusMode)}
                    className="flex items-center gap-2 text-xs font-bold hover:text-blue-500 transition-colors bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
                >
                    {focusMode ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                    {focusMode ? '退出专注' : '专注模式'}
                </button>
            </div>

            {/* Video Player */}
            <div className="flex-1 px-4 md:px-12 pb-8 flex items-center justify-center relative z-20">
                <div className="w-full max-w-6xl aspect-video bg-black rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/10 ring-1 ring-black/5">
                    <img src={data.image} className="w-full h-full object-cover opacity-80" alt="Video Content" />
                    
                    {/* Custom Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all duration-300 hover:scale-110 hover:bg-white/20 shadow-lg group-hover:shadow-white/10">
                            <Play size={40} fill="currentColor" className="ml-2"/>
                        </button>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all">
                            <div className="h-full w-1/3 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-white text-xs font-bold mt-3 tracking-wider">
                            <span>14:20</span>
                            <span>32:15</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Right Sidebar (Tabs) --- */}
        <div 
            className={`
                w-96 bg-white/80 backdrop-blur-2xl border-l border-gray-200/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
                flex flex-col relative shadow-xl z-30
                ${focusMode ? 'translate-x-full absolute right-0 h-full' : ''}
            `}
        >
            {/* Tabs Header */}
            <div className="flex p-2 m-4 bg-gray-100/50 rounded-xl">
                {['catalog', 'notes', 'resources'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                            activeTab === tab 
                            ? 'bg-white shadow-sm text-black' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'catalog' ? '目录' : tab === 'notes' ? '笔记' : '资源'}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                {/* Catalog View */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4 mt-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">{data.title}</h3>
                        {data.chapters.map((chapter: any, idx: number) => (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                    chapter.active 
                                    ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${chapter.active ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {chapter.active ? <Play size={16} fill="currentColor"/> : <CheckCircle size={16} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${chapter.active ? 'text-blue-900' : 'text-gray-700'}`}>
                                            {chapter.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">{chapter.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Notes View */}
                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col">
                        <textarea 
                            className="w-full h-64 bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-none font-medium leading-relaxed"
                            placeholder="在此记录重点..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        />
                        <div className="mt-4 flex justify-between items-center">
                            <button className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                + 14:20 截图
                            </button>
                            <button className="text-xs font-bold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                保存笔记
                            </button>
                        </div>
                    </div>
                )}

                {/* Resources View */}
                {activeTab === 'resources' && (
                    <div className="space-y-3 mt-2">
                        {data.resources.map((res: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-red-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{res.name}</p>
                                        <p className="text-xs text-gray-400">{res.size}</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                    <Download size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Assistant (Bubble Style) */}
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1 flex items-center gap-2 transform transition-all hover:scale-[1.02] cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <MessageSquare size={18} fill="currentColor" />
                    </div>
                    <div className="flex-1 px-2">
                        <p className="text-xs font-bold text-gray-900">AI 助教</p>
                        <p className="text-[10px] text-gray-500 truncate">针对当前“{data.subTitle}”有疑问？</p>
                    </div>
                    <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-1 hover:bg-gray-800">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Classroom;