
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Loader2, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface KnowledgeAIChatProps {
  currentNode?: {
    name: string;
    description: string;
    category: string;
  } | null;
  onClose: () => void;
}

const KnowledgeAIChat: React.FC<KnowledgeAIChatProps> = ({ currentNode, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初始化欢迎消息
    if (messages.length === 0) {
      const welcomeMsg = currentNode 
        ? `你好！我是你的知识图谱AI助手。你对"${currentNode.name}"有什么想了解的吗？我可以帮你解释概念、推荐学习资源，或者规划学习路径。`
        : '你好！我是你的知识图谱AI助手。在知识图谱中选择任意节点，我可以为你提供个性化的学习指导和答疑。';
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMsg,
        timestamp: new Date()
      }]);
    }
  }, [currentNode]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 模拟AI响应（实际项目中接入真实的AI API）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = generateAIResponse(input, currentNode);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI响应错误:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，我暂时无法回答这个问题。请稍后再试。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (question: string, node: any): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('前置') || lowerQ.includes('先学什么')) {
      return `学习"${node?.name}"之前，建议先掌握：\n1. 项目管理基础概念\n2. 相关过程组知识\n\n你可以在知识图谱中查看紫色连线的前置节点。`;
    }
    
    if (lowerQ.includes('资源') || lowerQ.includes('课程') || lowerQ.includes('视频')) {
      return `推荐的学习资源：\n📹 视频课程：${node?.name}精讲（约45分钟）\n📄 文档：官方指南第3章\n🎯 练习：10道精选练习题\n\n点击"开始学习"按钮即可访问。`;
    }
    
    if (lowerQ.includes('路径') || lowerQ.includes('规划')) {
      return `基于你的当前进度，推荐的学习路径：\n\n📍 当前位置：${node?.name}\n🎯 下一步：建议学习相关进阶知识\n⏱️ 预计时间：${node?.estimatedHours || 3}小时\n\n保持每天学习的节奏，预计1周内可以掌握！`;
    }
    
    if (lowerQ.includes('难') || lowerQ.includes('简单')) {
      const difficulty = node?.difficulty || 2;
      const levels = ['入门级', '简单', '中等', '较难', '专家级'];
      return `"${node?.name}"的难度评级是：${levels[difficulty - 1] || '中等'}\n\n💡 学习建议：\n- 循序渐进，先掌握基础概念\n- 结合实例练习加深理解\n- 遇到问题随时问我！`;
    }
    
    return `关于"${node?.name}"，这是一个${node?.category === 'foundation' ? '基础' : node?.category === 'advanced' ? '进阶' : '专家级'}知识点。\n\n${node?.description}\n\n💡 小贴士：在知识图谱中，你可以：\n- 点击查看前置知识（紫色连线）\n- 查看学习进度（绿色进度环）\n- 规划最优学习路径\n\n还有什么想了解的吗？`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    '这个知识点的 prerequisites 是什么？',
    '推荐的学习资源有哪些？',
    '学习路径怎么规划？',
    '这个知识点难度如何？'
  ];

  return (
    <div className="absolute bottom-6 left-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">知识图谱 AI</h3>
            <p className="text-xs text-white/70">你的学习助手</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-blue-100' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            }`}>
              {msg.role === 'user' ? (
                <User size={14} className="text-blue-600" />
              ) : (
                <Sparkles size={14} className="text-white" />
              )}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-white text-gray-700 shadow-sm rounded-bl-md'
            }`}>
              <p className="whitespace-pre-line">{msg.content}</p>
              <span className={`text-[10px] mt-1 block ${
                msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
              }`}>
                {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" />
              <span className="text-xs text-gray-500">思考中...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
            <Lightbulb size={10} />
            快捷问题
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors text-left truncate max-w-[150px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入问题，按Enter发送..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-xl transition-colors ${
              input.trim() && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAIChat;
