import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createRepos, type Repos } from '@/data';

interface DataContextValue {
  repos: Repos;
  /** Increases after every write; queries re-run when it changes. */
  version: number;
  notifyChanged: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * Provides the repositories for the open SQLite database plus a version
 * counter. This is a deliberately small alternative to a state library: the
 * database stays the single source of truth and screens simply re-query.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const repos = useMemo(() => createRepos(db), [db]);
  const [version, setVersion] = useState(0);
  const notifyChanged = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ repos, version, notifyChanged }), [repos, version, notifyChanged]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/** Access to repositories and change notifications. Must be used inside `DataProvider`. */
export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
