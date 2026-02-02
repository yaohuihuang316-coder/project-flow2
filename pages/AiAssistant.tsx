
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Eraser, Lightbulb } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabaseClient';

interface AiAssistantProps {
    currentUser?: UserProfile | null;
}

// Helper for Safe Env Access (Reused)
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) { }
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env.VITE_GEMINI_API_KEY;
        }
    } catch (e) { }
    return null;
};

const AiAssistant: React.FC<AiAssistantProps> = ({ currentUser }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'ai',
            content: `你好 ${currentUser?.name || '探索者'}！我是 ProjectFlow 智能助手。我可以协助你进行项目管理知识解答、文档撰写、风险分析等工作。今天想聊点什么？`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    // Fetch user learning context from Supabase
    const buildUserContext = async (user: any) => {
        if (!user) return { activeCourse: null, lastChapter: null, progressPercent: 0 };

        try {
            const { data, error } = await supabase
                .from('app_user_progress')
                .select('*, app_courses(*)')
                .eq('user_id', user.id)
                .order('last_accessed', { ascending: false })
                .limit(1);

            if (error || !data || data.length === 0) {
                return { activeCourse: null, lastChapter: null, progressPercent: 0 };
            }

            const progress = data[0];
            const completedChapters = progress.completed_chapters || [];
            const lastChapter = completedChapters.length > 0
                ? completedChapters[completedChapters.length - 1]
                : null;

            return {
                activeCourse: progress.app_courses,
                lastChapter: lastChapter,
                progressPercent: progress.progress || 0
            };
        } catch (err) {
            console.error('Context fetch error:', err);
            return { activeCourse: null, lastChapter: null, progressPercent: 0 };
        }
    };

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim()) return;

        // 1. User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        // 2. AI Placeholder
        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: aiMsgId,
            role: 'ai',
            content: '',
            timestamp: new Date()
        }]);

        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Missing");

            const ai = new GoogleGenAI({ apiKey });

            // Build user context
            const userContext = await buildUserContext(currentUser);

            // Dynamic System Instruction based on user context
            const systemPrompt = `你是 ProjectFlow AI 智能助手，专业的企业项目管理顾问。

**用户信息**:
- 姓名: ${currentUser?.name || '用户'}
- 角色: ${currentUser?.role || 'Student'}
- 当前 XP: ${currentUser?.xp || 0} 点
- 连续学习: ${currentUser?.streak || 0} 天
${userContext.activeCourse ? `- 正在学习: ${userContext.activeCourse.title}` : ''}
${userContext.lastChapter ? `- 最近完成: ${userContext.lastChapter}` : ''}
${userContext.progressPercent > 0 ? `- 课程进度: ${userContext.progressPercent}%` : ''}

**你的职责**:
1. 根据用户当前学习进度，提供个性化的项目管理知识解答
2. 如果用户正在学习某个课程，优先解答该课程相关的概念和问题
3. 结合用户的 XP 和角色，提供适当难度的内容建议
4. 使用 Markdown 格式，保持专业、简洁、结构化的回答风格
5. 适时推荐下一步学习方向或实践项目

**回答准则**:
- 对于初学者 (XP < 500): 侧重基础概念解释和实例演示
- 对于进阶者 (XP 500-2000): 提供深度分析和最佳实践
- 对于专家 (XP > 2000): 讨论高级应用场景和战略决策

请始终保持友好、专业的态度，鼓励用户持续学习和实践。`;

            // Using gemini-3-flash-preview for general purpose
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: [{ text: text }] }
                ],
                config: {
                    systemInstruction: systemPrompt,
                }
            });

            setIsThinking(false);

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId
                        ? { ...msg, content: msg.content + chunkText }
                        : msg
                ));
            }
        } catch (err: any) {
            console.error("Gemini Error:", err);
            setIsThinking(false);
            const errorMsg = err.message.includes("API Key")
                ? "⚠️ 错误：未配置 API Key。请检查 .env 文件。"
                : "⚠️ 连接中断，请稍后再试。";

            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg
            ));
        }
    };

    const handleClearChat = () => {
        if (window.confirm("确定要清空对话记录吗？")) {
            setMessages([messages[0]]); // Keep greeting
        }
    };

    const quickPrompts = [
        { icon: Lightbulb, text: "解释关键路径法 (CPM)", emoji: "🛤️" },
        { icon: Lightbulb, text: "如何编写项目章程？", emoji: "📋" },
        { icon: Lightbulb, text: "什么是挣值管理 (EVM)？", emoji: "📊" },
    ];

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Header with Glassmorphism */}
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg px-6 py-4 relative z-10">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
                                <Sparkles className="text-white" size={22} />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI 智能助手</h2>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Google Gemini 3.0 Flash
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-xl border border-white/30 hover:border-gray-200 transition-all shadow-sm hover:shadow-md"
                    >
                        <Eraser size={16} />
                        <span className="hidden sm:inline">清空对话</span>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 relative z-10">
                <div className="max-w-5xl mx-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Bot size={20} className="text-white" />
                                </div>
                            )}
                            <div className={`max-w-[85%] sm:max-w-2xl ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25'
                                    : 'bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl'
                                } rounded-3xl px-5 py-4 transition-all hover:scale-[1.02]`}>
                                {msg.role === 'ai' && msg.content === '' ? (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="text-sm font-medium">正在思考...</span>
                                    </div>
                                ) : (
                                    <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'} prose prose-sm max-w-none`}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <User size={20} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-4 justify-start animate-fadeIn">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl px-5 py-4 shadow-xl">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Loader2 className="animate-spin" size={18} />
                                    <span className="text-sm font-medium">AI 正在思考...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
                <div className="px-4 sm:px-6 pb-6 relative z-10 animate-fadeIn">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Lightbulb size={16} className="text-yellow-500" />
                            快速开始探索
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(prompt.text)}
                                    className="group flex items-center gap-3 p-4 bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl hover:border-purple-300 hover:bg-white/90 hover:shadow-xl transition-all text-left transform hover:scale-105"
                                >
                                    <div className="text-3xl transform group-hover:scale-110 transition-transform">{prompt.emoji}</div>
                                    <span className="text-sm font-medium text-gray-800 group-hover:text-purple-700 transition-colors">{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area with Glassmorphism */}
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-t border-white/20 shadow-lg px-4 sm:px-6 py-5 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="输入您的问题，比如：如何编写项目计划？"
                                className="w-full resize-none bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:shadow-md transition-all placeholder:text-gray-400"
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isThinking}
                            className="px-5 sm:px-7 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 font-medium"
                        >
                            <Send size={20} />
                            <span className="hidden sm:inline">发送</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-gray-200/50 rounded text-[10px] font-mono">Enter</kbd>
                        发送消息
                        <span className="text-gray-400">•</span>
                        <kbd className="px-2 py-1 bg-gray-200/50 rounded text-[10px] font-mono">Shift + Enter</kbd>
                        换行
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AiAssistant;
