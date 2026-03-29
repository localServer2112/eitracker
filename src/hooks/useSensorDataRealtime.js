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
        console.error('Failed to fetch vehicles data:', err);
        if (isActive) {
          setConnected(false);
          setError('Connection error');
        }
      }
    };

    // 1. Initial fetch
    fetchAllVehicles();
    
    // 2. Periodic Poll (every 2 mins)
    fallbackInterval = setInterval(() => {
      if (isActive) fetchAllVehicles();
    }, 120000);

    return () => {
      isActive = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      setConnected(false);
    };
  }, [token, updateVan]);

  return { vans, connected, error };
}
