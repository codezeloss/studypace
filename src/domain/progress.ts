/**
 * Progress evaluation. Everything is derived from raw sessions at read time,
 * so the database never stores derived numbers that could go out of sync.
 */
import { paceStatus } from './pace';
import type { PaceStatus, Session, StudyModule } from './types';
import { addDays, lastWeekStarts, startOfWeek, weekRange } from './week';

/** Sums the minutes of sessions that start within [start, end), optionally for one module. */
export function minutesInRange(
  sessions: readonly Session[],
  start: Date,
  end: Date,
  moduleId?: number,
): number {
  const from = start.getTime();
  const to = end.getTime();
  let total = 0;
  for (const session of sessions) {
    if (moduleId !== undefined && session.moduleId !== moduleId) continue;
    const t = new Date(session.startedAt).getTime();
    if (t >= from && t < to) total += session.durationMin;
  }
  return total;
}

/** All-time minutes logged for one module. */
export function totalMinutes(sessions: readonly Session[], moduleId: number): number {
  return sessions.reduce((sum, s) => (s.moduleId === moduleId ? sum + s.durationMin : sum), 0);
}

const safeRatio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

/** Progress of one module in the current week. `ratio` is not clamped, so 1.2 means 120 %. */
export interface ModuleWeekProgress {
  module: StudyModule;
  loggedMin: number;
  targetMin: number;
  ratio: number;
  pace: PaceStatus;
}

/** Evaluates one module's goal for the week that contains `now`. */
export function moduleWeekProgress(
  module: StudyModule,
  sessions: readonly Session[],
  now: Date,
): ModuleWeekProgress {
  const { start, end } = weekRange(now);
  const loggedMin = minutesInRange(sessions, start, end, module.id);
  const targetMin = module.weeklyTargetMin;
  return {
    module,
    loggedMin,
    targetMin,
    ratio: safeRatio(loggedMin, targetMin),
    pace: paceStatus(loggedMin, targetMin, now),
  };
}

/** Progress over all active modules for the current week. */
export interface WeekProgress {
  modules: ModuleWeekProgress[];
  loggedMin: number;
  targetMin: number;
  ratio: number;
  pace: PaceStatus;
}

/** Evaluates every non-archived module and the combined weekly goal. */
export function weekProgress(
  modules: readonly StudyModule[],
  sessions: readonly Session[],
  now: Date,
): WeekProgress {
  const rows = modules.filter((m) => !m.archived).map((m) => moduleWeekProgress(m, sessions, now));
  const loggedMin = rows.reduce((sum, r) => sum + r.loggedMin, 0);
  const targetMin = rows.reduce((sum, r) => sum + r.targetMin, 0);
  return {
    modules: rows,
    loggedMin,
    targetMin,
    ratio: safeRatio(loggedMin, targetMin),
    pace: paceStatus(loggedMin, targetMin, now),
  };
}

/** Minutes logged in one week. */
export interface WeekBucket {
  weekStart: Date;
  minutes: number;
}

/** Minutes per week for the last `weeks` weeks (oldest first), used by the bar chart. */
export function weeklyHistory(
  sessions: readonly Session[],
  moduleId: number,
  now: Date,
  weeks = 6,
): WeekBucket[] {
  return lastWeekStarts(now, weeks).map((weekStart) => ({
    weekStart,
    minutes: minutesInRange(sessions, weekStart, addDays(weekStart, 7), moduleId),
  }));
}

/** Sessions of one week with their total, used by the History list. */
export interface SessionWeekGroup {
  weekStart: Date;
  totalMin: number;
  sessions: Session[];
}

/** Groups sessions by ISO week, newest week first; sessions within a week are newest first. */
export function groupSessionsByWeek(sessions: readonly Session[]): SessionWeekGroup[] {
  // UTC ISO timestamps sort correctly as plain strings.
  const sorted = [...sessions].sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0));
  const groups: SessionWeekGroup[] = [];
  for (const session of sorted) {
    const weekStart = startOfWeek(new Date(session.startedAt));
    const last = groups[groups.length - 1];
    if (last && last.weekStart.getTime() === weekStart.getTime()) {
      last.sessions.push(session);
      last.totalMin += session.durationMin;
    } else {
      groups.push({ weekStart, totalMin: session.durationMin, sessions: [session] });
    }
  }
  return groups;
}
