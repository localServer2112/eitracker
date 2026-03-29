import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useSensorDataRealtime } from './useSensorDataRealtime';

// 1. Setup MSW (Mock Service Worker) to intercept fetch requests
const server = setupServer(
  // Intercept the initial data fetch
  http.get('*/sensor-data/all-vehicles/', () => {
    return HttpResponse.json([
      {
        vehicle_plate_number: 'TEST-123',
        lat: 3.1415,
        long: 7.8910,
        temp2: 24.5,
        batPer: 85,
        netSignal: 4, // 0-5 scale that should map to 'good' network status
        vanBat: 90,
        current: 5.2,
        energy: 100.5,
        speed: 45
      }
    ]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useSensorDataRealtime', () => {
  it('successfully fetches initial vehicles and strictly maps backend shorthand keys to frontend models', async () => {
    // 2. Render the hook exactly as the React App would
    const { result } = renderHook(() => useSensorDataRealtime('fake-token'));

    // 3. Wait for the async MSW interceptor to return the mock API data
    await waitFor(() => {
      expect(Object.keys(result.current.vans).length).toBe(1);
    });

    const van = result.current.vans['TEST-123'];
    expect(van).toBeDefined();
    
    // 4. Assert all property mutations occurred correctly
    expect(van.latitude).toBe(3.1415);
    expect(van.longitude).toBe(7.8910);
    expect(van.temp_2).toBe(24.5);
    
    // batPer mapping
    expect(van.logger_battery).toBe(85);
    expect(van.battery_percentage).toBe(85);
    
    // netSignal mapping (4)
    expect(van.network_status).toBe('good'); 
    
    // vanBat mapping
    expect(van.cooling_unit_battery).toBe(90);
    
    // miscellaneous mapping
    expect(van.solar_panel_current).toBe(5.2);
    expect(van.energy_charged).toBe(100.5);
    expect(van.vehicle_speed).toBe(45);
    
    // ensure default statuses are applied
    expect(van.status).toBe('online');
    expect(typeof van.last_seen).toBe('string');
  });
});
