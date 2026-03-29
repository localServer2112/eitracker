import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Header from './components/Header';
import MapView from './components/MapView';
import VansListModal from './components/VansListModal';
import NotificationTab from './components/NotificationTab';
import { useSensorDataRealtime } from './hooks/useSensorDataRealtime';
import Login from './components/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState('maps');
  const [selectedVan, setSelectedVan] = useState(null);
  
  // Manage auth state
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);

  const handleLogin = (newToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  const { vans } = useSensorDataRealtime(token);

  // Keep selectedVan synced with latest data
  const currentSelectedVan = selectedVan
    ? vans[selectedVan.vehicle_plate_number] || selectedVan
    : null;

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-muted/30">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

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

    </div>
  );
}
