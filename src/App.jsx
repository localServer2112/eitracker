import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Header from './components/Header';
import MapView from './components/MapView';
import VansListModal from './components/VansListModal';
import NotificationTab from './components/NotificationTab';
import { useSensorDataRealtime } from './hooks/useSensorDataRealtime';

const SSE_TOKEN = import.meta.env.VITE_SSE_TOKEN || null;

export default function App() {
  const [activeTab, setActiveTab] = useState('maps');
  const [selectedVan, setSelectedVan] = useState(null);

  const { vans, connected } = useSensorDataRealtime(SSE_TOKEN);

  // Keep selectedVan synced with latest data
  const currentSelectedVan = selectedVan
    ? vans[selectedVan.vehicle_plate_number] || selectedVan
    : null;

  return (
    <div className="flex flex-col h-full w-full bg-muted/30">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 relative overflow-hidden">
        {/* Map always renders behind overlays */}
        <MapView
          vans={vans}
          selectedVan={activeTab === 'maps' ? currentSelectedVan : null}
          onSelectVan={activeTab === 'maps' ? setSelectedVan : () => {}}
        />

        {activeTab === 'vans' && (
          <VansListModal
            vans={vans}
            onSelectVan={setSelectedVan}
            onSwitchToMap={() => setActiveTab('maps')}
          />
        )}

        {activeTab === 'notification' && <NotificationTab />}
      </main>

      {/* SSE indicator */}
      {SSE_TOKEN && (
        <div
          className={cn(
            'fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm border',
            connected
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
              : 'bg-red-500/10 text-red-500 border-red-200'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              connected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500'
            )}
          />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      )}
    </div>
  );
}
