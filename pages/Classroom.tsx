import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Play, 
  Minimize2, Maximize2, FileText, Download, CheckCircle, Send, Loader2, AlertCircle, Save
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface ClassroomProps {
    courseId?: string;
    currentUser?: UserProfile | null;
}

const Classroom: React.FC<ClassroomProps> = ({ courseId = 'default', currentUser }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'notes' | 'resources'>('catalog');
  const [focusMode, setFocusMode] = useState(false);
  
  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState<string>('');

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
            let { data: courseData, error: courseError } = await supabase
                .from('app_courses')
                .select('*')
                .eq('id', courseId)
                .single();

            // Fallback Logic
            if (courseError || !courseData) {
                console.warn(`Course ${courseId} not found, trying fallback`);
                const { data: fallbackData } = await supabase
                    .from('app_courses')
                    .select('*')
                    .limit(1)
                    .single();
                courseData = fallbackData;
            }

            if (courseData) {
                const safeChapters = Array.isArray(courseData.chapters) ? courseData.chapters : typeof courseData.chapters === 'string' ? JSON.parse(courseData.chapters) : [];
                const safeResources = Array.isArray(courseData.resources) ? courseData.resources : typeof courseData.resources === 'string' ? JSON.parse(courseData.resources) : [];
                const safeModuleInfo = typeof courseData.module_info === 'object' ? courseData.module_info : { module: 'Module 1', subTitle: 'Overview' };

                setData({
                    id: courseData.id,
                    title: courseData.title,
                    image: courseData.image,
                    module: safeModuleInfo?.module || 'Module 1',
                    subTitle: safeModuleInfo?.subTitle || courseData.title,
                    chapters: safeChapters.length > 0 ? safeChapters : [{title: 'Course Intro', time: '10:00', active: true}],
                    resources: safeResources
                });
            } else {
                setError("无法加载课程数据，请检查数据库。");
            }
        } catch (err) {
            console.error(err);
            setError("网络错误，无法连接到 Supabase。");
        } finally {
            setIsLoading(false);
        }
    };

    fetchCourse();
  }, [courseId]);

  // 2. Fetch User Notes for this Course
  useEffect(() => {
      const fetchNotes = async () => {
          if (!currentUser || !data?.id) return;

          const { data: progressData } = await supabase
              .from('app_user_progress')
              .select('notes')
              .eq('user_id', currentUser.id)
              .eq('course_id', data.id)
              .single();
          
          if (progressData && progressData.notes) {
              setNoteContent(progressData.notes);
          }
      };
      
      if (!isLoading && data) {
          fetchNotes();
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
          console.error(error);
          setNoteStatus('保存失败');
      } else {
          setNoteStatus('已同步至云端');
          setTimeout(() => setNoteStatus(''), 2000);
      }
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
          </div>
      );
  }

  return (
    <div className={`pt-16 min-h-screen transition-colors duration-700 ease-in-out ${focusMode ? 'bg-[#050505]' : 'bg-[#F5F5F7]'}`}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        
        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col relative z-10">
            {/* Ambient Glow Background Effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full pointer-events-none transition-opacity duration-1000 ${focusMode ? 'opacity-20' : 'opacity-40'}`}></div>

            {/* Toolbar */}
            <div className={`h-16 px-8 flex items-center justify-between z-20 ${focusMode ? 'text-white/50' : 'text-gray-500'}`}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest border border-current px-2 py-0.5 rounded-md">{data.module}</span>
                    <h2 className={`text-lg font-semibold tracking-tight ${focusMode ? 'text-white' : 'text-gray-900'}`}>{data.subTitle}</h2>
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

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all">
                            <div className="h-full w-1/3 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
                            </div>
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
            <div className="flex-1 overflow-y-auto px-6 pb-20">
                {/* Catalog View */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4 mt-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">{data.title}</h3>
                        {data.chapters.map((chapter: any, idx: number) => (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                    chapter.active 
                                    ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${chapter.active ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {chapter.active ? <Play size={16} fill="currentColor"/> : <CheckCircle size={16} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${chapter.active ? 'text-blue-900' : 'text-gray-700'}`}>
                                            {chapter.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">{chapter.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-red-500">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{res.name}</p>
                                            <p className="text-xs text-gray-400">{res.size}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
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
                        <p className="text-[10px] text-gray-500 truncate">针对当前“{data.subTitle}”有疑问？</p>
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