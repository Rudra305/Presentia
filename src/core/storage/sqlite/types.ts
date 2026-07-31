/**
 * Shared entity types.
 *
 * Every persisted entity extends `BaseEntity` — this guarantees that the
 * base repository can generically manage audit columns, soft deletes and
 * sync metadata.
 */

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface BaseEntity {
    id: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    deletedAt: number | null;
    syncStatus: SyncStatus;
    remoteId: string | null;
    lastSyncedAt: number | null;
}

export type NewEntity<T extends BaseEntity> = Omit<
    T,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'version'
    | 'deletedAt'
    | 'syncStatus'
    | 'remoteId'
    | 'lastSyncedAt'
> & { id?: string };
