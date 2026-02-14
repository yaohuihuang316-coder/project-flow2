
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Trash2, Edit2, CheckCircle, AlertCircle, 
  Info, AlertTriangle, X, Calendar, Users, Eye, EyeOff,
  Loader2, Search, Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: number;
  target_audience: 'all' | 'free' | 'pro' | 'pro_plus';
  is_active: boolean;
  start_at: string;
  end_at: string | null;
  created_at: string;
  created_by?: string;
}

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    type: 'info',
    priority: 50,
    target_audience: 'all',
    is_active: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 保存公告
  const handleSave = async () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      alert('标题和内容不能为空');
      return;
    }

    try {
      const { error } = currentAnnouncement.id
        ? await supabase
            .from('app_announcements')
            .update({
              title: currentAnnouncement.title,
              content: currentAnnouncement.content,
              type: currentAnnouncement.type,
              priority: currentAnnouncement.priority,
              target_audience: currentAnnouncement.target_audience,
              is_active: currentAnnouncement.is_active,
              start_at: currentAnnouncement.start_at,
              end_at: currentAnnouncement.end_at || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentAnnouncement.id)
        : await supabase
            .from('app_announcements')
            .insert({
              title: currentAnnouncement.title,
              content: currentAnnouncement.content,
              type: currentAnnouncement.type || 'info',
              priority: currentAnnouncement.priority || 50,
              target_audience: currentAnnouncement.target_audience || 'all',
              is_active: currentAnnouncement.is_active ?? true,
              start_at: currentAnnouncement.start_at || new Date().toISOString(),
              end_at: currentAnnouncement.end_at || null
            });

      if (error) throw error;
      
      setIsEditing(false);
      setCurrentAnnouncement({ type: 'info', priority: 50, target_audience: 'all', is_active: true });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('保存失败');
    }
  };

  // 删除公告
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此公告吗？')) return;

    try {
      const { error } = await supabase
        .from('app_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('删除失败');
    }
  };

  // 切换公告状态
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('app_announcements')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // 过滤公告
  const filteredAnnouncements = announcements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && item.is_active) ||
                         (filterStatus === 'inactive' && !item.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-orange-500" />;
      case 'error': return <AlertCircle size={20} className="text-red-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch(audience) {
      case 'free': return 'Free会员';
      case 'pro': return 'Pro会员';
      case 'pro_plus': return 'Pro+会员';
      default: return '全部用户';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone size={24} className="text-blue-600"/> 全站公告管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            发布公告将显示在用户导航栏的消息中心。当前共 {announcements.length} 条公告
          </p>
        </div>
        <button 
          onClick={() => { 
            setCurrentAnnouncement({ type: 'info', priority: 50, target_audience: 'all', is_active: true }); 
            setIsEditing(true); 
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} /> 发布公告
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-200">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索公告标题或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部类型</option>
          <option value="info">通知</option>
          <option value="success">成功</option>
          <option value="warning">警告</option>
          <option value="error">错误</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="active">生效中</option>
          <option value="inactive">已下线</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{announcements.filter(a => a.is_active).length}</div>
          <div className="text-xs text-gray-500">生效中</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{announcements.filter(a => a.type === 'info').length}</div>
          <div className="text-xs text-gray-500">通知</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{announcements.filter(a => a.type === 'warning').length}</div>
          <div className="text-xs text-gray-500">警告</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{announcements.filter(a => a.type === 'success').length}</div>
          <div className="text-xs text-gray-500">成功</div>
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> 加载中...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-200">
              <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
              <p>暂无公告</p>
            </div>
          ) : (
            filteredAnnouncements.map(item => (
              <div key={item.id} className={`bg-white p-5 rounded-2xl border shadow-sm flex items-start justify-between group hover:shadow-md transition-all ${
                item.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}>
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      {!item.is_active && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已下线</span>
                      )}
                      {item.end_at && new Date(item.end_at) < new Date() && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full">已过期</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12}/> 
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12}/> 
                        {getAudienceLabel(item.target_audience)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.priority >= 80 ? 'bg-red-100 text-red-600' :
                        item.priority >= 50 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        优先级: {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => toggleStatus(item.id, item.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.is_active 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.is_active ? '点击下线' : '点击上线'}
                  >
                    {item.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
                  </button>
                  <button 
                    onClick={() => { setCurrentAnnouncement(item); setIsEditing(true); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {currentAnnouncement.id ? '编辑公告' : '发布公告'}
              </h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公告标题</label>
                <input
                  type="text"
                  value={currentAnnouncement.title || ''}
                  onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入公告标题"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公告内容</label>
                <textarea
                  value={currentAnnouncement.content || ''}
                  onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, content: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入公告内容"
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公告类型</label>
                  <select
                    value={currentAnnouncement.type || 'info'}
                    onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">📢 通知</option>
                    <option value="success">✅ 成功</option>
                    <option value="warning">⚠️ 警告</option>
                    <option value="error">❌ 错误</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级 (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={currentAnnouncement.priority || 50}
                    onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标受众</label>
                <select
                  value={currentAnnouncement.target_audience || 'all'}
                  onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, target_audience: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">👥 全部用户</option>
                  <option value="free">🆓 Free会员</option>
                  <option value="pro">💎 Pro会员</option>
                  <option value="pro_plus">👑 Pro+会员</option>
                </select>
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">生效时间</label>
                  <input
                    type="datetime-local"
                    value={currentAnnouncement.start_at ? new Date(currentAnnouncement.start_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, start_at: new Date(e.target.value).toISOString()})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">过期时间 (可选)</label>
                  <input
                    type="datetime-local"
                    value={currentAnnouncement.end_at ? new Date(currentAnnouncement.end_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, end_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={currentAnnouncement.is_active ?? true}
                  onChange={(e) => setCurrentAnnouncement({...currentAnnouncement, is_active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">立即生效</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                {currentAnnouncement.id ? '保存修改' : '发布公告'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
