import { useEffect, useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-domain.com/api/v1';

/**
 * Real-time sensor data hook using SSE (Server-Sent Events).
 *
 * Connects to the djangorealtime SSE endpoint and listens for `sensor_data` events.
 * Maintains a vans object keyed by vehicle_plate_number for O(1) per-vehicle updates.
 *
 * @param {string|null} token - Auth token for SSE endpoint. Null skips connection.
 * @returns {{ vans: Object, connected: boolean, error: string|null }}
 */
export function useSensorDataRealtime(token) {
  const [vans, setVans] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const updateVan = useCallback((data) => {
    if (!data || !data.vehicle_plate_number) return;

    setVans((prev) => ({
      ...prev,
      [data.vehicle_plate_number]: {
        ...prev[data.vehicle_plate_number],
        ...data,
        // Map backend keys to frontend expected keys
        latitude: data.lat !== undefined ? data.lat : data.latitude,
        longitude: data.long !== undefined ? data.long : data.longitude,
        temp_2: data.temp2 !== undefined ? data.temp2 : data.temp_2,
        battery_percentage: data.batPer !== undefined ? data.batPer : data.battery_percentage,
        network_status: data.netSignal >= 5 ? 'strong' : data.netSignal >= 4 ? 'good' : data.netSignal >= 2 ? 'fair' : 'weak',
        cooling_unit_battery: data.vanBat !== undefined ? data.vanBat : data.cooling_unit_battery,
        logger_battery: data.batPer !== undefined ? data.batPer : data.logger_battery,
        solar_panel_current: data.current !== undefined ? data.current : data.solar_panel_current,
        energy_charged: data.energy !== undefined ? data.energy : data.energy_charged,
        vehicle_speed: data.speed !== undefined ? data.speed : data.vehicle_speed,
        
        last_seen: data.created_at || new Date().toISOString(),
        status: 'online',
      },
    }));
  }, []);

  useEffect(() => {
    if (!token) return;

    let reader;
    let isActive = true;
    let fallbackInterval;

    const fetchAllVehicles = async () => {
      try {
        const initialRes = await fetch(`${API_BASE}/sensor-data/all-vehicles/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (initialRes.ok) {
          const initialData = await initialRes.json();
          if (Array.isArray(initialData)) {
            initialData.forEach(van => {
              if (isActive) updateVan(van);
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch vehicles data:', err);
      }
    };

    const connectStream = async () => {
      try {
        // 1. Initial State Fetch
        await fetchAllVehicles();
        
        // 1b. Periodic Fallback Poll (every 2 mins)
        fallbackInterval = setInterval(() => {
          if (isActive) fetchAllVehicles();
        }, 120000);

        // 2. Connect to Realtime SSE stream
        const url = `${API_BASE}/realtime/sse/?token=${encodeURIComponent(token)}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'text/event-stream',
          }
        });

        if (!response.ok) {
          throw new Error('SSE connection failed');
        }

        setConnected(true);
        setError(null);

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (isActive) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // Keep incomplete piece in buffer

          for (const part of parts) {
            const lines = part.split('\n');
            let eventData = null;

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim();
                try {
                  eventData = JSON.parse(jsonStr);
                } catch (e) {
                  // ignore parse error for heartbeat/incomplete JSON
                }
              }
            }

            if (eventData && eventData.type !== 'connected') {
              updateVan(eventData);
              window.dispatchEvent(
                new CustomEvent('djr:sensor_data', { detail: eventData })
              );
            }
          }
        }
      } catch (err) {
        if (isActive) {
          setConnected(false);
          setError('Connection lost. Reconnecting...');
          setTimeout(connectStream, 5000); // basic reconnect logic
        }
      }
    };

    connectStream();

    return () => {
      isActive = false;
      if (reader) reader.cancel();
      if (fallbackInterval) clearInterval(fallbackInterval);
      setConnected(false);
    };
  }, [token, updateVan]);

  return { vans, connected, error };
}
