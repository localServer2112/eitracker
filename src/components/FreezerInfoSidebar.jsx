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
  Zap,
  Sun,
  Hash,
} from 'lucide-react';
import { timeSince } from '@/lib/time';
import { NetworkBars, MetricCell, StatRow } from '@/components/ui/metrics';

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
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {freezer.device_id}
                </h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">Freezer Unit</p>
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
                accentClass="text-cyan-500"
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
              icon={Hash}
              value={freezer.serial_number}
              unit=""
              label="Serial number"
            />
          </div>

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
