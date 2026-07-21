import { ExpoSQLiteAdapter } from './adapters/ExpoSQLiteAdapter';
import { runMigrations } from './migrations/runner';
import type { SQLiteAdapter } from './adapter';

/**
 * Production DB singleton.
 *
 * `getDb()` opens the on-device database exactly once, runs pending
 * migrations, and returns the shared adapter. Tests should NOT use this
 * module — they construct a `BetterSqliteAdapter` directly.
 */

const DB_NAME = 'attendance.db';

let cached: Promise<SQLiteAdapter> | null = null;

export function getDb(): Promise<SQLiteAdapter> {
  if (!cached) {
    cached = (async () => {
      const adapter = await ExpoSQLiteAdapter.open(DB_NAME);
      await runMigrations(adapter);
      return adapter;
    })();
  }
  return cached;
}

/** For tests only — swaps the cached instance. Never call in production. */
export function __setDbForTest(adapter: SQLiteAdapter | null): void {
  cached = adapter ? Promise.resolve(adapter) : null;
}
