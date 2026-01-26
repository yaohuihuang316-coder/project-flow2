
import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AdminAnnouncements: React.FC = () => {
    // Mock Data (In real app, this would be a Supabase table 'app_announcements')
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: '系统维护通知', content: '系统将于今晚 02:00 进行升级。', type: 'warning', date: '2024-03-20', active: true },
        { id: 2, title: '新课程上线：PMP 冲刺', content: '欢迎大家学习最新的 PMP 课程。', type: 'success', date: '2024-03-18', active: true },
        { id: 3, title: '社区规范更新', content: '请大家文明发言。', type: 'info', date: '2024-03-15', active: false },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<any>({});

    const handleSave = () => {
        if (!current.title) return;
        if (current.id) {
            setAnnouncements(prev => prev.map(a => a.id === current.id ? current : a));
        } else {
            setAnnouncements(prev => [{ ...current, id: Date.now(), date: new Date().toISOString().split('T')[0], active: true }, ...prev]);
        }
        setIsEditing(false);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Delete?")) setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'warning': return 'bg-orange-100 text-orange-700';
            case 'success': return 'bg-green-100 text-green-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative min-h-[600px]">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Megaphone size={24} className="text-blue-600"/> 全站公告管理</h1>
                    <p className="text-sm text-gray-500 mt-1">发布通知，将显示在用户导航栏的消息中心。</p>
                </div>
                <button 
                    onClick={() => { setCurrent({ type: 'info' }); setIsEditing(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} /> 发布公告
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {announcements.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${getTypeColor(item.type)}`}>
                                {item.type === 'warning' ? <AlertCircle size={20}/> : item.type === 'success' ? <CheckCircle size={20}/> : <Megaphone size={20}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {item.title}
                                    {!item.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已过期</span>}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {item.date}</span>
                                    <span className="uppercase tracking-wider">Type: {item.type}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setCurrent(item); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold">公告编辑器</h3>
                            <button onClick={() => setIsEditing(false)}><Plus size={20} className="rotate-45 text-gray-400"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">标题</label>
                                <input className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={current.title || ''} onChange={e => setCurrent({...current, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">类型</label>
                                <select className="w-full border rounded-xl px-3 py-2 text-sm outline-none" value={current.type || 'info'} onChange={e => setCurrent({...current, type: e.target.value})}>
                                    <option value="info">常规通知 (Info)</option>
                                    <option value="warning">重要警告 (Warning)</option>
                                    <option value="success">成功消息 (Success)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">内容</label>
                                <textarea rows={3} className="w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none" value={current.content || ''} onChange={e => setCurrent({...current, content: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={current.active !== false} onChange={e => setCurrent({...current, active: e.target.checked})} />
                                <label className="text-sm font-bold text-gray-700">立即生效</label>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800">保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncements;
