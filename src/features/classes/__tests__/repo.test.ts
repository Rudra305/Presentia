import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import { seedDev } from '@/core/storage/sqlite/seed';
import { TeacherRepo } from '@/features/teachers/repo';
import { ClassRepo } from '../repo';

describe('ClassRepo', () => {
    let db: BetterSqliteAdapter;
    let classRepo: ClassRepo;
    let teacherRepo: TeacherRepo;
    let tenantId: string;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const seed = await seedDev(db, { includeDemoData: true });
        tenantId = seed.tenantId;
        classRepo = new ClassRepo(db);
        teacherRepo = new TeacherRepo(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('listWithDetails returns seeded classes with teacher info and student count', async () => {
        const list = await classRepo.listWithDetails(tenantId);
        expect(list.length).toBe(3);

        const grade5A = list.find((c) => c.name === 'Grade 5 · Section A');
        expect(grade5A).toBeDefined();
        expect(grade5A?.grade).toBe('5');
        expect(grade5A?.section).toBe('A');
        expect(grade5A?.teacherName).toBe('Mr. Ravi Menon');
        expect(grade5A?.studentCount).toBe(5);
    });

    it('inserts a new class and retrieves it with details', async () => {
        const teachers = await teacherRepo.listByTenant(tenantId);
        const primaryTeacher = teachers[0]!;

        const inserted = await classRepo.insert({
            tenantId,
            name: '12-B Computer Science',
            grade: '12',
            section: 'B',
            teacherId: primaryTeacher.id,
        });

        expect(inserted.id).toBeDefined();

        const withDetails = await classRepo.findByIdWithDetails(inserted.id);
        expect(withDetails?.name).toBe('12-B Computer Science');
        expect(withDetails?.teacherName).toBe(primaryTeacher.fullName);
        expect(withDetails?.studentCount).toBe(0);
    });

    it('assigns and reassigns a teacher to a class', async () => {
        const teachers = await teacherRepo.listByTenant(tenantId);
        const inserted = await classRepo.insert({
            tenantId,
            name: '11-C Physics',
            grade: '11',
            section: 'C',
            teacherId: null,
        });

        // Unassigned initially
        let details = await classRepo.findByIdWithDetails(inserted.id);
        expect(details?.teacherId).toBeNull();
        expect(details?.teacherName).toBeNull();

        // Assign teacher
        await classRepo.assignTeacher(inserted.id, teachers[0]!.id);
        details = await classRepo.findByIdWithDetails(inserted.id);
        expect(details?.teacherId).toBe(teachers[0]!.id);
        expect(details?.teacherName).toBe(teachers[0]!.fullName);
    });

    it('searches classes by name or grade', async () => {
        await classRepo.insert({
            tenantId,
            name: 'Biology Honors',
            grade: '9',
            section: 'H',
            teacherId: null,
        });

        const searchResult = await classRepo.search(tenantId, 'biology');
        expect(searchResult).toHaveLength(1);
        expect(searchResult[0]?.name).toBe('Biology Honors');

        const searchByGrade = await classRepo.search(tenantId, '9');
        expect(searchByGrade.some((c) => c.name === 'Biology Honors')).toBe(true);
    });

    it('softDelete excludes class from active listWithDetails', async () => {
        const initialList = await classRepo.listWithDetails(tenantId);
        const target = initialList[0]!;

        await classRepo.softDelete(target.id);
        const listAfterDelete = await classRepo.listWithDetails(tenantId);

        expect(listAfterDelete.find((c) => c.id === target.id)).toBeUndefined();
    });
});
