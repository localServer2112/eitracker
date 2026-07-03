import { describe, it, expect } from 'vitest';
import { timeSince } from './time';

function agoISO(ms) {
  return new Date(Date.now() - ms).toISOString();
}

describe('timeSince', () => {
  it('returns "Unknown" for empty input by default', () => {
    expect(timeSince(null)).toBe('Unknown');
  });

  it('returns the provided emptyText for empty input', () => {
    expect(timeSince(undefined, { emptyText: '' })).toBe('');
  });

  it('returns "just now" for timestamps under 5 seconds old', () => {
    expect(timeSince(agoISO(1000))).toBe('just now');
  });

  it('returns "N sec ago" for timestamps under a minute old', () => {
    expect(timeSince(agoISO(30 * 1000))).toBe('30 sec ago');
  });

  it('returns "N min ago" for timestamps under an hour old', () => {
    expect(timeSince(agoISO(2 * 60 * 1000))).toBe('2 min ago');
  });

  it('returns "Nhrs ago" for timestamps under a day old', () => {
    expect(timeSince(agoISO(5 * 60 * 60 * 1000))).toBe('5hrs ago');
  });

  it('returns "Nd ago" for timestamps 24 hours or older', () => {
    expect(timeSince(agoISO(3 * 24 * 60 * 60 * 1000))).toBe('3d ago');
  });
});
