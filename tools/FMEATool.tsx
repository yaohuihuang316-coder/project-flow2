
import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Plus, Trash2, Save, Download, AlertTriangle, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FailureMode { id: string; processStep: string; failureMode: string; effects: string; severity: number; occurrence: number; detection: number; rpn: number; actions: string; }
interface FMEAToolProps { currentUser?: UserProfile | null; }

function calculateRPN(severity: number, occurrence: number, detection: number): number { return severity * occurrence * detection; }
function getRiskLevel(rpn: number): { level: string; color: string } {
  if (rpn >= 200) return { level: '高风险', color: '#ef4444' };
  if (rpn >= 100) return { level: '中风险', color: '#f59e0b' };
  return { level: '低风险', color: '#10b981' };
}

const severityDescriptions: Record<number, string> = { 1: '无影响', 2: '轻微', 3: '低', 4: '中等偏低', 5: '中等', 6: '中等偏高', 7: '高', 8: '很高', 9: '严重', 10: '极其严重' };
const occurrenceDescriptions: Record<number, string> = { 1: '极低', 2: '很低', 3: '低', 4: '中等偏低', 5: '中等', 6: '中等偏高', 7: '高', 8: '很高', 9: '极高', 10: '几乎确定' };
const detectionDescriptions: Record<number, string> = { 1: '几乎确定', 2: '很高', 3: '高', 4: '中等偏高', 5: '中等', 6: '中等偏低', 7: '低', 8: '很低', 9: '极低', 10: '无法检测' };

const FMEATool: React.FC<FMEAToolProps> = ({ currentUser }) => {
  const [analysisName, setAnalysisName] = useState('新产品开发FMEA');
  const [failureModes, setFailureModes] = useState<FailureMode[]>([
    { id: '1', processStep: '需求分析', failureMode: '需求遗漏', effects: '功能缺失，客户不满', severity: 8, occurrence: 5, detection: 4, rpn: 160, actions: '引入需求评审检查单' },
    { id: '2', processStep: '系统设计', failureMode: '架构缺陷', effects: '性能瓶颈，扩展困难', severity: 9, occurrence: 3, detection: 3, rpn: 81, actions: '架构评审 + 原型验证' },
    { id: '3', processStep: '编码实现', failureMode: '代码缺陷', effects: '系统故障，数据丢失', severity: 7, occurrence: 6, detection: 5, rpn: 210, actions: '强化代码评审，提升自动化测试覆盖率' },
    { id: '4', processStep: '测试验收', failureMode: '测试遗漏', effects: '缺陷流入生产环境', severity: 8, occurrence: 4, detection: 6, rpn: 192, actions: '完善测试用例，引入探索性测试' },
  ]);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stats = useMemo(() => {
    const highRisk = failureModes.filter(f => f.rpn >= 200).length;
    const mediumRisk = failureModes.filter(f => f.rpn >= 100 && f.rpn < 200).length;
    const lowRisk = failureModes.filter(f => f.rpn < 100).length;
    const avgRPN = failureModes.reduce((s, f) => s + f.rpn, 0) / failureModes.length;
    return { highRisk, mediumRisk, lowRisk, avgRPN: Math.round(avgRPN) };
  }, [failureModes]);

  const filteredModes = useMemo(() => {
    if (filterLevel === 'all') return failureModes;
    if (filterLevel === 'high') return failureModes.filter(f => f.rpn >= 200);
    if (filterLevel === 'medium') return failureModes.filter(f => f.rpn >= 100 && f.rpn < 200);
    return failureModes.filter(f => f.rpn < 100);
  }, [failureModes, filterLevel]);

  const chartData = useMemo(() => failureModes.sort((a, b) => b.rpn - a.rpn).slice(0, 10).map(f => ({ name: f.processStep.substring(0, 8), rpn: f.rpn, color: f.rpn >= 200 ? '#ef4444' : f.rpn >= 100 ? '#f59e0b' : '#10b981' })), [failureModes]);

  useEffect(() => { loadSavedAnalyses(); }, []);
  const loadSavedAnalyses = async () => { const { data } = await supabase.from('lab_fmea_analyses').select('*').order('created_at', { ascending: false }).limit(10); if (data) setSavedAnalyses(data); };
  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const addFailureMode = () => {
    const newMode: FailureMode = { id: Date.now().toString(), processStep: '新步骤', failureMode: '故障模式', effects: '影响描述', severity: 5, occurrence: 5, detection: 5, rpn: 125, actions: '' };
    setFailureModes([...failureModes, newMode]);
  };

  const removeFailureMode = (id: string) => { setFailureModes(failureModes.filter(f => f.id !== id)); };

  const updateFailureMode = (id: string, field: keyof FailureMode, value: string | number) => {
    setFailureModes(failureModes.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [field]: value };
      if (field === 'severity' || field === 'occurrence' || field === 'detection') updated.rpn = calculateRPN(updated.severity, updated.occurrence, updated.detection);
      return updated;
    }));
  };

  const saveAnalysis = async () => {
    const payload = { user_id: currentUser?.id || null, analysis_name: analysisName, failure_modes: failureModes, high_risk_items: stats.highRisk };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_fmea_analyses').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_fmea_analyses').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedAnalyses(); }
  };

  const loadAnalysis = (analysis: any) => { setCurrentId(analysis.id); setAnalysisName(analysis.analysis_name); setFailureModes(analysis.failure_modes); };
  const exportData = () => {
    const content = `FMEA分析报告\n============\n分析名称: ${analysisName}\n\n统计概览:\n- 高风险项 (RPN>=200): ${stats.highRisk}\n- 中风险项 (100<=RPN<200): ${stats.mediumRisk}\n- 低风险项 (RPN<100): ${stats.lowRisk}\n- 平均RPN: ${stats.avgRPN}\n\nRPN计算公式: RPN = 严重度(S) x 发生率(O) x 检出率(D)`.trim();
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `FMEA分析_${analysisName}.txt`; a.click(); URL.revokeObjectURL(url); showToast('success', '报告已导出');
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white"><ShieldAlert size={20} /></div>FMEA 风险分析</h1>
            <p className="text-gray-500 mt-1">故障模式与影响分析 - RPN风险优先级排序</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveAnalysis} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Save size={18} />保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
            <div className="flex items-center gap-2 text-red-600 mb-1"><AlertTriangle size={16} /><span className="text-xs uppercase tracking-wider font-medium">高风险</span></div>
            <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
            <p className="text-xs text-red-400">RPN {'>='} 200</p>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 text-amber-600 mb-1"><AlertCircle size={16} /><span className="text-xs uppercase tracking-wider font-medium">中风险</span></div>
            <p className="text-3xl font-bold text-amber-600">{stats.mediumRisk}</p>
            <p className="text-xs text-amber-400">100 {'<='} RPN {'<'} 200</p>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <div className="flex items-center gap-2 text-green-600 mb-1"><CheckCircle2 size={16} /><span className="text-xs uppercase tracking-wider font-medium">低风险</span></div>
            <p className="text-3xl font-bold text-green-600">{stats.lowRisk}</p>
            <p className="text-xs text-green-400">RPN {'<'} 100</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Filter size={16} /><span className="text-xs uppercase tracking-wider">平均RPN</span></div>
            <p className="text-3xl font-bold text-gray-900">{stats.avgRPN}</p>
            <p className="text-xs text-gray-400">所有项目平均</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">分析名称</label>
                  <input type="text" value={analysisName} onChange={(e) => setAnalysisName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">风险筛选</label>
                  <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as any)} className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="all">全部</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option>
                  </select>
                </div>
                <div className="self-end">
                  <button onClick={addFailureMode} className="px-4 py-2 bg-red-500 text-white rounded-xl flex items-center gap-2 hover:bg-red-600 transition-colors"><Plus size={18} />添加项目</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">过程步骤</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">故障模式</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">影响</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-16">S</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-16">O</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-16">D</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-20">RPN</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">改进措施</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredModes.map((mode) => {
                      const risk = getRiskLevel(mode.rpn);
                      return (
                        <tr key={mode.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="text" value={mode.processStep} onChange={(e) => updateFailureMode(mode.id, 'processStep', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" /></td>
                          <td className="px-4 py-3"><input type="text" value={mode.failureMode} onChange={(e) => updateFailureMode(mode.id, 'failureMode', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" /></td>
                          <td className="px-4 py-3"><input type="text" value={mode.effects} onChange={(e) => updateFailureMode(mode.id, 'effects', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" /></td>
                          <td className="px-4 py-3"><select value={mode.severity} onChange={(e) => updateFailureMode(mode.id, 'severity', parseInt(e.target.value))} className="w-14 px-1 py-1 text-sm border border-gray-200 rounded text-center" title={severityDescriptions[mode.severity]}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></td>
                          <td className="px-4 py-3"><select value={mode.occurrence} onChange={(e) => updateFailureMode(mode.id, 'occurrence', parseInt(e.target.value))} className="w-14 px-1 py-1 text-sm border border-gray-200 rounded text-center" title={occurrenceDescriptions[mode.occurrence]}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></td>
                          <td className="px-4 py-3"><select value={mode.detection} onChange={(e) => updateFailureMode(mode.id, 'detection', parseInt(e.target.value))} className="w-14 px-1 py-1 text-sm border border-gray-200 rounded text-center" title={detectionDescriptions[mode.detection]}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></td>
                          <td className="px-4 py-3 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: risk.color + '20', color: risk.color }}>{mode.rpn}</span></td>
                          <td className="px-4 py-3"><input type="text" value={mode.actions} onChange={(e) => updateFailureMode(mode.id, 'actions', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" placeholder="改进措施..." /></td>
                          <td className="px-4 py-3 text-center"><button onClick={() => removeFailureMode(mode.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">RPN 分布</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="rpn" radius={[0, 4, 4, 0]}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">评分标准</h3>
              <div className="space-y-4 text-sm">
                <div><p className="font-medium text-gray-700 mb-1">严重度 (S)</p><p className="text-xs text-gray-500">1=无影响, 10=极其严重</p></div>
                <div><p className="font-medium text-gray-700 mb-1">发生率 (O)</p><p className="text-xs text-gray-500">1=极低, 10=几乎确定</p></div>
                <div><p className="font-medium text-gray-700 mb-1">检出率 (D)</p><p className="text-xs text-gray-500">1=几乎确定, 10=无法检测</p></div>
                <div className="pt-2 border-t border-gray-100"><p className="font-medium text-gray-700">RPN = S x O x D</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史分析</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedAnalyses.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的分析</p> : savedAnalyses.map((analysis) => (
                  <button key={analysis.id} onClick={() => loadAnalysis(analysis)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === analysis.id ? 'bg-red-50 border-red-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{analysis.analysis_name}</p>
                    <p className="text-xs text-gray-500">高风险: {analysis.high_risk_items} 项</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={18} />优先改进项</h3>
              <div className="space-y-2">
                {failureModes.filter(f => f.rpn >= 200).slice(0, 3).map((f, i) => (
                  <div key={f.id} className="bg-white/10 rounded-lg p-2 text-sm"><span className="font-medium">{i + 1}. {f.processStep}</span><p className="text-white/80 text-xs mt-1">RPN: {f.rpn}</p></div>
                ))}
                {failureModes.filter(f => f.rpn >= 200).length === 0 && <p className="text-white/80 text-sm">暂无高风险项，继续保持！</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FMEATool;
