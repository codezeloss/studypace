/** Small key/value store for app flags such as "onboarding finished". */
import type { Db } from './db';

/** Creates the settings repository bound to a database. */
export function createSettingsRepo(db: Db) {
  return {
    /** Stored value, or null if the key was never set. */
    async get(key: string): Promise<string | null> {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
      return row?.value ?? null;
    },

    /** Inserts or overwrites a value. */
    async set(key: string, value: string): Promise<void> {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key, value,
      );
    },
  };
}

/** The settings repository API. */
export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
