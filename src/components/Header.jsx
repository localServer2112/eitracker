import { cn } from '@/lib/utils';
import { Fish, ChevronDown, Bell } from 'lucide-react';

const TABS = [
  { id: 'maps', label: 'Maps' },
  { id: 'vans', label: 'Vans' },
  { id: 'notification', label: 'Notification' },
];

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="relative z-50 flex items-center justify-between px-6 h-[64px] bg-[#111111] border-b border-white/5">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="text-[#4ade80] font-bold text-[17px] tracking-wide">
          Eja-iCe
        </span>
        <Fish className="w-5 h-5 text-gray-400 -rotate-12" strokeWidth={1.5} />
      </div>

      {/* Nav Tabs */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#111]" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-white/25 transition-all overflow-hidden">
            <span className="text-white text-xs font-semibold">T</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </header>
  );
}
