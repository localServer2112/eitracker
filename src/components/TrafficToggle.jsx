import { cn } from '@/lib/utils';
import { RadioTower } from 'lucide-react';

export default function TrafficToggle({ active, onToggle }) {
  return (
    <div className="absolute bottom-6 left-3 z-[1000]">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all duration-200 cursor-pointer shadow-lg',
          active
            ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
            : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
        )}
      >
        <RadioTower className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <span>Traffic</span>
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse-dot shrink-0" />
        )}
      </button>
    </div>
  );
}
