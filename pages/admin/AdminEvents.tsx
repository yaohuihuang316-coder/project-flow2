import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Calendar, Clock, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminEvents = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'events' | 'logs'>('events');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'events') fetchEvents();
        else fetchActivityLogs();
    }, [activeTab]);

    useEffect(() => {
        filterData();
    }, [searchQuery, events, activityLogs, activeTab]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_events')
                .select('*, app_users!app_events_user_id_fkey(id, name, email)')
                .order('start_time', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_activity_logs')
                .select('*, app_users!app_activity_logs_user_id_fkey(id, name, email)')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;
            setActivityLogs(data || []);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        const dataSource = activeTab === 'events' ? events : activityLogs;

        if (!searchQuery) {
            setFilteredData(dataSource);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = dataSource.filter(item => {
            if (activeTab === 'events') {
                return item.title?.toLowerCase().includes(query) ||
                    item.app_users?.name?.toLowerCase().includes(query);
            } else {
                return item.action_type?.toLowerCase().includes(query) ||
                    item.app_users?.name?.toLowerCase().includes(query);
            }
        });
        setFilteredData(filtered);
    };

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm('确定要删除这个日程事件吗?')) return;

        const { error } = await supabase
            .from('app_events')
            .delete()
            .eq('id', id);

        if (!error) {
            setEvents(events.filter(e => e.id !== id));
            alert('✅ 删除成功');
        } else {
            alert('❌ 删除失败');
        }
    };

    const handleBatchDeleteExpired = async () => {
        const now = new Date().toISOString();
        const expiredCount = events.filter(e => new Date(e.end_time) < new Date()).length;

        if (expiredCount === 0) {
            alert('没有过期的事件');
            return;
        }

        if (!window.confirm(`确定要删除 ${expiredCount} 个过期事件吗?`)) return;

        const { error } = await supabase
            .from('app_events')
            .delete()
            .lt('end_time', now);

        if (!error) {
            fetchEvents();
            alert(`✅ 已删除 ${expiredCount} 个过期事件`);
        } else {
            alert('❌ 删除失败');
        }
    };

    const exportData = () => {
        const dataSource = activeTab === 'events' ? filteredData : filteredData;

        if (activeTab === 'events') {
            const csvContent = [
                ['用户', '标题', '开始时间', '结束时间', '全天'].join(','),
                ...dataSource.map(item => [
                    item.app_users?.name || 'N/A',
                    item.title || '',
                    new Date(item.start_time).toLocaleString(),
                    new Date(item.end_time).toLocaleString(),
                    item.all_day ? '是' : '否'
                ].join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `日程事件_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } else {
            const csvContent = [
                ['用户', '操作类型', '积分', '时间'].join(','),
                ...dataSource.map(item => [
                    item.app_users?.name || 'N/A',
                    item.action_type || '',
                    item.points || 0,
                    new Date(item.created_at).toLocaleString()
                ].join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `活动日志_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    日程与活动管理
                </h1>
                <p className="text-gray-500 mt-1">管理用户日程事件和系统活动日志</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
                <button
                    onClick={() => { setActiveTab('events'); setSearchQuery(''); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'events'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Calendar size={16} className="inline mr-2" />
                    日程事件 ({events.length})
                </button>
                <button
                    onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'logs'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <TrendingUp size={16} className="inline mr-2" />
                    活动日志 ({activityLogs.length})
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={`搜索${activeTab === 'events' ? '事件标题或用户' : '操作类型或用户'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => activeTab === 'events' ? fetchEvents() : fetchActivityLogs()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={18} /> 刷新
                    </button>
                    {activeTab === 'events' && (
                        <button
                            onClick={handleBatchDeleteExpired}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={18} /> 清理过期
                        </button>
                    )}
                    <button
                        onClick={exportData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} /> 导出
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'events' ? (
                <EventsList
                    events={filteredData.length > 0 ? filteredData : events}
                    loading={loading}
                    onDelete={handleDeleteEvent}
                />
            ) : (
                <ActivityLogsList
                    logs={filteredData.length > 0 ? filteredData : activityLogs}
                    loading={loading}
                />
            )}

            {!loading && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    共 {activeTab === 'events' ? filteredData.length || events.length : filteredData.length || activityLogs.length} 条记录
                </div>
            )}
        </div>
    );
};

const EventsList = ({ events, loading, onDelete }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : events.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无日程事件</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">事件标题</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">结束时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {events.map((event: any) => {
                            const now = new Date();
                            const start = new Date(event.start_time);
                            const end = new Date(event.end_time);
                            const isExpired = end < now;
                            const isOngoing = start <= now && end >= now;

                            return (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {event.app_users?.name || '未知用户'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {event.app_users?.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{event.title}</div>
                                        {event.all_day && (
                                            <span className="text-xs text-blue-600">全天事件</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(event.start_time).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(event.end_time).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isExpired && (
                                            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                                                已过期
                                            </span>
                                        )}
                                        {isOngoing && (
                                            <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded">
                                                进行中
                                            </span>
                                        )}
                                        {!isExpired && !isOngoing && (
                                            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                                                未开始
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onDelete(event.id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const ActivityLogsList = ({ logs, loading }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无活动日志</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作类型</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">获得积分</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {logs.map((log: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {log.app_users?.name || '未知用户'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {log.app_users?.email || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${log.action_type === 'complete_task' ? 'text-green-600 bg-green-100' :
                                            log.action_type === 'finish_chapter' ? 'text-blue-600 bg-blue-100' :
                                                log.action_type === 'post_community' ? 'text-purple-600 bg-purple-100' :
                                                    'text-gray-600 bg-gray-100'
                                        }`}>
                                        {log.action_type === 'complete_task' ? '完成任务' :
                                            log.action_type === 'finish_chapter' ? '完成章节' :
                                                log.action_type === 'post_community' ? '发布帖子' :
                                                    log.action_type === 'login' ? '登录' : log.action_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-blue-600">+{log.points || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default AdminEvents;
