/**
 * Core data types of StudyPace. They are plain objects so the pure domain
 * functions, the repositories and the UI can all share them.
 */

/** Keys of the curated module color palette (resolved to hex values in `src/ui/theme.ts`). */
export type ModuleColor = 'ink' | 'teal' | 'cobalt' | 'olive' | 'plum' | 'ochre' | 'slate' | 'rose';

/** All palette keys in display order. */
export const MODULE_COLORS: readonly ModuleColor[] = [
  'ink', 'teal', 'cobalt', 'olive', 'plum', 'ochre', 'slate', 'rose',
];

/** A study module (course) the user tracks, e.g. "DLBCSEMSE02". */
export interface StudyModule {
  id: number;
  /** Short course code shown in lists, stored in upper case. */
  code: string;
  name: string;
  /** Credit points, used to estimate the total workload (see `pace.ts`). */
  ects: number;
  /** Planned exam date as `YYYY-MM-DD`, or null if not known yet. */
  examDate: string | null;
  /** The user's individual goal: minutes to study per ISO week. */
  weeklyTargetMin: number;
  color: ModuleColor;
  /** Archived modules keep their history but no longer count toward weekly goals. */
  archived: boolean;
  /** UTC ISO timestamp of creation. */
  createdAt: string;
}

/** Where a session came from: recorded live with the focus timer or entered afterwards. */
export type SessionSource = 'timer' | 'manual';

/** One block of study time: the performance data the app evaluates. */
export interface Session {
  id: number;
  moduleId: number;
  /** UTC ISO timestamp of the session start. */
  startedAt: string;
  /** Length in whole minutes, always greater than 0. */
  durationMin: number;
  /** Self-assessed focus from 1 (distracted) to 5 (deep focus), optional. */
  focusRating: number | null;
  note: string | null;
  source: SessionSource;
}

/** Persisted state of the running focus timer. At most one exists at a time. */
export interface ActiveTimer {
  moduleId: number;
  /** UTC ISO timestamp when the timer was started. */
  startedAt: string;
  /** UTC ISO timestamp when the timer was paused, or null while it runs. */
  pausedAt: string | null;
  /** Total length of all finished pauses in milliseconds. */
  pausedTotalMs: number;
}

/** Result of comparing the time logged this week with the time expected so far. */
export type PaceStatus = 'done' | 'onTrack' | 'behind';

/** Fields needed to create or update a module. */
export type NewModule = Omit<StudyModule, 'id' | 'createdAt' | 'archived'>;

/** Fields needed to create or update a session. */
export type NewSession = Omit<Session, 'id'>;
