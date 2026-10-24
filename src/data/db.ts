/**
 * Database access contract and schema migrations.
 *
 * `Db` is the subset of expo-sqlite's async `SQLiteDatabase` API that the
 * repositories need. The app passes the real expo-sqlite database; unit tests
 * pass an in-memory better-sqlite3 adapter (`test/sqliteAdapter.ts`), so the
 * same SQL is tested without a device.
 */

/** Values that can be bound to SQL parameters. */
export type SqlValue = string | number | null;

/** Minimal async database interface implemented by expo-sqlite and the test adapter. */
export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: SqlValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]>;
}

/**
 * Ordered schema migrations. Index i upgrades the database from version i to
 * i + 1. Never edit a released migration; append a new one instead.
 */
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    ects INTEGER NOT NULL CHECK (ects BETWEEN 1 AND 30),
    exam_date TEXT NULL,
    weekly_target_min INTEGER NOT NULL CHECK (weekly_target_min > 0),
    color TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    duration_min INTEGER NOT NULL CHECK (duration_min > 0),
    focus_rating INTEGER NULL CHECK (focus_rating BETWEEN 1 AND 5),
    note TEXT NULL,
    source TEXT NOT NULL CHECK (source IN ('timer', 'manual'))
  );
  CREATE INDEX idx_sessions_started ON sessions(started_at);
  CREATE INDEX idx_sessions_module ON sessions(module_id);
  CREATE TABLE active_timer (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    started_at TEXT NOT NULL,
    paused_at TEXT NULL,
    paused_total_ms INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `,
];

/**
 * Enables foreign keys (needed per connection for ON DELETE CASCADE) and
 * applies all migrations newer than the stored `user_version`.
 */
export async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = row?.user_version ?? 0; version < MIGRATIONS.length; version++) {
    await db.execAsync(MIGRATIONS[version]);
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}
