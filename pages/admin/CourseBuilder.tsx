
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, GripVertical, Trash2, CheckCircle, Terminal } from 'lucide-react';

interface CourseBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  course: any | null;
  onSave: (courseData: any) => void;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ isOpen, onClose, course, onSave }) => {
  const [formData, setFormData] = useState<any>({
    title: '', author: '', status: 'Draft', category: 'Course', chapters: [], simulation_data: []
  });

  useEffect(() => {
    if (course) {
      let parsedChapters = [];
      if (Array.isArray(course.chapters)) parsedChapters = course.chapters;
      else if (typeof course.chapters === 'string') try { parsedChapters = JSON.parse(course.chapters); } catch (e) { }

      let parsedSimData = [];
      if (Array.isArray(course.simulation_data)) parsedSimData = course.simulation_data;
      else if (typeof course.simulation_data === 'string') try { parsedSimData = JSON.parse(course.simulation_data); } catch (e) { }

      setFormData({
        title: course.title || '',
        author: course.author || '',
        status: course.status === 'Published' ? 'Published' : 'Draft',
        category: course.category || 'Course',
        chapters: parsedChapters,
        simulation_data: parsedSimData.length > 0 ? parsedSimData : [
          { id: 1, trigger: 'Start', message: '初始场景描述...', options: [{ text: '选项A', score: 10 }, { text: '选项B', score: -10 }] }
        ]
      });
    } else {
      setFormData({
        title: '', author: '', status: 'Draft', category: 'Course',
        chapters: [{ id: 1, title: 'New Chapter 1', duration: '10:00', type: 'video' }],
        simulation_data: [{ id: 1, trigger: 'Start', message: 'Scenario Start...', options: [] }]
      });
    }
  }, [course, isOpen]);

  const addChapter = () => {
    setFormData({ ...formData, chapters: [...formData.chapters, { id: Date.now(), title: 'New Chapter', duration: '00:00', type: 'video' }] });
  };

  const addSimEvent = () => {
    setFormData({ ...formData, simulation_data: [...formData.simulation_data, { id: Date.now(), trigger: 'Next Event', message: 'New Event...', options: [] }] });
  };

  // --- Render Script Editor for Simulations ---
  const renderScriptEditor = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Terminal size={16} /> 剧本编辑器 (Scenario Script)</h3>
        <button onClick={addSimEvent} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus size={14} /> 添加事件</button>
      </div>
      <div className="space-y-6">
        {formData.simulation_data.map((event: any, index: number) => (
          <div key={event.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-gray-400">EVENT {index + 1}</span>
              <button onClick={() => {
                const newData = formData.simulation_data.filter((e: any) => e.id !== event.id);
                setFormData({ ...formData, simulation_data: newData });
              }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
            <div className="space-y-3">
              <input
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm font-bold"
                placeholder="触发条件 (e.g. 项目中期, 突发Bug)"
                value={event.trigger}
                onChange={(e) => {
                  const newData = [...formData.simulation_data]; newData[index].trigger = e.target.value;
                  setFormData({ ...formData, simulation_data: newData });
                }}
              />
              <textarea
                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm resize-none"
                placeholder="剧情描述/问题内容..."
                rows={2}
                value={event.message}
                onChange={(e) => {
                  const newData = [...formData.simulation_data]; newData[index].message = e.target.value;
                  setFormData({ ...formData, simulation_data: newData });
                }}
              />
              {/* Options Editor (Simplified JSON for now) */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">选项 (JSON: [{`{text:"", score:0}`}])</label>
                <textarea
                  className="w-full bg-black text-green-400 font-mono text-xs rounded px-3 py-2 mt-1"
                  rows={2}
                  value={JSON.stringify(event.options)}
                  onChange={(e) => {
                    try {
                      const opts = JSON.parse(e.target.value);
                      const newData = [...formData.simulation_data]; newData[index].options = opts;
                      setFormData({ ...formData, simulation_data: newData });
                    } catch (err) { } // Ignore parse error while typing
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-[#F5F5F7] shadow-2xl z-[70] transform transition-transform duration-500 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{course ? '内容编辑器' : '创建新内容'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${formData.status === 'Published' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <p className="text-xs text-gray-500 font-medium">{formData.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFormData({ ...formData, status: formData.status === 'Draft' ? 'Published' : 'Draft' })} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">{formData.status === 'Draft' ? '发布' : '撤回'}</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">标题</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">分类</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none">
                  <option value="Course">体系课程</option>
                  <option value="Simulation">实战模拟 (Scenario)</option>
                  <option value="Lab">算法实验</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">作者</label>
                <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* Conditional Builder: Script vs Chapters */}
          {formData.category === 'Simulation' ? renderScriptEditor() : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-900">章节大纲</h3>
                <button onClick={addChapter} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus size={14} /> 添加章节</button>
              </div>
              <div className="space-y-3">
                {formData.chapters.map((chapter: any, index: number) => (
                  <div key={chapter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                    <GripVertical size={16} className="text-gray-300" />
                    <input type="text" value={chapter.title} onChange={(e) => {
                      const newChapters = [...formData.chapters]; newChapters[index].title = e.target.value; setFormData({ ...formData, chapters: newChapters });
                    }} className="bg-transparent text-sm font-bold text-gray-800 outline-none w-full" />
                    <button onClick={() => setFormData({ ...formData, chapters: formData.chapters.filter((c: any) => c.id !== chapter.id) })} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> 自动保存</div>
          <button onClick={() => { onSave(formData); onClose(); }} className="px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"><Save size={16} /> 完成</button>
        </div>
      </div>
    </>
  );
};

export default CourseBuilder;
