import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal, Video, Play, Pause, X, CloudRain, Coffee, Zap } from 'lucide-react';

const Schedule: React.FC = () => {
    // --- Focus Mode State ---
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [ambientSound, setAmbientSound] = useState<'rain' | 'cafe' | 'white' | null>(null);

    // --- Timer Logic ---
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Could play alarm here
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

    // Mock Timeline Data
    const events = [
        { id: 1, time: '09:00 AM', title: '每日站会 (Daily Standup)', type: 'meeting', duration: '15min', color: 'bg-blue-500' },
        { id: 2, time: '10:30 AM', title: '敏捷项目管理课程 - Module 2', type: 'learning', duration: '45min', color: 'bg-purple-500' },
        { id: 3, time: '02:00 PM', title: '团队代码评审 (Code Review)', type: 'meeting', duration: '1h 30min', color: 'bg-orange-500' },
        { id: 4, time: '04:00 PM', title: '独立研习：EVM 挣值分析', type: 'self', duration: '1h', color: 'bg-green-500' },
    ];

    return (
        <div className="pt-24 pb-12 px-6 sm:px-10 max-w-7xl mx-auto min-h-screen relative">
            
            {/* --- Main Schedule View --- */}
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left Column: Calendar & Summary */}
                <div className="w-full lg:w-80 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">我的日程</h1>
                        <p className="text-gray-500 mt-1">2024年10月24日 · 周四</p>
                    </div>

                    {/* Mini Calendar Widget */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-gray-900">October 2024</span>
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
                                const isSelected = day === 24;
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
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-sm min-h-[600px] relative">
                        {/* Current Time Line Indicator */}
                        <div className="absolute left-24 top-[320px] w-[calc(100%-6rem)] border-t-2 border-red-400 z-10 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-400 -ml-1"></div>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-auto">Current: 01:15 PM</span>
                        </div>

                        <div className="space-y-8">
                            {events.map((event) => (
                                <div key={event.id} className="flex group">
                                    {/* Time Column */}
                                    <div className="w-24 pt-2 text-right pr-6 relative">
                                        <span className="text-sm font-bold text-gray-900 block">{event.time}</span>
                                        <span className="text-xs text-gray-400 font-medium">{event.duration}</span>
                                    </div>

                                    {/* Event Card */}
                                    <div className="flex-1 relative pl-6 border-l-2 border-gray-100 group-hover:border-gray-200 transition-colors pb-8 last:pb-0">
                                        <div className={`absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full ring-4 ring-white ${event.color}`}></div>
                                        
                                        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-white mb-2 inline-block opacity-80 ${event.color}`}>
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
                                                    {event.type === 'meeting' ? <Video size={16}/> : <Clock size={16}/>}
                                                    <span>Google Meet</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                                                        <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                                                        <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-[8px] text-white">+3</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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