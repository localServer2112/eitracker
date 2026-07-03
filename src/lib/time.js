/**
 * Formats a date string as a relative "time since" string.
 *
 * Tiers:
 *   <5s    -> 'just now'
 *   <60s   -> 'N sec ago'
 *   <60min -> 'N min ago'
 *   <24h   -> 'Nhrs ago'
 *   >=24h  -> 'Nd ago'
 *
 * @param {string} dateStr - ISO date string (or any value accepted by `new Date`).
 * @param {{ emptyText?: string }} [options]
 * @param {string} [options.emptyText='Unknown'] - returned when dateStr is falsy.
 * @returns {string}
 */
export function timeSince(dateStr, { emptyText = 'Unknown' } = {}) {
  if (!dateStr) return emptyText;
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
