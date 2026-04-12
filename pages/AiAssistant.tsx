import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Eraser, Lightbulb, AlertTriangle } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
    createDeepSeekCompletion,
    DEFAULT_DEEPSEEK_MODEL,
    getDeepSeekApiKey,
    mapDeepSeekError,
} from '../lib/deepseekService';

interface AiAssistantProps {
    currentUser?: UserProfile | null;
}

type ModelKey = 'deepseek';

interface AIModelDefinition {
    name: string;
    icon: string;
    id: string;
}

const MODELS: Record<ModelKey, AIModelDefinition> = {
    deepseek: {
        name: 'DeepSeek 智能助手',
        icon: '🧠',
        id: DEFAULT_DEEPSEEK_MODEL,
    },
};

const DAILY_LIMITS = {
    free: 0,
    pro: 20,
    pro_plus: 50,
};

const QUICK_PROMPTS = [
    { text: '解释关键路径法（CPM）是什么，以及适合用在什么场景。', emoji: '📈' },
    { text: '帮我写一份简洁的项目章程模板。', emoji: '📝' },
    { text: '挣值管理（EVM）到底怎么理解？', emoji: '📊' },
    { text: '敏捷和瀑布应该怎么选？', emoji: '🚀' },
];

const VERSION = '2.2';

const buildSystemPrompt = (currentUser: UserProfile, userTier: string) => `你是 ProjectFlow 的 AI 智能助手，擅长项目管理知识解答、文档撰写、风险分析与学习辅导。

当前用户信息：
- 姓名：${currentUser.name || '用户'}
- 角色：${currentUser.role || 'Student'}
- 会员等级：${userTier}

请使用简洁、专业、鼓励式的中文回答。`;

const getWelcomeMessage = (currentUser: UserProfile, userTier: string) => {
    const name = currentUser.name || '探索者';

    if (userTier === 'pro_plus') {
        return `你好，${name}。你的增强版 AI 助手已经就绪，可以继续帮你完成项目管理问答、文档写作、学习辅导和更深入的分析整理。`;
    }

    return `你好，${name}。你的 AI 助手已经就绪，可以继续帮你处理项目管理问答、文档写作和学习辅导。`;
};

const AiAssistant: React.FC<AiAssistantProps> = ({ currentUser }) => {
    console.log('AI Assistant Version:', VERSION);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelKey>('deepseek');
    const [usage, setUsage] = useState({ used: 0, limit: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userTier = currentUser?.membershipTier || 'free';
    const canUseAI = userTier !== 'free';
    const hasDeepSeekKey = Boolean(getDeepSeekApiKey());
    const availableModels: ModelKey[] = canUseAI && hasDeepSeekKey ? ['deepseek'] : [];
    const activeModelKey = availableModels.includes(selectedModel) ? selectedModel : 'deepseek';
    const activeModel = MODELS[activeModelKey];

    useEffect(() => {
        console.log('AI Assistant mounted:', {
            version: VERSION,
            userTier,
            canUseAI,
            activeModel: activeModelKey,
        });
    }, [userTier, canUseAI, activeModelKey]);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        setMessages([
            {
                id: '0',
                role: 'ai',
                content: getWelcomeMessage(currentUser, userTier),
                timestamp: new Date(),
            },
        ]);
        setUsage({
            used: currentUser.aiDailyUsed || 0,
            limit: DAILY_LIMITS[userTier],
        });
    }, [currentUser, userTier]);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        setMessages(prev =>
            prev.length > 0
                ? [{ ...prev[0], content: getWelcomeMessage(currentUser, userTier) }, ...prev.slice(1)]
                : prev
        );
    }, [currentUser, userTier]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim() || !currentUser || !canUseAI) {
            return;
        }

        if (usage.used >= usage.limit) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: '⚠️ 今日 AI 调用次数已达上限，请明天再试或升级会员。',
                    timestamp: new Date(),
                },
            ]);
            return;
        }

        if (availableModels.length === 0) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: '⚠️ 当前没有可用的 DeepSeek 配置，请先检查 VITE_DEEPSEEK_API_KEY。',
                    timestamp: new Date(),
                },
            ]);
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [
            ...prev,
            {
                id: aiMsgId,
                role: 'ai',
                content: '',
                timestamp: new Date(),
            },
        ]);

        try {
            const aiResponse = await createDeepSeekCompletion({
                model: activeModel.id as typeof DEFAULT_DEEPSEEK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(currentUser, userTier),
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
            });

            setIsThinking(false);
            setMessages(prev =>
                prev.map(msg => (msg.id === aiMsgId ? { ...msg, content: aiResponse } : msg))
            );

            await supabase.from('app_ai_usage').insert({
                user_id: currentUser.id,
                model: activeModel.id,
                prompt_tokens: Math.floor(text.length * 0.3),
                completion_tokens: Math.floor(aiResponse.length * 0.7),
            });

            await supabase
                .from('app_users')
                .update({ ai_daily_used: (currentUser.aiDailyUsed || 0) + 1 })
                .eq('id', currentUser.id);

            setUsage(prev => ({ ...prev, used: prev.used + 1 }));
        } catch (error) {
            setIsThinking(false);

            const errorMsg = mapDeepSeekError(
                error,
                '⚠️ DeepSeek API Key 未配置，请检查 VITE_DEEPSEEK_API_KEY。'
            );

            setMessages(prev =>
                prev.map(msg => (msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg))
            );
        }
    };

    const handleClearChat = () => {
        if (window.confirm('确定要清空对话记录吗？')) {
            setMessages(prev => (prev.length > 0 ? [prev[0]] : []));
        }
    };

    if (!canUseAI) {
        return (
            <div className="h-screen flex flex-col pt-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles size={40} className="text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">会员专属功能</h2>
                        <p className="text-gray-500 mb-6">
                            AI 助手是会员专属功能。升级会员后即可使用 DeepSeek 智能问答与分析能力。
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI 智能助手
                            </h2>
                            <p className="text-xs text-gray-500">
                                {activeModel.name}
                                {availableModels.length === 0 ? '（未配置）' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={activeModelKey}
                            onChange={e => setSelectedModel(e.target.value as ModelKey)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={availableModels.length === 0}
                        >
                            <option value="deepseek">🧠 DeepSeek 智能助手</option>
                        </select>

                        <div
                            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                                usage.used >= usage.limit
                                    ? 'bg-red-100 text-red-700'
                                    : usage.used >= usage.limit * 0.8
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            <AlertTriangle size={12} />
                            {usage.used}/{usage.limit}
                        </div>

                        <button
                            onClick={handleClearChat}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="清空对话"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-5xl mx-auto space-y-5">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <Bot size={16} className="text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-3 ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md'
                                        : 'bg-white border border-gray-100 shadow-sm'
                                }`}
                            >
                                {msg.role === 'ai' && msg.content === '' ? (
                                    <div className="flex items-center gap-2 text-gray-500 py-1">
                                        <Loader2 className="animate-spin" size={16} />
                                        <span className="text-sm">思考中...</span>
                                    </div>
                                ) : (
                                    <div
                                        className={`text-sm leading-relaxed whitespace-pre-wrap ${{ msg.role === 'user' ? 'text-white' : 'text-gray-800' }}`}
                                    >
                                        {msg.content}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                                    <User size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-sm">DeepSeek 正在思考...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {messages.length === 1 && (
                <div className="flex-shrink-0 px-4 sm:px-6 pb-4">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Lightbulb size={16} className="text-yellow-500" />
                            快速开始揢�6�
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button key={idx} onClick={() => handleSendMessage(prompt.text)} className="group flex items-center gap-2 p-3 bg-white/70 border border-white/50 rounded-xl hover:border-purple-300 hover:bg-white hover:shadow-md transition-all text-left">
                                    <span className="text-lg">{prompt.emoji}</span>
                                    <span className="text-sm font-medium text-gray-800 group-hover:text-purple-700 truncate">{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-t border-white/20 px-4 sm:px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={ availableModels.length === 0 ? '当前未配置可用 DeepSeek 模垉' : usage.used >= usage.limit ? '今旧胳用次数已达上馐用' : '输入你的问题，例如：如何编写项目计划？' } disabled={usage.used >= usage.limit || availableModels.length === 0} className="w-full resize-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm placeholder:text-gray-400 text-sm" rows={2} />
                        </div>
                        <button onClick={() => handleSendMessage()} disabled={!input.trim() || isThinking || usage.used >= usage.limit || availableModels.length === 0} className="px-5 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"><Send size={18} /></button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-3"><span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">Enter</kbd>发送</span><span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">Shift + Enter</kbd>换行</span></p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
