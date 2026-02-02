
import React, { useState, useEffect, useMemo } from 'react';
import { Gauge, Plus, Trash2, Save, Download, TrendingUp, Calendar, Target, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';

interface Sprint { id: string; name: string; plannedPoints: number; completedPoints: number; startDate: string; endDate: string; }
interface VelocityTrackerProps { currentUser?: UserProfile | null; }

function calculateMovingAverage(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) result.push(null);
    else { const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0); result.push(Math.round(sum / period * 10) / 10); }
  }
  return result;
}

const VelocityTracker: React.FC<VelocityTrackerProps> = ({ currentUser }) => {
  const [teamName, setTeamName] = useState('敏捷开发团队');
  const [sprints, setSprints] = useState<Sprint[]>([
    { id: '1', name: 'Sprint 1', plannedPoints: 40, completedPoints: 35, startDate: '2024-01-01', endDate: '2024-01-14' },
    { id: '2', name: 'Sprint 2', plannedPoints: 40, completedPoints: 38, startDate: '2024-01-15', endDate: '2024-01-28' },
    { id: '3', name: 'Sprint 3', plannedPoints: 45, completedPoints: 42, startDate: '2024-01-29', endDate: '2024-02-11' },
    { id: '4', name: 'Sprint 4', plannedPoints: 45, completedPoints: 40, startDate: '2024-02-12', endDate: '2024-02-25' },
    { id: '5', name: 'Sprint 5', plannedPoints: 50, completedPoints: 48, startDate: '2024-02-26', endDate: '2024-03-10' },
    { id: '6', name: 'Sprint 6', plannedPoints: 50, completedPoints: 45, startDate: '2024-03-11', endDate: '2024-03-24' },
  ]);
  const [savedTrackers, setSavedTrackers] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stats = useMemo(() => {
    const velocities = sprints.map(s => s.completedPoints);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const completionRates = sprints.map(s => (s.completedPoints / s.plannedPoints) * 100);
    const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    const recentAvg = velocities.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, velocities.length);
    const earlyAvg = velocities.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, velocities.length);
    const trend = recentAvg > earlyAvg ? 'up' : recentAvg < earlyAvg ? 'down' : 'stable';
    return { averageVelocity: Math.round(avgVelocity * 10) / 10, averageCompletion: Math.round(avgCompletion * 10) / 10, totalCompleted: velocities.reduce((a, b) => a + b, 0), trend, trendPercent: earlyAvg > 0 ? Math.round((recentAvg - earlyAvg) / earlyAvg * 100) : 0 };
  }, [sprints]);

  const trendData = useMemo(() => {
    const velocities = sprints.map(s => s.completedPoints);
    const ma3 = calculateMovingAverage(velocities, 3);
    return sprints.map((sprint, index) => ({ sprintIndex: index + 1, sprintName: sprint.name, velocity: sprint.completedPoints, planned: sprint.plannedPoints, completionRate: Math.round(sprint.completedPoints / sprint.plannedPoints * 100), ma3: ma3[index] }));
  }, [sprints]);

  const burndownData = useMemo(() => {
    let remaining = sprints.reduce((sum, s) => sum + s.plannedPoints, 0);
    return sprints.map((sprint, index) => { remaining -= sprint.completedPoints; return { sprint: sprint.name, completed: sprint.completedPoints, remaining: Math.max(0, remaining), ideal: Math.max(0, sprints.reduce((sum, s) => sum + s.plannedPoints, 0) - (sprints.reduce((sum, s) => sum + s.plannedPoints, 0) / sprints.length) * (index + 1)) }; });
  }, [sprints]);

  useEffect(() => { loadSavedTrackers(); }, []);
  const loadSavedTrackers = async () => { const { data } = await supabase.from('lab_velocity_trackers').select('*').order('created_at', { ascending: false }).limit(10); if (data) setSavedTrackers(data); };
  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };
  const addSprint = () => { const lastSprint = sprints[sprints.length - 1]; setSprints([...sprints, { id: Date.now().toString(), name: `Sprint ${sprints.length + 1}`, plannedPoints: lastSprint?.plannedPoints || 40, completedPoints: 0, startDate: '', endDate: '' }]); };
  const removeSprint = (id: string) => { if (sprints.length <= 2) { showToast('error', '至少保留两个Sprint'); return; } setSprints(sprints.filter(s => s.id !== id)); };
  const updateSprint = (id: string, field: keyof Sprint, value: string | number) => { setSprints(sprints.map(s => s.id === id ? { ...s, [field]: value } : s)); };

  const saveTracker = async () => {
    setIsSaving(true);
    const payload = { user_id: currentUser?.id || null, team_name: teamName, sprints, average_velocity: stats.averageVelocity, trend: trendData };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_velocity_trackers').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_velocity_trackers').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    setIsSaving(false);
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedTrackers(); }
  };

  const loadTracker = (tracker: any) => { setCurrentId(tracker.id); setTeamName(tracker.team_name); setSprints(tracker.sprints); };
  const exportData = () => {
    const content = `迭代速率跟踪报告\n================\n团队名称: ${teamName}\n\n核心指标:\n- 平均速率: ${stats.averageVelocity} 故事点/迭代\n- 平均完成率: ${stats.averageCompletion}%\n- 总完成点数: ${stats.totalCompleted}\n- 趋势: ${stats.trend === 'up' ? '上升' : stats.trend === 'down' ? '下降' : '稳定'} (${stats.trendPercent}%)\n\nSprint明细:\nSprint 计划点数 完成点数 完成率\n${sprints.map(s => `${s.name} ${s.plannedPoints} ${s.completedPoints} ${Math.round(s.completedPoints / s.plannedPoints * 100)}%`).join('\n')}`.trim();
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `迭代速率_${teamName}.txt`; a.click(); URL.revokeObjectURL(url); showToast('success', '报告已导出');
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white"><Gauge size={20} /></div>迭代速率跟踪</h1>
            <p className="text-gray-500 mt-1">燃尽图、速率趋势与移动平均线分析</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveTracker} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Gauge size={16} /><span className="text-xs uppercase tracking-wider">平均速率</span></div>
            <p className="text-2xl font-bold text-gray-900">{stats.averageVelocity}</p>
            <p className="text-xs text-gray-400">故事点/迭代</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Target size={16} /><span className="text-xs uppercase tracking-wider">平均完成率</span></div>
            <p className="text-2xl font-bold text-amber-600">{stats.averageCompletion}%</p>
            <p className="text-xs text-gray-400">计划达成率</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar size={16} /><span className="text-xs uppercase tracking-wider">总完成</span></div>
            <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
            <p className="text-xs text-gray-400">故事点</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><TrendingUp size={16} /><span className="text-xs uppercase tracking-wider">趋势</span></div>
            <p className={`text-2xl font-bold ${stats.trend === 'up' ? 'text-green-600' : stats.trend === 'down' ? 'text-red-500' : 'text-gray-600'}`}>{stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→'} {Math.abs(stats.trendPercent)}%</p>
            <p className="text-xs text-gray-400">{stats.trend === 'up' ? '持续改进' : stats.trend === 'down' ? '需要关注' : '保持稳定'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">团队名称</label>
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Sprint 数据</h3>
                <button onClick={addSprint} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Plus size={18} /></button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sprints.map((sprint) => (
                  <div key={sprint.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="text" value={sprint.name} onChange={(e) => updateSprint(sprint.id, 'name', e.target.value)} className="flex-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg" />
                      <button onClick={() => removeSprint(sprint.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-500">计划</label><input type="number" value={sprint.plannedPoints} onChange={(e) => updateSprint(sprint.id, 'plannedPoints', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                      <div><label className="text-xs text-gray-500">完成</label><input type="number" value={sprint.completedPoints} onChange={(e) => updateSprint(sprint.id, 'completedPoints', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${sprint.completedPoints >= sprint.plannedPoints ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (sprint.completedPoints / sprint.plannedPoints) * 100)}%` }} /></div>
                      <span className="text-xs text-gray-500">{Math.round(sprint.completedPoints / sprint.plannedPoints * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史记录</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTrackers.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的记录</p> : savedTrackers.map((tracker) => (
                  <button key={tracker.id} onClick={() => loadTracker(tracker)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === tracker.id ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{tracker.team_name}</p>
                    <p className="text-xs text-gray-500">平均: {tracker.average_velocity} 点/迭代</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">速率趋势与移动平均线</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="sprintName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="velocity" fill="#f59e0b" name="实际速率" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeDasharray="5 5" name="计划" />
                    <Line type="monotone" dataKey="ma3" stroke="#10b981" strokeWidth={2} name="3-Sprint MA" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">累积燃尽图</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="remaining" stroke="#ef4444" fill="#fecaca" name="剩余工作量" />
                    <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="理想燃尽" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Target size={20} />下阶段建议</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-amber-100 mb-2">推荐计划容量</p>
                  <p className="text-3xl font-bold">{Math.round(sprints.slice(-3).reduce((s, sp) => s + sp.completedPoints, 0) / 3)} <span className="text-lg ml-1">故事点</span></p>
                  <p className="text-sm text-amber-100 mt-1">基于最近3个Sprint平均速率</p>
                </div>
                <div>
                  <p className="text-amber-100 mb-2">团队能力评估</p>
                  <ul className="space-y-1 text-amber-100 text-sm">
                    <li>速率稳定性: {stats.trend === 'stable' ? '高' : '中'}</li>
                    <li>计划准确性: {stats.averageCompletion >= 90 ? '优秀' : stats.averageCompletion >= 80 ? '良好' : '需改进'}</li>
                    <li>交付能力: {stats.averageVelocity >= 40 ? '强' : stats.averageVelocity >= 25 ? '中' : '弱'}</li>
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

export default VelocityTracker;
