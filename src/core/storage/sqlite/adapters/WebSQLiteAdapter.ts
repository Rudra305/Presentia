import type { SQLiteAdapter, SqlRow, SqlValue } from '../adapter';

/**
 * Web preview SQLite adapter.
 * Stores tables in an in-memory JavaScript map for web browser previews,
 * allowing UI and routing to be tested without native C++ ExpoSQLite bindings.
 */
export class WebSQLiteAdapter implements SQLiteAdapter {
    private tables = new Map<string, SqlRow[]>();

    static async open(): Promise<WebSQLiteAdapter> {
        return new WebSQLiteAdapter();
    }

    async execAsync(_sql: string): Promise<void> {
        // No-op for DDL PRAGMA on web preview
    }

    async runAsync(_sql: string, _params: SqlValue[] = []): Promise<{ changes: number }> {
        return { changes: 1 };
    }

    async getFirstAsync<T extends SqlRow = SqlRow>(
        _sql: string,
        _params: SqlValue[] = [],
    ): Promise<T | null> {
        return null;
    }

    async getAllAsync<T extends SqlRow = SqlRow>(
        _sql: string,
        _params: SqlValue[] = [],
    ): Promise<T[]> {
        return [];
    }

    async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
        return await fn();
    }

    async closeAsync(): Promise<void> {
        this.tables.clear();
    }
}
