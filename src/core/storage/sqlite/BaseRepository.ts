import type { SQLiteAdapter, SqlValue } from './adapter';
import { nowEpochMs, uuid } from './ids';
import type { BaseEntity, NewEntity, SyncStatus } from './types';

/**
 * Generic repository for entities that extend `BaseEntity`.
 *
 * Subclasses must implement:
 *   - `tableName`   — the SQLite table
 *   - `toRow(e)`    — entity → column map (exclusive to entity-specific fields)
 *   - `fromRow(r)`  — row → entity
 *
 * The base handles id generation, audit columns, versioning, soft deletes,
 * and sync-status bookkeeping so subclasses stay ~30 lines.
 */
export abstract class BaseRepository<T extends BaseEntity> {
    constructor(protected readonly db: SQLiteAdapter) {}

    protected abstract get tableName(): string;

    protected abstract toRow(entity: T): Record<string, SqlValue>;

    protected abstract fromRow(row: Record<string, SqlValue>): T;

    // ── Reads ────────────────────────────────────────────────────────────

    async findById(id: string, options: { includeDeleted?: boolean } = {}): Promise<T | null> {
        const where = options.includeDeleted ? 'id = ?' : 'id = ? AND deleted_at IS NULL';
        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(
            `SELECT * FROM ${this.tableName} WHERE ${where}`,
            [id],
        );
        return row ? this.fromRow(row) : null;
    }

    async findAll(
        options: {
            where?: string;
            params?: SqlValue[];
            orderBy?: string;
            limit?: number;
            offset?: number;
            includeDeleted?: boolean;
        } = {},
    ): Promise<T[]> {
        const parts: string[] = [];
        const baseWhere = options.includeDeleted ? '' : 'deleted_at IS NULL';
        if (baseWhere) parts.push(baseWhere);
        if (options.where) parts.push(`(${options.where})`);
        const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
        const order = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
        const limit = options.limit != null ? `LIMIT ${options.limit}` : '';
        const offset = options.offset != null ? `OFFSET ${options.offset}` : '';
        const sql = `SELECT * FROM ${this.tableName} ${where} ${order} ${limit} ${offset}`.trim();
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, options.params ?? []);
        return rows.map((r) => this.fromRow(r));
    }

    async count(where?: string, params: SqlValue[] = []): Promise<number> {
        const clause = where
            ? `WHERE deleted_at IS NULL AND (${where})`
            : 'WHERE deleted_at IS NULL';
        const row = await this.db.getFirstAsync<{ c: number }>(
            `SELECT COUNT(*) AS c FROM ${this.tableName} ${clause}`,
            params,
        );
        return row?.c ?? 0;
    }

    // ── Writes ───────────────────────────────────────────────────────────

    /**
     * Insert a new entity. Caller supplies feature-specific fields via
     * `NewEntity<T>`; the base generates id + audit + sync columns.
     */
    async insert(input: NewEntity<T>): Promise<T> {
        const now = nowEpochMs();
        const entity = {
            ...input,
            id: input.id ?? uuid(),
            createdAt: now,
            updatedAt: now,
            version: 1,
            deletedAt: null,
            syncStatus: 'pending' as SyncStatus,
            remoteId: null,
            lastSyncedAt: null,
        } as T;

        const row = this.toRow(entity);
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(',');
        const sql = `INSERT INTO ${this.tableName} (${cols.join(',')}) VALUES (${placeholders})`;
        await this.db.runAsync(
            sql,
            cols.map((c) => row[c] as SqlValue),
        );
        return entity;
    }

    /**
     * Patch an existing entity. Bumps `version` and `updated_at`; marks
     * `sync_status = 'pending'` so the sync queue picks it up.
     */
    async update(id: string, patch: Partial<Omit<T, 'id' | 'createdAt' | 'version'>>): Promise<T> {
        const current = await this.findById(id);
        if (!current) throw new Error(`${this.tableName}: not found ${id}`);
        const merged: T = {
            ...current,
            ...patch,
            updatedAt: nowEpochMs(),
            version: current.version + 1,
            syncStatus: 'pending',
        };
        const row = this.toRow(merged);
        const cols = Object.keys(row).filter((c) => c !== 'id');
        const setClause = cols.map((c) => `${c} = ?`).join(', ');
        const params = cols.map((c) => row[c] as SqlValue);
        params.push(id);
        await this.db.runAsync(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, params);
        return merged;
    }

    async softDelete(id: string): Promise<void> {
        const now = nowEpochMs();
        await this.db.runAsync(
            `UPDATE ${this.tableName}
         SET deleted_at = ?, updated_at = ?, sync_status = 'pending',
             version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
            [now, now, id],
        );
    }

    async hardDelete(id: string): Promise<void> {
        await this.db.runAsync(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    }
}
