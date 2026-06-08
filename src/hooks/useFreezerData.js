import { useEffect, useState, useCallback } from 'react';

const FREEZER_API_BASE = import.meta.env.VITE_FREEZER_API_BASE || '/freezer-api/v1';

export function useFreezerData(token) {
  const [freezers, setFreezers] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const updateFreezer = useCallback((data) => {
    if (!data || !data.device_id) return;

    setFreezers((prev) => ({
      ...prev,
      [data.device_id]: {
        ...prev[data.device_id],
        ...data,
        latitude: data.lat,
        longitude: data.lng,
        network_status:
          data.network_signal >= 5
            ? 'strong'
            : data.network_signal >= 4
              ? 'good'
              : data.network_signal >= 2
                ? 'fair'
                : 'weak',
        last_seen: data.created_at || new Date().toISOString(),
        status: 'online',
      },
    }));
  }, []);

  useEffect(() => {
    if (!token) return;
    let isActive = true;

    const fetchAllFreezers = async () => {
      try {
        const res = await fetch(`${FREEZER_API_BASE}/freezer-data/last/all/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((freezer) => { if (isActive) updateFreezer(freezer); });
            if (isActive) {
              setConnected(true);
              setError(null);
            }
          }
        } else {
          if (isActive) {
            setConnected(false);
            setError('Failed to fetch data');
          }
        }
      } catch (err) {
        console.error('Freezer fetch error:', err);
        if (isActive) {
          setConnected(false);
          setError('Connection error');
        }
      }
    };

    fetchAllFreezers();
    const interval = setInterval(() => {
      if (isActive) fetchAllFreezers();
    }, 120000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [token, updateFreezer]);

  return { freezers, connected, error };
}
