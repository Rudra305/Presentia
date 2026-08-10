import type { SQLiteAdapter } from '@/core/storage/sqlite';
import { getDb, nowEpochMs } from '@/core/storage/sqlite';
import type { SyncPullResult } from './types';

export interface ConflictDecision {
    entityId: string;
    entityType: string;
    winner: 'local' | 'remote';
    reason: string;
}

/**
 * Last-Write-Wins (LWW) Conflict Resolver.
 */
export class ConflictResolver {
    /**
     * Resolve and apply inbound remote deltas using LWW semantics.
     */
    static async applyInboundDeltas(
        entities: SyncPullResult['entities'],
        customDb?: SQLiteAdapter,
    ): Promise<ConflictDecision[]> {
        if (entities.length === 0) return [];
        const db = customDb ?? (await getDb());
        const decisions: ConflictDecision[] = [];

        for (const remote of entities) {
            const table = remote.entityType;
            if (!table) continue;

            const localRow = await db.getFirstAsync<{
                id: string;
                updated_at: number;
                version: number;
            }>(`SELECT id, updated_at, version FROM ${table} WHERE id = ?`, [remote.entityId]);

            if (!localRow) {
                // Local entity does not exist -> apply remote insert directly
                await ConflictResolver.applyRemoteUpdate(db, table, remote);
                decisions.push({
                    entityId: remote.entityId,
                    entityType: table,
                    winner: 'remote',
                    reason: 'Local record did not exist.',
                });
                continue;
            }

            const localUpdatedAt = Number(localRow.updated_at ?? 0);
            const localVersion = Number(localRow.version ?? 1);

            if (
                remote.updatedAt > localUpdatedAt ||
                (remote.updatedAt === localUpdatedAt && remote.version >= localVersion)
            ) {
                // Remote is newer or higher version -> remote wins
                await ConflictResolver.applyRemoteUpdate(db, table, remote);
                decisions.push({
                    entityId: remote.entityId,
                    entityType: table,
                    winner: 'remote',
                    reason: `Remote timestamp ${remote.updatedAt} >= local ${localUpdatedAt}.`,
                });
            } else {
                // Local is newer -> local wins
                decisions.push({
                    entityId: remote.entityId,
                    entityType: table,
                    winner: 'local',
                    reason: `Local timestamp ${localUpdatedAt} > remote ${remote.updatedAt}.`,
                });
            }
        }

        return decisions;
    }

    private static async applyRemoteUpdate(
        db: any,
        table: string,
        remote: SyncPullResult['entities'][0],
    ): Promise<void> {
        const ALLOWED_TABLES = new Set([
            'users',
            'classes',
            'students',
            'face_embeddings',
            'sessions',
            'attendance_records',
        ]);
        if (!ALLOWED_TABLES.has(table)) return;

        const data: Record<string, unknown> = { ...remote.data };
        if (!('created_at' in data) && !('createdAt' in data)) {
            data.created_at = remote.updatedAt;
        }

        const keys = Object.keys(data);
        if (keys.length === 0) return;

        const columns = ['id', ...keys, 'updated_at', 'version', 'sync_status', 'last_synced_at'];
        const placeholders = columns.map(() => '?').join(', ');
        const updateSets = keys.map((k) => `${k} = excluded.${k}`).join(', ');

        const values = [
            remote.entityId,
            ...Object.values(data),
            remote.updatedAt,
            remote.version,
            'synced',
            nowEpochMs(),
        ];

        const sql = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
                ${updateSets},
                updated_at = excluded.updated_at,
                version = excluded.version,
                sync_status = 'synced',
                last_synced_at = excluded.last_synced_at;
        `;

        await db.runAsync(sql, values);
    }
}
