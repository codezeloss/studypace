import type { Session, StudyModule } from '../src/domain/types';

let nextSessionId = 1;

/** Builds a module with sensible defaults; override only what a test cares about. */
export function makeModule(overrides: Partial<StudyModule> = {}): StudyModule {
  return {
    id: 1,
    code: 'DLBCSEMSE02',
    name: 'Mobile Software Engineering II',
    ects: 5,
    examDate: null,
    weeklyTargetMin: 600,
    color: 'ink',
    archived: false,
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

/** Builds a session starting at the given local time. */
export function makeSession(start: Date, durationMin: number, overrides: Partial<Session> = {}): Session {
  return {
    id: nextSessionId++,
    moduleId: 1,
    startedAt: start.toISOString(),
    durationMin,
    focusRating: null,
    note: null,
    source: 'manual',
    ...overrides,
  };
}
