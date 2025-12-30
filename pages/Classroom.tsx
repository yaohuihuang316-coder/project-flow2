
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Play, 
  Minimize2, Maximize2, FileText, Download, Send, Loader2, AlertCircle, Save, Check, ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface ClassroomProps {
    courseId?: string;
    currentUser?: UserProfile | null;
    onBack: () => void;
}

const Classroom: React.FC<ClassroomProps> = ({ courseId = 'default', currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'notes' | 'resources'>('catalog');
  const [focusMode, setFocusMode] = useState(false);
  
  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState<string>('');

  // Progress State
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Data State
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Course Data
  useEffect(() => {
    const fetchCourse = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch Course
            let { data: courseData } = await supabase
                .from('app_courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseData) {
                const safeChapters = Array.isArray(courseData.chapters) ? courseData.chapters : typeof courseData.chapters === 'string' ? JSON.parse(courseData.chapters) : [];
                // Ensure chapters have IDs
                const processedChapters = safeChapters.map((ch: any, idx: number) => ({
                    ...ch,
                    id: ch.id || `ch-${idx}` // Fallback ID
                }));

                const safeResources = Array.isArray(courseData.resources) ? courseData.resources : typeof courseData.resources === 'string' ? JSON.parse(courseData.resources) : [];
                
                // If no resources in DB, provide some mocks for download demo
                const finalResources = safeResources.length > 0 ? safeResources : [
                    { name: '课程讲义.pdf', size: '2.4 MB', type: 'pdf' },
                    { name: '实战源码.zip', size: '15 MB', type: 'zip' },
                    { name: '参考资料链接.txt', size: '1 KB', type: 'txt' }
                ];

                setData({
                    id: courseData.id,
                    title: courseData.title,
                    image: courseData.image,
                    subTitle: courseData.title,
                    chapters: processedChapters,
                    resources: finalResources
                });
                
                if (processedChapters.length > 0) setActiveChapterId(processedChapters[0].id);

            } else {
                setError("课程未找到");
            }
        } catch (err) {
            console.error(err);
            setError("数据加载失败");
        } finally {
            setIsLoading(false);
        }
    };

    fetchCourse();
  }, [courseId]);

  // 2. Fetch User Progress (Notes & Completed Chapters)
  useEffect(() => {
      const fetchProgress = async () => {
          if (!currentUser || !data?.id) return;

          const { data: progressData } = await supabase
              .from('app_user_progress')
              .select('notes, completed_chapters')
              .eq('user_id', currentUser.id)
              .eq('course_id', data.id)
              .single();
          
          if (progressData) {
              if (progressData.notes) setNoteContent(progressData.notes);
              
              // Handle completed_chapters safely (could be null or json)
              let doneList: string[] = [];
              if (Array.isArray(progressData.completed_chapters)) {
                  doneList = progressData.completed_chapters;
              } else if (typeof progressData.completed_chapters === 'string') {
                  try { doneList = JSON.parse(progressData.completed_chapters); } catch(e) {}
              }
              setCompletedChapters(doneList);
          }
      };
      
      if (!isLoading && data) {
          fetchProgress();
      }
  }, [currentUser, data, isLoading]);

  // 3. Save Notes Handler
  const handleSaveNote = async () => {
      if (!currentUser || !data?.id) {
          setNoteStatus('请先登录');
          return;
      }
      
      setIsSavingNote(true);
      setNoteStatus('保存中...');

      const { error } = await supabase.from('app_user_progress').upsert({
          user_id: currentUser.id,
          course_id: data.id,
          notes: noteContent,
          last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });

      setIsSavingNote(false);
      
      if (error) {
          setNoteStatus('保存失败');
      } else {
          setNoteStatus('已同步至云端');
          setTimeout(() => setNoteStatus(''), 2000);
      }
  };

  // 4. Toggle Chapter Completion & Update Progress %
  const toggleChapter = async (e: React.MouseEvent, chapterId: string) => {
      e.stopPropagation(); // Prevent playing video when checking box
      if (!currentUser || !data?.id) return;

      const isCompleted = completedChapters.includes(chapterId);
      const newCompleted = isCompleted 
          ? completedChapters.filter(id => id !== chapterId)
          : [...completedChapters, chapterId];
      
      setCompletedChapters(newCompleted);

      // Calculate Progress %
      const total = data.chapters.length;
      const progressPercent = Math.round((newCompleted.length / total) * 100);

      // Optimistic update
      const { error } = await supabase.from('app_user_progress').upsert({
          user_id: currentUser.id,
          course_id: data.id,
          completed_chapters: newCompleted, // Save raw array
          progress: progressPercent,
          last_accessed: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });

      if (error) console.error("Failed to update progress", error);
  };

  // 5. Handle Real Download
  const handleDownload = (resourceName: string) => {
      // In a real app, this would use a URL from Supabase Storage
      // Here we simulate a real file download by creating a blob
      const content = `这是 ${resourceName} 的模拟文件内容。\n\nProjectFlow Learning Resource\nCourse ID: ${data.id}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = resourceName; // Set the file name
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 font-medium">正在加载课程资源...</p>
          </div>
      );
  }

  if (error || !data) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <p className="text-gray-900 font-bold mb-2">加载失败</p>
              <p className="text-gray-500 text-sm">{error || '未知错误'}</p>
              <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">返回课程列表</button>
          </div>
      );
  }

  return (
    <div className={`pt-16 min-h-screen transition-colors duration-700 ease-in-out ${focusMode ? 'bg-[#050505]' : 'bg-[#F5F5F7]'}`}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        
        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col relative z-10">
            {/* Ambient Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full pointer-events-none transition-opacity duration-1000 ${focusMode ? 'opacity-20' : 'opacity-40'}`}></div>

            {/* Toolbar */}
            <div className={`h-16 px-4 md:px-8 flex items-center justify-between z-20 ${focusMode ? 'text-white/50' : 'text-gray-500'}`}>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className={`p-2 rounded-full transition-colors ${focusMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                        title="返回上一级"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Playing Course</span>
                        <h2 className={`text-base font-bold leading-none ${focusMode ? 'text-white' : 'text-gray-900'}`}>{data.subTitle}</h2>
                    </div>
                </div>
                <button 
                    onClick={() => setFocusMode(!focusMode)}
                    className="flex items-center gap-2 text-xs font-bold hover:text-blue-500 transition-colors bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
                >
                    {focusMode ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                    {focusMode ? '退出专注' : '专注模式'}
                </button>
            </div>

            {/* Video Player */}
            <div className="flex-1 px-4 md:px-12 pb-8 flex items-center justify-center relative z-20">
                <div className="w-full max-w-6xl aspect-video bg-black rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/10 ring-1 ring-black/5">
                    <img src={data.image} className="w-full h-full object-cover opacity-80" alt="Video Content" />
                    
                    {/* Custom Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all duration-300 hover:scale-110 hover:bg-white/20 shadow-lg group-hover:shadow-white/10">
                            <Play size={40} fill="currentColor" className="ml-2"/>
                        </button>
                    </div>

                    {/* Simple Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all">
                            <div className="h-full w-1/3 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] relative"></div>
                        </div>
                        <div className="flex justify-between text-white text-xs font-bold mt-3 tracking-wider">
                            <span>14:20</span>
                            <span>32:15</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Right Sidebar (Tabs) --- */}
        <div 
            className={`
                w-96 bg-white/80 backdrop-blur-2xl border-l border-gray-200/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
                flex flex-col relative shadow-xl z-30
                ${focusMode ? 'translate-x-full absolute right-0 h-full' : ''}
            `}
        >
            {/* Tabs Header */}
            <div className="flex p-2 m-4 bg-gray-100/50 rounded-xl">
                {['catalog', 'notes', 'resources'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                            activeTab === tab 
                            ? 'bg-white shadow-sm text-black' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'catalog' ? '目录' : tab === 'notes' ? '笔记' : '资源'}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
                {/* Catalog View */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4 mt-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900 truncate pr-2">{data.title}</h3>
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {Math.round((completedChapters.length / data.chapters.length) * 100)}% 完成
                            </span>
                        </div>
                        
                        {data.chapters.map((chapter: any) => {
                            const isCompleted = completedChapters.includes(chapter.id);
                            const isActive = activeChapterId === chapter.id;
                            
                            return (
                                <div 
                                    key={chapter.id} 
                                    onClick={() => setActiveChapterId(chapter.id)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                                        isActive
                                        ? 'bg-blue-50 border-blue-100 shadow-sm' 
                                        : 'hover:bg-gray-50 border-transparent bg-transparent'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button 
                                            onClick={(e) => toggleChapter(e, chapter.id)}
                                            className={`mt-0.5 rounded-full border p-0.5 transition-colors ${
                                                isCompleted 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-gray-300 text-transparent hover:border-gray-400'
                                            }`}
                                        >
                                            <Check size={12} strokeWidth={3} />
                                        </button>
                                        
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold leading-tight ${isActive ? 'text-blue-900' : isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                {chapter.title}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                                                {chapter.duration || '10:00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Notes View */}
                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col">
                        <textarea 
                            className="w-full h-64 bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-none font-medium leading-relaxed"
                            placeholder={currentUser ? "在此记录重点... (会自动保存)" : "请先登录以保存笔记"}
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        />
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">
                                {noteStatus}
                            </span>
                            <button 
                                onClick={handleSaveNote}
                                disabled={isSavingNote || !currentUser}
                                className="text-xs font-bold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSavingNote ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                                保存笔记
                            </button>
                        </div>
                    </div>
                )}

                {/* Resources View */}
                {activeTab === 'resources' && (
                    <div className="space-y-3 mt-2">
                        {data.resources && data.resources.length > 0 ? (
                            data.resources.map((res: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-red-500 border border-gray-100">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{res.name}</p>
                                            <p className="text-xs text-gray-400">{res.size} • {res.type?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownload(res.name)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors active:scale-95"
                                        title="下载资源"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                暂无相关资源
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AI Assistant (Bubble Style) */}
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1 flex items-center gap-2 transform transition-all hover:scale-[1.02] cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <MessageSquare size={18} fill="currentColor" />
                    </div>
                    <div className="flex-1 px-2">
                        <p className="text-xs font-bold text-gray-900">AI 助教</p>
                        <p className="text-[10px] text-gray-500 truncate">针对当前内容有疑问？</p>
                    </div>
                    <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-1 hover:bg-gray-800">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Classroom;
