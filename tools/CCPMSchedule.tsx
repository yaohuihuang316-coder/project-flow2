
import React, { useState, useEffect, useMemo } from 'react';
import { Link2, Plus, Trash2, Save, Download, AlertCircle, CheckCircle2, Shield, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CCPMTask { id: string; name: string; duration: number; safeDuration: number; resources: string[]; dependencies: string[]; earlyStart: number; earlyFinish: number; lateStart: number; lateFinish: number; isCritical: boolean; }
interface CCPMScheduleProps { currentUser?: UserProfile | null; }

function calculateCriticalChain(tasks: CCPMTask[]): CCPMTask[] {
  const taskMap = new Map(tasks.map(t => [t.id, { ...t, earlyStart: 0, earlyFinish: 0 }]));
  const visited = new Set<string>();
  const calculateEarly = (taskId: string): void => {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const task = taskMap.get(taskId)!;
    let maxEarlyFinish = 0;
    for (const depId of task.dependencies) { calculateEarly(depId); const depTask = taskMap.get(depId)!; maxEarlyFinish = Math.max(maxEarlyFinish, depTask.earlyFinish); }
    task.earlyStart = maxEarlyFinish;
    task.earlyFinish = maxEarlyFinish + task.duration;
  };
  tasks.forEach(t => calculateEarly(t.id));
  const maxEF = Math.max(...Array.from(taskMap.values()).map(t => t.earlyFinish));
  const visited2 = new Set<string>();
  const calculateLate = (taskId: string): void => {
    if (visited2.has(taskId)) return;
    visited2.add(taskId);
    const task = taskMap.get(taskId)!;
    const dependents = Array.from(taskMap.values()).filter(t => t.dependencies.includes(taskId));
    if (dependents.length === 0) task.lateFinish = maxEF;
    else task.lateFinish = Math.min(...dependents.map(t => t.lateStart));
    task.lateStart = task.lateFinish - task.duration;
  };
  const sortedByEF = Array.from(taskMap.values()).sort((a, b) => b.earlyFinish - a.earlyFinish);
  sortedByEF.forEach(t => { if (!visited2.has(t.id)) calculateLate(t.id); });
  Array.from(taskMap.values()).forEach(task => { task.isCritical = task.earlyStart === task.lateStart; });
  return Array.from(taskMap.values());
}

const CCPMSchedule: React.FC<CCPMScheduleProps> = ({ currentUser }) => {
  const [projectName, setProjectName] = useState('新产品开发项目');
  const [tasks, setTasks] = useState<CCPMTask[]>([
    { id: '1', name: '需求分析', duration: 10, safeDuration: 15, resources: ['BA'], dependencies: [], earlyStart: 0, earlyFinish: 10, lateStart: 0, lateFinish: 10, isCritical: true },
    { id: '2', name: '系统设计', duration: 12, safeDuration: 20, resources: ['架构师'], dependencies: ['1'], earlyStart: 10, earlyFinish: 22, lateStart: 10, lateFinish: 22, isCritical: true },
    { id: '3', name: '前端开发', duration: 20, safeDuration: 30, resources: ['前端'], dependencies: ['2'], earlyStart: 22, earlyFinish: 42, lateStart: 22, lateFinish: 42, isCritical: true },
    { id: '4', name: '后端开发', duration: 25, safeDuration: 40, resources: ['后端'], dependencies: ['2'], earlyStart: 22, earlyFinish: 47, lateStart: 22, lateFinish: 47, isCritical: true },
    { id: '5', name: '接口联调', duration: 8, safeDuration: 12, resources: ['前端', '后端'], dependencies: ['3', '4'], earlyStart: 47, earlyFinish: 55, lateStart: 47, lateFinish: 55, isCritical: true },
    { id: '6', name: '测试验收', duration: 10, safeDuration: 15, resources: ['测试'], dependencies: ['5'], earlyStart: 55, earlyFinish: 65, lateStart: 55, lateFinish: 65, isCritical: true },
  ]);
  const [bufferPercentage, setBufferPercentage] = useState(50);
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const calculatedTasks = useMemo(() => calculateCriticalChain(tasks), [tasks]);
  const stats = useMemo(() => {
    const criticalChain = calculatedTasks.filter(t => t.isCritical);
    const criticalChainLength = criticalChain.reduce((sum, t) => sum + t.duration, 0);
    const originalLength = criticalChain.reduce((sum, t) => sum + t.safeDuration, 0);
    const projectBuffer = Math.round(criticalChainLength * (bufferPercentage / 100));
    return { criticalChainLength, originalLength, projectBuffer, totalDuration: criticalChainLength + projectBuffer, timeSaved: originalLength - (criticalChainLength + projectBuffer), criticalTasks: criticalChain.length };
  }, [calculatedTasks, bufferPercentage]);

  const ganttData = useMemo(() => calculatedTasks.map(t => ({ name: t.name.substring(0, 10), start: t.earlyStart, duration: t.duration, isCritical: t.isCritical, resources: t.resources.join(', ') })), [calculatedTasks]);

  useEffect(() => { loadSavedSchedules(); }, []);
  const loadSavedSchedules = async () => { const { data } = await supabase.from('lab_ccpm_schedules').select('*').order('created_at', { ascending: false }).limit(10); if (data) setSavedSchedules(data); };
  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const addTask = () => { const newTask: CCPMTask = { id: Date.now().toString(), name: '新任务', duration: 5, safeDuration: 10, resources: [], dependencies: [], earlyStart: 0, earlyFinish: 5, lateStart: 0, lateFinish: 5, isCritical: false }; setTasks([...tasks, newTask]); };
  const removeTask = (id: string) => { if (tasks.length <= 2) { showToast('error', '至少保留两个任务'); return; } setTasks(tasks.filter(t => t.id !== id).map(t => ({ ...t, dependencies: t.dependencies.filter(dep => dep !== id) }))); };
  const updateTask = (id: string, field: keyof CCPMTask, value: any) => { setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t)); };
  const toggleDependency = (taskId: string, depId: string) => { const task = tasks.find(t => t.id === taskId); if (!task) return; const newDeps = task.dependencies.includes(depId) ? task.dependencies.filter(d => d !== depId) : [...task.dependencies, depId]; updateTask(taskId, 'dependencies', newDeps); };

  const saveSchedule = async () => {
    const payload = { user_id: currentUser?.id || null, project_name: projectName, tasks: calculatedTasks, project_buffer: stats.projectBuffer, critical_chain: calculatedTasks.filter(t => t.isCritical).map(t => t.id) };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_ccpm_schedules').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_ccpm_schedules').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedSchedules(); }
  };

  const loadSchedule = (schedule: any) => { setCurrentId(schedule.id); setProjectName(schedule.project_name); setTasks(schedule.tasks); };
  const exportData = () => {
    const content = `关键链法(CCPM)调度报告\n====================\n项目名称: ${projectName}\n\n关键指标:\n- 关键链长度: ${stats.criticalChainLength} 天\n- 项目缓冲: ${stats.projectBuffer} 天 (${bufferPercentage}%)\n- 项目总工期: ${stats.totalDuration} 天\n- 相比传统估算节省: ${stats.timeSaved} 天\n- 关键任务数: ${stats.criticalTasks}\n\n关键链任务: ${calculatedTasks.filter(t => t.isCritical).map(t => t.name).join(' -> ')}`.trim();
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `CCPM调度_${projectName}.txt`; a.click(); URL.revokeObjectURL(url); showToast('success', '报告已导出');
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white"><Link2 size={20} /></div>关键链法调度</h1>
            <p className="text-gray-500 mt-1">CCPM高级调度 - 资源约束与缓冲管理</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveSchedule} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Save size={18} />保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">关键链长度</p><p className="text-2xl font-bold text-gray-900">{stats.criticalChainLength}</p><p className="text-xs text-gray-400">天 (50%估算)</p></div>
          <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5"><p className="text-xs text-indigo-600 uppercase tracking-wider mb-1">项目缓冲</p><p className="text-2xl font-bold text-indigo-600">{stats.projectBuffer}</p><p className="text-xs text-indigo-400">天 ({bufferPercentage}%)</p></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">项目总工期</p><p className="text-2xl font-bold text-blue-600">{stats.totalDuration}</p><p className="text-xs text-gray-400">天</p></div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5"><p className="text-xs text-green-600 uppercase tracking-wider mb-1">节省工期</p><p className="text-2xl font-bold text-green-600">{stats.timeSaved}</p><p className="text-xs text-green-400">天</p></div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">关键任务</p><p className="text-2xl font-bold text-gray-900">{stats.criticalTasks}</p><p className="text-xs text-gray-400">个</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-2">缓冲比例: {bufferPercentage}%</label>
              <input type="range" min="20" max="100" value={bufferPercentage} onChange={(e) => setBufferPercentage(parseInt(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-500 mt-2">传统CCPM建议50%缓冲</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">任务列表</h3>
                <button onClick={addTask} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Plus size={18} /></button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-3 rounded-xl space-y-2 ${task.isCritical ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      {task.isCritical && <Zap size={12} className="text-indigo-500" />}
                      <input type="text" value={task.name} onChange={(e) => updateTask(task.id, 'name', e.target.value)} className="flex-1 px-2 py-1 text-sm font-medium border border-gray-200 rounded-lg" />
                      <button onClick={() => removeTask(task.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-500">50%估算</label><input type="number" value={task.duration} onChange={(e) => updateTask(task.id, 'duration', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                      <div><label className="text-xs text-gray-500">安全估算</label><input type="number" value={task.safeDuration} onChange={(e) => updateTask(task.id, 'safeDuration', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">资源</label>
                      <input type="text" value={task.resources.join(', ')} onChange={(e) => updateTask(task.id, 'resources', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">依赖任务</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tasks.filter(t => t.id !== task.id).map(t => (
                          <button key={t.id} onClick={() => toggleDependency(task.id, t.id)} className={`px-2 py-0.5 text-xs rounded ${task.dependencies.includes(t.id) ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{t.name.substring(0, 6)}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史调度</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedSchedules.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的调度</p> : savedSchedules.map((schedule) => (
                  <button key={schedule.id} onClick={() => loadSchedule(schedule)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === schedule.id ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{schedule.project_name}</p>
                    <p className="text-xs text-gray-500">缓冲: {schedule.project_buffer} 天</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">项目甘特图</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ganttData} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="duration" stackId="a">{ganttData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isCritical ? '#6366f1' : '#94a3b8'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded"></div><span className="text-sm text-gray-600">关键链任务</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-400 rounded"></div><span className="text-sm text-gray-600">非关键任务</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">关键链路径</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {calculatedTasks.filter(t => t.isCritical).sort((a, b) => a.earlyStart - b.earlyStart).map((task, index, arr) => (
                  <React.Fragment key={task.id}>
                    <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm">{task.name}<span className="ml-2 text-xs text-indigo-500">{task.duration}d</span></div>
                    {index < arr.length - 1 && <Link2 size={16} className="text-indigo-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={20} />缓冲管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><p className="text-indigo-100 mb-1">项目缓冲</p><p className="text-3xl font-bold">{stats.projectBuffer} 天</p><p className="text-sm text-indigo-200 mt-1">保护项目交付日期</p></div>
                <div><p className="text-indigo-100 mb-1">缓冲消耗监控</p><div className="h-3 bg-white/20 rounded-full overflow-hidden mt-2"><div className="h-full bg-white rounded-full" style={{ width: '0%' }}></div></div><p className="text-xs text-indigo-200 mt-1">项目未开始</p></div>
                <div><p className="text-indigo-100 mb-1">CCPM优势</p><ul className="text-sm text-indigo-100 space-y-1"><li>✓ 消除学生综合症</li><li>✓ 减少多任务切换</li><li>✓ 集中管理缓冲</li></ul></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCPMSchedule;
