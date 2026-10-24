/**
 * Form validation shared by the screens and the unit tests. Forms keep raw
 * strings (what the user typed); validation turns them into typed values or
 * returns one message per invalid field.
 */
import type { ModuleColor, NewModule, NewSession } from './types';
import { parseDayKey } from './week';

/** Either a valid, normalized value or the error messages per field. */
export type ValidationResult<T, E> = { ok: true; value: T } | { ok: false; errors: E };

/** Longest session that can be entered manually (12 hours). */
export const MAX_SESSION_MIN = 720;
/** Maximum note length in characters. */
export const MAX_NOTE_LENGTH = 500;

/** Parses "2.5" or "2,5" (comma is common in European locales); returns null otherwise. */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return null;
  return Number(trimmed.replace(',', '.'));
}

function parseWholeNumber(input: string): number | null {
  const trimmed = input.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/** Raw values of the module form. */
export interface ModuleFormValues {
  code: string;
  name: string;
  ects: string;
  examDate: string | null;
  weeklyTargetHours: string;
  color: ModuleColor;
}

/** One message per invalid module field. */
export type ModuleFormErrors = Partial<Record<keyof ModuleFormValues, string>>;

/** Validates the module form and converts hours into the stored minutes. */
export function validateModule(values: ModuleFormValues): ValidationResult<NewModule, ModuleFormErrors> {
  const errors: ModuleFormErrors = {};

  const code = values.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,16}$/.test(code)) errors.code = 'Use 2–16 letters or digits, e.g. DLBCSEMSE02';

  const name = values.name.trim();
  if (name.length === 0) errors.name = 'Enter the module name';
  else if (name.length > 80) errors.name = 'Keep the name under 80 characters';

  const ects = parseWholeNumber(values.ects);
  if (ects === null || ects < 1 || ects > 30) errors.ects = 'Enter a whole number from 1 to 30';

  if (values.examDate !== null && parseDayKey(values.examDate) === null) errors.examDate = 'Pick a valid date';

  const hours = parseDecimal(values.weeklyTargetHours);
  if (hours === null || hours < 0.25 || hours > 80) errors.weeklyTargetHours = 'Enter between 0.25 and 80 hours';

  if (Object.keys(errors).length > 0 || ects === null || hours === null) return { ok: false, errors };
  return {
    ok: true,
    value: { code, name, ects, examDate: values.examDate, weeklyTargetMin: Math.round(hours * 60), color: values.color },
  };
}

/** Raw values of the manual session form. */
export interface SessionFormValues {
  moduleId: number | null;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM`, 24-hour clock */
  time: string;
  durationMin: string;
  focusRating: number | null;
  note: string;
}

/** One message per invalid session field. */
export type SessionFormErrors = Partial<Record<keyof SessionFormValues, string>>;

/** Validates the session form. Sessions cannot start in the future. */
export function validateSession(values: SessionFormValues, now: Date): ValidationResult<NewSession, SessionFormErrors> {
  const errors: SessionFormErrors = {};

  if (values.moduleId === null) errors.moduleId = 'Choose a module';

  const day = parseDayKey(values.date);
  if (!day) errors.date = 'Pick a valid date';

  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(values.time);
  if (!time) errors.time = 'Pick a start time';

  let start: Date | null = null;
  if (day && time) {
    start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(time[1]), Number(time[2]));
    if (start.getTime() > now.getTime()) errors.time = "The session can't start in the future";
  }

  const duration = parseWholeNumber(values.durationMin);
  if (duration === null || duration < 1 || duration > MAX_SESSION_MIN) {
    errors.durationMin = `Enter minutes from 1 to ${MAX_SESSION_MIN}`;
  }

  const rating = values.focusRating;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) errors.focusRating = 'Rate from 1 to 5';

  const note = values.note.trim();
  if (note.length > MAX_NOTE_LENGTH) errors.note = `Keep the note under ${MAX_NOTE_LENGTH} characters`;

  if (Object.keys(errors).length > 0 || values.moduleId === null || start === null || duration === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      moduleId: values.moduleId,
      startedAt: start.toISOString(),
      durationMin: duration,
      focusRating: rating,
      note: note.length > 0 ? note : null,
      source: 'manual',
    },
  };
}
