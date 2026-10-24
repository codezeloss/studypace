/**
 * Goal evaluation rules: the ECTS workload, the suggested weekly target and
 * the weekly pace status. See section 6 of the design spec.
 */
import type { PaceStatus } from './types';
import { daysBetween, daysElapsedInWeek, parseDayKey } from './week';

/** IU defines 1 ECTS as 25–30 hours of work; the lower bound is used. */
export const HOURS_PER_ECTS = 25;

/** Logged time counts as "on track" when it reaches 90 % of the time expected so far. */
export const ON_TRACK_TOLERANCE = 0.9;

/** Suggested targets are rounded up to quarter hours so they are easy to plan with. */
const SUGGESTION_STEP_MIN = 15;

/** Total expected study time of a module in minutes. */
export function workloadMinutes(ects: number): number {
  return ects * HOURS_PER_ECTS * 60;
}

/**
 * Whole weeks left until the exam, rounded up. 0 when the exam is today or
 * already past; null when there is no valid exam date.
 */
export function weeksUntilExam(examDate: string | null, today: Date): number | null {
  if (!examDate) return null;
  const exam = parseDayKey(examDate);
  if (!exam) return null;
  return Math.max(0, Math.ceil(daysBetween(today, exam) / 7));
}

/** Input for {@link suggestWeeklyTarget}. */
export interface SuggestionInput {
  ects: number;
  examDate: string | null;
  /** Minutes already logged for this module (all time). */
  loggedTotalMin: number;
  today: Date;
}

/**
 * Suggests a weekly target that spreads the remaining ECTS workload evenly
 * over the weeks left until the exam (at least one week). The result is
 * rounded up to 15 minutes and is at least 15 minutes.
 * Returns null without an exam date, because there is nothing to pace against.
 */
export function suggestWeeklyTarget({ ects, examDate, loggedTotalMin, today }: SuggestionInput): number | null {
  const weeks = weeksUntilExam(examDate, today);
  if (weeks === null) return null;
  const remaining = Math.max(0, workloadMinutes(ects) - loggedTotalMin);
  const perWeek = Math.ceil(remaining / Math.max(1, weeks));
  const rounded = Math.ceil(perWeek / SUGGESTION_STEP_MIN) * SUGGESTION_STEP_MIN;
  return Math.max(SUGGESTION_STEP_MIN, rounded);
}

/**
 * Compares this week's logged minutes with the share of the target expected
 * by `now`. Example: on Wednesday (day 3) with a 7 h target, 3 h are
 * expected, and 2 h 42 (90 %) still counts as on track.
 */
export function paceStatus(loggedMin: number, targetMin: number, now: Date): PaceStatus {
  if (loggedMin >= targetMin) return 'done';
  const expected = (targetMin * daysElapsedInWeek(now)) / 7;
  return loggedMin >= ON_TRACK_TOLERANCE * expected ? 'onTrack' : 'behind';
}
