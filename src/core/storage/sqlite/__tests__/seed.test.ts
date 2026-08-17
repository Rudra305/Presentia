import { BetterSqliteAdapter } from '../adapters/BetterSqliteAdapter';
import { runMigrations } from '../migrations/runner';
import { seedDev, SEED_TENANT_ID } from '../seed';

describe('seed data', () => {
    let db: BetterSqliteAdapter;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('creates the expected tenant + users + classes + students', async () => {
        const result = await seedDev(db, { includeDemoData: true });
        expect(result.tenantId).toBe(SEED_TENANT_ID);
        expect(result.principalId).toBeTruthy();
        expect(result.teacherIds).toHaveLength(2);
        expect(result.classIds).toHaveLength(3);
        expect(result.studentIds).toHaveLength(15); // 3 classes × 5 students
    });

    it('populates every foreign-key relationship correctly', async () => {
        const { classIds } = await seedDev(db, { includeDemoData: true });
        const [class1] = classIds;
        const students = await db.getAllAsync<{ full_name: string; roll_no: string }>(
            'SELECT full_name, roll_no FROM students WHERE class_id = ? ORDER BY roll_no',
            [class1!],
        );
        expect(students).toHaveLength(5);
        expect(students[0]!.roll_no).toBe('01');
        expect(students[4]!.roll_no).toBe('05');
    });

    it('is idempotent — running twice returns the same ids', async () => {
        const a = await seedDev(db, { includeDemoData: true });
        const b = await seedDev(db, { includeDemoData: true });
        expect(b.tenantId).toBe(a.tenantId);
        expect(b.principalId).toBe(a.principalId);
        expect(b.teacherIds.sort()).toEqual(a.teacherIds.sort());
        expect(b.classIds.sort()).toEqual(a.classIds.sort());
        expect(b.studentIds.sort()).toEqual(a.studentIds.sort());

        const tenantCount = await db.getFirstAsync<{ c: number }>(
            'SELECT COUNT(*) AS c FROM tenants',
        );
        expect(tenantCount?.c).toBe(1);
    });
});
