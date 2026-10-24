/** Persists the single running focus timer so it survives app restarts. */
import type { ActiveTimer } from '@/domain/types';
import type { Db } from './db';

interface TimerRow {
  module_id: number;
  started_at: string;
  paused_at: string | null;
  paused_total_ms: number;
}

/** Creates the timer repository bound to a database. */
export function createTimerRepo(db: Db) {
  return {
    /** The active timer, or null if none is running or paused. */
    async get(): Promise<ActiveTimer | null> {
      const row = await db.getFirstAsync<TimerRow>('SELECT * FROM active_timer WHERE id = 1');
      return row
        ? { moduleId: row.module_id, startedAt: row.started_at, pausedAt: row.paused_at, pausedTotalMs: row.paused_total_ms }
        : null;
    },

    /** Inserts or replaces the single timer row. */
    async save(timer: ActiveTimer): Promise<void> {
      await db.runAsync(
        `INSERT INTO active_timer (id, module_id, started_at, paused_at, paused_total_ms) VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET module_id = excluded.module_id, started_at = excluded.started_at,
           paused_at = excluded.paused_at, paused_total_ms = excluded.paused_total_ms`,
        timer.moduleId, timer.startedAt, timer.pausedAt, timer.pausedTotalMs,
      );
    },

    /** Removes the timer after the session was saved or discarded. */
    async clear(): Promise<void> {
      await db.runAsync('DELETE FROM active_timer');
    },
  };
}

/** The timer repository API. */
export type TimerRepo = ReturnType<typeof createTimerRepo>;
