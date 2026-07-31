import * as SQLite from 'expo-sqlite';

import type { SQLiteAdapter, SqlRow, SqlValue } from '../adapter';

/**
 * Production adapter — wraps `expo-sqlite` behind the common interface.
 * Enables foreign keys and WAL journal mode at open time.
 */
export class ExpoSQLiteAdapter implements SQLiteAdapter {
    constructor(private readonly db: SQLite.SQLiteDatabase) {}

    static async open(name: string): Promise<ExpoSQLiteAdapter> {
        const db = await SQLite.openDatabaseAsync(name);
        await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
        return new ExpoSQLiteAdapter(db);
    }

    execAsync(sql: string): Promise<void> {
        return this.db.execAsync(sql);
    }

    async runAsync(sql: string, params: SqlValue[] = []): Promise<{ changes: number }> {
        const result = await this.db.runAsync(sql, params as SQLite.SQLiteBindValue[]);
        return { changes: result.changes };
    }

    async getFirstAsync<T extends SqlRow = SqlRow>(
        sql: string,
        params: SqlValue[] = [],
    ): Promise<T | null> {
        const row = await this.db.getFirstAsync<T>(sql, params as SQLite.SQLiteBindValue[]);
        return row ?? null;
    }

    getAllAsync<T extends SqlRow = SqlRow>(sql: string, params: SqlValue[] = []): Promise<T[]> {
        return this.db.getAllAsync<T>(sql, params as SQLite.SQLiteBindValue[]);
    }

    async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
        let result!: T;
        await this.db.withTransactionAsync(async () => {
            result = await fn();
        });
        return result;
    }

    closeAsync(): Promise<void> {
        return this.db.closeAsync();
    }
}
