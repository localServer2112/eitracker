export const OFFLINE_AFTER_MS = 10 * 60 * 1000; // no report for 10 min => offline
export const ATTENTION_AFTER_MS = 5 * 60 * 1000; // no report for 5 min => attention

export function deriveStatus(lastSeenIso, nowMs = Date.now()) {
  if (!lastSeenIso) return 'offline';
  const age = nowMs - new Date(lastSeenIso).getTime();
  if (Number.isNaN(age) || age >= OFFLINE_AFTER_MS) return 'offline';
  if (age >= ATTENTION_AFTER_MS) return 'attention';
  return 'online';
}
