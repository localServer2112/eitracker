import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAddressFromCoordinates } from '../utils/geocoder';
import {
  X,
  BatteryMedium,
  Signal,
  MapPin,
  Thermometer,
  Droplets,
  Sun,
  Zap,
  Gauge,
  Route,
} from 'lucide-react';

function timeSince(dateStr) {
  if (!dateStr) return 'Unknown';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}hrs ago`;
}

function MetricCell({ value, unit, label, accent = false, danger = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-1">
      <div className="flex items-baseline gap-0.5">
        <span className={cn('text-[17px] font-bold', danger ? 'text-red-500' : accent ? 'text-emerald-600' : 'text-foreground')}>
          {value ?? '-'}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function NetworkBars({ value }) {
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

function StatRow({ icon: Icon, value, unit, label, date }) {
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

export default function VanInfoSidebar({ van, onClose, onViewOnMap }) {
  const [locationStr, setLocationStr] = useState('Fetching address...');
  const isOnline = van.status === 'online' || van.status === 'attention';
  const lastSeenText = timeSince(van.last_seen);
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    if (!van.latitude || !van.longitude || (van.latitude === 0 && van.longitude === 0)) {
      setLocationStr('Unknown location');
      return;
    }

    // Debounce the geocoder call by 500ms
    const timerId = setTimeout(() => {
      getAddressFromCoordinates(van.latitude, van.longitude).then(setLocationStr);
    }, 500);

    return () => clearTimeout(timerId);
  }, [van.latitude, van.longitude]);

  return (
    <div className="absolute top-3 right-3 bottom-3 w-[340px] z-[1000] animate-slide-in-right">
      <Card className="h-full flex flex-col shadow-2xl border-0 rounded-2xl overflow-hidden">
        <ScrollArea className="flex-1">
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {van.vehicle_plate_number}
                </h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">{van.model}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <BatteryMedium
                    className={cn(
                      'w-5 h-5',
                      (van.battery_percentage ?? 0) > 50
                        ? 'text-emerald-500'
                        : (van.battery_percentage ?? 0) > 20
                          ? 'text-amber-500'
                          : 'text-red-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {van.battery_percentage ?? '-'}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <NetworkBars value={van.netSignal || 0} />
                  {/* <span className="text-[10px]">Network</span> */}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mx-5 px-4 py-3 bg-muted/50 rounded-xl">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-foreground leading-snug">
                  {locationStr}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-muted-foreground">Location</span>
                  <span className="text-[11px] text-muted-foreground/40">·</span>
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isOnline ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {lastSeenText}
                  </span>
                  <span className="text-[11px] text-muted-foreground/40">·</span>
                  <button
                    onClick={onViewOnMap}
                    className="text-[11px] text-blue-500 hover:text-blue-600 underline underline-offset-2"
                  >
                    view on map
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mx-5 mt-4 border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-border">
              <MetricCell value={van.sht_temp} unit="°C" label="Sht_temp" />
              <MetricCell value={van.temp_2} unit="°C" label="Temp 2" />
              <MetricCell value={van.ambient_temp} unit="°C" label="Ambient Temp" />
            </div>
            <Separator />
            <div className="grid grid-cols-3 divide-x divide-border">
              <MetricCell value={van.humidity} unit="%" label="Humidity" />
              <MetricCell
                value={van.cooling_unit_battery}
                unit="%"
                label="Cooling Unit Battery"
                danger={(van.cooling_unit_battery ?? 0) < 30}
              />
              <MetricCell
                value={van.logger_battery}
                unit="%"
                label="Logger Battery"
                danger={(van.logger_battery ?? 0) < 30}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 mt-3">
            <StatRow icon={Sun} value={van.solar_panel_current} unit="Amps" label="Solar panel current" date={dateLabel} />
            <Separator />
            <StatRow icon={Zap} value={van.energy_charged} unit="kwh" label="Energy charged from panel" date={dateLabel} />
            <Separator />
            <StatRow icon={Gauge} value={van.vehicle_speed} unit="km/h" label="Vehicle speed" date={dateLabel} />
            <Separator />
            <StatRow
              icon={Route}
              value={van.total_distance != null ? parseFloat((van.total_distance / 1000).toFixed(2)) : null}
              unit="km"
              label="Total distance moved"
              date={dateLabel}
            />
          </div>

          {/* Bottom spacing */}
          <div className="h-4" />
        </ScrollArea>

        {/* Close */}
        <div className="p-3 flex justify-center border-t border-border">
          <Button
            onClick={onClose}
            size="icon"
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
