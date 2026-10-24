import Database from 'better-sqlite3';
import type { Db, SqlValue } from '../src/data/db';

/** In-memory SQLite database implementing the app's `Db` interface for unit tests. */
export function createTestDb(): Db {
  const raw = new Database(':memory:');
  return {
    async execAsync(source: string) {
      raw.exec(source);
    },
    async runAsync(source: string, ...params: SqlValue[]) {
      const result = raw.prepare(source).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: result.changes };
    },
    async getFirstAsync<T>(source: string, ...params: SqlValue[]) {
      return (raw.prepare(source).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(source: string, ...params: SqlValue[]) {
      return raw.prepare(source).all(...params) as T[];
    },
  };
}
