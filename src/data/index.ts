/** Entry point of the data layer: bundles all repositories for one database. */
import type { Db } from './db';
import { createModuleRepo } from './moduleRepo';
import { createSessionRepo } from './sessionRepo';
import { createSettingsRepo } from './settingsRepo';
import { createTimerRepo } from './timerRepo';

/** Creates every repository for the given database. */
export function createRepos(db: Db) {
  return {
    modules: createModuleRepo(db),
    sessions: createSessionRepo(db),
    timer: createTimerRepo(db),
    settings: createSettingsRepo(db),
  };
}

/** All repositories, as provided to screens through `useData()`. */
export type Repos = ReturnType<typeof createRepos>;
