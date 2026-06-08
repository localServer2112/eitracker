import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAddressFromCoordinates } from '../utils/geocoder';
import {
  X,
  BatteryMedium,
  MapPin,
  Thermometer,
  Zap,
  Sun,
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

function MetricCell({ value, unit, label, danger = false, accent = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-1">
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            'text-[17px] font-bold',
            danger ? 'text-red-500' : accent ? 'text-cyan-500' : 'text-foreground'
          )}
        >
          {value ?? '-'}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function NetworkBars({ value }) {
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

export default function FreezerInfoSidebar({ freezer, onClose, onViewOnMap }) {
  const [locationStr, setLocationStr] = useState('Fetching address...');
  const isOnline = freezer.status === 'online' || freezer.status === 'attention';
  const lastSeenText = timeSince(freezer.last_seen);
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    if (
      !freezer.latitude ||
      !freezer.longitude ||
      (freezer.latitude === 0 && freezer.longitude === 0)
    ) {
      setLocationStr('Unknown location');
      return;
    }
    const timerId = setTimeout(() => {
      getAddressFromCoordinates(freezer.latitude, freezer.longitude).then(setLocationStr);
    }, 500);
    return () => clearTimeout(timerId);
  }, [freezer.latitude, freezer.longitude]);

  return (
    <div className="absolute top-3 right-3 bottom-3 w-[340px] z-[1000] animate-slide-in-right">
      <Card className="h-full flex flex-col shadow-2xl border-0 rounded-2xl overflow-hidden">
        <ScrollArea className="flex-1">
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">❄️</span>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {freezer.device_id}
                  </h2>
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {freezer.batch_code ? `Batch: ${freezer.batch_code}` : freezer.serial_number || 'Freezer Unit'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <BatteryMedium
                    className={cn(
                      'w-5 h-5',
                      (freezer.battery_percent ?? 0) > 50
                        ? 'text-emerald-500'
                        : (freezer.battery_percent ?? 0) > 20
                          ? 'text-amber-500'
                          : 'text-red-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {freezer.battery_percent ?? '-'}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <NetworkBars value={freezer.network_signal || 0} />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mx-5 px-4 py-3 bg-muted/50 rounded-xl">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-foreground leading-snug">{locationStr}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-muted-foreground">Location</span>
                  <span className="text-[11px] text-muted-foreground/40">·</span>
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isOnline ? 'text-cyan-500' : 'text-red-500'
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
              <MetricCell
                value={freezer.temperature}
                unit="°C"
                label="Temperature"
                accent
                danger={freezer.temperature != null && freezer.temperature > 8}
              />
              <MetricCell
                value={freezer.battery_percent}
                unit="%"
                label="Battery"
                danger={(freezer.battery_percent ?? 100) < 30}
              />
              <MetricCell
                value={freezer.network_signal}
                unit=""
                label="Signal"
              />
            </div>
            <Separator />
            <div className="grid grid-cols-3 divide-x divide-border">
              <MetricCell
                value={freezer.current_generation}
                unit="A"
                label="Current Gen"
              />
              <MetricCell
                value={freezer.current_consumption}
                unit="A"
                label="Consumption"
              />
              <MetricCell
                value={freezer.energy_generation != null ? parseFloat(freezer.energy_generation.toFixed(2)) : null}
                unit="kWh"
                label="Energy Gen"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 mt-3">
            <StatRow
              icon={Sun}
              value={freezer.current_generation}
              unit="Amps"
              label="Current generation"
              date={dateLabel}
            />
            <Separator />
            <StatRow
              icon={Zap}
              value={freezer.energy_generation != null ? parseFloat(freezer.energy_generation.toFixed(3)) : null}
              unit="kWh"
              label="Energy generation"
              date={dateLabel}
            />
            <Separator />
            <StatRow
              icon={Zap}
              value={freezer.energy_consumption != null ? parseFloat(freezer.energy_consumption.toFixed(3)) : null}
              unit="kWh"
              label="Energy consumption"
              date={dateLabel}
            />
            <Separator />
            <StatRow
              icon={Thermometer}
              value={freezer.temperature}
              unit="°C"
              label="Freezer temperature"
              date={dateLabel}
            />
          </div>

          {/* Device info */}
          {(freezer.serial_number || freezer.chip_mac) && (
            <div className="mx-5 mt-3 mb-2 px-4 py-3 bg-muted/30 rounded-xl">
              {freezer.serial_number && (
                <div className="flex justify-between text-[11px] py-0.5">
                  <span className="text-muted-foreground">Serial</span>
                  <span className="font-mono text-foreground">{freezer.serial_number}</span>
                </div>
              )}
              {freezer.chip_mac && (
                <div className="flex justify-between text-[11px] py-0.5">
                  <span className="text-muted-foreground">MAC</span>
                  <span className="font-mono text-foreground">{freezer.chip_mac}</span>
                </div>
              )}
            </div>
          )}

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
