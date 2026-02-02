
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Save, Download, TrendingUp, Shield, Search, Bug, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface QualityCostProps { currentUser?: UserProfile | null; }
const COLORS = { prevention: '#10b981', appraisal: '#3b82f6', internal: '#f59e0b', external: '#ef4444' };

const QualityCostTool: React.FC<QualityCostProps> = ({ currentUser }) => {
  const [modelName, setModelName] = useState('2024年度质量成本');
  const [preventionCost, setPreventionCost] = useState(50000);
  const [appraisalCost, setAppraisalCost] = useState(80000);
  const [internalFailure, setInternalFailure] = useState(120000);
  const [externalFailure, setExternalFailure] = useState(60000);
  const [totalSales, setTotalSales] = useState(5000000);
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const stats = useMemo(() => {
    const totalCOQ = preventionCost + appraisalCost + internalFailure + externalFailure;
    const coqPercentage = (totalCOQ / totalSales) * 100;
    const conformanceCost = preventionCost + appraisalCost;
    const nonConformanceCost = internalFailure + externalFailure;
    const conformanceRatio = totalCOQ > 0 ? (conformanceCost / totalCOQ) * 100 : 0;
    return { totalCOQ, coqPercentage: Math.round(coqPercentage * 100) / 100, conformanceCost, nonConformanceCost, conformanceRatio: Math.round(conformanceRatio * 10) / 10, isOptimal: (preventionCost/totalCOQ)*100 >= 10 && conformanceRatio >= 35 && coqPercentage <= 15 };
  }, [preventionCost, appraisalCost, internalFailure, externalFailure, totalSales]);

  const pieData = useMemo(() => [
    { name: '预防成本', value: preventionCost, color: COLORS.prevention, icon: Shield },
    { name: '评估成本', value: appraisalCost, color: COLORS.appraisal, icon: Search },
    { name: '内部失败', value: internalFailure, color: COLORS.internal, icon: Bug },
    { name: '外部失败', value: externalFailure, color: COLORS.external, icon: Users }
  ], [preventionCost, appraisalCost, internalFailure, externalFailure]);

  const benchmarkData = [
    { name: '您的企业', prevention: Math.round((preventionCost/stats.totalCOQ)*100), appraisal: Math.round((appraisalCost/stats.totalCOQ)*100) },
    { name: '行业优秀', prevention: 15, appraisal: 30 },
    { name: '行业平均', prevention: 8, appraisal: 22 }
  ];

  useEffect(() => { loadSavedModels(); }, []);
  const loadSavedModels = async () => { const { data } = await supabase.from('lab_quality_cost_models').select('*').order('created_at', { ascending: false }).limit(10); if (data) setSavedModels(data); };
  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const saveModel = async () => {
    const payload = { user_id: currentUser?.id || null, model_name: modelName, prevention_cost: preventionCost, appraisal_cost: appraisalCost, internal_failure_cost: internalFailure, external_failure_cost: externalFailure, total_sales: totalSales, coq_percentage: stats.coqPercentage, breakdown: { prevention: preventionCost, appraisal: appraisalCost, internal: internalFailure, external: externalFailure } };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_quality_cost_models').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_quality_cost_models').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedModels(); }
  };

  const loadModel = (model: any) => { setCurrentId(model.id); setModelName(model.model_name); setPreventionCost(model.prevention_cost); setAppraisalCost(model.appraisal_cost); setInternalFailure(model.internal_failure_cost); setExternalFailure(model.external_failure_cost); setTotalSales(model.total_sales); };
  const exportData = () => {
    const content = `质量成本(COQ)分析报告\n====================\n模型名称: ${modelName}\n\n成本明细:\n- 预防成本: ¥${preventionCost.toLocaleString()}\n- 评估成本: ¥${appraisalCost.toLocaleString()}\n- 内部失败成本: ¥${internalFailure.toLocaleString()}\n- 外部失败成本: ¥${externalFailure.toLocaleString()}\n- 总质量成本: ¥${stats.totalCOQ.toLocaleString()}\n- 总销售额: ¥${totalSales.toLocaleString()}\n\n关键指标:\n- COQ占比: ${stats.coqPercentage}%\n- 符合性成本: ¥${stats.conformanceCost.toLocaleString()} (${stats.conformanceRatio}%)\n- 非符合性成本: ¥${stats.nonConformanceCost.toLocaleString()} (${100 - stats.conformanceRatio}%)`.trim();
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `质量成本_${modelName}.txt`; a.click(); URL.revokeObjectURL(url); showToast('success', '报告已导出');
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white"><DollarSign size={20} /></div>质量成本模型</h1>
            <p className="text-gray-500 mt-1">COQ分析 - 预防、评估与失败成本优化</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveModel} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Save size={18} />保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className={`rounded-2xl p-6 mb-6 shadow-lg ${stats.isOptimal ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">质量成本占比 (COQ)</p>
              <p className="text-5xl font-bold text-white">{stats.coqPercentage}%</p>
              <p className="text-white/80 text-sm mt-2">{stats.coqPercentage <= 5 ? '优秀水平' : stats.coqPercentage <= 10 ? '良好水平' : stats.coqPercentage <= 15 ? '一般水平' : '需要改进'}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">总质量成本</p>
              <p className="text-3xl font-bold text-white">¥{stats.totalCOQ.toLocaleString()}</p>
              <p className="text-white/80 text-sm mt-2">占销售额 {stats.coqPercentage}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
              <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-2">年度销售额</label>
              <input type="number" value={totalSales} onChange={(e) => setTotalSales(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">成本输入</h3>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-green-500" /><label className="text-sm font-medium text-gray-700">预防成本</label></div>
                <input type="number" value={preventionCost} onChange={(e) => setPreventionCost(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">培训、流程改进、预防性维护</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><Search size={16} className="text-blue-500" /><label className="text-sm font-medium text-gray-700">评估成本</label></div>
                <input type="number" value={appraisalCost} onChange={(e) => setAppraisalCost(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">检验、测试、审计、评审</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><Bug size={16} className="text-amber-500" /><label className="text-sm font-medium text-gray-700">内部失败成本</label></div>
                <input type="number" value={internalFailure} onChange={(e) => setInternalFailure(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">返工、报废、停工损失</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-red-500" /><label className="text-sm font-medium text-gray-700">外部失败成本</label></div>
                <input type="number" value={externalFailure} onChange={(e) => setExternalFailure(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">退货、索赔、声誉损失</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史模型</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedModels.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的模型</p> : savedModels.map((model) => (
                  <button key={model.id} onClick={() => loadModel(model)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === model.id ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{model.model_name}</p>
                    <p className="text-xs text-gray-500">COQ: {model.coq_percentage}%</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                <div className="flex items-center gap-2 text-green-600 mb-2"><Shield size={16} /><span className="text-xs uppercase tracking-wider font-medium">符合性成本</span></div>
                <p className="text-2xl font-bold text-green-700">¥{stats.conformanceCost.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">{stats.conformanceRatio}% 占总质量成本</p>
              </div>
              <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
                <div className="flex items-center gap-2 text-red-600 mb-2"><AlertCircle size={16} /><span className="text-xs uppercase tracking-wider font-medium">非符合性成本</span></div>
                <p className="text-2xl font-bold text-red-700">¥{stats.nonConformanceCost.toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1">{100 - stats.conformanceRatio}% 占总质量成本</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">质量成本分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">行业对比 - 预防与评估投入占比</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benchmarkData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 50]} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="prevention" name="预防占比 %" fill={COLORS.prevention} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="appraisal" name="评估占比 %" fill={COLORS.appraisal} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={20} />优化建议</h3>
              <div className="space-y-2 text-pink-100">
                {(preventionCost/stats.totalCOQ)*100 < 10 && <p>• 建议增加预防投入至10%以上，前期投入可降低后期失败成本</p>}
                {(appraisalCost/stats.totalCOQ)*100 < 20 && <p>• 评估成本偏低，可能导致缺陷流入后续环节</p>}
                {stats.nonConformanceCost > stats.conformanceCost && <p>• 非符合性成本过高，建议加强预防和评估</p>}
                {stats.coqPercentage > 15 && <p>• COQ占比过高，建议系统性地实施质量改进计划</p>}
                {stats.isOptimal && <p>✓ 质量成本结构良好，继续保持当前策略</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityCostTool;
