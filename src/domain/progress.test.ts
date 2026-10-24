import { makeModule, makeSession } from '../../test/factories';
import {
  groupSessionsByWeek, minutesInRange, moduleWeekProgress, totalMinutes,
  weekProgress, weeklyHistory,
} from './progress';

const NOW = new Date(2026, 9, 23, 12); // Friday, week starts Mon 19 Oct
const mse = makeModule({ id: 1, weeklyTargetMin: 300 });
const math = makeModule({ id: 2, code: 'DLBDSMFC01', weeklyTargetMin: 120 });
const old = makeModule({ id: 3, code: 'OLD', archived: true, weeklyTargetMin: 600 });

const sessions = [
  makeSession(new Date(2026, 9, 19, 0, 0), 60, { moduleId: 1 }),   // Monday 00:00 -> this week
  makeSession(new Date(2026, 9, 22, 18), 90, { moduleId: 1 }),     // this week
  makeSession(new Date(2026, 9, 21, 8), 30, { moduleId: 2 }),      // this week
  makeSession(new Date(2026, 9, 18, 23, 30), 45, { moduleId: 1 }), // Sunday before -> last week
  makeSession(new Date(2026, 9, 6, 10), 120, { moduleId: 1 }),     // three weeks ago
  makeSession(new Date(2026, 9, 20, 10), 50, { moduleId: 3 }),     // archived module
];

describe('minutesInRange / totalMinutes', () => {
  it('uses a half-open range and filters by module', () => {
    const start = new Date(2026, 9, 19);
    const end = new Date(2026, 9, 26);
    expect(minutesInRange(sessions, start, end)).toBe(230);
    expect(minutesInRange(sessions, start, end, 1)).toBe(150);
    expect(totalMinutes(sessions, 1)).toBe(315);
  });
});

describe('moduleWeekProgress', () => {
  it('reports logged, target, ratio and pace', () => {
    expect(moduleWeekProgress(mse, sessions, NOW)).toEqual({
      module: mse, loggedMin: 150, targetMin: 300, ratio: 0.5, pace: 'behind',
    });
  });
});

describe('weekProgress', () => {
  it('sums active modules only', () => {
    const result = weekProgress([mse, math, old], sessions, NOW);
    expect(result.modules.map((m) => m.module.id)).toEqual([1, 2]);
    expect(result.loggedMin).toBe(180);
    expect(result.targetMin).toBe(420);
    expect(result.ratio).toBeCloseTo(180 / 420);
  });
  it('returns ratio 0 without modules', () => {
    expect(weekProgress([], sessions, NOW).ratio).toBe(0);
  });
});

describe('weeklyHistory', () => {
  it('buckets minutes per week, oldest first', () => {
    expect(weeklyHistory(sessions, 1, NOW, 3)).toEqual([
      { weekStart: new Date(2026, 9, 5), minutes: 120 },
      { weekStart: new Date(2026, 9, 12), minutes: 45 },
      { weekStart: new Date(2026, 9, 19), minutes: 150 },
    ]);
  });
});

describe('groupSessionsByWeek', () => {
  it('groups newest week first with totals', () => {
    const groups = groupSessionsByWeek(sessions.filter((s) => s.moduleId === 1));
    expect(groups.map((g) => [g.weekStart, g.totalMin, g.sessions.length])).toEqual([
      [new Date(2026, 9, 19), 150, 2],
      [new Date(2026, 9, 12), 45, 1],
      [new Date(2026, 9, 5), 120, 1],
    ]);
    expect(groups[0].sessions[0].durationMin).toBe(90); // newest first inside a week
  });
});
