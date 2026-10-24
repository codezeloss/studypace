/** Data access for the `modules` table. All module SQL lives here. */
import type { ModuleColor, NewModule, StudyModule } from '@/domain/types';
import type { Db } from './db';

interface ModuleRow {
  id: number;
  code: string;
  name: string;
  ects: number;
  exam_date: string | null;
  weekly_target_min: number;
  color: string;
  archived: number;
  created_at: string;
}

function toModule(row: ModuleRow): StudyModule {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    ects: row.ects,
    examDate: row.exam_date,
    weeklyTargetMin: row.weekly_target_min,
    color: row.color as ModuleColor,
    archived: row.archived === 1,
    createdAt: row.created_at,
  };
}

/** Creates the module repository bound to a database. */
export function createModuleRepo(db: Db) {
  return {
    /** Active modules sorted by code; with `includeArchived`, archived ones follow. */
    async list(options: { includeArchived?: boolean } = {}): Promise<StudyModule[]> {
      const rows = await db.getAllAsync<ModuleRow>(
        options.includeArchived
          ? 'SELECT * FROM modules ORDER BY archived, code'
          : 'SELECT * FROM modules WHERE archived = 0 ORDER BY code',
      );
      return rows.map(toModule);
    },

    /** One module, or null if it does not exist. */
    async get(id: number): Promise<StudyModule | null> {
      const row = await db.getFirstAsync<ModuleRow>('SELECT * FROM modules WHERE id = ?', id);
      return row ? toModule(row) : null;
    },

    /** Inserts a module and returns its new id. */
    async create(input: NewModule, now: Date = new Date()): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO modules (code, name, ects, exam_date, weekly_target_min, color, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        input.code, input.name, input.ects, input.examDate, input.weeklyTargetMin, input.color, now.toISOString(),
      );
      return result.lastInsertRowId;
    },

    /** Replaces all editable fields of a module. */
    async update(id: number, input: NewModule): Promise<void> {
      await db.runAsync(
        `UPDATE modules SET code = ?, name = ?, ects = ?, exam_date = ?, weekly_target_min = ?, color = ?
         WHERE id = ?`,
        input.code, input.name, input.ects, input.examDate, input.weeklyTargetMin, input.color, id,
      );
    },

    /** Changes only the weekly goal (used by "Use suggested target"). */
    async setWeeklyTarget(id: number, minutes: number): Promise<void> {
      await db.runAsync('UPDATE modules SET weekly_target_min = ? WHERE id = ?', minutes, id);
    },

    /** Archives or restores a module. */
    async setArchived(id: number, archived: boolean): Promise<void> {
      await db.runAsync('UPDATE modules SET archived = ? WHERE id = ?', archived ? 1 : 0, id);
    },

    /** Deletes a module; its sessions and a running timer go with it (ON DELETE CASCADE). */
    async remove(id: number): Promise<void> {
      await db.runAsync('DELETE FROM modules WHERE id = ?', id);
    },
  };
}

/** The module repository API. */
export type ModuleRepo = ReturnType<typeof createModuleRepo>;
