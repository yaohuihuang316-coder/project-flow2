
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Minimize2, Maximize2, FileText, Download, Send, Loader2, AlertCircle, Save, Check, ChevronLeft, ExternalLink, Bot, X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

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

  // AI Chat State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'ai', content: '你好！我是你的 AI 助教。关于这节课的内容，有什么可以帮你的吗？', timestamp: new Date() }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Data State
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gemini Client Init
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  
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
                    { name: '课程讲义(示例).pdf', size: '2.4 MB', type: 'pdf', url: '' },
                    { name: '实战源码(示例).zip', size: '15 MB', type: 'zip', url: '' },
                    { name: '参考资料(示例).txt', size: '1 KB', type: 'txt', url: '' }
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

  // Scroll to bottom of chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiOpen]);

  // 3. Save Notes Handler (Real Integration)
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

  // Auto-save debounce
  useEffect(() => {
      const timer = setTimeout(() => {
          if (noteContent && currentUser && data) {
             handleSaveNote(); 
          }
      }, 5000); // 5s auto-save
      return () => clearTimeout(timer);
  }, [noteContent]);

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
  const handleDownload = (resource: any) => {
      if (resource.url && resource.url.startsWith('http')) {
          const link = document.createElement('a');
          link.href = resource.url;
          link.target = '_blank'; 
          link.setAttribute('download', resource.name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } else {
          const content = `这是 ${resource.name} 的模拟文件内容。\n\nProjectFlow Learning Resource\nCourse ID: ${data.id}\n\n(请在后台配置真实下载链接)`;
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = resource.name; 
          document.body.appendChild(link);
          link.click();
          
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }
  };

  // 6. Real AI Chat Handler (Gemini Streaming)
  const handleSendMessage = async () => {
      if (!aiInput.trim()) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: aiInput,
          timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, userMsg]);
      const currentInput = aiInput;
      setAiInput('');
      setIsAiThinking(true);

      // Create AI message placeholder
      const aiMsgId = (Date.now() + 1).toString();
      setChatMessages(prev => [...prev, {
          id: aiMsgId,
          role: 'ai',
          content: '', // Start empty
          timestamp: new Date()
      }]);

      try {
        if (!apiKey) {
            console.error("❌ ERROR: API Key is missing. Please create a .env file and set VITE_GEMINI_API_KEY.");
            throw new Error("API Key is missing (Check Console)");
        }
        
        console.log("🚀 Initializing Gemini with Key: ", apiKey.substring(0, 5) + "...");

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // Use Streaming
        // Switched to 'gemini-3-flash-preview' as per instructions to fix 404
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview', 
            contents: [
                { role: 'user', parts: [{ text: `Context: User is learning the course "${data?.title}".` }] },
                { role: 'user', parts: [{ text: currentInput }] }
            ],
            config: {
                systemInstruction: "You are a helpful, professional AI teaching assistant for an Enterprise Project Management Learning System. Keep answers concise, encouraging, and relevant to the course context.",
            }
        });

        setIsAiThinking(false);

        for await (const chunk of responseStream) {
            const chunkText = chunk.text; 
            setChatMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                ? { ...msg, content: msg.content + chunkText }
                : msg
            ));
        }

      } catch (err: any) {
          console.error("Gemini Error Detail:", err);
          setIsAiThinking(false);
          
          let errorMsg = "抱歉，我现在无法连接到大脑。";
          if (err.message.includes("API Key")) {
              errorMsg = "⚠️ 错误：未配置 API Key。请在项目根目录创建 .env 文件并添加 VITE_GEMINI_API_KEY。";
          } else if (err.message.includes("404")) {
              errorMsg = "⚠️ 模型未找到。系统已尝试切换模型，请刷新页面重试。";
          } else if (err.message.includes("429")) {
              errorMsg = "⚠️ 服务繁忙 (429)：AI 助教当前请求过多，请稍后再试。";
          } else if (err.message.includes("fetch")) {
              errorMsg = "⚠️ 网络错误：无法连接到 Google API，请检查网络设置。";
          }

          setChatMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
            ? { ...msg, content: errorMsg }
            : msg
        ));
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
                            <span className={`text-xs font-medium transition-colors ${noteStatus.includes('已同步') ? 'text-green-600' : 'text-gray-400'}`}>
                                {noteStatus || (noteContent ? '未保存更改' : '')}
                            </span>
                            <button 
                                onClick={handleSaveNote}
                                disabled={isSavingNote || !currentUser}
                                className="text-xs font-bold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSavingNote ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                                {isSavingNote ? 'Saving' : 'Save'}
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
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{res.name}</p>
                                            <p className="text-xs text-gray-400">{res.size} • {res.type?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownload(res)}
                                        className={`p-2 rounded-full transition-colors active:scale-95 ${
                                            res.url ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                        }`}
                                        title={res.url ? "下载真实文件" : "下载模拟文件"}
                                    >
                                        {res.url ? <ExternalLink size={18} /> : <Download size={18} />}
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

            {/* AI Assistant Trigger Button */}
            {!isAiOpen && (
                <div className="absolute bottom-6 left-6 right-6">
                    <div 
                        onClick={() => setIsAiOpen(true)}
                        className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1 flex items-center gap-2 transform transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Bot size={20} fill="currentColor" />
                        </div>
                        <div className="flex-1 px-2">
                            <p className="text-xs font-bold text-gray-900">AI 助教</p>
                            <p className="text-[10px] text-gray-500 truncate">点击展开对话...</p>
                        </div>
                        <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white mr-1 hover:bg-gray-800">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* AI Chat Interface (Slide-up Overlay) */}
            <div className={`absolute inset-x-0 bottom-0 top-16 bg-white z-40 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isAiOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                             <Bot size={16} />
                         </div>
                         <div>
                             <h3 className="font-bold text-gray-900 text-sm">AI 助教</h3>
                             <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online (Gemini 3 Flash)
                             </p>
                         </div>
                     </div>
                     <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                         <X size={20} />
                     </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9FAFB]">
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] shrink-0 mr-2 mt-2">
                                    <Bot size={12}/>
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] shrink-0 mr-2 mt-2">
                                <Bot size={12}/>
                             </div>
                             <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                             </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent pl-4 text-sm outline-none placeholder:text-gray-400"
                            placeholder="输入你的问题..."
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!aiInput.trim() || isAiThinking}
                            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Classroom;
