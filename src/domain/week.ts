/**
 * Calendar helpers. They work in the device's local time zone because study
 * weeks and streak days are experienced locally. Weeks follow ISO 8601 and
 * start on Monday.
 */

/** Milliseconds in a day (only used where DST cannot matter). */
export const DAY_MS = 86_400_000;

/** Returns a new Date at 00:00 local time on the same calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds whole calendar days. Uses `setDate`, so it stays correct across DST changes. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Returns Monday 00:00 of the ISO week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offsetFromMonday = (day.getDay() + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0
  return addDays(day, -offsetFromMonday);
}

/** Half-open range [start, end) of the ISO week that contains `date`. */
export function weekRange(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date);
  return { start, end: addDays(start, 7) };
}

/** Days of the current week that have started, today included (Monday = 1 … Sunday = 7). */
export function daysElapsedInWeek(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** Start dates of the last `count` weeks, oldest first, ending with the week of `date`. */
export function lastWeekStarts(date: Date, count: number): Date[] {
  const current = startOfWeek(date);
  return Array.from({ length: count }, (_, i) => addDays(current, -7 * (count - 1 - i)));
}

/** Formats a date as `YYYY-MM-DD` in local time. Used for exam dates and day grouping. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses `YYYY-MM-DD` into a local Date at 00:00, or returns null for invalid input. */
export function parseDayKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  // JavaScript silently rolls 2026-02-31 over to March; treat that as invalid.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** Whole calendar days from `from` to `to`; negative if `to` is earlier. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** ISO 8601 week number (1–53) of `date`. */
export function isoWeekNumber(date: Date): number {
  // The ISO year of a week is the year its Thursday falls in; week 1 contains January 4th.
  const thursday = addDays(startOfWeek(date), 3);
  const jan4 = new Date(thursday.getFullYear(), 0, 4);
  return 1 + Math.round(daysBetween(startOfWeek(jan4), startOfWeek(date)) / 7);
}
