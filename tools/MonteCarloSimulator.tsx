
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, Plus, Trash2, Play, Save, Download, 
  TrendingUp, AlertCircle, Loader2, BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

interface TaskInput {
  id: string;
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

interface SimulationResult {
  p10: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  histogram: { bin: string; count: number }[];
}

interface MonteCarloProps {
  currentUser?: UserProfile | null;
}

// PERT分布采样 - Box-Muller变换生成正态分布
function pertSample(o: number, m: number, p: number): number {
  const mean = (o + 4 * m + p) / 6;
  const stddev = (p - o) / 6;
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + z * stddev);
}

// 运行蒙特卡洛模拟
function runSimulation(tasks: TaskInput[], iterations = 10000): number[] {
  const results: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const totalDuration = tasks.reduce((sum, task) => {
      return sum + pertSample(task.optimistic, task.mostLikely, task.pessimistic);
    }, 0);
    results.push(totalDuration);
  }
  return results.sort((a, b) => a - b);
}

// 计算置信区间和直方图数据
function analyzeResults(results: number[]): SimulationResult {
  const p10 = results[Math.floor(results.length * 0.1)];
  const p50 = results[Math.floor(results.length * 0.5)];
  const p75 = results[Math.floor(results.length * 0.75)];
  const p90 = results[Math.floor(results.length * 0.9)];
  const mean = results.reduce((a, b) => a + b, 0) / results.length;

  // 生成直方图数据
  const min = results[0];
  const max = results[results.length - 1];
  const binCount = 20;
  const binWidth = (max - min) / binCount;
  const histogram: { bin: string; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = results.filter(r => r >= binStart && r < binEnd).length;
    histogram.push({
      bin: `${Math.round(binStart)}-${Math.round(binEnd)}`,
      count
    });
  }

  return { p10, p50, p75, p90, mean, histogram };
}

const MonteCarloSimulator: React.FC<MonteCarloProps> = ({ currentUser }) => {
  const [projectName, setProjectName] = useState('新项目估算');
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: '1', name: '需求分析', optimistic: 3, mostLikely: 5, pessimistic: 8 },
    { id: '2', name: '系统设计', optimistic: 5, mostLikely: 8, pessimistic: 12 },
    { id: '3', name: '开发实现', optimistic: 15, mostLikely: 20, pessimistic: 30 },
    { id: '4', name: '测试验收', optimistic: 5, mostLikely: 8, pessimistic: 15 },
  ]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 加载已保存的模拟
  useEffect(() => {
    loadSavedSimulations();
  }, [currentUser]);

  const loadSavedSimulations = async () => {
    const { data } = await supabase
      .from('lab_monte_carlo_simulations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSavedSimulations(data);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const addTask = () => {
    const newTask: TaskInput = {
      id: Date.now().toString(),
      name: '新任务',
      optimistic: 1,
      mostLikely: 3,
      pessimistic: 5
    };
    setTasks([...tasks, newTask]);
  };

  const removeTask = (id: string) => {
    if (tasks.length <= 1) {
      showToast('error', '至少保留一个任务');
      return;
    }
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: keyof TaskInput, value: string | number) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const runMonteCarlo = useCallback(() => {
    setIsSimulating(true);
    
    // 使用setTimeout让UI有机会更新loading状态
    setTimeout(() => {
      const results = runSimulation(tasks, 10000);
      const analysis = analyzeResults(results);
      setResult(analysis);
      setIsSimulating(false);
    }, 100);
  }, [tasks]);

  const saveSimulation = async () => {
    if (!result) {
      showToast('error', '请先运行模拟');
      return;
    }

    setIsSaving(true);
    const payload = {
      user_id: currentUser?.id || null,
      project_name: projectName,
      tasks,
      simulation_results: result,
      iterations: 10000
    };

    let error;
    if (currentId) {
      const { error: updateError } = await supabase
        .from('lab_monte_carlo_simulations')
        .update(payload)
        .eq('id', currentId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('lab_monte_carlo_simulations')
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
      loadSavedSimulations();
    }
  };

  const loadSimulation = (sim: any) => {
    setCurrentId(sim.id);
    setProjectName(sim.project_name);
    setTasks(sim.tasks);
    setResult(sim.simulation_results);
  };

  const exportToPDF = () => {
    const content = `
蒙特卡洛模拟报告
================
项目名称: ${projectName}
模拟次数: 10,000次

任务列表:
${tasks.map(t => `- ${t.name}: 乐观${t.optimistic}天 / 最可能${t.mostLikely}天 / 悲观${t.pessimistic}天`).join('\n')}

模拟结果:
- P50 (中位数): ${result ? Math.round(result.p50) : '-'} 天
- P75 (75%概率): ${result ? Math.round(result.p75) : '-'} 天  
- P90 (90%概率): ${result ? Math.round(result.p90) : '-'} 天
- 平均值: ${result ? Math.round(result.mean) : '-'} 天

结论: 项目有90%的概率在${result ? Math.round(result.p90) : '-'}天内完成。
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `蒙特卡洛模拟_${projectName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', '报告已导出');
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <TrendingUp size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Calculator size={20} />
              </div>
              蒙特卡洛模拟器
            </h1>
            <p className="text-gray-500 mt-1">基于PERT分布的风险量化分析工具</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveSimulation}
              disabled={isSaving || !result}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              保存
            </button>
            <button
              onClick={exportToPDF}
              disabled={!result}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              导出
            </button>
            <button
              onClick={runMonteCarlo}
              disabled={isSimulating}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {isSimulating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              {isSimulating ? '模拟中...' : '运行模拟'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Task Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Name */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">任务列表</h3>
                <button
                  onClick={addTask}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="任务名称"
                      />
                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">乐观</label>
                        <input
                          type="number"
                          min="0"
                          value={task.optimistic}
                          onChange={(e) => updateTask(task.id, 'optimistic', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">最可能</label>
                        <input
                          type="number"
                          min="0"
                          value={task.mostLikely}
                          onChange={(e) => updateTask(task.id, 'mostLikely', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">悲观</label>
                        <input
                          type="number"
                          min="0"
                          value={task.pessimistic}
                          onChange={(e) => updateTask(task.id, 'pessimistic', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Simulations */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史记录</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedSimulations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">暂无保存的模拟</p>
                ) : (
                  savedSimulations.map((sim) => (
                    <button
                      key={sim.id}
                      onClick={() => loadSimulation(sim)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        currentId === sim.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">{sim.project_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sim.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Result Cards */}
            {result && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">P50 (中位数)</p>
                  <p className="text-2xl font-bold text-blue-600">{Math.round(result.p50)}天</p>
                  <p className="text-xs text-gray-400 mt-1">50%概率完成</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">P75</p>
                  <p className="text-2xl font-bold text-indigo-600">{Math.round(result.p75)}天</p>
                  <p className="text-xs text-gray-400 mt-1">75%概率完成</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">P90</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(result.p90)}天</p>
                  <p className="text-xs text-gray-400 mt-1">90%概率完成</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">平均值</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(result.mean)}天</p>
                  <p className="text-xs text-gray-400 mt-1">期望工期</p>
                </div>
              </div>
            )}

            {/* Distribution Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                工期概率分布
              </h3>
              {result ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="bin" 
                        tick={{ fontSize: 10 }}
                        interval={2}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value} 次`, '频率']}
                      />
                      <ReferenceLine x={`${Math.round(result.p50)}-${Math.round(result.p50) + 1}`} stroke="#3B82F6" strokeDasharray="3 3" />
                      <ReferenceLine x={`${Math.round(result.p90)}-${Math.round(result.p90) + 1}`} stroke="#8B5CF6" strokeDasharray="3 3" />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                    <p>点击"运行模拟"查看概率分布</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {result && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp size={20} />
                  分析结论
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  基于 {tasks.length} 个任务的 {tasks.reduce((sum, t) => sum + t.mostLikely, 0)} 天最可能工期估算，
                  经过 10,000 次蒙特卡洛模拟：
                </p>
                <ul className="mt-4 space-y-2 text-blue-100">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    项目有 <span className="font-bold text-white">50%</span> 的概率在 <span className="font-bold text-white">{Math.round(result.p50)}天</span> 内完成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    项目有 <span className="font-bold text-white">90%</span> 的概率在 <span className="font-bold text-white">{Math.round(result.p90)}天</span> 内完成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    建议预留 <span className="font-bold text-white">{Math.round(result.p90 - result.p50)}天</span> 缓冲时间以应对不确定性
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloSimulator;
