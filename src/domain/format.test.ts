import {
  formatClock, formatDayTime, formatDuration, formatLongDate, formatPercent,
  formatShortDate, formatTime, formatWeekRange, minutesToHoursInput,
} from './format';

describe('formatDuration', () => {
  it.each([
    [0, '0 min'], [45, '45 min'], [60, '1 h'], [65, '1 h 05'], [400, '6 h 40'], [-5, '0 min'],
  ])('%i minutes -> %s', (min, text) => {
    // Compare with normal spaces for readability; the real output uses non-breaking spaces.
    expect(formatDuration(min).replace(/ /g, ' ')).toBe(text);
  });
  it('uses non-breaking spaces so a duration never wraps across lines', () => {
    expect(formatDuration(400)).toBe('6 h 40');
    expect(formatDuration(45)).not.toContain(' ');
  });
});

describe('formatPercent', () => {
  it('rounds and never goes negative', () => {
    expect(formatPercent(0.724)).toBe('72%');
    expect(formatPercent(1.5)).toBe('150%');
    expect(formatPercent(-1)).toBe('0%');
  });
});

describe('formatClock', () => {
  it('shows mm:ss under an hour and h:mm:ss above', () => {
    expect(formatClock(249_000)).toBe('04:09');
    expect(formatClock(3_909_000)).toBe('1:05:09');
    expect(formatClock(-10)).toBe('00:00');
  });
});

describe('minutesToHoursInput', () => {
  it('converts minutes to a short decimal string', () => {
    expect(minutesToHoursInput(150)).toBe('2.5');
    expect(minutesToHoursInput(600)).toBe('10');
    expect(minutesToHoursInput(20)).toBe('0.33');
  });
});

describe('dates', () => {
  const ref = new Date(2026, 9, 23);
  it('formats short, long, time and day-time', () => {
    expect(formatShortDate(new Date(2026, 9, 19), ref)).toBe('19 Oct');
    expect(formatShortDate(new Date(2027, 1, 12), ref)).toBe('12 Feb 2027');
    expect(formatLongDate(new Date(2027, 1, 12))).toBe('12 Feb 2027');
    expect(formatTime(new Date(2026, 9, 23, 9, 5))).toBe('09:05');
    expect(formatDayTime(new Date(2026, 9, 23, 9, 5))).toBe('Fri 23 Oct · 09:05');
  });
  it('formats week ranges inside and across months', () => {
    expect(formatWeekRange(new Date(2026, 9, 19))).toBe('19–25 Oct');
    expect(formatWeekRange(new Date(2026, 9, 26))).toBe('26 Oct – 1 Nov');
  });
});
