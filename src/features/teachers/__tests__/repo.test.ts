import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import { seedDev } from '@/core/storage/sqlite/seed';
import { TeacherRepo } from '../repo';

describe('TeacherRepo', () => {
    let db: BetterSqliteAdapter;
    let repo: TeacherRepo;
    let tenantId: string;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const seed = await seedDev(db, { includeDemoData: true });
        tenantId = seed.tenantId;
        repo = new TeacherRepo(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('listByTenant returns seeded staff members sorted by name', async () => {
        const list = await repo.listByTenant(tenantId);
        expect(list).toHaveLength(3);
        expect(list.map((t) => t.fullName)).toEqual([
            'Dr. Ada Okafor',
            'Mr. Ravi Menon',
            'Ms. Lin Wei',
        ]);
    });

    it('inserts a teacher and picks it up in the list', async () => {
        await repo.insert({
            tenantId,
            fullName: 'Ms. Nia Okafor',
            email: 'nia@school.example',
            status: 'active',
            biometricEnrolled: false,
        });
        const list = await repo.listByTenant(tenantId);
        expect(list.map((t) => t.fullName)).toContain('Ms. Nia Okafor');
    });

    it('updates a teacher and bumps version + updated_at', async () => {
        const list = await repo.listByTenant(tenantId);
        const first = list[0]!;
        await new Promise((r) => setTimeout(r, 2));
        const updated = await repo.update(first.id, { fullName: 'Mr. Ravi M. Renamed' });
        expect(updated.fullName).toBe('Mr. Ravi M. Renamed');
        expect(updated.version).toBe(first.version + 1);
        expect(updated.updatedAt).toBeGreaterThan(first.updatedAt);
    });

    it('softDelete removes the teacher from the default list', async () => {
        const list = await repo.listByTenant(tenantId);
        await repo.softDelete(list[0]!.id);
        const afterList = await repo.listByTenant(tenantId);
        expect(afterList).toHaveLength(list.length - 1);
    });

    it('search filters by name and email (case-insensitive)', async () => {
        await repo.insert({
            tenantId,
            fullName: 'Dr. Aditi Sharma',
            email: 'aditi@school.example',
            status: 'active',
            biometricEnrolled: false,
        });

        const byName = await repo.search(tenantId, 'aditi');
        expect(byName).toHaveLength(1);
        expect(byName[0]!.fullName).toBe('Dr. Aditi Sharma');

        const byEmail = await repo.search(tenantId, 'ADITI@school');
        expect(byEmail).toHaveLength(1);

        const missing = await repo.search(tenantId, 'zzz-no-match');
        expect(missing).toHaveLength(0);
    });
});
