
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
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">AI 智能助手</h2>
                            <p className="text-xs text-gray-500">基于 Google Gemini 3.0</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Eraser size={16} />
                        清空对话
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Bot size={18} className="text-white" />
                                </div>
                            )}
                            <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-5 py-4 shadow-sm`}>
                                {msg.role === 'ai' && msg.content === '' ? (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Loader2 className="animate-spin" size={16} />
                                        <span className="text-sm">思考中...</span>
                                    </div>
                                ) : (
                                    <div className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-gray-800'} prose prose-sm max-w-none`}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                    <User size={18} className="text-gray-700" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-4 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-sm">AI 正在思考...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Prompts (shown when no messages) */}
            {messages.length === 1 && (
                <div className="px-6 pb-4">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-sm text-gray-500 mb-3">快速提示：</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(prompt.text)}
                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
                                >
                                    <span className="text-2xl">{prompt.emoji}</span>
                                    <span className="text-sm text-gray-700">{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
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
                            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isThinking}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">按 Enter 发送，Shift+Enter 换行</p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
