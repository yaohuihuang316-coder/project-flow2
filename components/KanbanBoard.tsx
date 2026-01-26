
import React, { useState, useEffect } from 'react';
import { 
  MoreHorizontal, Plus, CheckCircle2, Clock, 
  AlertTriangle, Loader2, Save, XCircle, Trash2
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

// Default tasks to seed if user has none (>10 items)
const SEED_TASKS: Task[] = [
  { id: 't-1', title: '设计登录页 UI', tag: 'Design', points: 3, status: 'Done', priority: 'High', assignee: 'Alex' },
  { id: 't-2', title: '搭建后端 API', tag: 'Backend', points: 5, status: 'Review', priority: 'High', assignee: 'Mike' },
  { id: 't-3', title: '实现 JWT 鉴权', tag: 'Security', points: 5, status: 'In Progress', priority: 'Critical', assignee: 'Alex' },
  { id: 't-4', title: '集成支付网关', tag: 'Payment', points: 8, status: 'Ready', priority: 'Medium' },
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
              const safeTasks = data.map(t => ({
                  ...t,
                  points: t.points || 1,
                  priority: t.priority || 'Medium',
                  assignee: t.assignee || 'Unassigned'
              }));
              setTasks(safeTasks);
          } else {
              setTasks([]);
          }
          setIsLoading(false);
      };

      fetchTasks();
  }, [currentUser]);

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

  // --- 4. Persistence Helpers & Activity Logging ---
  const saveTaskUpdate = async (updatedTask: Task) => {
      if (!currentUser) return; 

      const taskPayload = {
          id: updatedTask.id,
          user_id: currentUser.id,
          title: updatedTask.title,
          tag: updatedTask.tag,
          points: updatedTask.points,
          status: updatedTask.status,
          priority: updatedTask.priority,
          assignee: updatedTask.assignee, 
          is_blocked: updatedTask.isBlocked
      };

      const { error } = await supabase
          .from('app_kanban_tasks')
          .upsert(taskPayload);
      
      if (error) {
          console.error("Failed to sync task:", error);
      }
  };

  // NEW: Delete Task
  const handleDeleteTask = async (id: string) => {
      if (!window.confirm("确定要删除此任务吗？")) return;
      
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== id));

      if (currentUser) {
          const { error } = await supabase.from('app_kanban_tasks').delete().eq('id', id);
          if (error) {
              setNotification({ msg: '删除失败', type: 'error' });
              // Revert if critical, but for Kanban usually fine to just reload later
          } else {
              setNotification({ msg: '任务已删除', type: 'info' });
          }
      }
      setTimeout(() => setNotification(null), 2000);
  };

  // Activity Logger
  const logActivity = async (task: Task) => {
      if (!currentUser) return;
      await supabase.from('app_activity_logs').insert({
          user_id: currentUser.id,
          action_type: 'complete_task',
          points: task.points, 
          meta: { task_title: task.title },
          created_at: new Date().toISOString()
      });
      setNotification({ msg: `任务完成！获得 ${task.points} 贡献点`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
  };

  const initDefaultTasks = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const tasksToInsert = SEED_TASKS.map(t => ({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          user_id: currentUser.id,
          title: t.title,
          tag: t.tag,
          points: t.points,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee,
          created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('app_kanban_tasks').insert(tasksToInsert);
      
      if (!error) {
          setTasks(tasksToInsert);
          setNotification({ msg: '已初始化示例任务', type: 'info' });
      } else {
          setNotification({ msg: '初始化失败：' + (error.message || 'Check DB'), type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
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
              id: newTask.id,
              user_id: currentUser.id,
              title: newTask.title,
              tag: newTask.tag,
              points: newTask.points,
              status: newTask.status,
              priority: newTask.priority,
              assignee: newTask.assignee, 
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
        
        if (targetStatus === 'Done' && task.status !== 'Done') {
            logActivity(task);
        }
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
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Clock size={16}/>
                    <span>Sprint 4 ends in <strong className="text-black">{sprintDaysLeft} days</strong></span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {tasks.length === 0 && !isLoading && currentUser && (
                    <button onClick={initDefaultTasks} className="flex items-center gap-2 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                        <Save size={14}/> 初始化示例数据
                    </button>
                )}
                <div className="h-12 w-32 relative group">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burndownData}>
                            <Area type="monotone" dataKey="remaining" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
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
                            <div className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${column === 'Backlog' ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
                                    <h3 className="font-bold text-sm text-gray-700">{column}</h3>
                                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-medium text-gray-500">
                                        {tasks.filter(t => t.status === column).length}
                                    </span>
                                </div>
                                <button onClick={() => handleAddTask(column)} className="text-gray-400 hover:text-black transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>

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
                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm z-10 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("是否解决此阻塞问题？")) {
                                                        setTasks(prev => prev.map(t => t.id === task.id ? {...t, isBlocked: false} : t));
                                                    }
                                                }}
                                            >
                                                <XCircle size={14} />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            
                                            {/* Action Menu (Delete) */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                    className="text-gray-300 hover:text-red-500"
                                                    title="删除任务"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button className="text-gray-300 hover:text-gray-600">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-3">{task.title}</h4>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 rounded">{task.tag}</span>
                                            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 bg-gray-50">
                                                {task.points}
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
