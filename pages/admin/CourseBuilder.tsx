import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Plus, GripVertical, Trash2, Video, FileText, CheckCircle, Clock } from 'lucide-react';

interface CourseBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  course: any | null;
  onSave: (courseData: any) => void;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ isOpen, onClose, course, onSave }) => {
  const [formData, setFormData] = useState<any>({
    title: '', author: '', status: 'Draft', chapters: []
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        author: course.author,
        status: course.status === 'Published' ? 'Published' : 'Draft',
        chapters: [
            { id: 1, title: 'Introduction to Concept', duration: '10:00', type: 'video' },
            { id: 2, title: 'Core Principles', duration: '25:00', type: 'video' },
            { id: 3, title: 'Quiz: Chapter 1', duration: '15:00', type: 'quiz' },
        ] // Mock chapters
      });
    } else {
      setFormData({ title: '', author: '', status: 'Draft', chapters: [] });
    }
  }, [course, isOpen]);

  const addChapter = () => {
    const newChapter = {
        id: Date.now(),
        title: 'New Chapter',
        duration: '00:00',
        type: 'video'
    };
    setFormData({ ...formData, chapters: [...formData.chapters, newChapter] });
  };

  const removeChapter = (id: number) => {
    setFormData({ ...formData, chapters: formData.chapters.filter((c: any) => c.id !== id) });
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-[#F5F5F7] shadow-2xl z-[70] transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{course ? '课程构建器' : '创建新内容'}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${formData.status === 'Published' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <p className="text-xs text-gray-500 font-medium">{formData.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setFormData({...formData, status: formData.status === 'Draft' ? 'Published' : 'Draft'})}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
            >
                {formData.status === 'Draft' ? '发布课程' : '撤回草稿'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8">
            {/* 1. Basic Info Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 mb-4">基本信息</h3>
                
                {/* Cover Upload Simulation */}
                <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
                    <ImageIcon size={24} className="mb-2 group-hover:scale-110 transition-transform"/>
                    <span className="text-xs font-bold">拖拽封面图或点击上传</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">课程标题</label>
                        <input 
                            type="text" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="输入吸引人的标题"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">讲师</label>
                        <input 
                            type="text" 
                            value={formData.author}
                            onChange={(e) => setFormData({...formData, author: e.target.value})}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">难度</label>
                        <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none">
                            <option>Foundation</option>
                            <option>Advanced</option>
                            <option>Expert</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Curriculum Builder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-gray-900">章节大纲 (Curriculum)</h3>
                    <button onClick={addChapter} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <Plus size={14}/> 添加章节
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.chapters.map((chapter: any, index: number) => (
                        <div key={chapter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="cursor-move text-gray-300 hover:text-gray-600">
                                <GripVertical size={16} />
                            </div>
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 border border-gray-200 shadow-sm shrink-0">
                                {chapter.type === 'video' ? <Video size={14}/> : <FileText size={14}/>}
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    value={chapter.title}
                                    onChange={(e) => {
                                        const newChapters = [...formData.chapters];
                                        newChapters[index].title = e.target.value;
                                        setFormData({...formData, chapters: newChapters});
                                    }}
                                    className="bg-transparent text-sm font-bold text-gray-800 outline-none w-full focus:bg-white rounded px-1"
                                />
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                    <Clock size={10} />
                                    <span>{chapter.duration}</span>
                                </div>
                            </div>
                            <button onClick={() => removeChapter(chapter.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {formData.chapters.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                            暂无章节，请点击右上角添加
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <CheckCircle size={14} className="text-green-500"/>
                自动保存于 10:42 AM
            </div>
            <button 
                onClick={() => {
                    onSave(formData);
                    onClose();
                }}
                className="px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"
            >
                <Save size={16} /> 完成编辑
            </button>
        </div>
      </div>
    </>
  );
};

export default CourseBuilder;