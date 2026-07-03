import { describe, it, expect, vi, afterEach } from 'vitest';

// The geocoder module keeps its address cache at module scope, so each test
// that needs an isolated cache uses vi.resetModules() + a dynamic import to
// get a fresh module instance. Tests that intentionally rely on the cache
// (the cache-hit case) reuse the same imported instance within that test.

describe('geocoder: getAddressFromCoordinates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns "Unknown location" for 0/0 coords and does not call fetch', async () => {
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getAddressFromCoordinates } = await import('./geocoder.js');

    const result = await getAddressFromCoordinates(0, 0);

    expect(result).toBe('Unknown location');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('composes an address from road, suburb, and city on a successful response', async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          road: 'Main St',
          suburb: 'Downtown',
          city: 'Metropolis',
          state: 'Some State',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getAddressFromCoordinates } = await import('./geocoder.js');

    const result = await getAddressFromCoordinates(10.1234, 20.5678);

    expect(result).toBe('Main St, Downtown, Metropolis');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches by grid cell: nearby coordinates rounding to the same cell reuse the cached value', async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { road: 'Grid Rd', suburb: 'Gridburb', city: 'Gridtown' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getAddressFromCoordinates } = await import('./geocoder.js');

    const first = await getAddressFromCoordinates(7.39641, 3.5);
    const second = await getAddressFromCoordinates(7.39642, 3.5);

    expect(first).toBe('Grid Rd, Gridburb, Gridtown');
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns "Location unavailable" when fetch rejects', async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);
    const { getAddressFromCoordinates } = await import('./geocoder.js');

    const result = await getAddressFromCoordinates(11.111, 22.222);

    expect(result).toBe('Location unavailable');
  });

  it('falls back to state when only state is present in the address', async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { state: 'Lonely State' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getAddressFromCoordinates } = await import('./geocoder.js');

    const result = await getAddressFromCoordinates(33.333, 44.444);

    expect(result).toBe('Lonely State');
  });
});
