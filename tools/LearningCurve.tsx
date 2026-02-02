
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, Save, Download, Calculator, AlertCircle, CheckCircle2, Loader2, History } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface LearningCurveData {
  unit: number;
  time: number;
  cumulative: number;
}

interface LearningCurveProps {
  currentUser?: UserProfile | null;
}

function calculateLearningCurve(firstUnitTime: number, learningRate: number, totalUnits: number): LearningCurveData[] {
  const data: LearningCurveData[] = [];
  let cumulativeTime = 0;
  
  for (let n = 1; n <= totalUnits; n++) {
    const time = firstUnitTime * Math.pow(n, -Math.log2(learningRate));
    cumulativeTime += time;
    data.push({
      unit: n,
      time: Math.round(time * 100) / 100,
      cumulative: Math.round(cumulativeTime * 100) / 100
    });
  }
  return data;
}

function getLearningRateDescription(rate: number): string {
  if (rate >= 0.95) return '无明显学习效应';
  if (rate >= 0.85) return '标准学习曲线 (85%-95%)';
  if (rate >= 0.75) return '积极学习曲线 (75%-85%)';
  return '高效学习曲线 (<75%)';
}

const LearningCurve: React.FC<LearningCurveProps> = ({ currentUser }) => {
  const [modelName, setModelName] = useState('新产品生产学习曲线');
  const [firstUnitTime, setFirstUnitTime] = useState(100);
  const [learningRate, setLearningRate] = useState(0.8);
  const [totalUnits, setTotalUnits] = useState(100);
  const [savedModels, setSavedModels] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const curveData = useMemo(() => calculateLearningCurve(firstUnitTime, learningRate, totalUnits), [firstUnitTime, learningRate, totalUnits]);

  const stats = useMemo(() => {
    const first10 = curveData.slice(0, 10);
    const last10 = curveData.slice(-10);
    const avgFirst10 = first10.reduce((sum, d) => sum + d.time, 0) / first10.length;
    const avgLast10 = last10.reduce((sum, d) => sum + d.time, 0) / last10.length;
    const improvement = ((avgFirst10 - avgLast10) / avgFirst10 * 100);
    
    return {
      firstUnit: curveData[0]?.time || 0,
      tenthUnit: curveData[9]?.time || 0,
      hundredthUnit: curveData[99]?.time || curveData[curveData.length - 1]?.time || 0,
      totalTime: curveData[curveData.length - 1]?.cumulative || 0,
      improvement: Math.round(improvement * 10) / 10,
      avgTime: curveData.reduce((sum, d) => sum + d.time, 0) / curveData.length
    };
  }, [curveData]);

  useEffect(() => { loadSavedModels(); }, []);

  const loadSavedModels = async () => {
    const { data } = await supabase.from('lab_learning_curve_models').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setSavedModels(data);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const saveModel = async () => {
    setIsSaving(true);
    const payload = {
      user_id: currentUser?.id || null,
      model_name: modelName,
      first_unit_time: firstUnitTime,
      learning_rate: learningRate,
      total_units: totalUnits,
      predictions: curveData
    };

    let error;
    if (currentId) {
      const { error: updateError } = await supabase.from('lab_learning_curve_models').update(payload).eq('id', currentId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase.from('lab_learning_curve_models').insert(payload).select().single();
      error = insertError;
      if (data) setCurrentId(data.id);
    }

    setIsSaving(false);
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedModels(); }
  };

  const loadModel = (model: any) => {
    setCurrentId(model.id);
    setModelName(model.model_name);
    setFirstUnitTime(model.first_unit_time);
    setLearningRate(model.learning_rate);
    setTotalUnits(model.total_units);
  };

  const exportData = () => {
    const content = `学习曲线分析报告\n================\n模型名称: ${modelName}\n首次生产时间: ${firstUnitTime} 小时\n学习率: ${(learningRate * 100).toFixed(0)}%\n生产总量: ${totalUnits} 件\n\n关键指标:\n- 第1件时间: ${stats.firstUnit} 小时\n- 第10件时间: ${stats.tenthUnit} 小时\n- 第${totalUnits}件时间: ${stats.hundredthUnit} 小时\n- 总累计时间: ${Math.round(stats.totalTime)} 小时\n- 平均单件时间: ${Math.round(stats.avgTime * 10) / 10} 小时\n- 整体效率提升: ${stats.improvement}%`.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习曲线_${modelName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', '报告已导出');
  };

  const sampleRates = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95];

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white"><TrendingDown size={20} /></div>
              学习曲线模型
            </h1>
            <p className="text-gray-500 mt-1">基于经验曲线效应预测生产效率提升</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveModel} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}保存
            </button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
              <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-2">首次生产时间 (小时)</label>
              <input type="number" min="1" value={firstUnitTime} onChange={(e) => setFirstUnitTime(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-2">学习率: {(learningRate * 100).toFixed(0)}%</label>
              <input type="range" min="0.5" max="0.99" step="0.01" value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value))} className="w-full mb-2" />
              <p className="text-xs text-gray-500 mb-4">{getLearningRateDescription(learningRate)}</p>
              <label className="block text-sm font-medium text-gray-700 mb-2">生产总量</label>
              <input type="number" min="10" max="1000" value={totalUnits} onChange={(e) => setTotalUnits(parseInt(e.target.value) || 10)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calculator size={16} />快速选择学习率</h3>
              <div className="grid grid-cols-3 gap-2">
                {sampleRates.map((rate) => (
                  <button key={rate} onClick={() => setLearningRate(rate)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${Math.abs(learningRate - rate) < 0.01 ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {(rate * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-cyan-50 rounded-xl">
                <p className="text-xs text-cyan-700"><strong>提示:</strong> 80%学习率表示产量每翻倍，所需时间减少20%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><History size={16} />历史模型</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedModels.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的模型</p> : savedModels.map((model) => (
                  <button key={model.id} onClick={() => loadModel(model)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === model.id ? 'bg-cyan-50 border-cyan-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{model.model_name}</p>
                    <p className="text-xs text-gray-500">学习率: {(model.learning_rate * 100).toFixed(0)}% | 产量: {model.total_units}件</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">第1件时间</p>
                <p className="text-2xl font-bold text-gray-900">{stats.firstUnit}h</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">第10件时间</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.tenthUnit}h</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">第{totalUnits}件时间</p>
                <p className="text-2xl font-bold text-blue-600">{stats.hundredthUnit}h</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">效率提升</p>
                <p className="text-2xl font-bold text-green-600">{stats.improvement}%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">学习曲线趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curveData.filter((_, i) => i % 5 === 0 || i === curveData.length - 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="unit" tick={{ fontSize: 11 }} label={{ value: '生产数量', position: 'insideBottom', offset: -5 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: '单件时间(小时)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(value: number, name: string) => [`${value} 小时`, name === 'time' ? '单件时间' : '累计时间']} />
                    <ReferenceLine y={stats.avgTime} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="time" stroke="#06b6d4" strokeWidth={2} dot={false} name="单件时间" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Calculator size={20} />分析结论</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-cyan-100 mb-2">公式说明</p>
                  <p className="text-lg font-mono bg-white/10 rounded-lg p-3">T_n = {firstUnitTime} x n^(-log_2({learningRate}))</p>
                </div>
                <div>
                  <p className="text-cyan-100 mb-2">工期优化建议</p>
                  <ul className="space-y-1 text-cyan-100 text-sm">
                    <li>前10件平均时间: {Math.round(curveData.slice(0, 10).reduce((s, d) => s + d.time, 0) / 10 * 10) / 10}h</li>
                    <li>后10件平均时间: {Math.round(curveData.slice(-10).reduce((s, d) => s + d.time, 0) / 10 * 10) / 10}h</li>
                    <li>建议批量生产以降低单位成本</li>
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

export default LearningCurve;
