
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Sparkles, Save, Download, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Brain } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EVMData { period: number; periodName: string; pv: number; ev: number; ac: number; spi: number; cpi: number; }
interface PredictionResult { period: number; periodName: string; spi: number; cpi: number; confidence: number; }
interface EVMPredictionProps { currentUser?: UserProfile | null; }

function generatePredictions(historicalData: EVMData[], periods: number): PredictionResult[] {
  const predictions: PredictionResult[] = [];
  const lastData = historicalData[historicalData.length - 1];
  const spiTrend = historicalData.length > 1 ? (lastData.spi - historicalData[0].spi) / historicalData.length : 0;
  const cpiTrend = historicalData.length > 1 ? (lastData.cpi - historicalData[0].cpi) / historicalData.length : 0;
  
  for (let i = 1; i <= periods; i++) {
    const predictedSPI = Math.max(0.5, Math.min(1.5, lastData.spi + spiTrend * i + (Math.random() - 0.5) * 0.05));
    const predictedCPI = Math.max(0.5, Math.min(1.5, lastData.cpi + cpiTrend * i + (Math.random() - 0.5) * 0.05));
    predictions.push({ period: lastData.period + i, periodName: `预测${i}`, spi: Math.round(predictedSPI * 100) / 100, cpi: Math.round(predictedCPI * 100) / 100, confidence: Math.max(50, 95 - i * 10) });
  }
  return predictions;
}

function generateAIAnalysis(data: EVMData[], predictions: PredictionResult[]): string {
  const lastSPI = data[data.length - 1]?.spi || 1;
  const lastCPI = data[data.length - 1]?.cpi || 1;
  const trendSPI = predictions[predictions.length - 1]?.spi || lastSPI;
  
  let analysis = `基于最近${data.length}个月的数据分析:\n\n`;
  analysis += lastSPI >= 1.0 ? `进度表现良好 (SPI=${lastSPI.toFixed(2)})\n` : lastSPI >= 0.9 ? `进度略有滞后 (SPI=${lastSPI.toFixed(2)})\n` : `进度严重滞后 (SPI=${lastSPI.toFixed(2)})\n`;
  analysis += lastCPI >= 1.0 ? `成本控制良好 (CPI=${lastCPI.toFixed(2)})\n` : lastCPI >= 0.9 ? `成本略有超支 (CPI=${lastCPI.toFixed(2)})\n` : `成本严重超支 (CPI=${lastCPI.toFixed(2)})\n`;
  analysis += trendSPI > lastSPI ? `预计进度将改善至 SPI=${trendSPI.toFixed(2)}` : trendSPI < lastSPI ? `预计进度可能下滑至 SPI=${trendSPI.toFixed(2)}` : `预计进度保持稳定`;
  return analysis;
}

const EVMPrediction: React.FC<EVMPredictionProps> = ({ currentUser }) => {
  const [projectName, setProjectName] = useState('企业管理系统项目');
  const [evmData, setEvmData] = useState<EVMData[]>([
    { period: 1, periodName: '1月', pv: 100, ev: 95, ac: 98, spi: 0.95, cpi: 0.97 },
    { period: 2, periodName: '2月', pv: 200, ev: 190, ac: 195, spi: 0.95, cpi: 0.97 },
    { period: 3, periodName: '3月', pv: 300, ev: 290, ac: 295, spi: 0.97, cpi: 0.98 },
    { period: 4, periodName: '4月', pv: 400, ev: 395, ac: 398, spi: 0.99, cpi: 0.99 },
    { period: 5, periodName: '5月', pv: 500, ev: 505, ac: 500, spi: 1.01, cpi: 1.01 },
    { period: 6, periodName: '6月', pv: 600, ev: 615, ac: 605, spi: 1.03, cpi: 1.02 },
  ]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predictionPeriods, setPredictionPeriods] = useState(3);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const combinedData = useMemo(() => {
    const historical = evmData.map(d => ({ ...d, type: 'historical', confidence: 100 }));
    const predicted = predictions.map(p => ({ period: p.period, periodName: p.periodName, spi: p.spi, cpi: p.cpi, pv: null, ev: null, ac: null, type: 'predicted', confidence: p.confidence }));
    return [...historical, ...predicted];
  }, [evmData, predictions]);

  useEffect(() => { loadSavedAnalyses(); }, []);

  const loadSavedAnalyses = async () => {
    const { data } = await supabase.from('lab_evm_predictions').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setSavedAnalyses(data);
  };

  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const addPeriod = () => {
    const lastPeriod = evmData[evmData.length - 1];
    setEvmData([...evmData, { period: lastPeriod.period + 1, periodName: `${lastPeriod.period + 1}期`, pv: lastPeriod.pv + 100, ev: lastPeriod.ev + 95, ac: lastPeriod.ac + 98, spi: 0.95, cpi: 0.97 }]);
  };

  const removePeriod = (index: number) => { if (evmData.length <= 2) { showToast('error', '至少保留两个数据点'); return; } setEvmData(evmData.filter((_, i) => i !== index)); };

  const updateData = (index: number, field: keyof EVMData, value: string | number) => {
    const newData = [...evmData];
    newData[index] = { ...newData[index], [field]: value };
    if (field === 'pv' || field === 'ev' || field === 'ac') {
      const pv = field === 'pv' ? Number(value) : newData[index].pv;
      const ev = field === 'ev' ? Number(value) : newData[index].ev;
      const ac = field === 'ac' ? Number(value) : newData[index].ac;
      newData[index].spi = pv > 0 ? Math.round(ev / pv * 100) / 100 : 0;
      newData[index].cpi = ac > 0 ? Math.round(ev / ac * 100) / 100 : 0;
    }
    setEvmData(newData);
  };

  const runPrediction = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const preds = generatePredictions(evmData, predictionPeriods);
      setPredictions(preds);
      setAiAnalysis(generateAIAnalysis(evmData, preds));
      setIsAnalyzing(false);
    }, 1500);
  };

  const saveAnalysis = async () => {
    const payload = { user_id: currentUser?.id || null, project_name: projectName, historical_data: evmData, predictions: { predictions, analysis: aiAnalysis }, ai_analysis: aiAnalysis };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_evm_predictions').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_evm_predictions').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedAnalyses(); }
  };

  const loadAnalysis = (analysis: any) => { setCurrentId(analysis.id); setProjectName(analysis.project_name); setEvmData(analysis.historical_data); if (analysis.predictions) { setPredictions(analysis.predictions.predictions || []); setAiAnalysis(analysis.ai_analysis || ''); } };

  const exportData = () => {
    const content = `挣值管理趋势预测报告\n==================\n项目名称: ${projectName}\n\n历史数据:\n月份 PV EV AC SPI CPI\n${evmData.map(d => `${d.periodName} ${d.pv} ${d.ev} ${d.ac} ${d.spi} ${d.cpi}`).join('\n')}\n\nAI分析:\n${aiAnalysis}`.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EVM预测_${projectName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', '报告已导出');
  };

  const currentSPI = evmData[evmData.length - 1]?.spi || 1;
  const currentCPI = evmData[evmData.length - 1]?.cpi || 1;

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white"><TrendingUp size={20} /></div>挣值趋势预测</h1>
            <p className="text-gray-500 mt-1">AI驱动的SPI/CPI趋势预测与风险分析</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveAnalysis} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Save size={18} />保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
            <button onClick={runPrediction} disabled={isAnalyzing} className="px-6 py-2 bg-violet-600 text-white rounded-xl flex items-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-lg shadow-violet-500/25">{isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{isAnalyzing ? 'AI分析中...' : 'AI预测'}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-2">预测期数: {predictionPeriods} 个月</label>
              <input type="range" min="1" max="6" value={predictionPeriods} onChange={(e) => setPredictionPeriods(parseInt(e.target.value))} className="w-full" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">当前状态</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-violet-50 rounded-xl text-center">
                  <p className="text-xs text-violet-600 uppercase">SPI</p>
                  <p className={`text-2xl font-bold ${currentSPI >= 1 ? 'text-green-600' : 'text-red-500'}`}>{currentSPI.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{currentSPI >= 1 ? '进度良好' : '进度滞后'}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-xs text-purple-600 uppercase">CPI</p>
                  <p className={`text-2xl font-bold ${currentCPI >= 1 ? 'text-green-600' : 'text-red-500'}`}>{currentCPI.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{currentCPI >= 1 ? '成本节约' : '成本超支'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">历史数据</h3>
                <button onClick={addPeriod} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Plus size={18} /></button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {evmData.map((data, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="text" value={data.periodName} onChange={(e) => updateData(index, 'periodName', e.target.value)} className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg" />
                      <button onClick={() => removePeriod(index)} className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-xs text-gray-500">PV</label><input type="number" value={data.pv} onChange={(e) => updateData(index, 'pv', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                      <div><label className="text-xs text-gray-500">EV</label><input type="number" value={data.ev} onChange={(e) => updateData(index, 'ev', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                      <div><label className="text-xs text-gray-500">AC</label><input type="number" value={data.ac} onChange={(e) => updateData(index, 'ac', e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg" /></div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${data.spi >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>SPI: {data.spi}</span>
                      <span className={`px-2 py-0.5 rounded ${data.cpi >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>CPI: {data.cpi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史分析</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedAnalyses.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的分析</p> : savedAnalyses.map((analysis) => (
                  <button key={analysis.id} onClick={() => loadAnalysis(analysis)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === analysis.id ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{analysis.project_name}</p>
                    <p className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString('zh-CN')}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6">SPI/CPI 趋势预测</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodName" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0.5, 1.5]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="spi" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="SPI" />
                    <Line type="monotone" dataKey="cpi" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} name="CPI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div><span className="text-sm text-gray-600">SPI (进度绩效)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div><span className="text-sm text-gray-600">CPI (成本绩效)</span></div>
              </div>
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Brain size={20} />AI 智能分析</h3>
                <div className="whitespace-pre-line text-violet-100 leading-relaxed">{aiAnalysis}</div>
              </div>
            )}

            {predictions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">预测置信度</h3>
                <div className="space-y-3">
                  {predictions.map((pred, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-16">{pred.periodName}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full" style={{ width: `${pred.confidence}%` }} /></div>
                      <span className="text-sm font-medium text-gray-700 w-16 text-right">{pred.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVMPrediction;
