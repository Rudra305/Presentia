import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import type { SeedResult } from '@/core/storage/sqlite/seed';
import { seedDev } from '@/core/storage/sqlite/seed';

import { __setMockServerDeltas } from '../api';
import { ConflictResolver } from '../conflict';
import { getSyncEngine } from '../engine';
import { SyncQueueRepo } from '../repo';

describe('Sync Feature Module', () => {
    let db: BetterSqliteAdapter;
    let queueRepo: SyncQueueRepo;
    let seed: SeedResult;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        seed = await seedDev(db, { includeDemoData: true });
        queueRepo = new SyncQueueRepo(db);
        __setMockServerDeltas([]);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    describe('SyncQueueRepo', () => {
        it('starts with 0 pending items', async () => {
            const count = await queueRepo.getPendingCount();
            expect(count).toBe(0);
        });

        it('enqueues a mutation and retrieves it via getPending', async () => {
            const item = await queueRepo.enqueue('classes', 'cls-100', 'create', {
                name: 'Grade 10 Physics',
            });
            expect(item.entityType).toBe('classes');
            expect(item.entityId).toBe('cls-100');
            expect(item.op).toBe('create');

            const pending = await queueRepo.getPending();
            expect(pending).toHaveLength(1);
            expect(pending[0]!.id).toBe(item.id);
        });

        it('records failure and increases attempts with exponential backoff', async () => {
            const item = await queueRepo.enqueue('classes', 'cls-200', 'update', {
                name: 'Math',
            });
            await queueRepo.recordFailure(item.id, 'Network timeout');

            const count = await queueRepo.getPendingCount();
            expect(count).toBe(1);

            const pending = await queueRepo.getPending();
            expect(pending).toHaveLength(0); // Deferred due to backoff next_try_at delay
        });

        it('dequeues items when successfully processed', async () => {
            const item = await queueRepo.enqueue('students', 'st-300', 'delete', {});
            await queueRepo.dequeue([item.id]);

            const count = await queueRepo.getPendingCount();
            expect(count).toBe(0);
        });
    });

    describe('ConflictResolver (LWW)', () => {
        it('applies remote delta when remote timestamp is newer', async () => {
            const remoteTimestamp = Date.now() + 10000;
            const targetClassId = seed.classIds[0]!;
            const decisions = await ConflictResolver.applyInboundDeltas(
                [
                    {
                        entityType: 'classes',
                        entityId: targetClassId,
                        data: { tenant_id: seed.tenantId, name: 'Grade 10A Mathematics' },
                        updatedAt: remoteTimestamp,
                        version: 5,
                        deletedAt: null,
                    },
                ],
                db,
            );

            expect(decisions).toHaveLength(1);
            expect(decisions[0]!.winner).toBe('remote');

            const updatedRow = await db.getFirstAsync<{ name: string; sync_status: string }>(
                `SELECT name, sync_status FROM classes WHERE id = ?`,
                [targetClassId],
            );
            expect(updatedRow?.name).toBe('Grade 10A Mathematics');
            expect(updatedRow?.sync_status).toBe('synced');
        });

        it('retains local record when local timestamp is newer', async () => {
            const olderRemoteTimestamp = 1000; // Far in the past
            const targetClassId = seed.classIds[1]!;
            const decisions = await ConflictResolver.applyInboundDeltas(
                [
                    {
                        entityType: 'classes',
                        entityId: targetClassId,
                        data: { tenant_id: seed.tenantId, name: 'Old Stale Name' },
                        updatedAt: olderRemoteTimestamp,
                        version: 1,
                        deletedAt: null,
                    },
                ],
                db,
            );

            expect(decisions).toHaveLength(1);
            expect(decisions[0]!.winner).toBe('local');
        });
    });

    describe('SyncEngine', () => {
        it('runs a complete sync cycle smoothly', async () => {
            const engine = getSyncEngine();
            const status = await engine.runSyncCycle(db, queueRepo);
            expect(status.isSyncing).toBe(false);
            expect(status.lastError).toBeNull();
            expect(status.lastSyncedAt).toBeGreaterThan(0);
        });
    });
});
