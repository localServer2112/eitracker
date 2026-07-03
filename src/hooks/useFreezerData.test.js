import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useFreezerData } from './useFreezerData';

// Recent timestamps so status/staleness derivation (plan 002) still lands on
// "online" if/when that logic replaces the current hardcoded status.
const RECENT_ISO = new Date().toISOString();

const server = setupServer(
  http.get('*/freezer-data/last/all/', () => {
    return HttpResponse.json([
      {
        device_id: 'FZ-01',
        lat: 7.1,
        lng: 3.9,
        network_signal: 4,
        created_at: RECENT_ISO,
      },
    ]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useFreezerData', () => {
  it('fetches freezer data and maps lat/lng + network_signal to latitude/longitude/network_status', async () => {
    const { result } = renderHook(() => useFreezerData('fake-login-token'));

    await waitFor(() => {
      expect(Object.keys(result.current.freezers).length).toBe(1);
    });

    const freezer = result.current.freezers['FZ-01'];
    expect(freezer).toBeDefined();
    expect(freezer.latitude).toBe(7.1);
    expect(freezer.longitude).toBe(3.9);
    expect(freezer.network_status).toBe('good');
    expect(freezer.last_seen).toBe(RECENT_ISO);
  });

  it('maps network_signal boundaries to strong/fair/weak', async () => {
    server.use(
      http.get('*/freezer-data/last/all/', () => {
        return HttpResponse.json([
          { device_id: 'FZ-STRONG', lat: 1, lng: 1, network_signal: 5, created_at: RECENT_ISO },
          { device_id: 'FZ-FAIR', lat: 2, lng: 2, network_signal: 2, created_at: RECENT_ISO },
          { device_id: 'FZ-WEAK', lat: 3, lng: 3, network_signal: 0, created_at: RECENT_ISO },
        ]);
      })
    );

    const { result } = renderHook(() => useFreezerData('fake-login-token'));

    await waitFor(() => {
      expect(Object.keys(result.current.freezers).length).toBe(3);
    });

    expect(result.current.freezers['FZ-STRONG'].network_status).toBe('strong');
    expect(result.current.freezers['FZ-FAIR'].network_status).toBe('fair');
    expect(result.current.freezers['FZ-WEAK'].network_status).toBe('weak');
  });

  it('ignores records without a device_id', async () => {
    server.use(
      http.get('*/freezer-data/last/all/', () => {
        return HttpResponse.json([
          { lat: 5, lng: 5, network_signal: 5, created_at: RECENT_ISO },
        ]);
      })
    );

    const { result } = renderHook(() => useFreezerData('fake-login-token'));

    // Give the fetch a chance to resolve; state should remain empty throughout.
    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    expect(Object.keys(result.current.freezers).length).toBe(0);
  });

  it('does not fetch when there is no token (post-plan-001, loginToken is the only token path; pre-001 this test also requires VITE_FREEZER_TOKEN to be unset)', async () => {
    // No .env file exists in this worktree, so VITE_FREEZER_TOKEN is unset here regardless
    // of which version of useFreezerData is active. onUnhandledRequest: 'error' (see server.listen
    // above) means any unexpected request would fail the test suite.
    const { result } = renderHook(() => useFreezerData(null));

    // Allow any microtasks/effects to flush.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.freezers).toEqual({});
    expect(result.current.connected).toBe(false);
  });
});
