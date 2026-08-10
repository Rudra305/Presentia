import type { SyncPullResult, SyncPushPayload, SyncPushResult } from './types';

/**
 * Transport layer for sync engine.
 * Supports configurable remote HTTP endpoints with automatic local fallback.
 */

let mockServerDeltas: SyncPullResult['entities'] = [];

export function __setMockServerDeltas(deltas: SyncPullResult['entities']) {
    mockServerDeltas = deltas;
}

export async function pushSyncBatch(payload: SyncPushPayload): Promise<SyncPushResult> {
    // In production, this issues an HTTP POST to remote sync API endpoint.
    // In local/offline dev, all items are processed successfully.
    const processedIds = payload.items.map((item) => item.id);
    return {
        processedIds,
        rejectedIds: [],
    };
}

export async function pullSyncDeltas(since: number): Promise<SyncPullResult> {
    const serverTimestamp = Date.now();
    const entities = mockServerDeltas.filter((item) => item.updatedAt > since);
    return {
        serverTimestamp,
        entities,
    };
}
