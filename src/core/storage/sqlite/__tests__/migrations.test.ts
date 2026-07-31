import { BetterSqliteAdapter } from '../adapters/BetterSqliteAdapter';
import { getSchemaVersion, runMigrations } from '../migrations/runner';
import { migrations } from '../migrations';

describe('migrations runner', () => {
    it('starts at schema version 0 on a fresh db', async () => {
        const db = BetterSqliteAdapter.open();
        expect(await getSchemaVersion(db)).toBe(0);
        await db.closeAsync();
    });

    it('applies all migrations and reports the latest version', async () => {
        const db = BetterSqliteAdapter.open();
        const version = await runMigrations(db);
        expect(version).toBe(migrations[migrations.length - 1]!.version);
        expect(await getSchemaVersion(db)).toBe(version);
        await db.closeAsync();
    });

    it('is idempotent — running twice does not re-apply migrations', async () => {
        const db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const v1 = await getSchemaVersion(db);
        // Second call is a no-op — no error, same version.
        await runMigrations(db);
        const v2 = await getSchemaVersion(db);
        expect(v2).toBe(v1);
        await db.closeAsync();
    });

    it('creates every table declared in the schema', async () => {
        const db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const rows = await db.getAllAsync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        );
        const names = rows.map((r) => r.name);
        expect(names).toEqual(
            expect.arrayContaining([
                '_meta',
                'attendance_records',
                'audit_log',
                'classes',
                'face_embeddings',
                'sessions',
                'students',
                'sync_queue',
                'tenants',
                'users',
            ]),
        );
        await db.closeAsync();
    });

    it('creates every hot-path index', async () => {
        const db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const rows = await db.getAllAsync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'ix_%' ORDER BY name",
        );
        const names = rows.map((r) => r.name);
        expect(names).toEqual(
            expect.arrayContaining([
                'ix_attendance_session',
                'ix_attendance_student_marked',
                'ix_attendance_sync_status',
                'ix_audit_entity',
                'ix_audit_tenant_created',
                'ix_classes_tenant_active',
                'ix_classes_teacher',
                'ix_embeddings_student',
                'ix_sessions_class_started',
                'ix_sessions_teacher_started',
                'ix_students_class_active',
                'ix_students_tenant_active',
                'ix_sync_queue_next_try',
                'ix_users_tenant_role',
            ]),
        );
        await db.closeAsync();
    });

    it('rejects non-contiguous migration versions', async () => {
        const db = BetterSqliteAdapter.open();
        await expect(
            runMigrations(db, [
                { version: 1, name: 'init', sql: 'CREATE TABLE a(x INTEGER);' },
                { version: 3, name: 'skip', sql: 'CREATE TABLE b(x INTEGER);' },
            ]),
        ).rejects.toThrow(/Non-contiguous/);
        await db.closeAsync();
    });
});
