import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, Plus, AlertCircle, CheckCircle2, Clock, 
  AlertTriangle, RotateCcw, Play, Pause, Flame, ChevronUp 
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// --- Types ---
type Status = 'Backlog' | 'Ready' | 'In Progress' | 'Review' | 'Done';
type Priority = 'High' | 'Medium' | 'Low' | 'Critical';

interface Task {
  id: string;
  title: string;
  tag: string;
  points: number;
  status: Status;
  priority: Priority;
  assignee?: string;
  isBlocked?: boolean;
}

// --- Mock Data ---
const INITIAL_TASKS: Task[] = [
  { id: 't-1', title: '设计登录页 UI', tag: 'Design', points: 3, status: 'Done', priority: 'High', assignee: 'Alex' },
  { id: 't-2', title: '搭建后端 API 框架', tag: 'Backend', points: 5, status: 'Review', priority: 'High', assignee: 'Mike' },
  { id: 't-3', title: '实现 JWT 鉴权', tag: 'Security', points: 5, status: 'In Progress', priority: 'Critical', assignee: 'Alex' },
  { id: 't-4', title: '集成 Stripe 支付', tag: 'Payment', points: 8, status: 'Ready', priority: 'Medium' },
  { id: 't-5', title: '编写用户手册', tag: 'Docs', points: 2, status: 'Backlog', priority: 'Low' },
  { id: 't-6', title: '优化数据库索引', tag: 'DB', points: 3, status: 'Backlog', priority: 'Medium' },
];

const COLUMNS: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done'];

const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [sprintDaysLeft, setSprintDaysLeft] = useState(10);
  const [burndownData, setBurndownData] = useState<{ day: number; remaining: number }[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);
  
  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // --- Burndown Logic ---
  useEffect(() => {
    // Calculate total points
    const totalPoints = tasks.reduce((acc, t) => acc + t.points, 0);
    const donePoints = tasks.filter(t => t.status === 'Done').reduce((acc, t) => acc + t.points, 0);
    const remaining = totalPoints - donePoints;

    setBurndownData(prev => {
        const day = 10 - sprintDaysLeft;
        // Simple logic to prevent duplicate day entries for demo
        const newData = [...prev.filter(d => d.day !== day), { day, remaining }];
        return newData.sort((a, b) => a.day - b.day);
    });
  }, [tasks, sprintDaysLeft]);

  // --- Chaos Monkey (Random Events) ---
  useEffect(() => {
    const interval = setInterval(() => {
        const rand = Math.random();
        if (rand > 0.95) { // 5% chance every 3s
            triggerRandomEvent();
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [tasks]);

  const triggerRandomEvent = () => {
      const events = [
          { 
              msg: '🔥 生产环境出现紧急 Bug！', 
              action: () => {
                  const bug: Task = { 
                      id: `bug-${Date.now()}`, 
                      title: '修复生产环境 502 错误', 
                      tag: 'Bug', points: 8, 
                      status: 'Ready', priority: 'Critical' 
                  };
                  setTasks(prev => [bug, ...prev]);
              }
          },
          {
              msg: '🚧 外部 API 服务宕机，开发受阻！',
              action: () => {
                 setTasks(prev => prev.map(t => t.status === 'In Progress' ? { ...t, isBlocked: true } : t));
                 setTimeout(() => {
                     setTasks(prev => prev.map(t => { delete t.isBlocked; return t; }));
                     setNotification({ msg: '✅ 服务已恢复', type: 'info' });
                 }, 5000);
              }
          }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      setNotification({ msg: event.msg, type: 'error' });
      event.action();
      setTimeout(() => setNotification(null), 4000);
  };

  // --- D&D Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (task && task.status !== targetStatus) {
        // Logic: Cannot move blocked tasks
        if (task.isBlocked) {
            setNotification({ msg: '🚫 无法移动受阻的任务！', type: 'error' });
            setTimeout(() => setNotification(null), 2000);
            setDraggedTaskId(null);
            return;
        }

        setTasks(prev => prev.map(t => 
            t.id === draggedTaskId ? { ...t, status: targetStatus } : t
        ));
    }
    setDraggedTaskId(null);
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case 'Critical': return 'bg-red-100 text-red-600 border-red-200';
          case 'High': return 'bg-orange-100 text-orange-600 border-orange-200';
          case 'Medium': return 'bg-blue-100 text-blue-600 border-blue-200';
          default: return 'bg-gray-100 text-gray-500 border-gray-200';
      }
  };

  return (
    <div className="h-full flex flex-col">
        {/* --- Toolbar --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                     <img src="https://i.pravatar.cc/100?u=1" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                     <img src="https://i.pravatar.cc/100?u=2" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                     <img src="https://i.pravatar.cc/100?u=3" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                     <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">+2</div>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Clock size={16}/>
                    <span>Sprint 4 ends in <strong className="text-black">{sprintDaysLeft} days</strong></span>
                </div>
            </div>

            {/* Burndown Mini Chart */}
            <div className="h-12 w-32 relative group">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={burndownData}>
                        <Area type="monotone" dataKey="remaining" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 bg-white/90 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-gray-100 rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold text-blue-600">Burndown</span>
                </div>
            </div>
        </div>

        {/* --- Notification Toast --- */}
        {notification && (
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${
                notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
            }`}>
                {notification.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
                {notification.msg}
            </div>
        )}

        {/* --- Board --- */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-6 h-full min-w-[1000px] px-2">
                {COLUMNS.map(column => (
                    <div 
                        key={column}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column)}
                        className={`flex-1 flex flex-col rounded-2xl transition-colors duration-300 ${
                            column === 'Done' ? 'bg-green-50/50' : 'bg-gray-100/50'
                        } ${draggedTaskId ? 'ring-2 ring-blue-500/10' : ''}`}
                    >
                        {/* Column Header */}
                        <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    column === 'Backlog' ? 'bg-gray-400' :
                                    column === 'Ready' ? 'bg-orange-400' :
                                    column === 'In Progress' ? 'bg-blue-500' :
                                    column === 'Review' ? 'bg-purple-500' : 'bg-green-500'
                                }`}></span>
                                <h3 className="font-bold text-sm text-gray-700">{column}</h3>
                                <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-medium text-gray-500">
                                    {tasks.filter(t => t.status === column).length}
                                </span>
                            </div>
                            <button className="text-gray-400 hover:text-black">
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Drop Zone */}
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                            {tasks.filter(t => t.status === column).map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all relative group ${
                                        task.isBlocked ? 'opacity-70 grayscale border-red-200' : ''
                                    }`}
                                >
                                    {task.isBlocked && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm z-10">
                                            <AlertTriangle size={12} />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                    
                                    <h4 className="text-sm font-bold text-gray-900 leading-tight mb-3">{task.title}</h4>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 rounded">
                                                {task.tag}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             {task.assignee && (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                    {task.assignee.charAt(0)}
                                                </div>
                                             )}
                                             <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 bg-gray-50" title="Story Points">
                                                 {task.points}
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default KanbanBoard;