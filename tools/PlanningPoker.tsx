
import React, { useState, useEffect } from 'react';
import { 
  Users, Play, RotateCcw, Eye, EyeOff, CheckCircle2, 
  Trophy, Save, Loader2, AlertCircle, Plus, Trash2, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

// Fibonacci序列选项
const FIBONACCI_POINTS = ['?', '0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '☕'];

interface Story {
  id: string;
  title: string;
  description: string;
  finalEstimate?: string;
}

interface Vote {
  userId: string;
  userName: string;
  point: string;
}

interface PlanningPokerProps {
  currentUser?: UserProfile | null;
}

// 模拟虚拟团队成员投票
function simulateTeamVotes(storyComplexity: 'simple' | 'medium' | 'complex'): Vote[] {
  const basePoints: Record<string, string> = { simple: '3', medium: '8', complex: '20' };
  const base = basePoints[storyComplexity] || '8';
  
  // 根据基础值生成接近的估算
  const nearbyPoints = ['3', '5', '8', '13', '20', '40'];
  const baseIndex = nearbyPoints.indexOf(base);
  
  const virtualMembers = ['张伟', '李娜', '王强', '刘洋', '陈静'];
  
  return virtualMembers.map((name, index) => {
    // 大部分成员投接近的值，少数可能有不同意见
    let pointIndex = baseIndex;
    if (Math.random() > 0.6) pointIndex += Math.random() > 0.5 ? 1 : -1;
    if (pointIndex < 0) pointIndex = 0;
    if (pointIndex >= nearbyPoints.length) pointIndex = nearbyPoints.length - 1;
    
    return {
      userId: `virtual-${index}`,
      userName: name,
      point: nearbyPoints[pointIndex]
    };
  });
}

// 检测是否达成一致
function checkConsensus(votes: Vote[]): boolean {
  const nonCoffeeVotes = votes.filter(v => v.point !== '?' && v.point !== '☕');
  if (nonCoffeeVotes.length === 0) return false;
  const uniqueVotes = new Set(nonCoffeeVotes.map(v => v.point));
  return uniqueVotes.size === 1;
}

// 计算平均值
function calculateAverage(votes: Vote[]): number {
  const numericVotes = votes
    .map(v => v.point)
    .filter(v => !isNaN(Number(v)) && v !== '☕' && v !== '?')
    .map(Number);
  
  if (numericVotes.length === 0) return 0;
  return numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
}

const PlanningPoker: React.FC<PlanningPokerProps> = ({ currentUser }) => {
  const [sessionName, setSessionName] = useState('Sprint估算会议');
  const [stories, setStories] = useState<Story[]>([
    { id: '1', title: '用户登录功能', description: '实现用户邮箱+密码登录' },
    { id: '2', title: '商品列表页', description: '展示商品列表，支持分页和筛选' },
    { id: '3', title: '购物车功能', description: '添加商品到购物车，修改数量' },
  ]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [virtualVotes, setVirtualVotes] = useState<Vote[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    loadSavedSessions();
  }, []);

  const loadSavedSessions = async () => {
    const { data } = await supabase
      .from('lab_planning_poker_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSavedSessions(data);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const addStory = () => {
    const newStory: Story = {
      id: Date.now().toString(),
      title: '新用户故事',
      description: '描述待补充...'
    };
    setStories([...stories, newStory]);
  };

  const removeStory = (id: string) => {
    if (stories.length <= 1) {
      showToast('error', '至少保留一个故事');
      return;
    }
    const newStories = stories.filter(s => s.id !== id);
    setStories(newStories);
    if (currentStoryIndex >= newStories.length) {
      setCurrentStoryIndex(newStories.length - 1);
    }
  };

  const updateStory = (id: string, field: keyof Story, value: string) => {
    setStories(stories.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const setFinalEstimate = (point: string) => {
    const newStories = [...stories];
    newStories[currentStoryIndex].finalEstimate = point;
    setStories(newStories);
  };

  const simulateVoting = () => {
    if (!userVote) {
      showToast('error', '请先选择你的估算');
      return;
    }

    setIsSimulating(true);
    setIsRevealed(false);

    // 模拟延迟
    setTimeout(() => {
      // 根据故事复杂度判断
      const complexity: 'simple' | 'medium' | 'complex' = 
        userVote === '1' || userVote === '2' || userVote === '3' ? 'simple' :
        userVote === '5' || userVote === '8' ? 'medium' : 'complex';
      
      const votes = simulateTeamVotes(complexity);
      setVirtualVotes(votes);
      setIsSimulating(false);
    }, 800);
  };

  const revealVotes = () => {
    if (virtualVotes.length === 0) {
      showToast('error', '请先开始投票');
      return;
    }
    setIsRevealed(true);
  };

  const resetVoting = () => {
    setUserVote(null);
    setVirtualVotes([]);
    setIsRevealed(false);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      resetVoting();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      resetVoting();
    }
  };

  const saveSession = async () => {
    const payload = {
      session_name: sessionName,
      stories,
      current_story_index: currentStoryIndex,
      estimates: stories.reduce((acc, s) => {
        if (s.finalEstimate) acc[s.id] = s.finalEstimate;
        return acc;
      }, {} as Record<string, string>),
      is_revealed: isRevealed,
      created_by: currentUser?.id || null
    };

    let error;
    if (currentId) {
      const { error: updateError } = await supabase
        .from('lab_planning_poker_sessions')
        .update(payload)
        .eq('id', currentId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('lab_planning_poker_sessions')
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (data) setCurrentId(data.id);
    }

    if (error) {
      showToast('error', '保存失败: ' + error.message);
    } else {
      showToast('success', '保存成功!');
      loadSavedSessions();
    }
  };

  const loadSession = (session: any) => {
    setCurrentId(session.id);
    setSessionName(session.session_name);
    setStories(session.stories);
    setCurrentStoryIndex(session.current_story_index || 0);
    resetVoting();
  };

  const allVotes = userVote ? [...virtualVotes, { 
    userId: 'current', 
    userName: currentUser?.name || '我', 
    point: userVote 
  }] : virtualVotes;

  const hasConsensus = checkConsensus(allVotes);
  const avgEstimate = calculateAverage(allVotes);

  return (
    <div className="w-full h-full bg-[#F5F5F7] overflow-y-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                <Users size={20} />
              </div>
              敏捷估算扑克
            </h1>
            <p className="text-gray-500 mt-1">团队协作估算工具 - 同步出牌，暴露差异</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveSession}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Save size={18} />
              保存
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Stories */}
          <div className="lg:col-span-1 space-y-6">
            {/* Session Name */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">会议名称</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Story List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">用户故事</h3>
                <button
                  onClick={addStory}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    onClick={() => { setCurrentStoryIndex(index); resetVoting(); }}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${
                      currentStoryIndex === index 
                        ? 'bg-orange-50 border border-orange-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">
                        {index + 1}. {story.title}
                      </span>
                      {story.finalEstimate && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {story.finalEstimate}
                        </span>
                      )}
                    </div>
                    {currentStoryIndex === index && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStory(story.id); }}
                        className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> 删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Sessions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">历史会议</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedSessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">暂无保存的会议</p>
                ) : (
                  savedSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        currentId === session.id ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">{session.session_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Story */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  故事 {currentStoryIndex + 1} / {stories.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={prevStory}
                    disabled={currentStoryIndex === 0}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一个
                  </button>
                  <button
                    onClick={nextStory}
                    disabled={currentStoryIndex === stories.length - 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    下一个 <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={currentStory.title}
                onChange={(e) => updateStory(currentStory.id, 'title', e.target.value)}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-transparent hover:border-gray-200 focus:border-orange-500 outline-none bg-transparent pb-2 mb-3"
                placeholder="用户故事标题"
              />
              <textarea
                value={currentStory.description}
                onChange={(e) => updateStory(currentStory.id, 'description', e.target.value)}
                className="w-full text-gray-600 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                rows={2}
                placeholder="用户故事描述..."
              />
            </div>

            {/* Voting Area */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">选择估算点数</h3>
                <div className="flex gap-2">
                  {!isRevealed ? (
                    <>
                      <button
                        onClick={simulateVoting}
                        disabled={isSimulating || !userVote}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        {isSimulating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        开始投票
                      </button>
                      <button
                        onClick={revealVotes}
                        disabled={virtualVotes.length === 0}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <Eye size={18} />
                        揭示
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={resetVoting}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw size={18} />
                      重新投票
                    </button>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
                {FIBONACCI_POINTS.map((point) => (
                  <button
                    key={point}
                    onClick={() => !isRevealed && setUserVote(point)}
                    disabled={isRevealed}
                    className={`aspect-[2/3] rounded-xl font-bold text-lg transition-all duration-300 ${
                      userVote === point
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    } disabled:cursor-not-allowed`}
                  >
                    {point}
                  </button>
                ))}
              </div>

              {/* Results */}
              {virtualVotes.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {isRevealed ? '投票结果' : '等待揭示...'}
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {allVotes.map((vote, index) => (
                      <div key={vote.userId} className="text-center">
                        <div 
                          className={`w-16 h-24 mx-auto rounded-xl flex items-center justify-center text-xl font-bold mb-2 transition-all duration-500 ${
                            isRevealed 
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rotate-0'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white rotate-180'
                          }`}
                          style={{ 
                            transform: isRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                            transition: 'transform 0.6s'
                          }}
                        >
                          {isRevealed ? vote.point : '?'}
                        </div>
                        <p className="text-sm text-gray-600">{vote.userName}</p>
                      </div>
                    ))}
                  </div>

                  {isRevealed && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      {hasConsensus ? (
                        <div className="flex items-center gap-3 text-green-600">
                          <Trophy size={24} />
                          <div>
                            <p className="font-semibold">达成一致!</p>
                            <p className="text-sm">所有人都选择了 {allVotes[0]?.point} 点</p>
                          </div>
                          <button
                            onClick={() => setFinalEstimate(allVotes[0]?.point)}
                            className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            确认 {allVotes[0]?.point} 点
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-orange-600 font-medium mb-2 flex items-center gap-2">
                            <AlertCircle size={18} />
                            估算存在分歧，需要讨论
                          </p>
                          <p className="text-sm text-gray-600 mb-3">
                            平均值: <span className="font-semibold">{avgEstimate.toFixed(1)}</span> 点
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(allVotes.map(v => v.point))).map(point => (
                              <button
                                key={point}
                                onClick={() => setFinalEstimate(point)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-orange-500 hover:text-orange-600 transition-colors"
                              >
                                设为 {point} 点
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy size={20} />
                估算完成度
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${(stories.filter(s => s.finalEstimate).length / stories.length) * 100}%` }}
                  />
                </div>
                <span className="font-bold">
                  {stories.filter(s => s.finalEstimate).length} / {stories.length}
                </span>
              </div>
              <p className="mt-3 text-orange-100 text-sm">
                已完成 {stories.filter(s => s.finalEstimate).length} 个故事的估算
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningPoker;
