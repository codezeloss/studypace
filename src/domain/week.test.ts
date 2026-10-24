import {
  addDays, daysBetween, daysElapsedInWeek, isoWeekNumber, lastWeekStarts,
  parseDayKey, startOfWeek, toDayKey, weekRange,
} from './week';

// Month index is zero-based: 9 = October.
const FRI = new Date(2026, 9, 23, 15, 30);

describe('startOfWeek', () => {
  it('returns Monday 00:00 for a Friday', () => {
    expect(startOfWeek(FRI)).toEqual(new Date(2026, 9, 19));
  });
  it('treats Sunday as the last day of the ISO week', () => {
    expect(startOfWeek(new Date(2026, 9, 25, 23, 59))).toEqual(new Date(2026, 9, 19));
  });
  it('keeps Monday but drops the time', () => {
    expect(startOfWeek(new Date(2026, 9, 19, 10, 30))).toEqual(new Date(2026, 9, 19));
  });
});

describe('weekRange', () => {
  it('is half-open from Monday to next Monday', () => {
    expect(weekRange(FRI)).toEqual({ start: new Date(2026, 9, 19), end: new Date(2026, 9, 26) });
  });
});

describe('daysElapsedInWeek', () => {
  it('counts Monday as 1 and Sunday as 7', () => {
    expect(daysElapsedInWeek(new Date(2026, 9, 19))).toBe(1);
    expect(daysElapsedInWeek(FRI)).toBe(5);
    expect(daysElapsedInWeek(new Date(2026, 9, 25))).toBe(7);
  });
});

describe('lastWeekStarts', () => {
  it('returns week starts oldest first, ending with the current week', () => {
    expect(lastWeekStarts(FRI, 3)).toEqual([
      new Date(2026, 9, 5), new Date(2026, 9, 12), new Date(2026, 9, 19),
    ]);
  });
});

describe('day keys', () => {
  it('formats and parses YYYY-MM-DD in local time', () => {
    expect(toDayKey(FRI)).toBe('2026-10-23');
    expect(parseDayKey('2026-11-02')).toEqual(new Date(2026, 10, 2));
  });
  it('rejects malformed and overflowing dates', () => {
    expect(parseDayKey('abc')).toBeNull();
    expect(parseDayKey('2026-02-31')).toBeNull();
  });
});

describe('daysBetween and addDays', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween(FRI, new Date(2026, 9, 30, 1))).toBe(7);
    expect(daysBetween(FRI, new Date(2026, 9, 20))).toBe(-3);
    expect(addDays(new Date(2026, 9, 31), 1)).toEqual(new Date(2026, 10, 1));
  });
});

describe('isoWeekNumber', () => {
  it('matches ISO 8601 week numbers', () => {
    expect(isoWeekNumber(FRI)).toBe(43);
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53); // 2026 has 53 ISO weeks
    expect(isoWeekNumber(new Date(2027, 0, 4))).toBe(1);
  });
});
