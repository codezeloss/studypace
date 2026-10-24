import { MAX_TIMER_MS, elapsedMs, isSavable, pauseTimer, resumeTimer, startTimer, toSessionMinutes } from './timer';

const t = (h: number, m: number, s = 0) => new Date(2026, 9, 23, h, m, s);
const MIN = 60_000;

describe('focus timer', () => {
  const started = startTimer(1, t(10, 0));

  it('measures elapsed time from timestamps', () => {
    expect(elapsedMs(started, t(10, 25))).toBe(25 * MIN);
  });

  it('freezes while paused and excludes the pause after resuming', () => {
    const paused = pauseTimer(started, t(10, 25));
    expect(elapsedMs(paused, t(10, 40))).toBe(25 * MIN);
    const resumed = resumeTimer(paused, t(10, 40));
    expect(resumed.pausedTotalMs).toBe(15 * MIN);
    expect(elapsedMs(resumed, t(10, 50))).toBe(35 * MIN);
  });

  it('ignores repeated pause or resume', () => {
    const paused = pauseTimer(started, t(10, 5));
    expect(pauseTimer(paused, t(10, 9))).toBe(paused);
    expect(resumeTimer(started, t(10, 9))).toBe(started);
  });

  it('clamps to 0 and to the 12 hour maximum', () => {
    expect(elapsedMs(started, t(9, 0))).toBe(0);
    expect(elapsedMs(started, new Date(2026, 9, 24, 12))).toBe(MAX_TIMER_MS);
  });

  it('rounds to whole minutes and refuses sessions under a minute', () => {
    expect(toSessionMinutes(89_999)).toBe(1);
    expect(isSavable(29_999)).toBe(false);
    expect(isSavable(30_000)).toBe(true);
  });
});
