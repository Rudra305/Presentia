import { Platform } from 'react-native';

import type { SQLiteAdapter } from './adapter';

/**
 * Production DB singleton.
 *
 * `getDb()` opens the on-device database exactly once, runs pending
 * migrations, and returns the shared adapter. On Web preview, uses
 * `WebSQLiteAdapter` to prevent native module errors.
 */

const DB_NAME = 'attendance.db';

let cached: Promise<SQLiteAdapter> | null = null;

export function getDb(): Promise<SQLiteAdapter> {
    if (!cached) {
        cached = (async () => {
            if (Platform.OS === 'web') {
                const { WebSQLiteAdapter } = await import('./adapters/WebSQLiteAdapter');
                return WebSQLiteAdapter.open();
            }
            const { ExpoSQLiteAdapter } = await import('./adapters/ExpoSQLiteAdapter');
            const { runMigrations } = await import('./migrations/runner');
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
