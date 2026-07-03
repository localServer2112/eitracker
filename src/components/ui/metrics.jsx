import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function MetricCell({ value, unit, label, accentClass = 'text-emerald-600', accent = false, danger = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-1">
      <div className="flex items-baseline gap-0.5">
        <span className={cn('text-[17px] font-bold', danger ? 'text-red-500' : accent ? accentClass : 'text-foreground')}>
          {value ?? '-'}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

export function NetworkBars({ value }) {
  // Determine how many bars should be lit based on value (0-5 scale from IoT)
  const activeBars = value >= 5 ? 4 : value >= 4 ? 3 : value >= 2 ? 2 : value >= 1 ? 1 : 0;

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="2" y="10" width="2" height="4" rx="1" fill="currentColor" opacity={activeBars >= 1 ? 1 : 0.3} />
      <rect x="5" y="8" width="2" height="6" rx="1" fill="currentColor" opacity={activeBars >= 2 ? 1 : 0.3} />
      <rect x="8" y="5" width="2" height="9" rx="1" fill="currentColor" opacity={activeBars >= 3 ? 1 : 0.3} />
      <rect x="11" y="2" width="2" height="12" rx="1" fill="currentColor" opacity={activeBars >= 4 ? 1 : 0.3} />
    </svg>
  );
}

export function StatRow({ icon: Icon, value, unit, label, date }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-foreground">{value ?? '-'}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          {date && (
            <>
              <span className="text-[11px] text-muted-foreground/50">·</span>
              <span className="text-[11px] text-muted-foreground">{date}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MiniMetric({ label, value, unit }) {
  const isNull = value === null || value === undefined;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground leading-none ">{label}</span>
      <span className={cn('text-sm font-semibold leading-none py-2', isNull ? 'text-muted-foreground/40' : 'text-foreground')}>
        {isNull ? '-' : value}
        {!isNull && unit && <span className="text-muted-foreground font-normal">{unit}</span>}
      </span>
    </div>
  );
}

export function StatusIndicator({ status }) {
  const configs = {
    online: { variant: 'success', label: 'Online' },
    offline: { variant: 'danger', label: 'Offline' },
    attention: { variant: 'warning', label: 'Attention' },
  };
  const c = configs[status] || configs.offline;

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <Badge variant={c.variant} className="text-[11px] px-2 py-0">
        {c.label}
      </Badge>
      {status === 'attention' && (
        <span className="text-[10px] text-amber-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" />
          Attention
        </span>
      )}
    </div>
  );
}
