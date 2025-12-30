
import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal, Plus, CheckCircle2, Clock, 
  AlertTriangle, Loader2, Save, XCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

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

interface KanbanBoardProps {
    currentUser?: UserProfile | null;
}

const COLUMNS: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done'];

// Default tasks to seed if user has none
const SEED_TASKS: Task[] = [
  { id: 't-1', title: '设计登录页 UI', tag: 'Design', points: 3, status: 'Done', priority: 'High', assignee: 'Alex' },
  { id: 't-2', title: '搭建后端 API', tag: 'Backend', points: 5, status: 'Review', priority: 'High', assignee: 'Mike' },
  { id: 't-3', title: '实现 JWT 鉴权', tag: 'Security', points: 5, status: 'In Progress', priority: 'Critical', assignee: 'Alex' },
  { id: 't-4', title: '集成支付网关', tag: 'Payment', points: 8, status: 'Ready', priority: 'Medium' },
  { id: 't-5', title: '编写用户手册', tag: 'Docs', points: 2, status: 'Backlog', priority: 'Low' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sprintDaysLeft] = useState(10);
  const [burndownData, setBurndownData] = useState<{ day: number; remaining: number }[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // --- 1. Load Data from DB ---
  useEffect(() => {
      const fetchTasks = async () => {
          setIsLoading(true);
          
          if (!currentUser) {
              setTasks(SEED_TASKS); // Demo mode for guests
              setIsLoading(false);
              return;
          }

          const { data, error } = await supabase
              .from('app_kanban_tasks')
              .select('*')
              .eq('user_id', currentUser.id);

          if (!error && data && data.length > 0) {
              setTasks(data);
          } else if (data && data.length === 0) {
              setTasks([]); 
          } else {
              console.error("Error loading tasks:", error);
          }
          setIsLoading(false);
      };

      fetchTasks();
  }, [currentUser]);

  // --- 2. Simulation Engine (Random Events) ---
  useEffect(() => {
    // Only run simulation if user is active (has tasks)
    if (!tasks.length) return;

    const interval = setInterval(() => {
        // 10% chance every 15 seconds to trigger an event
        if (Math.random() > 0.9) { 
             triggerRandomEvent();
        }
    }, 15000); 

    return () => clearInterval(interval);
  }, [tasks]);

  const triggerRandomEvent = () => {
      const eventTypes = [
          { type: 'SCOPE_CREEP', msg: '🚨 客户变更了需求！新增紧急任务到 Backlog。', severity: 'error' },
          { type: 'BUG_FOUND', msg: '🐛 测试环境发现严重 Bug，请优先修复！', severity: 'error' },
          { type: 'TEAM_HELP', msg: '🤝 团队成员完成了部分工作，效率提升！', severity: 'success' },
          { type: 'SERVER_DOWN', msg: '🔥 开发服务器宕机，所有进行中任务受阻。', severity: 'error' }
      ];
      
      const evt = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      setNotification({ msg: evt.msg, type: evt.severity as any });
      setTimeout(() => setNotification(null), 5000);

      // Effect Logic
      if (evt.type === 'SCOPE_CREEP') {
          const newTask: Task = {
              id: `urgent-${Date.now()}`,
              title: '紧急：客户需求变更 #' + Math.floor(Math.random() * 100),
              tag: 'Change',
              points: 5,
              status: 'Backlog',
              priority: 'Critical',
              assignee: 'Unassigned'
          };
          setTasks(prev => [newTask, ...prev]);
      } 
      else if (evt.type === 'SERVER_DOWN') {
          setTasks(prev => prev.map(t => 
              t.status === 'In Progress' ? { ...t, isBlocked: true } : t
          ));
      }
      else if (evt.type === 'TEAM_HELP') {
           // Auto move one task to done
           setTasks(prev => {
               const candidates = prev.filter(t => t.status === 'In Progress' && !t.isBlocked);
               if (candidates.length > 0) {
                   const luckyTask = candidates[0];
                   return prev.map(t => t.id === luckyTask.id ? { ...t, status: 'Review' } : t);
               }
               return prev;
           });
      }
  };

  // --- 3. Burndown Logic ---
  useEffect(() => {
    const totalPoints = tasks.reduce((acc, t) => acc + (t.points || 0), 0);
    const donePoints = tasks.filter(t => t.status === 'Done').reduce((acc, t) => acc + (t.points || 0), 0);
    const remaining = Math.max(0, totalPoints - donePoints);

    setBurndownData(prev => {
        const day = 10 - sprintDaysLeft;
        const newData = [...prev.filter(d => d.day !== day), { day, remaining }];
        return newData.sort((a, b) => a.day - b.day);
    });
  }, [tasks, sprintDaysLeft]);

  // --- 4. Persistence Helpers ---
  const saveTaskUpdate = async (updatedTask: Task) => {
      if (!currentUser) return; 

      const { error } = await supabase
          .from('app_kanban_tasks')
          .upsert({
              id: updatedTask.id,
              user_id: currentUser.id,
              title: updatedTask.title,
              tag: updatedTask.tag,
              points: updatedTask.points,
              status: updatedTask.status,
              priority: updatedTask.priority,
              assignee: updatedTask.assignee
          });
      
      if (error) {
          console.error("Failed to sync task:", error);
      }
  };

  const initDefaultTasks = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const tasksToInsert = SEED_TASKS.map(t => ({
          ...t,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          user_id: currentUser.id,
          created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('app_kanban_tasks').insert(tasksToInsert);
      if (!error) {
          setTasks(tasksToInsert);
          setNotification({ msg: '已初始化示例任务', type: 'info' });
          setTimeout(() => setNotification(null), 3000);
      } else {
          setNotification({ msg: '初始化失败，请检查数据库', type: 'error' });
      }
      setIsLoading(false);
  };

  const handleAddTask = async (status: Status) => {
      const title = prompt("请输入任务标题:");
      if (!title) return;

      const newTask: Task = {
          id: `task-${Date.now()}`,
          title,
          tag: 'General',
          points: 1,
          status,
          priority: 'Medium',
          assignee: currentUser?.name || 'Me'
      };

      setTasks(prev => [...prev, newTask]);
      
      if (currentUser) {
          await supabase.from('app_kanban_tasks').insert({
              ...newTask,
              user_id: currentUser.id,
              created_at: new Date().toISOString()
          });
      }
  };

  // --- D&D Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (task && task.status !== targetStatus) {
        if (task.isBlocked) {
            setNotification({ msg: '🚫 无法移动受阻的任务！请先解决阻塞问题。', type: 'error' });
            setTimeout(() => setNotification(null), 2000);
            setDraggedTaskId(null);
            return;
        }

        const updatedTask = { ...task, status: targetStatus };
        setTasks(prev => prev.map(t => t.id === draggedTaskId ? updatedTask : t));
        saveTaskUpdate(updatedTask); 
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
                     <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs border-2 border-white">
                         {currentUser?.name?.charAt(0) || 'U'}
                     </div>
                     <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">+AI</div>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Clock size={16}/>
                    <span>Sprint 4 ends in <strong className="text-black">{sprintDaysLeft} days</strong></span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Seed Button for Empty State */}
                {tasks.length === 0 && !isLoading && currentUser && (
                    <button 
                        onClick={initDefaultTasks}
                        className="flex items-center gap-2 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Save size={14}/> 初始化示例数据
                    </button>
                )}

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
        </div>

        {/* --- Notification Toast --- */}
        {notification && (
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm animate-bounce-in ${
                notification.type === 'error' ? 'bg-red-500 text-white' : 
                notification.type === 'success' ? 'bg-green-600 text-white' :
                'bg-blue-600 text-white'
            }`}>
                {notification.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
                {notification.msg}
            </div>
        )}

        {/* --- Board --- */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                    <Loader2 className="animate-spin" /> 加载任务板...
                </div>
            ) : (
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
                                <button onClick={() => handleAddTask(column)} className="text-gray-400 hover:text-black transition-colors">
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
                                            task.isBlocked ? 'opacity-80 bg-red-50 border-red-200' : ''
                                        }`}
                                    >
                                        {task.isBlocked && (
                                            <div 
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm z-10 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent drag start on click
                                                    if (confirm("是否解决此阻塞问题？")) {
                                                        setTasks(prev => prev.map(t => t.id === task.id ? {...t, isBlocked: false} : t));
                                                    }
                                                }}
                                                title="点击解决阻塞"
                                            >
                                                <XCircle size={14} />
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
            )}
        </div>
    </div>
  );
};

export default KanbanBoard;
