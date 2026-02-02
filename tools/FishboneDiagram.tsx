
import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Trash2, Save, Download, Sparkles, AlertCircle, CheckCircle2, Lightbulb, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface Cause { id: string; text: string; category: string; }
interface FishboneDiagramProps { currentUser?: UserProfile | null; }

const defaultCategories = ['人', '机', '料', '法', '环'];
const aiSuggestionsMap: Record<string, string[]> = {
  '项目延期': ['需求变更频繁', '资源不足', '技术难题', '沟通不畅', '计划不合理'],
  '质量缺陷': ['测试不充分', '代码审查不严', '需求理解偏差', '环境差异', '培训不足'],
  '成本超支': ['估算不准确', '范围蔓延', '返工过多', '资源浪费', '供应商涨价'],
  '客户不满': ['需求理解偏差', '交付延迟', '沟通不及时', '质量不达标', '期望管理不当'],
  '团队冲突': ['目标不一致', '职责不清', '沟通方式不当', '资源竞争', '个性差异'],
};

const FishboneDiagram: React.FC<FishboneDiagramProps> = ({ currentUser }) => {
  const [problem, setProblem] = useState('项目延期');
  const [categories, setCategories] = useState(defaultCategories);
  const [causes, setCauses] = useState<Cause[]>([
    { id: '1', text: '需求变更频繁', category: '人' },
    { id: '2', text: '资源不足', category: '人' },
    { id: '3', text: '技术债务', category: '机' },
    { id: '4', text: '第三方组件问题', category: '机' },
    { id: '5', text: '需求文档不清晰', category: '料' },
    { id: '6', text: '验收标准模糊', category: '料' },
    { id: '7', text: '敏捷实践不到位', category: '法' },
    { id: '8', text: '代码审查流于形式', category: '法' },
    { id: '9', text: '开发环境不稳定', category: '环' },
    { id: '10', text: '跨时区协作困难', category: '环' },
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [newCause, setNewCause] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('人');
  const [savedDiagrams, setSavedDiagrams] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { loadSavedDiagrams(); }, []);
  const loadSavedDiagrams = async () => { const { data } = await supabase.from('lab_fishbone_diagrams').select('*').order('created_at', { ascending: false }).limit(10); if (data) setSavedDiagrams(data); };
  const showToast = (type: 'success' | 'error', message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const addCategory = () => { if (!newCategory.trim()) return; if (categories.includes(newCategory)) { showToast('error', '该分类已存在'); return; } setCategories([...categories, newCategory]); setNewCategory(''); };
  const removeCategory = (cat: string) => { if (categories.length <= 2) { showToast('error', '至少保留两个分类'); return; } setCategories(categories.filter(c => c !== cat)); setCauses(causes.filter(c => c.category !== cat)); };
  const addCause = () => { if (!newCause.trim()) return; setCauses([...causes, { id: Date.now().toString(), text: newCause, category: selectedCategory }]); setNewCause(''); };
  const removeCause = (id: string) => { setCauses(causes.filter(c => c.id !== id)); };

  const getAISuggestions = () => { setAiSuggestions(aiSuggestionsMap[problem] || ['沟通问题', '资源限制', '流程缺陷', '技术挑战', '环境因素']); setShowAISuggestions(true); };
  const applyAISuggestion = (suggestion: string) => {
    const keywordMap: Record<string, string[]> = { '人': ['沟通', '培训', '技能', '态度', '协作', '冲突'], '机': ['设备', '工具', '系统', '软件', '硬件', '技术'], '料': ['材料', '数据', '文档', '需求', '资源', '信息'], '法': ['流程', '方法', '规范', '标准', '制度', '计划'], '环': ['环境', '时间', '地点', '市场', '政策', '外部'] };
    let bestCategory = categories[0];
    categories.forEach(cat => { const keywords = keywordMap[cat] || []; if (keywords.some(k => suggestion.includes(k))) bestCategory = cat; });
    setCauses([...causes, { id: Date.now().toString(), text: suggestion, category: bestCategory }]);
    setShowAISuggestions(false);
    showToast('success', `已添加到 "${bestCategory}" 分类`);
  };

  const saveDiagram = async () => {
    const payload = { user_id: currentUser?.id || null, problem_statement: problem, categories, causes: causes.reduce((acc, c) => { if (!acc[c.category]) acc[c.category] = []; acc[c.category].push(c.text); return acc; }, {} as Record<string, string[]>), ai_suggestions: aiSuggestions };
    let error;
    if (currentId) { const { error: updateError } = await supabase.from('lab_fishbone_diagrams').update(payload).eq('id', currentId); error = updateError; }
    else { const { data, error: insertError } = await supabase.from('lab_fishbone_diagrams').insert(payload).select().single(); error = insertError; if (data) setCurrentId(data.id); }
    if (error) showToast('error', '保存失败: ' + error.message);
    else { showToast('success', '保存成功!'); loadSavedDiagrams(); }
  };

  const loadDiagram = (diagram: any) => {
    setCurrentId(diagram.id); setProblem(diagram.problem_statement); setCategories(diagram.categories);
    const restoredCauses: Cause[] = [];
    Object.entries(diagram.causes as Record<string, string[]>).forEach(([cat, texts]) => { texts.forEach((text, idx) => { restoredCauses.push({ id: `${diagram.id}-${cat}-${idx}`, text, category: cat }); }); });
    setCauses(restoredCauses);
    if (diagram.ai_suggestions) setAiSuggestions(diagram.ai_suggestions);
  };

  const exportData = () => {
    const content = `鱼骨图根因分析报告\n==================\n问题描述: ${problem}\n\n根因分析:\n${categories.map(cat => { const catCauses = causes.filter(c => c.category === cat).map(c => `  - ${c.text}`).join('\n'); return `${cat}:\n${catCauses || '  (无)'}`; }).join('\n\n')}\n\n总结:\n本次分析识别了 ${causes.length} 个潜在根因，涵盖 ${categories.length} 个维度。`.trim();
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `鱼骨图分析_${problem}.txt`; a.click(); URL.revokeObjectURL(url); showToast('success', '报告已导出');
  };

  const renderFishbone = () => {
    const topCategories = categories.slice(0, Math.ceil(categories.length / 2));
    const bottomCategories = categories.slice(Math.ceil(categories.length / 2));
    return (
      <div className="relative h-96 bg-white rounded-2xl border border-gray-200 p-4 overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-400 transform -translate-y-1/2"></div>
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="w-32 h-20 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-300">
            <span className="text-sm font-medium text-red-700 text-center px-2">{problem}</span>
          </div>
        </div>
        {topCategories.map((cat, idx) => {
          const catCauses = causes.filter(c => c.category === cat);
          const left = 20 + (idx * 25);
          return (
            <div key={cat} className="absolute" style={{ left: `${left}%`, top: '10%' }}>
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium text-gray-600 mb-1 bg-gray-100 px-2 py-0.5 rounded">{cat}</div>
                <div className="w-0.5 h-24 bg-gray-300 transform rotate-12 origin-bottom"></div>
                <div className="absolute top-20 left-2 space-y-1">
                  {catCauses.slice(0, 3).map((cause) => (<div key={cause.id} className="text-xs text-gray-600 whitespace-nowrap">• {cause.text}</div>))}
                  {catCauses.length > 3 && (<div className="text-xs text-gray-400">+{catCauses.length - 3} more</div>)}
                </div>
              </div>
            </div>
          );
        })}
        {bottomCategories.map((cat, idx) => {
          const catCauses = causes.filter(c => c.category === cat);
          const left = 20 + (idx * 25);
          return (
            <div key={cat} className="absolute" style={{ left: `${left}%`, bottom: '10%' }}>
              <div className="flex flex-col-reverse items-center">
                <div className="text-xs font-medium text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded">{cat}</div>
                <div className="w-0.5 h-24 bg-gray-300 transform -rotate-12 origin-top"></div>
                <div className="absolute bottom-20 left-2 space-y-1">
                  {catCauses.slice(0, 3).map((cause) => (<div key={cause.id} className="text-xs text-gray-600 whitespace-nowrap">• {cause.text}</div>))}
                  {catCauses.length > 3 && (<div className="text-xs text-gray-400">+{catCauses.length - 3} more</div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {toast && (<div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{toast.message}</div>)}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white"><GitBranch size={20} /></div>鱼骨图根因分析</h1>
            <p className="text-gray-500 mt-1">结构化问题分析 - 人机料法环五维诊断</p>
          </div>
          <div className="flex gap-3">
            <button onClick={getAISuggestions} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Sparkles size={18} className="text-amber-500" />AI建议</button>
            <button onClick={saveDiagram} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Save size={18} />保存</button>
            <button onClick={exportData} className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"><Download size={18} />导出</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">问题描述</label>
              <input type="text" value={problem} onChange={(e) => setProblem(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="输入需要分析的问题..." />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">分析维度</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <div key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-1 ${selectedCategory === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {cat}
                    <button onClick={(e) => { e.stopPropagation(); removeCategory(cat); }} className="ml-1 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="新维度" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" onKeyPress={(e) => e.key === 'Enter' && addCategory()} />
                <button onClick={addCategory} className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"><Plus size={18} /></button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">添加根因</h3>
              <p className="text-sm text-gray-500 mb-3">当前分类: <span className="font-medium text-teal-600">{selectedCategory}</span></p>
              <div className="flex gap-2">
                <input type="text" value={newCause} onChange={(e) => setNewCause(e.target.value)} placeholder="输入根因..." className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none" onKeyPress={(e) => e.key === 'Enter' && addCause()} />
                <button onClick={addCause} className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"><Plus size={18} /></button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">根因列表</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {categories.map((cat) => {
                  const catCauses = causes.filter(c => c.category === cat);
                  if (catCauses.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">{cat}</h4>
                      <div className="space-y-1">
                        {catCauses.map((cause) => (
                          <div key={cause.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{cause.text}</span>
                            <button onClick={() => removeCause(cause.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史分析</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedDiagrams.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">暂无保存的分析</p> : savedDiagrams.map((diagram) => (
                  <button key={diagram.id} onClick={() => loadDiagram(diagram)} className={`w-full text-left p-3 rounded-xl transition-colors ${currentId === diagram.id ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <p className="font-medium text-sm text-gray-900 truncate">{diagram.problem_statement}</p>
                    <p className="text-xs text-gray-500">{diagram.categories.length} 个维度</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {renderFishbone()}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center"><p className="text-3xl font-bold text-teal-600">{causes.length}</p><p className="text-sm text-gray-500">识别根因</p></div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center"><p className="text-3xl font-bold text-teal-600">{categories.length}</p><p className="text-sm text-gray-500">分析维度</p></div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center"><p className="text-3xl font-bold text-teal-600">{causes.length > 0 ? Math.round(causes.length / categories.length * 10) / 10 : 0}</p><p className="text-sm text-gray-500">平均/维度</p></div>
            </div>
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Lightbulb size={20} />分析建议</h3>
              <div className="space-y-2 text-teal-100">
                {causes.length === 0 ? <p>请添加根因以获取分析建议</p> : <><p>• 最多的根因维度: {categories.reduce((max, cat) => { const count = causes.filter(c => c.category === cat).length; return count > max.count ? { cat, count } : max; }, { cat: '', count: 0 }).cat}</p><p>• 建议优先解决前3个根因</p><p>• 考虑根因之间的关联性</p></>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAISuggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" />AI 根因建议</h3>
              <button onClick={() => setShowAISuggestions(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">基于问题 "{problem}"，AI建议以下可能根因：</p>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, idx) => (
                <button key={idx} onClick={() => applyAISuggestion(suggestion)} className="w-full text-left p-3 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors text-sm">{suggestion}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FishboneDiagram;
