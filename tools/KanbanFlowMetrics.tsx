
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutKanban, Save, Download, Plus, Trash2, TrendingUp,
  Clock, Zap, BarChart3, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar
} from 'recharts';

interface KanbanItem {
  id: string;
  title: string;
  status: 'backlog' | 'inProgress' | 'done';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface DailySnapshot {
  date: string;
  backlog: number;
  inProgress: number;
  done: number;
}

interface KanbanMetrics {
  leadTime: number;
  cycleTime: number;
  throughput: number;
  currentWIP: number;
}

interface KanbanFlowProps {
  currentUser?: UserProfile | null;
}

// Little's Law: LeadTime = WIP / Throughput
function calculateMetrics(items: KanbanItem[], days: number = 14): KanbanMetrics {
  const completedItems = items.filter(i => i.status === 'done' && i.completedAt);
  const inProgressItems = items.filter(i => i.status === 'inProgress');
  
  // 计算吞吐量 (每周完成的任务数)
  const throughput = completedItems.length / (days / 7);
  
  // 计算平均Lead Time (从创建到完成的时间)
  const leadTimes = completedItems.map(item => {
    const created = new Date(item.createdAt).getTime();
    const completed = new Date(item.completedAt!).getTime();
    return (completed - created) / (1000 * 60 * 60 * 24); // 转换为天数
  });
  const avgLeadTime = leadTimes.length > 0 
    ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length 
    : 0;
  
  // 计算平均Cycle Time (从开始到完成的时间)
  const cycleTimes = completedItems
    .filter(i => i.startedAt)
    .map(item => {
      const started = new Date(item.startedAt!).getTime();
      const completed = new Date(item.completedAt!).getTime();
      return (completed - started) / (1000 * 60 * 60 * 24);
    });
  const avgCycleTime = cycleTimes.length > 0
    ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
    : 0;
  
  return {
    leadTime: Math.round(avgLeadTime * 10) / 10,
    cycleTime: Math.round(avgCycleTime * 10) / 10,
    throughput: Math.round(throughput * 10) / 10,
    currentWIP: inProgressItems.length
  };
}

// 生成累积流图数据
function generateCFD(items: KanbanItem[], days: number = 14): DailySnapshot[] {
  const snapshots: DailySnapshot[] = [];
  const endDate = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const backlog = items.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate <= date && item.status !== 'done';
    }).length;
    
    const inProgress = items.filter(item => {
      if (item.status !== 'inProgress' && item.status !== 'done') return false;
      const started = item.startedAt ? new Date(item.startedAt) : null;
      return started && started <= date;
    }).length;
    
    const done = items.filter(item => {
      if (item.status !== 'done' || !item.completedAt) return false;
      const completed = new Date(item.completedAt);
      return completed <= date;
    }).length;
    
    snapshots.push({ date: dateStr, backlog, inProgress: inProgress - done, done });
  }
  
  return snapshots;
}

const KanbanFlowMetrics: React.FC<KanbanFlowProps> = ({ currentUser }) => {
  const [boardName, setBoardName] = useState('研发看板');
  const [items, setItems] = useState<KanbanItem[]>([
    { id: '1', title: '需求分析', status: 'done', createdAt: '2024-01-01', startedAt: '2024-01-02', completedAt: '2024-01-05' },
    { id: '2', title: '技术设计', status: 'done', createdAt: '2024-01-03', startedAt: '2024-01-04', completedAt: '2024-01-08' },
    { id: '3', title: '前端开发', status: 'inProgress', createdAt: '2024-01-05', startedAt: '2024-01-09' },
    { id: '4', title: '后端API', status: 'inProgress', createdAt: '2024-01-06', startedAt: '2024-01-10' },
    { id: '5', title: '数据库设计', status: 'done', createdAt: '2024-01-04', startedAt: '2024-01-05', completedAt: '2024-01-07' },
    { id: '6', title: '测试用例', status: 'backlog', createdAt: '2024-01-08' },
    { id: '7', title: '部署脚本', status: 'backlog', createdAt: '2024-01-09' },
  ]);
  const [wipLimit, setWipLimit] = useState(3);
  const [savedBoards, setSavedBoards] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const metrics = useMemo(() => calculateMetrics(items), [items]);
  const cfdData = useMemo(() => generateCFD(items), [items]);

  useEffect(() => {
    loadSavedBoards();
  }, []);

  const loadSavedBoards = async () => {
    const { data } = await supabase
      .from('lab_kanban_flow_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSavedBoards(data);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const addItem = () => {
    const newItem: KanbanItem = {
      id: Date.now().toString(),
      title: '新任务',
      status: 'backlog',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof KanbanItem, value: string) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      
      // 自动更新状态相关的时间戳
      if (field === 'status') {
        if (value === 'inProgress' && !item.startedAt) {
          updated.startedAt = new Date().toISOString().split('T')[0];
        }
        if (value === 'done' && !item.completedAt) {
          updated.completedAt = new Date().toISOString().split('T')[0];
          if (!item.startedAt) {
            updated.startedAt = new Date().toISOString().split('T')[0];
          }
        }
      }
      
      return updated;
    }));
  };

  const saveBoard = async () => {
    setIsSaving(true);
    
    const completedItems = items.filter(i => i.status === 'done');
    const payload = {
      user_id: currentUser?.id || null,
      board_name: boardName,
      daily_snapshots: cfdData,
      completed_items: completedItems,
      wip_limit: wipLimit
    };

    let error;
    if (currentId) {
      const { error: updateError } = await supabase
        .from('lab_kanban_flow_data')
        .update(payload)
        .eq('id', currentId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('lab_kanban_flow_data')
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (data) setCurrentId(data.id);
    }

    setIsSaving(false);
    if (error) {
      showToast('error', '保存失败: ' + error.message);
    } else {
      showToast('success', '保存成功!');
      loadSavedBoards();
    }
  };

  const loadBoard = (board: any) => {
    setCurrentId(board.id);
    setBoardName(board.board_name);
    setWipLimit(board.wip_limit);
    if (board.completed_items) {
      setItems(board.completed_items);
    }
  };

  const exportData = () => {
    const content = `
Kanban流动指标报告
================
看板名称: ${boardName}
生成时间: ${new Date().toLocaleDateString('zh-CN')}

核心指标:
- Lead Time (交付周期): ${metrics.leadTime} 天
- Cycle Time (处理周期): ${metrics.cycleTime} 天  
- Throughput (吞吐量): ${metrics.throughput} 项/周
- Current WIP (在制品): ${metrics.currentWIP} / ${wipLimit}

任务列表:
${items.map(i => `- [${i.status === 'done' ? '✓' : i.status === 'inProgress' ? '▶' : '○'}] ${i.title}`).join('\n')}

Little's Law分析:
理论Lead Time = WIP / Throughput = ${metrics.currentWIP} / ${metrics.throughput} = ${(metrics.currentWIP / metrics.throughput).toFixed(1)} 天
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kanban指标_${boardName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', '报告已导出');
  };

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-600',
    inProgress: 'bg-blue-100 text-blue-600',
    done: 'bg-green-100 text-green-600'
  };

  const statusLabels = {
    backlog: '待办',
    inProgress: '进行中',
    done: '已完成'
  };

  const wipWarning = metrics.currentWIP > wipLimit;

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
                <LayoutKanban size={20} />
              </div>
              Kanban流动指标
            </h1>
            <p className="text-gray-500 mt-1">可视化流程瓶颈，数据驱动持续改进</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveBoard}
              disabled={isSaving}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              保存
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Download size={18} />
              导出
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock size={16} />
              <span className="text-xs uppercase tracking-wider">Lead Time</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.leadTime}</p>
            <p className="text-xs text-gray-400 mt-1">天 (创建到完成)</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Zap size={16} />
              <span className="text-xs uppercase tracking-wider">Cycle Time</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{metrics.cycleTime}</p>
            <p className="text-xs text-gray-400 mt-1">天 (开始到完成)</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp size={16} />
              <span className="text-xs uppercase tracking-wider">Throughput</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{metrics.throughput}</p>
            <p className="text-xs text-gray-400 mt-1">项/周</p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${wipWarning ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center gap-2 mb-2 ${wipWarning ? 'text-red-500' : 'text-gray-500'}`}>
              <BarChart3 size={16} />
              <span className="text-xs uppercase tracking-wider">WIP</span>
            </div>
            <p className={`text-3xl font-bold ${wipWarning ? 'text-red-600' : 'text-purple-600'}`}>
              {metrics.currentWIP}
              <span className="text-lg text-gray-400">/{wipLimit}</span>
            </p>
            <p className={`text-xs mt-1 ${wipWarning ? 'text-red-500' : 'text-gray-400'}`}>
              {wipWarning ? '⚠️ 超出限制' : '在制品数量'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Task Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Board Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">看板名称</label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4"
              />
              <label className="block text-sm font-medium text-gray-700 mb-2">WIP限制</label>
              <input
                type="number"
                min="1"
                max="20"
                value={wipLimit}
                onChange={(e) => setWipLimit(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">任务列表</h3>
                <button
                  onClick={addItem}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => updateItem(item.id, 'status', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="backlog">待办</option>
                      <option value="inProgress">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                    {item.status !== 'backlog' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={item.startedAt || ''}
                          onChange={(e) => updateItem(item.id, 'startedAt', e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                          placeholder="开始日期"
                        />
                        {item.status === 'done' && (
                          <input
                            type="date"
                            value={item.completedAt || ''}
                            onChange={(e) => updateItem(item.id, 'completedAt', e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                            placeholder="完成日期"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Boards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史看板</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedBoards.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">暂无保存的看板</p>
                ) : (
                  savedBoards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => loadBoard(board)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        currentId === board.id ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">{board.board_name}</p>
                      <p className="text-xs text-gray-500">
                        WIP限制: {board.wip_limit}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* CFD Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                累积流图 (CFD)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cfdData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="done" 
                      stackId="1" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      name="已完成"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="inProgress" 
                      stackId="1" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      name="进行中"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="backlog" 
                      stackId="1" 
                      stroke="#9CA3AF" 
                      fill="#9CA3AF" 
                      name="待办"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                流程分析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-green-100 mb-2">Little's Law 验证</p>
                  <p className="text-2xl font-bold">
                    Lead Time ≈ WIP / Throughput
                  </p>
                  <p className="text-green-100 mt-1">
                    {metrics.leadTime} ≈ {metrics.currentWIP} / {metrics.throughput} = {(metrics.currentWIP / metrics.throughput).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-green-100 mb-2">改进建议</p>
                  <ul className="space-y-1 text-green-100 text-sm">
                    {wipWarning ? (
                      <li>⚠️ WIP超出限制，建议限制并行任务数</li>
                    ) : (
                      <li>✓ WIP控制良好</li>
                    )}
                    {metrics.cycleTime > metrics.leadTime * 0.5 ? (
                      <li>⚠️ Cycle Time占比较高，关注流程效率</li>
                    ) : (
                      <li>✓ 流程效率良好</li>
                    )}
                    {metrics.throughput < 2 ? (
                      <li>💡 吞吐量偏低，考虑增加资源或拆分任务</li>
                    ) : (
                      <li>✓ 吞吐量健康</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanFlowMetrics;
