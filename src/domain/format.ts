/**
 * Display formatting. Month and weekday names are fixed English strings so
 * output is identical on every device and in tests.
 */
import { addDays } from './week';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Non-breaking space: keeps a number and its unit on the same line. */
const NBSP = ' ';

/**
 * Human-readable duration: "45 min", "2 h", "6 h 40". Negative input shows as 0.
 * Uses non-breaking spaces so a value never wraps across two lines.
 */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}${NBSP}min`;
  if (m === 0) return `${h}${NBSP}h`;
  return `${h}${NBSP}h${NBSP}${pad2(m)}`;
}

/** Ratio (0.72) as a whole percentage ("72%"). Values above 1 are kept to show over-achievement. */
export function formatPercent(ratio: number): string {
  return `${Math.round(Math.max(0, ratio) * 100)}%`;
}

/** Stopwatch display: "04:09" under an hour, "1:05:09" from one hour. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

/** Minutes as an hours string for text inputs, max two decimals: 150 -> "2.5". */
export function minutesToHoursInput(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}

/** "19 Oct", or "12 Feb 2027" when the year differs from `reference`. */
export function formatShortDate(date: Date, reference: Date = new Date()): string {
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === reference.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

/** "12 Feb 2027". */
export function formatLongDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** 24-hour time "09:05". */
export function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "Fri 23 Oct · 09:05", used in session lists. */
export function formatDayTime(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} · ${formatTime(date)}`;
}

/** "19–25 Oct", or "26 Oct – 1 Nov" when the week spans two months. */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`;
  }
  return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}
