import type { SQLiteAdapter, SqlValue } from '@/core/storage/sqlite';
import { getDb, nowEpochMs, uuid } from '@/core/storage/sqlite';
import type { SyncOp, SyncQueueItem } from './types';

export class SyncQueueRepo {
    constructor(private db: SQLiteAdapter) {}

    private fromRow(row: Record<string, SqlValue>): SyncQueueItem {
        const createdAt = Number(row.created_at ?? Date.now());
        return {
            id: row.id as string,
            entityType: row.entity_type as string,
            entityId: row.entity_id as string,
            op: row.op as SyncOp,
            payload: row.payload as string,
            attempts: Number(row.attempts ?? 0),
            nextTryAt: Number(row.next_try_at ?? 0),
            lastError: (row.last_error ?? null) as string | null,
            createdAt,
            updatedAt: createdAt,
            version: 1,
            deletedAt: null,
            syncStatus: 'synced',
            remoteId: null,
            lastSyncedAt: null,
        };
    }

    /**
     * Enqueue a local mutation for outbound sync.
     */
    async enqueue(
        entityType: string,
        entityId: string,
        op: SyncOp,
        payload: Record<string, unknown>,
    ): Promise<SyncQueueItem> {
        const now = nowEpochMs();
        const id = uuid();
        const payloadStr = JSON.stringify(payload);

        const sql = `
            INSERT INTO sync_queue (id, entity_type, entity_id, op, payload, attempts, next_try_at, last_error, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?)
        `;

        await this.db.runAsync(sql, [id, entityType, entityId, op, payloadStr, now, now]);

        return {
            id,
            entityType,
            entityId,
            op,
            payload: payloadStr,
            attempts: 0,
            nextTryAt: now,
            lastError: null,
            createdAt: now,
            updatedAt: now,
            version: 1,
            deletedAt: null,
            syncStatus: 'pending',
            remoteId: null,
            lastSyncedAt: null,
        };
    }

    /**
     * Fetch items eligible for sync attempt (next_try_at <= now), ordered by creation time.
     */
    async getPending(limit = 50): Promise<SyncQueueItem[]> {
        const now = nowEpochMs();
        const sql = `SELECT * FROM sync_queue WHERE next_try_at <= ? ORDER BY created_at ASC LIMIT ?`;
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [now, limit]);
        return rows.map((r) => this.fromRow(r));
    }

    /**
     * Count total pending queued mutations.
     */
    async getPendingCount(): Promise<number> {
        const sql = `SELECT COUNT(*) AS c FROM sync_queue`;
        const row = await this.db.getFirstAsync<{ c: number }>(sql);
        return row?.c ?? 0;
    }

    /**
     * Mark an item as failed with exponential backoff delay for retries.
     */
    async recordFailure(id: string, errorMsg: string): Promise<void> {
        const fetchSql = `SELECT attempts FROM sync_queue WHERE id = ?`;
        const item = await this.db.getFirstAsync<{ attempts: number }>(fetchSql, [id]);
        if (!item) return;

        const newAttempts = Number(item.attempts ?? 0) + 1;
        const delayMs = Math.min(300000, 1000 * Math.pow(2, newAttempts)); // Cap at 5 minutes
        const nextTryAt = nowEpochMs() + delayMs;

        const updateSql = `UPDATE sync_queue SET attempts = ?, next_try_at = ?, last_error = ? WHERE id = ?`;
        await this.db.runAsync(updateSql, [newAttempts, nextTryAt, errorMsg, id]);
    }

    /**
     * Remove successfully pushed queue items by ID array.
     */
    async dequeue(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        const placeholders = ids.map(() => '?').join(',');
        const sql = `DELETE FROM sync_queue WHERE id IN (${placeholders})`;
        await this.db.runAsync(sql, ids);
    }
}

export async function getSyncQueueRepo(): Promise<SyncQueueRepo> {
    const db = await getDb();
    return new SyncQueueRepo(db);
}
