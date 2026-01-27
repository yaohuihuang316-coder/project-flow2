
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
            content: `Hello ${currentUser?.name || 'Explorer'}! I am the ProjectFlow AI Assistant. I can help you with project management knowledge, documentation, risk analysis, and more. What would you like to discuss today?`,
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
            const systemPrompt = `You are ProjectFlow AI, an expert Enterprise Project Management assistant.

**User Profile**:
- Name: ${currentUser?.name || 'User'}
- Role: ${currentUser?.role || 'Student'}  
- XP: ${currentUser?.xp || 0} points
- Streak: ${currentUser?.streak || 0} days
${userContext.activeCourse ? `- Current Course: ${userContext.activeCourse.title}` : ''}
${userContext.lastChapter ? `- Last Completed: ${userContext.lastChapter}` : ''}
${userContext.progressPercent > 0 ? `- Progress: ${userContext.progressPercent}%` : ''}

**Your Responsibilities**:
1. Provide personalized PM knowledge based on user's current learning progress
2. If user is taking a course, prioritize content related to that course
3. Adjust answer complexity based on user's XP and role
4. Use Markdown formatting for professional, concise, structured answers
5. Suggest next learning steps or practice projects when appropriate

**Answer Guidelines**:
- Beginners (XP < 500): Focus on basic concepts with examples
- Intermediate (XP 500-2000): Provide in-depth analysis and best practices
- Advanced (XP > 2000): Discuss advanced applications and strategic decisions

Always be friendly, professional, and encourage continuous learning.`;

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
                ? "Error: API Key not configured. Please check your .env file."
                : "Connection interrupted. Please try again later.";

            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg
            ));
        }
    };

    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to clear the chat history?")) {
            setMessages([messages[0]]); // Keep greeting
        }
    };

    const quickPrompts = [
        { icon: Lightbulb, text: "Explain Critical Path Method", emoji: "🛤️" },
        { icon: Lightbulb, text: "How to write a project charter?", emoji: "📋" },
        { icon: Lightbulb, text: "What is Earned Value Management?", emoji: "📊" },
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
                            <h2 className="font-bold text-gray-900">AI Assistant</h2>
                            <p className="text-xs text-gray-500">Powered by Google Gemini</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Eraser size={16} />
                        Clear Chat
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
                                        <span className="text-sm">Thinking...</span>
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
                                    <span className="text-sm">AI is thinking...</span>
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
                        <p className="text-sm text-gray-500 mb-3">Quick prompts:</p>
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
                            placeholder="Ask me anything about project management..."
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
                    <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
