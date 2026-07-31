/* eslint-disable @typescript-eslint/no-require-imports */

import type { SQLiteAdapter, SqlRow, SqlValue } from '../adapter';

/**
 * Test-only adapter — wraps `better-sqlite3` (synchronous, Node) behind the
 * shared async interface. Should NEVER be imported by production code; it's
 * loaded lazily via require() so Metro can safely skip it.
 */
export class BetterSqliteAdapter implements SQLiteAdapter {
    private readonly db: any;

    private constructor(db: unknown) {
        this.db = db;
    }

    static open(filename = ':memory:'): BetterSqliteAdapter {
        const Database = require('better-sqlite3');
        const db = new Database(filename);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        return new BetterSqliteAdapter(db);
    }

    async execAsync(sql: string): Promise<void> {
        this.db.exec(sql);
    }

    async runAsync(sql: string, params: SqlValue[] = []): Promise<{ changes: number }> {
        const stmt = this.db.prepare(sql);
        const info = stmt.run(...params);
        return { changes: info.changes as number };
    }

    async getFirstAsync<T extends SqlRow = SqlRow>(
        sql: string,
        params: SqlValue[] = [],
    ): Promise<T | null> {
        const stmt = this.db.prepare(sql);
        const row = stmt.get(...params) as T | undefined;
        return row ?? null;
    }

    async getAllAsync<T extends SqlRow = SqlRow>(
        sql: string,
        params: SqlValue[] = [],
    ): Promise<T[]> {
        const stmt = this.db.prepare(sql);
        return stmt.all(...params) as T[];
    }

    async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
        // better-sqlite3 transactions are synchronous, so we roll our own to
        // support async work inside `fn` (mirrors expo-sqlite semantics).
        this.db.exec('BEGIN');
        try {
            const result = await fn();
            this.db.exec('COMMIT');
            return result;
        } catch (err) {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }

    async closeAsync(): Promise<void> {
        this.db.close();
    }
}
