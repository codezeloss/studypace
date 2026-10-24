import { createTestDb } from '../../test/sqliteAdapter';
import type { NewModule, NewSession } from '../domain/types';
import { MIGRATIONS, migrate } from './db';
import { createRepos } from './index';

async function setup() {
  const db = createTestDb();
  await migrate(db);
  return { db, repos: createRepos(db) };
}

const mse: NewModule = {
  code: 'DLBCSEMSE02', name: 'Mobile Software Engineering II', ects: 5,
  examDate: '2027-02-12', weeklyTargetMin: 300, color: 'ink',
};
const session = (moduleId: number, startedAt: string, durationMin = 30): NewSession => ({
  moduleId, startedAt, durationMin, focusRating: 4, note: null, source: 'manual',
});

describe('migrate', () => {
  it('is idempotent and records the schema version', async () => {
    const { db } = await setup();
    await migrate(db);
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(MIGRATIONS.length);
  });
});

describe('module repository', () => {
  it('creates, reads, updates and archives modules', async () => {
    const { repos } = await setup();
    const id = await repos.modules.create(mse, new Date('2026-10-01T08:00:00Z'));
    await repos.modules.create({ ...mse, code: 'AAA01' });

    expect(await repos.modules.get(id)).toEqual({
      ...mse, id, archived: false, createdAt: '2026-10-01T08:00:00.000Z',
    });
    expect((await repos.modules.list()).map((m) => m.code)).toEqual(['AAA01', 'DLBCSEMSE02']);

    await repos.modules.update(id, { ...mse, name: 'MSE II', examDate: null });
    await repos.modules.setWeeklyTarget(id, 450);
    const updated = await repos.modules.get(id);
    expect(updated).toMatchObject({ name: 'MSE II', examDate: null, weeklyTargetMin: 450 });

    await repos.modules.setArchived(id, true);
    expect((await repos.modules.list()).map((m) => m.code)).toEqual(['AAA01']);
    expect((await repos.modules.list({ includeArchived: true })).map((m) => m.code)).toEqual(['AAA01', 'DLBCSEMSE02']);
  });

  it('returns null for unknown ids', async () => {
    const { repos } = await setup();
    expect(await repos.modules.get(99)).toBeNull();
  });

  it('cascades deletes to sessions and the running timer', async () => {
    const { repos } = await setup();
    const id = await repos.modules.create(mse);
    await repos.sessions.create(session(id, '2026-10-20T08:00:00.000Z'));
    await repos.timer.save({ moduleId: id, startedAt: '2026-10-23T08:00:00.000Z', pausedAt: null, pausedTotalMs: 0 });
    expect(await repos.sessions.countForModule(id)).toBe(1);

    await repos.modules.remove(id);
    expect(await repos.sessions.list()).toEqual([]);
    expect(await repos.timer.get()).toBeNull();
  });
});

describe('session repository', () => {
  it('lists newest first with module and half-open date filters', async () => {
    const { repos } = await setup();
    const a = await repos.modules.create(mse);
    const b = await repos.modules.create({ ...mse, code: 'BBB01' });
    await repos.sessions.create(session(a, '2026-10-19T00:00:00.000Z'));
    await repos.sessions.create(session(a, '2026-10-22T10:00:00.000Z'));
    await repos.sessions.create(session(b, '2026-10-21T10:00:00.000Z'));
    await repos.sessions.create(session(a, '2026-10-26T00:00:00.000Z'));

    expect((await repos.sessions.list()).map((s) => s.startedAt)).toEqual([
      '2026-10-26T00:00:00.000Z', '2026-10-22T10:00:00.000Z', '2026-10-21T10:00:00.000Z', '2026-10-19T00:00:00.000Z',
    ]);
    const week = await repos.sessions.list({
      moduleId: a, from: new Date('2026-10-19T00:00:00.000Z'), to: new Date('2026-10-26T00:00:00.000Z'),
    });
    expect(week.map((s) => s.startedAt)).toEqual(['2026-10-22T10:00:00.000Z', '2026-10-19T00:00:00.000Z']);
  });

  it('updates, deletes and restores a session with its id', async () => {
    const { repos } = await setup();
    const m = await repos.modules.create(mse);
    const id = await repos.sessions.create(session(m, '2026-10-22T10:00:00.000Z'));
    await repos.sessions.update(id, { ...session(m, '2026-10-22T11:00:00.000Z', 50), note: 'Unit 4', source: 'timer' });
    const updated = await repos.sessions.get(id);
    expect(updated).toEqual({
      id, moduleId: m, startedAt: '2026-10-22T11:00:00.000Z', durationMin: 50, focusRating: 4, note: 'Unit 4', source: 'timer',
    });

    await repos.sessions.remove(id);
    expect(await repos.sessions.get(id)).toBeNull();
    await repos.sessions.restore(updated!);
    expect(await repos.sessions.get(id)).toEqual(updated);
  });

  it('enforces positive durations at the database level', async () => {
    const { repos } = await setup();
    const m = await repos.modules.create(mse);
    await expect(repos.sessions.create(session(m, '2026-10-22T10:00:00.000Z', 0))).rejects.toThrow();
  });
});

describe('timer and settings repositories', () => {
  it('keeps a single active timer row', async () => {
    const { repos } = await setup();
    const m = await repos.modules.create(mse);
    expect(await repos.timer.get()).toBeNull();
    await repos.timer.save({ moduleId: m, startedAt: '2026-10-23T08:00:00.000Z', pausedAt: null, pausedTotalMs: 0 });
    await repos.timer.save({ moduleId: m, startedAt: '2026-10-23T08:00:00.000Z', pausedAt: '2026-10-23T08:20:00.000Z', pausedTotalMs: 5000 });
    expect(await repos.timer.get()).toEqual({
      moduleId: m, startedAt: '2026-10-23T08:00:00.000Z', pausedAt: '2026-10-23T08:20:00.000Z', pausedTotalMs: 5000,
    });
    await repos.timer.clear();
    expect(await repos.timer.get()).toBeNull();
  });

  it('stores and overwrites settings', async () => {
    const { repos } = await setup();
    expect(await repos.settings.get('onboarded')).toBeNull();
    await repos.settings.set('onboarded', 'false');
    await repos.settings.set('onboarded', 'true');
    expect(await repos.settings.get('onboarded')).toBe('true');
  });
});
