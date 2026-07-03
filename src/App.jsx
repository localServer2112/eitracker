import { useState } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import VansListModal from './components/VansListModal';
import FreezerListModal from './components/FreezerListModal';
import { useSensorDataRealtime } from './hooks/useSensorDataRealtime';
import { useFreezerData } from './hooks/useFreezerData';
import Login from './components/Login';

// TEMPORARY: the freezer API is a separate backend with its own user
// database, so most accounts that log in fine on the vehicle API get
// rejected by the freezer API. Until that account is provisioned, fall back
// to a shared token so freezer data stays available. NOTE this token is
// inlined into the client bundle by Vite and is readable via DevTools by
// anyone visiting the deployed site — remove this fallback once per-user
// freezer login actually works.
const FREEZER_TOKEN_FALLBACK = import.meta.env.VITE_FREEZER_TOKEN || null;

export default function App() {
  const [activeTab, setActiveTab] = useState('maps');
  const [selectedVan, setSelectedVan] = useState(null);
  const [selectedFreezer, setSelectedFreezer] = useState(null);

  // Manage auth state
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [freezerToken, setFreezerToken] = useState(
    () => localStorage.getItem('freezer_auth_token') || FREEZER_TOKEN_FALLBACK
  );
  const [freezerLoginError, setFreezerLoginError] = useState(null);

  const handleLogin = (newToken, newFreezerToken, freezerAuthError) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);

    // Prefer the real per-user token; fall back to the shared token so
    // freezer data is still available when the freezer login fails.
    const resolvedFreezerToken = newFreezerToken || FREEZER_TOKEN_FALLBACK;
    if (resolvedFreezerToken) {
      localStorage.setItem('freezer_auth_token', resolvedFreezerToken);
      setFreezerToken(resolvedFreezerToken);
      setFreezerLoginError(null);
    } else {
      // Clear any stale token from a previous session so we don't keep using
      // freezer credentials this login attempt couldn't re-establish.
      localStorage.removeItem('freezer_auth_token');
      setFreezerToken(null);
      setFreezerLoginError(freezerAuthError || null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('freezer_auth_token');
    setToken(null);
    setFreezerToken(null);
    setFreezerLoginError(null);
  };

  const { vans, connected: vansConnected, error: vansError } = useSensorDataRealtime(token);
  const { freezers, connected: freezersConnected, error: freezersError } = useFreezerData(freezerToken);

  const connection = {
    vans: { connected: vansConnected, error: vansError },
    freezers: {
      connected: freezersConnected,
      error: freezersError || freezerLoginError,
      // The Freezers tab is always available, so its connection status
      // should always be surfaced — not hidden just because the freezer
      // login attempt failed and left us without a token.
      enabled: true,
    },
  };

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
      <Header activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} connection={connection} />

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
