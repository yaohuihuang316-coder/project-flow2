import React from 'react';
import { ChevronLeft, Share2, Settings } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

interface SimulationProps {
    onBack: () => void;
}

const Simulation: React.FC<SimulationProps> = ({ onBack }) => {
    return (
        <div className="w-full h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
            {/* --- App Header --- */}
            <div className="h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            Project Alpha
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">Agile</span>
                        </h1>
                        <p className="text-xs text-gray-500">Sprint 4: Payment Integration</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex -space-x-2 mr-4">
                        <img src="https://i.pravatar.cc/100?u=4" className="w-6 h-6 rounded-full border border-white" />
                        <img src="https://i.pravatar.cc/100?u=5" className="w-6 h-6 rounded-full border border-white" />
                        <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] font-bold text-gray-500">+3</div>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">
                        <Share2 size={12} /> Share
                    </button>
                    <button className="p-2 text-gray-400 hover:text-black">
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* --- Kanban Container --- */}
            <div className="flex-1 overflow-hidden p-6">
                 {/* 
                    We use a container with a subtle background grid to emulate 
                    Apple Freeform's infinite canvas feel.
                 */}
                 <div className="w-full h-full bg-white rounded-[2rem] shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                    <div className="relative z-10 h-full">
                        <KanbanBoard />
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Simulation;