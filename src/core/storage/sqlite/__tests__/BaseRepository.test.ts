import { BetterSqliteAdapter } from '../adapters/BetterSqliteAdapter';
import { BaseRepository } from '../BaseRepository';
import type { SqlValue } from '../adapter';
import type { BaseEntity } from '../types';

/**
 * Purpose-built test entity + table. Keeps BaseRepository tests isolated
 * from the production schema — every column the base cares about is
 * exercised (audit, soft-delete, sync).
 */
interface TestEntity extends BaseEntity {
  name: string;
  code: string;
}

const TEST_TABLE_DDL = `
  CREATE TABLE test_items (
    id             TEXT PRIMARY KEY NOT NULL,
    name           TEXT NOT NULL,
    code           TEXT NOT NULL,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    version        INTEGER NOT NULL,
    deleted_at     INTEGER,
    sync_status    TEXT NOT NULL,
    remote_id      TEXT,
    last_synced_at INTEGER
  );
`;

class TestRepo extends BaseRepository<TestEntity> {
  protected get tableName(): string {
    return 'test_items';
  }

  protected toRow(e: TestEntity): Record<string, SqlValue> {
    return {
      id: e.id,
      name: e.name,
      code: e.code,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      version: e.version,
      deleted_at: e.deletedAt,
      sync_status: e.syncStatus,
      remote_id: e.remoteId,
      last_synced_at: e.lastSyncedAt,
    };
  }

  protected fromRow(row: Record<string, SqlValue>): TestEntity {
    return {
      id: row.id as string,
      name: row.name as string,
      code: row.code as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      version: row.version as number,
      deletedAt: (row.deleted_at ?? null) as number | null,
      syncStatus: row.sync_status as TestEntity['syncStatus'],
      remoteId: (row.remote_id ?? null) as string | null,
      lastSyncedAt: (row.last_synced_at ?? null) as number | null,
    };
  }
}

describe('BaseRepository', () => {
  let db: BetterSqliteAdapter;
  let repo: TestRepo;

  beforeEach(async () => {
    db = BetterSqliteAdapter.open();
    await db.execAsync(TEST_TABLE_DDL);
    repo = new TestRepo(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('inserts an entity and generates id + audit + sync columns', async () => {
    const created = await repo.insert({ name: 'Acme High', code: 'ACME-1' });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.version).toBe(1);
    expect(created.createdAt).toBeGreaterThan(0);
    expect(created.updatedAt).toBe(created.createdAt);
    expect(created.deletedAt).toBeNull();
    expect(created.syncStatus).toBe('pending');
    expect(created.remoteId).toBeNull();
    expect(created.lastSyncedAt).toBeNull();
  });

  it('findById returns the inserted row', async () => {
    const created = await repo.insert({ name: 'Acme', code: 'A1' });
    const found = await repo.findById(created.id);
    expect(found?.name).toBe('Acme');
  });

  it('findById returns null when the row does not exist', async () => {
    expect(await repo.findById('does-not-exist')).toBeNull();
  });

  it('findById excludes soft-deleted rows by default', async () => {
    const created = await repo.insert({ name: 'Acme', code: 'A1' });
    await repo.softDelete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    // But can be found when explicitly requested.
    const withDeleted = await repo.findById(created.id, { includeDeleted: true });
    expect(withDeleted?.id).toBe(created.id);
    expect(withDeleted?.deletedAt).not.toBeNull();
  });

  it('update bumps version, refreshes updated_at, keeps created_at', async () => {
    const created = await repo.insert({ name: 'Acme', code: 'A1' });
    await new Promise((r) => setTimeout(r, 2));
    const updated = await repo.update(created.id, { name: 'Acme 2' });
    expect(updated.version).toBe(2);
    expect(updated.name).toBe('Acme 2');
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    expect(updated.syncStatus).toBe('pending');
  });

  it('update throws when the row does not exist', async () => {
    await expect(repo.update('missing', { name: 'x' })).rejects.toThrow(/not found/);
  });

  it('findAll returns rows ordered as requested and skips deleted by default', async () => {
    await repo.insert({ name: 'A', code: 'C-A' });
    const b = await repo.insert({ name: 'B', code: 'C-B' });
    await repo.insert({ name: 'C', code: 'C-C' });
    await repo.softDelete(b.id);
    const rows = await repo.findAll({ orderBy: 'code ASC' });
    expect(rows.map((r) => r.name)).toEqual(['A', 'C']);
  });

  it('findAll includes deleted when asked', async () => {
    const a = await repo.insert({ name: 'A', code: 'C-A' });
    await repo.softDelete(a.id);
    const rows = await repo.findAll({ includeDeleted: true });
    expect(rows).toHaveLength(1);
  });

  it('findAll supports where clauses with params', async () => {
    await repo.insert({ name: 'Alpha', code: 'X' });
    await repo.insert({ name: 'Beta', code: 'Y' });
    const rows = await repo.findAll({ where: 'code = ?', params: ['Y'] });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('Beta');
  });

  it('count returns the number of live rows (excludes soft-deleted)', async () => {
    expect(await repo.count()).toBe(0);
    const a = await repo.insert({ name: 'A', code: 'C-A' });
    await repo.insert({ name: 'B', code: 'C-B' });
    expect(await repo.count()).toBe(2);
    await repo.softDelete(a.id);
    expect(await repo.count()).toBe(1);
  });

  it('softDelete stamps deleted_at and bumps version', async () => {
    const created = await repo.insert({ name: 'X', code: 'C-X' });
    await repo.softDelete(created.id);
    const row = await repo.findById(created.id, { includeDeleted: true });
    expect(row?.deletedAt).toBeGreaterThan(0);
    expect(row?.version).toBe(2);
  });

  it('hardDelete removes the row permanently', async () => {
    const created = await repo.insert({ name: 'X', code: 'C-X' });
    await repo.hardDelete(created.id);
    expect(await repo.findById(created.id, { includeDeleted: true })).toBeNull();
    expect(await repo.count()).toBe(0);
  });
});
