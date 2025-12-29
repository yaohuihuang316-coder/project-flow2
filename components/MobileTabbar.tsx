import React from 'react';
import { Page } from '../types';
import { LayoutDashboard, Library, PlayCircle, User, Compass } from 'lucide-react';

interface MobileTabbarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const MobileTabbar: React.FC<MobileTabbarProps> = ({ currentPage, setPage }) => {
  const navItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: '概览' },
    { page: Page.LEARNING, icon: Library, label: '学习' },
    { page: Page.SIMULATION, icon: Compass, label: '实战' }, // Mobile specific priority
    { page: Page.PROFILE, icon: User, label: '我的' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-t border-gray-200/50 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center h-14">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform"
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} className={isActive ? "fill-blue-600/20" : ""} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Home Indicator Safe Area Space */}
      <div className="h-4 w-full"></div> 
    </div>
  );
};

export default MobileTabbar;