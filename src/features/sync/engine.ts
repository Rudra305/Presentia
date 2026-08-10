import type { SQLiteAdapter } from '@/core/storage/sqlite';
import { getDb, nowEpochMs } from '@/core/storage/sqlite';
import { pullSyncDeltas, pushSyncBatch } from './api';
import { ConflictResolver } from './conflict';
import { getSyncQueueRepo, SyncQueueRepo } from './repo';
import type { SyncEngineStatus, SyncPushPayload } from './types';

type SyncListener = (status: SyncEngineStatus) => void;

export class SyncEngine {
    private static instance: SyncEngine | null = null;
    private listeners: Set<SyncListener> = new Set();
    private lastSyncedAt: number | null = null;
    private isSyncing = false;
    private lastError: string | null = null;

    static getInstance(): SyncEngine {
        if (!SyncEngine.instance) {
            SyncEngine.instance = new SyncEngine();
        }
        return SyncEngine.instance;
    }

    subscribe(listener: SyncListener): () => void {
        this.listeners.add(listener);
        this.notify();
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(customQueueRepo?: SyncQueueRepo) {
        void this.getStatus(customQueueRepo).then((status) => {
            for (const listener of this.listeners) {
                listener(status);
            }
        });
    }

    async getStatus(customQueueRepo?: SyncQueueRepo): Promise<SyncEngineStatus> {
        const queueRepo = customQueueRepo ?? (await getSyncQueueRepo());
        const pendingCount = await queueRepo.getPendingCount();
        return {
            isSyncing: this.isSyncing,
            pendingCount,
            lastSyncedAt: this.lastSyncedAt,
            lastError: this.lastError,
        };
    }

    /**
     * Executes a full bi-directional sync cycle (Outbound Push -> Inbound Pull -> LWW Resolution).
     */
    async runSyncCycle(
        customDb?: SQLiteAdapter,
        customQueueRepo?: SyncQueueRepo,
    ): Promise<SyncEngineStatus> {
        if (this.isSyncing) return this.getStatus(customQueueRepo);

        this.isSyncing = true;
        this.lastError = null;
        this.notify(customQueueRepo);

        try {
            const queueRepo = customQueueRepo ?? (await getSyncQueueRepo());
            const pendingItems = await queueRepo.getPending(50);

            if (pendingItems.length > 0) {
                const pushPayload: SyncPushPayload = {
                    items: pendingItems.map((item) => {
                        let parsed: Record<string, unknown> = {};
                        try {
                            parsed = JSON.parse(item.payload) as Record<string, unknown>;
                        } catch {
                            parsed = {};
                        }
                        return {
                            id: item.id,
                            entityType: item.entityType,
                            entityId: item.entityId,
                            op: item.op,
                            payload: parsed,
                            version: item.version,
                            updatedAt: item.updatedAt,
                        };
                    }),
                };

                const pushRes = await pushSyncBatch(pushPayload);

                if (pushRes.processedIds.length > 0) {
                    await queueRepo.dequeue(pushRes.processedIds);
                    await this.markEntitiesSynced(pendingItems, pushRes.processedIds, customDb);
                }

                for (const rej of pushRes.rejectedIds) {
                    await queueRepo.recordFailure(rej.id, rej.error);
                }
            }

            // Inbound Pull
            const since = this.lastSyncedAt ?? 0;
            const pullRes = await pullSyncDeltas(since);
            if (pullRes.entities.length > 0) {
                await ConflictResolver.applyInboundDeltas(pullRes.entities, customDb);
            }

            this.lastSyncedAt = pullRes.serverTimestamp;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sync cycle failed';
            this.lastError = msg;
        } finally {
            this.isSyncing = false;
            this.notify(customQueueRepo);
        }

        return this.getStatus(customQueueRepo);
    }

    private async markEntitiesSynced(
        items: { id: string; entityType: string; entityId: string }[],
        processedIds: string[],
        customDb?: SQLiteAdapter,
    ): Promise<void> {
        const db = customDb ?? (await getDb());
        const processedSet = new Set(processedIds);
        const now = nowEpochMs();

        const ALLOWED_TABLES = new Set([
            'users',
            'classes',
            'students',
            'face_embeddings',
            'sessions',
            'attendance_records',
        ]);

        for (const item of items) {
            if (!processedSet.has(item.id)) continue;
            if (!ALLOWED_TABLES.has(item.entityType)) continue;

            const sql = `UPDATE ${item.entityType} SET sync_status = 'synced', last_synced_at = ? WHERE id = ?`;
            try {
                await db.runAsync(sql, [now, item.entityId]);
            } catch {
                // Ignore if entity row was deleted
            }
        }
    }
}

export function getSyncEngine(): SyncEngine {
    return SyncEngine.getInstance();
}
