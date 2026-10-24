import { makeSession } from '../../test/factories';
import { currentStreak } from './streak';

const at = (day: number, hour = 10) => makeSession(new Date(2026, 9, day, hour), 30);

describe('currentStreak', () => {
  const sessions = [at(21), at(22), at(23, 8), at(23, 20)];

  it('counts consecutive days ending today', () => {
    expect(currentStreak(sessions, new Date(2026, 9, 23, 21))).toBe(3);
  });
  it('keeps the streak alive while today has no session yet', () => {
    expect(currentStreak(sessions, new Date(2026, 9, 24, 9))).toBe(3);
  });
  it('breaks after a full day without a session', () => {
    expect(currentStreak(sessions, new Date(2026, 9, 25, 9))).toBe(0);
  });
  it('stops at gaps', () => {
    expect(currentStreak([at(20), at(22), at(23)], new Date(2026, 9, 23, 21))).toBe(2);
  });
  it('is 0 without sessions', () => {
    expect(currentStreak([], new Date(2026, 9, 23))).toBe(0);
  });
});
