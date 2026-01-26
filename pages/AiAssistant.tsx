
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Eraser, Lightbulb } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AiAssistantProps {
    currentUser?: UserProfile | null;
}

// Helper for Safe Env Access (Reused)
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {}
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) {}
    return '';
};

const SUGGESTIONS = [
    "如何制定 PMP 备考计划？",
    "解释一下敏捷开发的 4 大宣言",
    "遇到项目范围蔓延怎么办？",
    "生成一份项目启动会 (Kick-off) 议程"
];

const AiAssistant: React.FC<AiAssistantProps> = ({ currentUser }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            id: 'init', 
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
            
            // Using gemini-3-flash-preview for general purpose
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [
                    { role: 'user', parts: [{ text: text }] }
                ],
                config: {
                    systemInstruction: "You are an expert Enterprise Project Management AI Assistant named 'ProjectFlow AI'. Help users with project planning, PMP knowledge, risk analysis, and team management. Keep answers professional, concise, and structured. Use Markdown for formatting.",
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

    return (
        <div className="pt-20 pb-20 md:pt-24 px-4 sm:px-8 max-w-5xl mx-auto h-screen flex flex-col">
            
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-blue-600 fill-blue-100" /> AI 智能助手
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">基于 Google Gemini 3.0 • 您的私人 PM 专家</p>
                </div>
                <button 
                    onClick={handleClearChat}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                    title="清空对话"
                >
                    <Eraser size={16}/> <span className="hidden sm:inline">清空</span>
                </button>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col relative animate-fade-in-up">
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${
                                msg.role === 'ai' 
                                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                                {msg.role === 'ai' ? <Bot size={20}/> : <User size={20}/>}
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                    msg.role === 'user' 
                                    ? 'bg-black text-white rounded-tr-sm' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1 opacity-70">
                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                                <Bot size={20}/>
                            </div>
                            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">正在思考...</span>
                                <Loader2 size={14} className="animate-spin text-blue-600"/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    {/* Suggestions */}
                    {messages.length < 3 && !isThinking && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 custom-scrollbar">
                            {SUGGESTIONS.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSendMessage(s)}
                                    className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl text-xs font-bold border border-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <Lightbulb size={12}/> {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent pl-4 text-sm outline-none placeholder:text-gray-400 font-medium h-10"
                            placeholder="输入您的问题 (Enter 发送)..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSendMessage()}
                            autoFocus
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isThinking}
                            className="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md active:scale-95"
                        >
                            {isThinking ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5"/>}
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">AI 可能会犯错。请核查重要信息。</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
