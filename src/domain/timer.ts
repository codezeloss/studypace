/**
 * Focus timer state transitions. Elapsed time is always computed from stored
 * timestamps instead of counting ticks, so the timer stays correct when
 * Android pauses or kills the app in the background.
 */
import type { ActiveTimer } from './types';

/** Safety cap: a forgotten timer never produces a session longer than 12 hours. */
export const MAX_TIMER_MS = 12 * 60 * 60 * 1000;

/** Creates a running timer for a module. */
export function startTimer(moduleId: number, now: Date): ActiveTimer {
  return { moduleId, startedAt: now.toISOString(), pausedAt: null, pausedTotalMs: 0 };
}

/** Active study time in ms: wall time since start minus pauses, clamped to [0, MAX_TIMER_MS]. */
export function elapsedMs(timer: ActiveTimer, now: Date): number {
  const end = timer.pausedAt ? new Date(timer.pausedAt).getTime() : now.getTime();
  const raw = end - new Date(timer.startedAt).getTime() - timer.pausedTotalMs;
  return Math.min(MAX_TIMER_MS, Math.max(0, raw));
}

/** Pauses a running timer; returns the same object if it is already paused. */
export function pauseTimer(timer: ActiveTimer, now: Date): ActiveTimer {
  if (timer.pausedAt) return timer;
  return { ...timer, pausedAt: now.toISOString() };
}

/** Resumes a paused timer and adds the pause length; returns the same object if it is running. */
export function resumeTimer(timer: ActiveTimer, now: Date): ActiveTimer {
  if (!timer.pausedAt) return timer;
  const pausedFor = Math.max(0, now.getTime() - new Date(timer.pausedAt).getTime());
  return { ...timer, pausedAt: null, pausedTotalMs: timer.pausedTotalMs + pausedFor };
}

/** Converts elapsed milliseconds to whole minutes for a saved session. */
export function toSessionMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

/** A timer result can be saved once it rounds to at least one minute. */
export function isSavable(ms: number): boolean {
  return toSessionMinutes(ms) >= 1;
}
