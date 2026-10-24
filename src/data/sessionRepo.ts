/** Data access for the `sessions` table. */
import type { NewSession, Session, SessionSource } from '@/domain/types';
import type { Db, SqlValue } from './db';

interface SessionRow {
  id: number;
  module_id: number;
  started_at: string;
  duration_min: number;
  focus_rating: number | null;
  note: string | null;
  source: string;
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    moduleId: row.module_id,
    startedAt: row.started_at,
    durationMin: row.duration_min,
    focusRating: row.focus_rating,
    note: row.note,
    source: row.source as SessionSource,
  };
}

/** Optional filters for the session list. `from`/`to` form a half-open range. */
export interface SessionQuery {
  moduleId?: number;
  from?: Date;
  to?: Date;
}

/** Creates the session repository bound to a database. */
export function createSessionRepo(db: Db) {
  return {
    /** Sessions matching the filters, newest first. */
    async list(query: SessionQuery = {}): Promise<Session[]> {
      const where: string[] = [];
      const params: SqlValue[] = [];
      if (query.moduleId !== undefined) {
        where.push('module_id = ?');
        params.push(query.moduleId);
      }
      // Timestamps are UTC ISO strings, so text comparison equals time comparison.
      if (query.from) {
        where.push('started_at >= ?');
        params.push(query.from.toISOString());
      }
      if (query.to) {
        where.push('started_at < ?');
        params.push(query.to.toISOString());
      }
      const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const rows = await db.getAllAsync<SessionRow>(
        `SELECT * FROM sessions ${clause} ORDER BY started_at DESC, id DESC`,
        ...params,
      );
      return rows.map(toSession);
    },

    /** One session, or null if it does not exist. */
    async get(id: number): Promise<Session | null> {
      const row = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?', id);
      return row ? toSession(row) : null;
    },

    /** Inserts a session and returns its new id. */
    async create(input: NewSession): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO sessions (module_id, started_at, duration_min, focus_rating, note, source)
         VALUES (?, ?, ?, ?, ?, ?)`,
        input.moduleId, input.startedAt, input.durationMin, input.focusRating, input.note, input.source,
      );
      return result.lastInsertRowId;
    },

    /** Replaces all fields of a session. */
    async update(id: number, input: NewSession): Promise<void> {
      await db.runAsync(
        `UPDATE sessions SET module_id = ?, started_at = ?, duration_min = ?, focus_rating = ?, note = ?, source = ?
         WHERE id = ?`,
        input.moduleId, input.startedAt, input.durationMin, input.focusRating, input.note, input.source, id,
      );
    },

    /** Deletes a session. */
    async remove(id: number): Promise<void> {
      await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
    },

    /** Re-inserts a deleted session with its original id (used by "Undo"). */
    async restore(session: Session): Promise<void> {
      await db.runAsync(
        `INSERT INTO sessions (id, module_id, started_at, duration_min, focus_rating, note, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        session.id, session.moduleId, session.startedAt, session.durationMin, session.focusRating, session.note, session.source,
      );
    },

    /** Number of sessions of a module (shown before deleting it). */
    async countForModule(moduleId: number): Promise<number> {
      const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sessions WHERE module_id = ?', moduleId);
      return row?.n ?? 0;
    },
  };
}

/** The session repository API. */
export type SessionRepo = ReturnType<typeof createSessionRepo>;
