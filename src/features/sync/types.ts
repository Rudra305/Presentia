import type { BaseEntity } from '@/core/storage/sqlite';

export type SyncOp = 'create' | 'update' | 'delete';

export interface SyncQueueItem extends BaseEntity {
    entityType: string;
    entityId: string;
    op: SyncOp;
    payload: string;
    attempts: number;
    nextTryAt: number;
    lastError: string | null;
}

export interface SyncPushPayload {
    items: {
        id: string;
        entityType: string;
        entityId: string;
        op: SyncOp;
        payload: Record<string, unknown>;
        version: number;
        updatedAt: number;
    }[];
}

export interface SyncPushResult {
    processedIds: string[];
    rejectedIds: { id: string; error: string }[];
}

export interface SyncPullResult {
    serverTimestamp: number;
    entities: {
        entityType: string;
        entityId: string;
        data: Record<string, unknown>;
        updatedAt: number;
        version: number;
        deletedAt: number | null;
    }[];
}

export interface SyncEngineStatus {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncedAt: number | null;
    lastError: string | null;
}
