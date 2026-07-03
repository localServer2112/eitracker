import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, X, Loader2 } from 'lucide-react';
import { timeSince } from '@/lib/time';
import { MiniMetric, StatusIndicator } from '@/components/ui/metrics';

const FREEZER_API_BASE = import.meta.env.VITE_FREEZER_API_BASE || '/freezer-api/v1';

export default function FreezerListModal({ freezers, token, onSelectFreezer, onSwitchToMap }) {
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportDevice, setExportDevice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportError, setExportError] = useState('');

  const freezerList = Object.values(freezers);

  const handleExport = async () => {
    setExportError('');
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (exportDevice) params.set('device_id', exportDevice);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const url = `${FREEZER_API_BASE}/freezer-data/export/csv${params.toString() ? `?${params}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const filename = exportDevice ? `freezer-data-${exportDevice}.csv` : 'freezer-data-all.csv';
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
    if (!search.trim()) return freezerList;
    const q = search.toLowerCase();
    return freezerList.filter(
      (f) =>
        f.device_id?.toLowerCase().includes(q) ||
        f.batch_code?.toLowerCase().includes(q) ||
        f.serial_number?.toLowerCase().includes(q) ||
        f.status?.toLowerCase().includes(q)
    );
  }, [freezerList, search]);

  const handleRowClick = (freezer) => {
    onSelectFreezer(freezer);
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
              <CardTitle className="text-xl">All Freezers</CardTitle>
              <CardDescription className="mt-1">
                {freezerList.length} {freezerList.length === 1 ? 'Unit' : 'Units'}
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

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Device</label>
                <select
                  value={exportDevice}
                  onChange={(e) => setExportDevice(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                >
                  <option value="">All Freezers</option>
                  {freezerList.map((f) => (
                    <option key={f.device_id} value={f.device_id}>
                      {f.device_id}
                    </option>
                  ))}
                </select>
              </div>

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

              {exportError && <p className="text-xs text-red-400">{exportError}</p>}

              <Button
                onClick={handleExport}
                disabled={isDownloading}
                className="w-full h-9 text-sm bg-cyan-500 hover:bg-cyan-600 text-white"
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
              placeholder="Search by device ID, batch code..."
              className="pl-9 bg-muted/50 border-border/50 rounded-xl h-10 focus-visible:ring-cyan-400/30"
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="pt-0 pb-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {freezerList.length === 0 ? 'No freezers found' : 'No results'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((freezer) => (
                  <button
                    key={freezer.device_id}
                    onClick={() => handleRowClick(freezer)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3.5 rounded-xl transition-colors text-left group cursor-pointer',
                      'hover:bg-muted/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <span className="text-xl">❄️</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{freezer.device_id}</span>
                        {freezer.status === 'offline' && freezer.last_seen && (
                          <span className="text-[10px] text-red-400">
                            · Last seen: {timeSince(freezer.last_seen, { emptyText: '' })}
                          </span>
                        )}
                      </div>
                      {freezer.batch_code && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Batch: {freezer.batch_code}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <MiniMetric label="Temperature" value={freezer.temperature} unit="°C" />
                        <MiniMetric label="Battery" value={freezer.battery_percent} unit="%" />
                        <MiniMetric label="Energy Gen" value={freezer.energy_generation != null ? parseFloat(freezer.energy_generation.toFixed(2)) : null} unit="kWh" />
                        <MiniMetric label="Energy Cons" value={freezer.energy_consumption != null ? parseFloat(freezer.energy_consumption.toFixed(2)) : null} unit="kWh" />
                      </div>
                    </div>

                    {/* Status */}
                    <StatusIndicator status={freezer.status} lastSeen={freezer.last_seen} />
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
