import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { Repos } from '@/data';
import { useSnackbar } from '@/ui/SnackbarProvider';
import { useData } from './DataProvider';

/** State of a {@link useQuery} call. */
export interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
}

/**
 * Loads data through the repositories while the screen is focused, and again
 * whenever data changes (version bump) or `key` changes (e.g. a route id).
 * Results that arrive after the screen lost focus are ignored.
 *
 * The fetcher is wrapped in `useEffectEvent`, so callers can pass an inline
 * function without re-running the query on every render.
 */
export function useQuery<T>(fetcher: (repos: Repos) => Promise<T>, key: string | number | null = null) {
  const { repos, version } = useData();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: null, loading: true });
  const load = useEffectEvent(() => fetcher(repos));
  const focused = useIsFocused();

  // `version`, `reloadKey` and `key` are triggers: a change re-runs the query.
  useEffect(() => {
    if (!focused) return;
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [focused, repos, version, reloadKey, key]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}

/**
 * Returns a function that runs a write through the repositories, then tells
 * all queries to refresh. Errors are shown in a snackbar instead of crashing;
 * the function then resolves to undefined.
 */
export function useMutation() {
  const { repos, notifyChanged } = useData();
  const showSnackbar = useSnackbar();
  return useCallback(
    async <T,>(action: (r: Repos) => Promise<T>): Promise<T | undefined> => {
      try {
        const result = await action(repos);
        notifyChanged();
        return result;
      } catch (error) {
        console.error(error);
        showSnackbar({ message: 'Something went wrong. Please try again.' });
        return undefined;
      }
    },
    [repos, notifyChanged, showSnackbar],
  );
}

/**
 * Current time, refreshed every `intervalMs` (null = never), e.g. 1000 for a
 * running timer. The first refresh happens right away so a resumed timer
 * never shows a stale value.
 */
export function useNow(intervalMs: number | null): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (intervalMs === null) return;
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
