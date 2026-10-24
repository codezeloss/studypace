/** Daily study streak, a small motivation signal on the dashboard. */
import type { Session } from './types';
import { addDays, startOfDay, toDayKey } from './week';

/**
 * Counts consecutive calendar days with at least one session, ending today.
 * If nothing was logged today yet, counting starts yesterday, so the streak
 * only breaks once a whole day has passed without studying.
 */
export function currentStreak(sessions: readonly Pick<Session, 'startedAt'>[], now: Date): number {
  const days = new Set(sessions.map((s) => toDayKey(new Date(s.startedAt))));
  let cursor = startOfDay(now);
  if (!days.has(toDayKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
