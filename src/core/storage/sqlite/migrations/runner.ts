import type { SQLiteAdapter } from '../adapter';
import { migrations, type Migration } from './index';

const META_KEY = 'schema_version';

async function ensureMetaTable(db: SQLiteAdapter): Promise<void> {
    await db.execAsync(
        'CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
    );
}

async function readSchemaVersion(db: SQLiteAdapter): Promise<number> {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM _meta WHERE key = ?', [
        META_KEY,
    ]);
    return row ? Number.parseInt(row.value, 10) : 0;
}

async function writeSchemaVersion(db: SQLiteAdapter, version: number): Promise<void> {
    await db.runAsync(
        'INSERT INTO _meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        [META_KEY, String(version)],
    );
}

/**
 * Apply every migration whose `version` is strictly greater than the value
 * stored in `_meta.schema_version`. Each migration runs in its own
 * transaction so a failed migration rolls back cleanly.
 *
 * Returns the version the DB is at after running.
 */
export async function runMigrations(
    db: SQLiteAdapter,
    toApply: Migration[] = migrations,
): Promise<number> {
    await ensureMetaTable(db);
    const current = await readSchemaVersion(db);

    const pending = [...toApply]
        .sort((a, b) => a.version - b.version)
        .filter((m) => m.version > current);

    if (pending.length === 0) return current;

    // Sanity: versions must be contiguous.
    for (let i = 0; i < pending.length; i++) {
        const expected = current + i + 1;
        const actual = pending[i]!.version;
        if (actual !== expected) {
            throw new Error(
                `Non-contiguous migration: expected version ${expected}, got ${actual} (${pending[i]!.name}). ` +
                    'Migrations must increment by exactly 1.',
            );
        }
    }

    let last = current;
    for (const migration of pending) {
        await db.withTransactionAsync(async () => {
            await db.execAsync(migration.sql);
            await writeSchemaVersion(db, migration.version);
        });
        last = migration.version;
    }
    return last;
}

export async function getSchemaVersion(db: SQLiteAdapter): Promise<number> {
    await ensureMetaTable(db);
    return readSchemaVersion(db);
}
