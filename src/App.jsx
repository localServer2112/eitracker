import { useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import VansListModal from './components/VansListModal';
import FreezerListModal from './components/FreezerListModal';
import { useSensorDataRealtime } from './hooks/useSensorDataRealtime';
import { useFreezerData } from './hooks/useFreezerData';
import Login from './components/Login';

export default function App() {
  const [activeTab, setActiveTab] = useState('maps');
  const [selectedVan, setSelectedVan] = useState(null);
  const [selectedFreezer, setSelectedFreezer] = useState(null);

  // Manage auth state
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [freezerToken, setFreezerToken] = useState(() => localStorage.getItem('freezer_auth_token') || null);

  const handleLogin = (newToken, newFreezerToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    if (newFreezerToken) {
      localStorage.setItem('freezer_auth_token', newFreezerToken);
      setFreezerToken(newFreezerToken);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('freezer_auth_token');
    setToken(null);
    setFreezerToken(null);
  };

  const { vans } = useSensorDataRealtime(token);
  const { freezers } = useFreezerData(freezerToken);

  // Keep selections synced with latest data
  const currentSelectedVan = selectedVan
    ? vans[selectedVan.vehicle_plate_number] || selectedVan
    : null;

  const currentSelectedFreezer = selectedFreezer
    ? freezers[selectedFreezer.device_id] || selectedFreezer
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
          onSelectVan={(van) => { setSelectedVan(van); setSelectedFreezer(null); }}
          freezers={freezers}
          selectedFreezer={activeTab === 'maps' ? currentSelectedFreezer : null}
          onSelectFreezer={(f) => { setSelectedFreezer(f); setSelectedVan(null); }}
        />

        {activeTab === 'vans' && (
          <VansListModal
            vans={vans}
            token={token}
            onSelectVan={(van) => { setSelectedVan(van); setSelectedFreezer(null); }}
            onSwitchToMap={() => setActiveTab('maps')}
          />
        )}

        {activeTab === 'fridges' && (
          <FreezerListModal
            freezers={freezers}
            token={freezerToken}
            onSelectFreezer={(f) => { setSelectedFreezer(f); setSelectedVan(null); }}
            onSwitchToMap={() => setActiveTab('maps')}
          />
        )}


      </main>

    </div>
  );
}
