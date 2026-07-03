import { describe, it, expect } from 'vitest';
import { deriveStatus, OFFLINE_AFTER_MS, ATTENTION_AFTER_MS } from './deviceStatus';

describe('deriveStatus', () => {
  const NOW = new Date('2026-07-02T12:00:00.000Z').getTime();

  it('returns "online" for a fresh timestamp', () => {
    const lastSeen = new Date(NOW).toISOString();
    expect(deriveStatus(lastSeen, NOW)).toBe('online');
  });

  it('returns "attention" for a timestamp 6 minutes old', () => {
    const lastSeen = new Date(NOW - 6 * 60 * 1000).toISOString();
    expect(deriveStatus(lastSeen, NOW)).toBe('attention');
  });

  it('returns "offline" for a timestamp 11 minutes old', () => {
    const lastSeen = new Date(NOW - 11 * 60 * 1000).toISOString();
    expect(deriveStatus(lastSeen, NOW)).toBe('offline');
  });

  it('returns "offline" for a null timestamp', () => {
    expect(deriveStatus(null, NOW)).toBe('offline');
  });

  it('returns "offline" for an undefined timestamp', () => {
    expect(deriveStatus(undefined, NOW)).toBe('offline');
  });

  it('returns "offline" for an unparseable string', () => {
    expect(deriveStatus('not-a-date', NOW)).toBe('offline');
  });

  it('returns "attention" at exactly the ATTENTION_AFTER_MS boundary', () => {
    const lastSeen = new Date(NOW - ATTENTION_AFTER_MS).toISOString();
    expect(deriveStatus(lastSeen, NOW)).toBe('attention');
  });

  it('returns "offline" at exactly the OFFLINE_AFTER_MS boundary', () => {
    const lastSeen = new Date(NOW - OFFLINE_AFTER_MS).toISOString();
    expect(deriveStatus(lastSeen, NOW)).toBe('offline');
  });
});
