
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Eraser, Lightbulb, AlertTriangle, Crown } from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabaseClient';
import { 
  AI_MODELS, 
  canUseAIModel, 
  getAvailableModels, 
  getUsageLimitMessage,
  getGeminiApiKey,
  AI_DAILY_LIMITS
} from '../lib/ai-config';

interface AiAssistantProps {
    currentUser?: UserProfile | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentUser }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedModel, setSelectedModel] = useState<'basic' | 'pro'>('basic');
    const [usage, setUsage] = useState({ used: 0, limit: 0, resetAt: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const userTier = currentUser?.membershipTier || 'free';
    const canUseAI = userTier !== 'free';
    const canUseProModel = canUseAIModel(userTier, 'pro');
    const availableModels = getAvailableModels(userTier);

    // 初始化消息和获取使用量
    useEffect(() => {
        if (currentUser) {
            setMessages([{
                id: '0',
                role: 'ai',
                content: `你好 ${currentUser.name || '探索者'}！我是 ProjectFlow AI助手。我可以协助你进行项目管理知识解答、文档撰写、风险分析等工作。${!canUseAI ? '请先升级会员以使用AI功能。' : ''}`,
                timestamp: new Date()
            }]);

            // 获取今日使用量
            fetchUsage();
        }
    }, [currentUser]);

    // 获取使用量
    const fetchUsage = async () => {
        if (!currentUser) return;
        
        const limit = AI_DAILY_LIMITS[userTier];
        
        // 检查是否需要重置
        if (currentUser.aiDailyResetAt && new Date(currentUser.aiDailyResetAt) < new Date()) {
            await supabase
                .from('app_users')
                .update({ ai_daily_used: 0 })
                .eq('id', currentUser.id);
        }
        
        setUsage({
            used: currentUser.aiDailyUsed || 0,
            limit,
            resetAt: currentUser.aiDailyResetAt || ''
        });
    };

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // 记录使用量
    const recordUsage = async (model: string, tokens: number) => {
        if (!currentUser) return;
        
        await supabase.from('app_ai_usage').insert({
            user_id: currentUser.id,
            model,
            prompt_tokens: Math.floor(tokens * 0.3),
            completion_tokens: Math.floor(tokens * 0.7)
        });
        
        // 更新用户日使用量
        await supabase
            .from('app_users')
            .update({ ai_daily_used: (currentUser.aiDailyUsed || 0) + 1 })
            .eq('id', currentUser.id);
            
        setUsage(prev => ({ ...prev, used: prev.used + 1 }));
    };

    // 发送消息
    const handleSendMessage = async (text: string = input) => {
        if (!text.trim() || !currentUser || !canUseAI) return;
        
        // 检查是否超过限制
        if (usage.used >= usage.limit) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: '⚠️ 今日AI调用已达上限，请明天再试或升级会员。',
                timestamp: new Date()
            }]);
            return;
        }

        // 检查是否有权限使用选定模型
        if (selectedModel === 'pro' && !canUseProModel) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: '⚠️ Kimi 2.5 需要 Pro+ 会员才能使用。请切换到 Gemini Flash 或升级会员。',
                timestamp: new Date()
            }]);
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: aiMsgId,
            role: 'ai',
            content: '',
            timestamp: new Date()
        }]);

        try {
            const modelConfig = AI_MODELS[selectedModel];
            
            if (selectedModel === 'basic') {
                // 使用 Gemini
                const apiKey = getGeminiApiKey();
                if (!apiKey) {
                    throw new Error('API Key 未配置');
                }

                const ai = new GoogleGenAI({ apiKey });
                
                const systemPrompt = `你是 ProjectFlow AI 智能助手，专业的企业项目管理顾问。
用户信息:
- 姓名: ${currentUser.name || '用户'}
- 角色: ${currentUser.role || 'Student'}
- 当前等级: ${userTier}

请提供简洁、专业的回答。`;

                const responseStream = await ai.models.generateContentStream({
                    model: modelConfig.id,
                    contents: [{ role: 'user', parts: [{ text }] }],
                    config: { systemInstruction: systemPrompt }
                });

                setIsThinking(false);
                let totalTokens = 0;

                for await (const chunk of responseStream) {
                    const chunkText = chunk.text || '';
                    totalTokens += chunkText.length;
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMsgId
                            ? { ...msg, content: msg.content + chunkText }
                            : msg
                    ));
                }

                await recordUsage(modelConfig.id, totalTokens);
            } else {
                // Pro 模型 - Kimi (这里简化处理，实际接入 Moonshot API)
                setIsThinking(false);
                
                // 模拟 Kimi 响应
                setTimeout(async () => {
                    const response = `【Kimi 2.5 深度分析】\n\n关于 "${text}" 的问题，我为您提供以下专业分析：\n\n1. **核心概念解析**\n   - 这是项目管理中的关键议题\n   - 涉及多个知识领域的交叉\n\n2. **最佳实践建议**\n   - 建议采用渐进式实施策略\n   - 注重团队协作和沟通\n\n3. **常见 pitfalls**\n   - 避免过度规划\n   - 保持灵活性\n\n如需更深入的分析，请提供更多背景信息。`;
                    
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMsgId
                            ? { ...msg, content: response }
                            : msg
                    ));
                    
                    await recordUsage(modelConfig.id, response.length);
                }, 2000);
            }
        } catch (err: any) {
            setIsThinking(false);
            const errorMsg = err.message.includes('API Key')
                ? '⚠️ 错误：未配置 API Key。请联系管理员。'
                : '⚠️ 连接中断，请稍后再试。';

            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg
            ));
        }
    };

    const handleClearChat = () => {
        if (window.confirm('确定要清空对话记录吗？')) {
            setMessages([messages[0]]);
        }
    };

    const quickPrompts = [
        { text: '解释关键路径法 (CPM)', emoji: '🛤️' },
        { text: '如何编写项目章程？', emoji: '📋' },
        { text: '什么是挣值管理 (EVM)？', emoji: '📊' },
        { text: '敏捷 vs 瀑布，如何选择？', emoji: '🔄' },
    ];

    // 使用限制提示
    const usageMessage = getUsageLimitMessage(usage.used, usage.limit, usage.resetAt);

    // 如果没有AI权限
    if (!canUseAI) {
        return (
            <div className="h-screen flex flex-col pt-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Crown size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">会员专属功能</h2>
                        <p className="text-gray-500 mb-6">
                            AI 助手是会员专属功能。升级会员即可使用 Gemini Flash 智能助手，
                            获得项目管理知识解答、文档撰写等专业服务。
                        </p>
                        <button 
                            onClick={() => window.location.href = '/membership'}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                        >
                            查看会员权益
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h2 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI 智能助手
                            </h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {AI_MODELS[selectedModel].name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 模型选择器 */}
                        {availableModels.length > 1 && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value as 'basic' | 'pro')}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="basic">⚡ Gemini Flash</option>
                                <option value="pro">🧠 Kimi 2.5</option>
                            </select>
                        )}

                        {/* 使用量显示 */}
                        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                            usageMessage.type === 'exceeded' ? 'bg-red-100 text-red-700' :
                            usageMessage.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            <AlertTriangle size={12} />
                            {usageMessage.message}
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

            {/* Messages Area - 使用 flex-1 和 overflow 确保正确滚动 */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6"
            >
                <div className="max-w-5xl mx-auto space-y-5">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <Bot size={16} className="text-white" />
                                </div>
                            )}
                            
                            <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'bg-white border border-gray-100 shadow-sm'
                            }`}>
                                {msg.role === 'ai' && msg.content === '' ? (
                                    <div className="flex items-center gap-2 text-gray-500 py-1">
                                        <Loader2 className="animate-spin" size={16} />
                                        <span className="text-sm">思考中...</span>
                                    </div>
                                ) : (
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user' ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                            
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <User size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isThinking && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
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

            {/* Quick Prompts */}
            {messages.length === 1 && (
                <div className="flex-shrink-0 px-4 sm:px-6 pb-4">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Lightbulb size={16} className="text-yellow-500" />
                            快速开始探索
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(prompt.text)}
                                    className="group flex items-center gap-2 p-3 bg-white/70 border border-white/50 rounded-xl hover:border-purple-300 hover:bg-white hover:shadow-md transition-all text-left"
                                >
                                    <span className="text-lg">{prompt.emoji}</span>
                                    <span className="text-sm font-medium text-gray-800 group-hover:text-purple-700 truncate">
                                        {prompt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area - 固定在底部 */}
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/70 border-t border-white/20 px-4 sm:px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    {/* 移动端使用量提示 */}
                    <div className={`sm:hidden mb-2 text-xs ${
                        usageMessage.type === 'exceeded' ? 'text-red-600' :
                        usageMessage.type === 'warning' ? 'text-amber-600' :
                        'text-gray-500'
                    }`}>
                        {usageMessage.message}
                    </div>
                    
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
                                placeholder={usage.used >= usage.limit ? "今日调用已达上限" : "输入您的问题，比如：如何编写项目计划？"}
                                disabled={usage.used >= usage.limit}
                                className="w-full resize-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm placeholder:text-gray-400 text-sm"
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isThinking || usage.used >= usage.limit}
                            className="px-5 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">Enter</kbd>
                            发送
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">Shift + Enter</kbd>
                            换行
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
