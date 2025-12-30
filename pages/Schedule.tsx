import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal, Play, Pause, X, CloudRain, Coffee, Zap, Plus, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ScheduleProps {
    currentUser?: UserProfile | null;
}

const Schedule: React.FC<ScheduleProps> = ({ currentUser }) => {
    // --- Focus Mode State ---
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); 
    const [isActive, setIsActive] = useState(false);
    const [ambientSound, setAmbientSound] = useState<'rain' | 'cafe' | 'white' | null>(null);

    // --- Events State ---
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', time: '09:00 AM', duration: '1h', type: 'meeting' });

    // --- Timer Logic ---
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    };

    // --- Data Fetching ---
    const fetchEvents = async () => {
        setIsLoading(true);
        if (!currentUser) {
            // Mock data for guests
            setEvents([
                { id: 1, time: '09:00 AM', title: '每日站会 (Daily Standup)', type: 'meeting', duration: '15min' },
                { id: 2, time: '10:30 AM', title: '敏捷项目管理课程 - Module 2', type: 'learning', duration: '45min' },
            ]);
            setIsLoading(false);
            return;
        }

        const { data } = await supabase
            .from('app_events')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });

        if (data) setEvents(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [currentUser]);

    const handleAddEvent = async () => {
        if (!currentUser) return;
        if (!newEvent.title) return;

        const eventToSave = {
            user_id: currentUser.id,
            title: newEvent.title,
            start_time: newEvent.time, // Using text for simplicity as per requirement
            duration: newEvent.duration,
            type: newEvent.type,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('app_events').insert(eventToSave);
        if (!error) {
            fetchEvents();
            setIsAddOpen(false);
            setNewEvent({ title: '', time: '09:00 AM', duration: '1h', type: 'meeting' });
        }
    };

    const getEventColor = (type: string) => {
        switch(type) {
            case 'meeting': return 'bg-blue-500';
            case 'learning': return 'bg-purple-500';
            case 'work': return 'bg-orange-500';
            case 'self': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="pt-24 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen relative">
            
            {/* --- Main Schedule View --- */}
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left Column: Calendar & Summary */}
                <div className="w-full lg:w-80 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">我的日程</h1>
                        <p className="text-gray-500 mt-1">
                            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                        </p>
                    </div>

                    {/* Mini Calendar Widget */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-900">Today</span>
                            <div className="flex gap-2">
                                <button className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16}/></button>
                                <button className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-2">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-700">
                            {[...Array(31)].map((_, i) => {
                                const day = i + 1;
                                const isSelected = day === new Date().getDate();
                                return (
                                    <div 
                                        key={i} 
                                        className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all ${
                                            isSelected 
                                            ? 'bg-black text-white shadow-lg' 
                                            : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Focus Mode Entry */}
                    <button 
                        onClick={() => setIsFocusMode(true)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[1.5rem] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition-all group"
                    >
                        <Zap size={20} className="group-hover:text-yellow-300 transition-colors" />
                        进入深度专注 (Focus)
                    </button>
                </div>

                {/* Right Column: Timeline */}
                <div className="flex-1 animate-fade-in-up delay-100">
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-sm min-h-[600px] relative flex flex-col">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900">今日安排</h3>
                            <button 
                                onClick={() => setIsAddOpen(!isAddOpen)}
                                className="flex items-center gap-1 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                <Plus size={14}/> 添加
                            </button>
                        </div>

                        {/* Add Event Form */}
                        {isAddOpen && (
                            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 animate-fade-in">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input 
                                        placeholder="事件标题" 
                                        className="col-span-2 px-3 py-2 rounded-lg border text-sm"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    />
                                    <input 
                                        placeholder="时间 (09:00 AM)" 
                                        className="px-3 py-2 rounded-lg border text-sm"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                    />
                                    <select 
                                        className="px-3 py-2 rounded-lg border text-sm"
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                                    >
                                        <option value="meeting">会议 (Meeting)</option>
                                        <option value="learning">学习 (Learning)</option>
                                        <option value="work">工作 (Work)</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsAddOpen(false)} className="text-xs px-3 py-1.5 text-gray-500">取消</button>
                                    <button onClick={handleAddEvent} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">保存</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-8 flex-1">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className="text-sm">正在同步日程...</p>
                                </div>
                            ) : events.length > 0 ? events.map((event) => (
                                <div key={event.id} className="flex group">
                                    {/* Time Column */}
                                    <div className="w-24 pt-2 text-right pr-6 relative">
                                        <span className="text-sm font-bold text-gray-900 block">{event.start_time || event.time}</span>
                                        <span className="text-xs text-gray-400 font-medium">{event.duration}</span>
                                    </div>

                                    {/* Event Card */}
                                    <div className="flex-1 relative pl-6 border-l-2 border-gray-100 group-hover:border-gray-200 transition-colors pb-8 last:pb-0">
                                        <div className={`absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full ring-4 ring-white ${getEventColor(event.type)}`}></div>
                                        
                                        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-white mb-2 inline-block opacity-80 ${getEventColor(event.type)}`}>
                                                        {event.type}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                                </div>
                                                <button className="text-gray-300 hover:text-gray-600">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={16}/>
                                                    <span>Planned</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-gray-400 text-sm">
                                    暂无日程，点击右上角添加
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Focus Mode Overlay (Full Screen) --- */}
            {isFocusMode && (
                <div className="fixed inset-0 z-[100] bg-[#000] text-white flex flex-col items-center justify-center animate-fade-in">
                     {/* Background Ambient Effect */}
                     <div className="absolute inset-0 overflow-hidden pointer-events-none">
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] transition-all duration-[3000ms] ${isActive ? 'scale-110 opacity-30' : 'scale-100 opacity-20'}`}></div>
                         <div className={`absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] transition-all duration-[4000ms] ${isActive ? 'translate-x-10' : ''}`}></div>
                     </div>

                     {/* Top Bar */}
                     <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
                         <div className="flex items-center gap-2 text-white/50">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-xs font-bold uppercase tracking-widest">Focus Mode Active</span>
                         </div>
                         <button 
                            onClick={() => setIsFocusMode(false)}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10"
                        >
                            <X size={20} />
                         </button>
                     </div>

                     {/* Main Timer */}
                     <div className="relative z-10 text-center mb-16">
                         <div className="text-[12rem] font-bold tracking-tighter leading-none font-mono tabular-nums bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 select-none">
                             {formatTime(timeLeft)}
                         </div>
                         <p className="text-white/40 font-medium text-lg mt-4">Stay focused on the task at hand.</p>
                         
                         <div className="mt-10 flex items-center justify-center gap-6">
                             <button 
                                onClick={toggleTimer}
                                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                             >
                                 {isActive ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
                             </button>
                             <button 
                                onClick={resetTimer}
                                className="px-6 py-3 rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors font-bold text-sm"
                            >
                                Reset
                             </button>
                         </div>
                     </div>

                     {/* Ambient Sound Controls */}
                     <div className="absolute bottom-12 flex gap-4 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
                         {[
                             { id: 'rain', icon: CloudRain, label: 'Rain' },
                             { id: 'cafe', icon: Coffee, label: 'Cafe' },
                             { id: 'white', icon: Zap, label: 'Static' },
                         ].map(sound => (
                             <button
                                key={sound.id}
                                onClick={() => setAmbientSound(ambientSound === sound.id ? null : sound.id as any)}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all ${
                                    ambientSound === sound.id 
                                    ? 'bg-white text-black shadow-lg' 
                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                             >
                                 <sound.icon size={24} className={ambientSound === sound.id ? 'fill-current' : ''} />
                                 <span className="text-[10px] font-bold mt-2 uppercase tracking-wider">{sound.label}</span>
                                 {ambientSound === sound.id && (
                                     <div className="w-1 h-1 bg-black rounded-full mt-1 animate-ping"></div>
                                 )}
                             </button>
                         ))}
                     </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;