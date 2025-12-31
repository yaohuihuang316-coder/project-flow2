
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlayCircle, Network, 
  Layers, 
  DollarSign, Target, X, 
  Plus, Save, RefreshCw, Zap,
  AlertTriangle,
  ChevronDown, Layout
} from 'lucide-react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Bar, Legend, Line, ComposedChart } from 'recharts';
import { UserProfile } from '../types';

// --- TYPES & INTERFACES ---

interface Tool {
    id: string;
    name: string;
    icon: any;
    color: string;
    component: React.ReactNode;
}

// --- CPM ALGORITHM ENGINE ---

interface CpmTask {
    id: string;
    name: string;
    duration: number;
    predecessors: string[]; 
    // Calculated
    es: number; // Early Start
    ef: number; // Early Finish
    ls: number; // Late Start
    lf: number; // Late Finish
    slack: number;
    isCritical: boolean;
    level: number; // For Graph X-axis
}

class CpmEngine {
    static calculate(tasks: CpmTask[]): CpmTask[] {
        const taskMap = new Map(tasks.map(t => [t.id, { ...t, es: 0, ef: 0, ls: Infinity, lf: Infinity, slack: 0, isCritical: false, level: 0 }]));
        
        // 1. Forward Pass (ES, EF) & Level Calculation
        let changed = true;
        while (changed) {
            changed = false;
            for (const task of taskMap.values()) {
                let maxPrevEf = 0;
                let maxPrevLevel = -1;
                
                // Find predecessors
                const preds = task.predecessors
                    .map(pid => taskMap.get(pid))
                    .filter(p => p !== undefined) as CpmTask[];

                for (const p of preds) {
                    if (p.ef > maxPrevEf) maxPrevEf = p.ef;
                    if (p.level > maxPrevLevel) maxPrevLevel = p.level;
                }

                const newEs = maxPrevEf;
                const newEf = newEs + task.duration;
                const newLevel = maxPrevLevel + 1;

                if (task.es !== newEs || task.ef !== newEf || task.level !== newLevel) {
                    task.es = newEs;
                    task.ef = newEf;
                    task.level = newLevel;
                    changed = true;
                }
            }
        }

        // 2. Backward Pass (LS, LF)
        const projectDuration = Math.max(...Array.from(taskMap.values()).map(t => t.ef));
        
        // Initialize End Nodes
        for (const task of taskMap.values()) {
            // Check if task is a predecessor to anyone
            const isPredecessorToSomeone = Array.from(taskMap.values()).some(t => t.predecessors.includes(task.id));
            if (!isPredecessorToSomeone) {
                task.lf = projectDuration;
                task.ls = task.lf - task.duration;
            }
        }

        // Iterate backwards (naive approach, running multiple times to propagate)
        for (let i = 0; i < tasks.length + 1; i++) {
            for (const task of taskMap.values()) {
                const successors = Array.from(taskMap.values()).filter(t => t.predecessors.includes(task.id));
                if (successors.length > 0) {
                    const minSuccLs = Math.min(...successors.map(s => s.ls));
                    task.lf = minSuccLs;
                    task.ls = task.lf - task.duration;
                }
            }
        }

        // 3. Slack & Critical Path
        for (const task of taskMap.values()) {
            task.slack = task.ls - task.es;
            // Float precision fix
            if (Math.abs(task.slack) < 0.01) {
                task.slack = 0;
                task.isCritical = true;
            }
        }

        return Array.from(taskMap.values());
    }
}

// --- SUB-COMPONENTS: TOOLS ---

// 1. CPM STUDIO
const CpmStudio = () => {
    const [tasks, setTasks] = useState<CpmTask[]>([
        { id: 'A', name: '需求分析', duration: 3, predecessors: [], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'B', name: '原型设计', duration: 5, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'C', name: '后端架构', duration: 4, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'D', name: '前端开发', duration: 6, predecessors: ['B'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'E', name: 'API开发', duration: 5, predecessors: ['C'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
        { id: 'F', name: '集成测试', duration: 3, predecessors: ['D', 'E'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
    ]);
    const [calculatedTasks, setCalculatedTasks] = useState<CpmTask[]>([]);
    const [projectDuration, setProjectDuration] = useState(0);

    const handleCalculate = () => {
        const result = CpmEngine.calculate(tasks);
        setCalculatedTasks(result);
        setProjectDuration(Math.max(...result.map(t => t.ef)));
    };

    // Auto-calculate on mount
    useEffect(() => { handleCalculate(); }, []);

    // Graph Layout Helpers
    const getTaskPos = (task: CpmTask, allTasks: CpmTask[]) => {
        const levelTasks = allTasks.filter(t => t.level === task.level);
        const indexInLevel = levelTasks.findIndex(t => t.id === task.id);
        const x = 50 + (task.level * 180);
        const y = 50 + (indexInLevel * 100) + (task.level % 2 === 0 ? 0 : 40); // Stagger
        return { x, y };
    };

    const updateTask = (idx: number, field: string, value: any) => {
        const newTasks = [...tasks];
        // @ts-ignore
        newTasks[idx][field] = value;
        if(field === 'predecessors') {
             // @ts-ignore
             newTasks[idx][field] = value.split(',').map(s=>s.trim().toUpperCase()).filter(s=>s);
        }
        setTasks(newTasks);
    };

    const loadPreset = (type: 'software' | 'house') => {
        if(type === 'software') {
            setTasks([
                { id: 'A', name: 'Plan', duration: 2, predecessors: [], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'B', name: 'Design', duration: 4, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'C', name: 'Code', duration: 10, predecessors: ['B'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'D', name: 'Test', duration: 5, predecessors: ['C'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
            ]);
        } else {
            setTasks([
                { id: 'A', name: '地基', duration: 5, predecessors: [], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'B', name: '墙体', duration: 7, predecessors: ['A'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'C', name: '屋顶', duration: 3, predecessors: ['B'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'D', name: '水电', duration: 4, predecessors: ['B'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
                { id: 'E', name: '装修', duration: 10, predecessors: ['C', 'D'], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0 },
            ]);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-2">
            {/* Left Console */}
            <div className="w-full md:w-80 flex flex-col gap-4 bg-gray-50/50 rounded-3xl p-5 border border-gray-200 shadow-inner overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><Network size={18}/> 任务清单</h3>
                    <div className="flex gap-1">
                        <button onClick={()=>loadPreset('software')} className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-gray-100">软件</button>
                        <button onClick={()=>loadPreset('house')} className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-gray-100">工程</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {tasks.map((task, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs">
                            <div className="flex justify-between mb-2">
                                <input className="font-bold w-8 bg-gray-100 rounded px-1 text-center" value={task.id} onChange={(e)=>updateTask(i, 'id', e.target.value)} />
                                <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                            </div>
                            <input className="w-full mb-2 border-b border-gray-100 outline-none pb-1 font-medium" value={task.name} onChange={(e)=>updateTask(i, 'name', e.target.value)} placeholder="任务名称"/>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase">Duration</label>
                                    <input type="number" className="w-full bg-gray-50 rounded px-2 py-1" value={task.duration} onChange={(e)=>updateTask(i, 'duration', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-400 uppercase">Predecessors</label>
                                    <input className="w-full bg-gray-50 rounded px-2 py-1" value={task.predecessors.join(',')} onChange={(e)=>updateTask(i, 'predecessors', e.target.value)} placeholder="e.g. A,B"/>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={()=>setTasks([...tasks, {id: String.fromCharCode(65+tasks.length), name:'New Task', duration:1, predecessors:[], es:0, ef:0, ls:0, lf:0, slack:0, isCritical:false, level:0}])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-gray-400 hover:text-gray-600 transition-colors">
                        + Add Task
                    </button>
                </div>
                <button onClick={handleCalculate} className="py-3 bg-black text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                    <PlayCircle size={16} /> Calculate Path
                </button>
            </div>

            {/* Right Graph Stage */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                
                {/* Result Overlay */}
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
                    <div className="bg-white/80 backdrop-blur border border-gray-100 shadow-lg px-4 py-2 rounded-2xl mb-2">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Duration</span>
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{projectDuration} <span className="text-sm text-gray-400">days</span></div>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold">
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Critical</span>
                        <span className="flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full border border-gray-200"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Normal</span>
                    </div>
                </div>

                {/* SVG Graph */}
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <svg width="100%" height="100%" className="min-w-[800px] min-h-[600px]">
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#9CA3AF" />
                            </marker>
                            <marker id="arrow-critical" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
                            </marker>
                        </defs>
                        {calculatedTasks.map((task) => {
                            const start = getTaskPos(task, calculatedTasks);
                            return task.predecessors.map(pid => {
                                const parent = calculatedTasks.find(t => t.id === pid);
                                if(!parent) return null;
                                const end = getTaskPos(parent, calculatedTasks);
                                const isCriticalLink = task.isCritical && parent.isCritical && (parent.ef === task.es); // Simplified link check
                                
                                // Cubic Bezier
                                const path = `M${end.x},${end.y + 25} C${end.x + 50},${end.y + 25} ${start.x - 50},${start.y + 25} ${start.x},${start.y + 25}`;
                                
                                return (
                                    <g key={`${pid}-${task.id}`}>
                                        <path 
                                            d={path} 
                                            fill="none" 
                                            stroke={isCriticalLink ? "#EF4444" : "#E5E7EB"} 
                                            strokeWidth={isCriticalLink ? 3 : 2}
                                            markerEnd={isCriticalLink ? "url(#arrow-critical)" : "url(#arrow)"}
                                            strokeDasharray={isCriticalLink ? "none" : "5,5"}
                                            className={isCriticalLink ? "animate-pulse" : ""}
                                        />
                                    </g>
                                );
                            });
                        })}
                        
                        {calculatedTasks.map((task) => {
                            const pos = getTaskPos(task, calculatedTasks);
                            return (
                                <g key={task.id} transform={`translate(${pos.x}, ${pos.y})`}>
                                    <rect 
                                        x="0" y="0" width="100" height="50" rx="12" 
                                        fill={task.isCritical ? "#FEF2F2" : "white"} 
                                        stroke={task.isCritical ? "#EF4444" : "#E5E7EB"} 
                                        strokeWidth={task.isCritical ? 2 : 1}
                                        className="shadow-sm"
                                    />
                                    <text x="50" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1F2937">{task.name}</text>
                                    <text x="50" y="38" textAnchor="middle" fontSize="10" fill="#6B7280">Dur: {task.duration}d</text>
                                    
                                    {/* Stats Badge */}
                                    <rect x="-10" y="-10" width="24" height="24" rx="12" fill={task.isCritical ? "#EF4444" : "#3B82F6"} />
                                    <text x="2" y="6" fontSize="10" fontWeight="bold" fill="white">{task.id}</text>
                                    
                                    {/* Slack Indicator */}
                                    {task.slack > 0 && (
                                        <text x="50" y="65" textAnchor="middle" fontSize="9" fill="#10B981" fontWeight="bold">Slack: {task.slack}d</text>
                                    )}
                                </g>
                            )
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
};

// 2. FINANCIAL MODELER
const FinModeler = () => {
    const [initInv, setInitInv] = useState(50000);
    const [cashFlows, setCashFlows] = useState([15000, 20000, 25000, 30000, 35000]);
    const [discountRate, setDiscountRate] = useState(10);

    const data = useMemo(() => {
        let cumulative = -initInv;
        return cashFlows.map((flow, i) => {
            const pv = flow / Math.pow(1 + discountRate/100, i+1);
            cumulative += pv;
            return {
                year: `Y${i+1}`,
                flow: flow,
                pv: Math.round(pv),
                cumulative: Math.round(cumulative)
            };
        });
    }, [initInv, cashFlows, discountRate]);

    const npv = data[data.length-1].cumulative;
    const roi = ((data.reduce((a,b)=>a+b.flow, 0) - initInv) / initInv) * 100;
    const breakEvenIndex = data.findIndex(d => d.cumulative >= 0);
    const payBackPeriod = breakEvenIndex === -1 ? 'N/A' : `${breakEvenIndex + 1} Years`;

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 p-4">
            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><DollarSign className="text-green-600"/> 核心参数</h3>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Initial Investment</label>
                        <input type="number" className="w-full text-xl font-bold border-b border-gray-200 outline-none py-1" value={initInv} onChange={(e)=>setInitInv(Number(e.target.value))}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Discount Rate (%)</label>
                        <input type="range" min="0" max="20" className="w-full accent-green-600" value={discountRate} onChange={(e)=>setDiscountRate(Number(e.target.value))}/>
                        <div className="text-right text-xs font-mono">{discountRate}%</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">现金流预测</h3>
                        <button onClick={()=>setCashFlows([...cashFlows, 20000])} className="p-1 bg-black text-white rounded hover:bg-gray-800"><Plus size={14}/></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {cashFlows.map((cf, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-8 font-bold text-gray-400">Y{i+1}</span>
                                <input type="number" className="flex-1 bg-gray-50 rounded px-2 py-1 text-right" value={cf} onChange={(e)=>{
                                    const n = [...cashFlows]; n[i] = Number(e.target.value); setCashFlows(n);
                                }}/>
                                <button onClick={()=>setCashFlows(cashFlows.filter((_,idx)=>idx!==i))} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black text-white p-5 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500 uppercase">NPV (净现值)</p>
                        <p className={`text-2xl font-mono font-bold ${npv>0?'text-green-400':'text-red-400'}`}>${npv.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase">ROI</p>
                        <p className={`text-2xl font-mono font-bold ${roi>0?'text-green-600':'text-red-500'}`}>{roi.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase">Payback Period</p>
                        <p className="text-2xl font-mono font-bold text-blue-600">{payBackPeriod}</p>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                    <h4 className="absolute top-6 left-6 font-bold text-gray-400 text-xs uppercase">Cumulative Cash Flow Analysis</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={[{year: 'Start', flow: 0, cumulative: -initInv}, ...data]} margin={{top: 40, right: 20, bottom: 20, left: 20}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/>
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize:10}}/>
                            <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                            <ReferenceLine y={0} stroke="#000" strokeOpacity={0.2} />
                            <Bar dataKey="flow" fill="#E5E7EB" radius={[4,4,0,0]} name="Annual Flow"/>
                            <Line type="monotone" dataKey="cumulative" stroke="#2563EB" strokeWidth={3} dot={{r:4, fill:'#2563EB'}} name="Cumulative NPV"/>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// 3. AGILE BURN-DOWN
const AgileBurn = () => {
    const totalPoints = 100;
    const [days, setDays] = useState(14);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // Generate Mock Data with Scope Creep
        const arr = [];
        let actual = totalPoints;
        let scope = totalPoints;
        for(let i=0; i<=days; i++) {
            const ideal = totalPoints - (totalPoints/days)*i;
            
            // Random simulation
            if(i > 0 && i < days) {
                // Burn
                actual -= Math.floor(Math.random() * 12);
                if(actual < 0) actual = 0;
                // Creep (20% chance)
                if(Math.random() > 0.8) scope += Math.floor(Math.random() * 10);
            }

            arr.push({
                day: i,
                Ideal: Math.round(ideal),
                Actual: i > 8 ? null : actual, // Simulate future as null
                Scope: scope
            });
        }
        setData(arr);
    }, [days]);

    return (
        <div className="h-full flex flex-col p-4 space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Zap size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-900">Sprint 42 Burn-down</h3>
                        <p className="text-xs text-gray-500">Velocity: 24pts / day</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>setDays(days===14?21:14)} className="px-3 py-1 bg-white border rounded-lg text-xs font-bold">
                        {days} Day Sprint
                    </button>
                    <button onClick={()=>setData([...data])} className="p-2 bg-white border rounded-lg text-gray-500 hover:text-black"><RefreshCw size={14}/></button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"/>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10}} label={{ value: 'Sprint Days', position: 'insideBottom', offset: -5, fontSize:10 }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:10}} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fontSize:10 }}/>
                        <RechartsTooltip />
                        <Legend verticalAlign="top" height={36}/>
                        
                        <Line type="monotone" dataKey="Ideal" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                        <Area type="monotone" dataKey="Actual" stroke="#2563EB" fill="url(#colorActual)" strokeWidth={3} />
                        <Line type="step" dataKey="Scope" stroke="#EF4444" strokeWidth={2} dot={false}/>
                        
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                    </ComposedChart>
                </ResponsiveContainer>
                
                {/* Warning Overlay */}
                <div className="absolute top-16 right-10 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 animate-bounce-in">
                    <AlertTriangle size={16} className="text-red-500"/>
                    <div>
                        <p className="text-[10px] font-bold text-red-800 uppercase">Scope Creep Detected</p>
                        <p className="text-xs text-red-600">+15 pts added mid-sprint</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. WBS VIEWER
const WbsTree = () => {
    // Recursive Component
    const Node = ({ data, level }: {data:any, level:number}) => {
        const [expanded, setExpanded] = useState(true);
        const progressColor = data.progress === 100 ? 'bg-green-500' : data.progress > 50 ? 'bg-blue-500' : 'bg-gray-300';
        
        return (
            <div className="flex flex-col items-center relative">
                {level > 0 && <div className="h-6 w-px bg-gray-300"></div>}
                <div 
                    className={`
                        relative z-10 bg-white border-2 rounded-xl p-3 w-40 text-center shadow-sm cursor-pointer transition-all hover:scale-105
                        ${data.progress===100 ? 'border-green-200' : 'border-gray-100'}
                    `}
                    onClick={()=>setExpanded(!expanded)}
                >
                    <div className="text-[10px] font-bold text-gray-400 mb-1">{data.code}</div>
                    <div className="text-sm font-bold text-gray-800 leading-tight mb-2">{data.name}</div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${progressColor}`} style={{width: `${data.progress}%`}}></div>
                    </div>
                    {data.children && (
                        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border rounded-full p-0.5 text-gray-400 shadow-sm ${expanded ? 'rotate-180':''}`}>
                            <ChevronDown size={12}/>
                        </div>
                    )}
                </div>
                
                {expanded && data.children && (
                    <div className="flex gap-4 mt-0 pt-0 relative">
                        {/* Connecting line horizontal */}
                        {data.children.length > 1 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-10rem)] h-px bg-transparent">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                            </div>
                        )}
                        {data.children.map((child:any, i:number) => (
                            <Node key={i} data={child} level={level+1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const wbsData = {
        code: '1.0', name: 'New Mobile App', progress: 65,
        children: [
            { code: '1.1', name: 'Planning', progress: 100, children: [
                { code: '1.1.1', name: 'Market Research', progress: 100 },
                { code: '1.1.2', name: 'Feasibility', progress: 100 }
            ]},
            { code: '1.2', name: 'Design', progress: 80, children: [
                { code: '1.2.1', name: 'Prototyping', progress: 100 },
                { code: '1.2.2', name: 'UI Assets', progress: 60 }
            ]},
            { code: '1.3', name: 'Development', progress: 40, children: [
                { code: '1.3.1', name: 'Backend API', progress: 70 },
                { code: '1.3.2', name: 'Frontend', progress: 10 }
            ]}
        ]
    };

    return (
        <div className="h-full bg-gray-50/50 rounded-3xl overflow-auto custom-scrollbar p-10 flex justify-center items-start">
            <Node data={wbsData} level={0} />
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const LearningHub: React.FC<{onNavigate:any, currentUser:UserProfile|null}> = () => {
    // Navigation State
    const [activeToolId, setActiveToolId] = useState('cpm');
    
    // Tools Configuration
    const tools: Tool[] = [
        { id: 'cpm', name: 'CPM Studio', icon: Network, color: 'text-blue-500', component: <CpmStudio /> },
        { id: 'roi', name: 'Finance Modeler', icon: DollarSign, color: 'text-green-500', component: <FinModeler /> },
        { id: 'burn', name: 'Agile Burn-down', icon: Zap, color: 'text-orange-500', component: <AgileBurn /> },
        { id: 'wbs', name: 'WBS Visualizer', icon: Layers, color: 'text-purple-500', component: <WbsTree /> },
        { id: 'okr', name: 'OKR Master', icon: Target, color: 'text-red-500', component: <div className="p-10 text-center text-gray-400">OKR Module coming soon</div> },
        { id: 'charter', name: 'Charter AI', icon: FileTextIcon, color: 'text-gray-500', component: <div className="p-10 text-center text-gray-400">AI Charter Generator (See previous impl)</div> }
    ];

    const activeTool = tools.find(t => t.id === activeToolId) || tools[0];

    return (
        <div className="pt-20 pb-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
            
            {/* 1. THE STAGE (Main Content Area) */}
            <div className="w-full max-w-[1400px] aspect-[16/10] md:aspect-[16/9] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative transition-all duration-500 animate-fade-in-up">
                {/* Stage Header */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-20 flex items-center justify-between px-8 border-b border-gray-100/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gray-50 ${activeTool.color}`}>
                            <activeTool.icon size={20}/>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{activeTool.name}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                            <Save size={18}/>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                            <Layout size={18}/>
                        </button>
                    </div>
                </div>

                {/* Stage Content */}
                <div className="absolute inset-0 pt-16 bg-[#fafafa]">
                    {activeTool.component}
                </div>
            </div>

            {/* 2. THE DOCK (Bottom Navigation) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-white/70 backdrop-blur-2xl border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 flex items-end gap-3 ring-1 ring-black/5">
                    {tools.map((tool) => {
                        const isActive = activeToolId === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setActiveToolId(tool.id)}
                                className="group relative flex flex-col items-center gap-1 transition-all duration-300 hover:-translate-y-2"
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                    {tool.name}
                                </div>

                                {/* Icon Container */}
                                <div className={`
                                    w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300
                                    ${isActive 
                                        ? 'bg-black text-white scale-110 shadow-lg' 
                                        : 'bg-white hover:bg-gray-50 text-gray-500 hover:scale-110'}
                                `}>
                                    <tool.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                {/* Active Dot */}
                                <div className={`w-1 h-1 rounded-full bg-black transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                            </button>
                        );
                    })}
                    
                    {/* Separator */}
                    <div className="w-px h-8 bg-gray-300 mx-1 self-center"></div>

                    {/* Classic Cases Entry */}
                    <button 
                        onClick={() => alert("Simulation Mode needs full screen trigger")} // In real app, open Sim Modal
                        className="group relative flex flex-col items-center gap-1 transition-all duration-300 hover:-translate-y-2"
                    >
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none">
                            Cases
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                            <PlayCircle size={22} />
                        </div>
                        <div className="w-1 h-1 opacity-0"></div>
                    </button>
                </div>
            </div>

        </div>
    );
};

// Helper
function FileTextIcon(props:any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>; }

export default LearningHub;
