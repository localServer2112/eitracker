import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Search, Truck, Download, X, Loader2 } from 'lucide-react';

function timeSince(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}hrs ago`;
}

function MiniMetric({ label, value, unit }) {
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

function StatusIndicator({ status, lastSeen }) {
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
      {status === 'offline' && lastSeen && (
        <span className="text-[10px] text-red-400">
          Last seen: {timeSince(lastSeen)}
        </span>
      )}
      {status === 'attention' && (
        <span className="text-[10px] text-amber-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" />
          Attention
        </span>
      )}
    </div>
  );
}

import vanActiveImg from '../assets/van-active.png';
import vanDefaultImg from '../assets/van-default.png';

export default function VansListModal({ vans, token, onSelectVan, onSwitchToMap }) {
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportPlate, setExportPlate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportError, setExportError] = useState('');

  const vanList = Object.values(vans);

  const handleExport = async () => {
    setExportError('');
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (exportPlate) params.set('plate_number', exportPlate);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const base = import.meta.env.VITE_API_BASE || '/api/v1';
      const url = `${base}/sensor-data/export/csv${params.toString() ? `?${params}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const filename = exportPlate
        ? `sensor-data-${exportPlate}.csv`
        : 'sensor-data-all.csv';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return vanList;
    const q = search.toLowerCase();
    return vanList.filter(
      (v) =>
        v.vehicle_plate_number.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.status?.toLowerCase().includes(q)
    );
  }, [vanList, search]);

  const vanCount = vanList.filter((v) => v.type === 'Van').length;
  const tricycleCount = vanList.filter((v) => v.type === 'Tricycle').length;

  const handleRowClick = (van) => {
    onSelectVan(van);
    if (onSwitchToMap) onSwitchToMap();
  };

  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center pt-6 pb-6 pointer-events-none">
      <Card className="w-full max-w-[680px] max-h-[80vh] flex-1 min-h-0 flex flex-col pointer-events-auto animate-fade-in-up shadow-2xl border-0 rounded-2xl overflow-hidden">
        {/* Title */}
        <CardHeader className="pb-2 pt-6 px-5">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex flex-col items-center">
              <CardTitle className="text-xl">All Vehicles</CardTitle>
              <CardDescription className="mt-1">
                {vanCount} Vans · {tricycleCount} Tricycles
              </CardDescription>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant={showExport ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => { setShowExport((v) => !v); setExportError(''); }}
              >
                {showExport ? <X className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {showExport ? 'Close' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Export panel */}
        {showExport && (
          <div className="px-5 pb-3">
            <div className="rounded-xl border border-border/50 bg-muted/40 p-4 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Export Options</p>

              {/* Van selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Vehicle</label>
                <select
                  value={exportPlate}
                  onChange={(e) => setExportPlate(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                >
                  <option value="">All Vans</option>
                  {vanList.map((v) => (
                    <option key={v.vehicle_plate_number} value={v.vehicle_plate_number}>
                      {v.vehicle_plate_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm bg-background border-border/50 rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm bg-background border-border/50 rounded-lg"
                  />
                </div>
              </div>

              {exportError && (
                <p className="text-xs text-red-400">{exportError}</p>
              )}

              <Button
                onClick={handleExport}
                disabled={isDownloading}
                className="w-full h-9 text-sm bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isDownloading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Downloading...</>
                ) : (
                  <><Download className="w-3.5 h-3.5 mr-2" /> Download CSV</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-muted/50 border-border/50 rounded-xl h-10 focus-visible:ring-emerald-400/30"
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="pt-0 pb-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No vehicles found
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((van, i) => (
                  <button
                    key={van.vehicle_plate_number}
                    onClick={() => handleRowClick(van)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3.5 rounded-xl transition-colors text-left group cursor-pointer',
                      'hover:bg-muted/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <img
                        src={(van.status === 'online' || van.status === 'attention') ? vanActiveImg : vanDefaultImg}
                        alt="van"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {van.vehicle_plate_number}
                        </span>
                        {van.status === 'attention' && (
                          <span className="text-[10px] text-amber-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" />
                            Attention
                          </span>
                        )}
                        {van.status === 'offline' && van.last_seen && (
                          <span className="text-[10px] text-red-400">
                            · Last seen: {timeSince(van.last_seen)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <MiniMetric label="Sht_Temp" value={van.sht_temp} unit="°C" />
                        <MiniMetric label="Amb Temp" value={van.ambient_temp} unit="°C" />
                        <MiniMetric label="Logger Battery" value={van.logger_battery} unit="%" />
                        <MiniMetric label="Cooling Unit Battery" value={van.cooling_unit_battery} unit="%" />
                      </div>
                    </div>

                    {/* Status */}
                    <StatusIndicator status={van.status} lastSeen={van.last_seen} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
