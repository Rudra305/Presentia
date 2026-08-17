import { BetterSqliteAdapter } from '../adapters/BetterSqliteAdapter';
import { runMigrations } from '../migrations/runner';
import { seedDev } from '../seed';

describe('schema relationships & constraints', () => {
    let db: BetterSqliteAdapter;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('enforces UNIQUE(tenant_id, class_id, roll_no) on students', async () => {
        const { tenantId, classIds } = await seedDev(db, { includeDemoData: true });
        const classId = classIds[0]!;
        await expect(
            db.runAsync(
                `INSERT INTO students
          (id, tenant_id, class_id, roll_no, full_name,
           created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?)`,
                ['dup-student', tenantId, classId, '01', 'Duplicate', 0, 0, 1, 'pending'],
            ),
        ).rejects.toThrow(/UNIQUE/);
    });

    it('enforces role CHECK constraint on users', async () => {
        const { tenantId } = await seedDev(db, { includeDemoData: true });
        await expect(
            db.runAsync(
                `INSERT INTO users
          (id, tenant_id, role, full_name,
           biometric_enrolled, status, created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                ['bad-role', tenantId, 'admin', 'Bad', 0, 'active', 0, 0, 1, 'pending'],
            ),
        ).rejects.toThrow(/CHECK/);
    });

    it('cascades student delete when its class is hard-deleted', async () => {
        const { classIds } = await seedDev(db, { includeDemoData: true });
        const classId = classIds[0]!;
        const before = await db.getFirstAsync<{ c: number }>(
            'SELECT COUNT(*) AS c FROM students WHERE class_id = ?',
            [classId],
        );
        expect(before?.c).toBe(5);

        await db.runAsync('DELETE FROM classes WHERE id = ?', [classId]);

        const after = await db.getFirstAsync<{ c: number }>(
            'SELECT COUNT(*) AS c FROM students WHERE class_id = ?',
            [classId],
        );
        expect(after?.c).toBe(0);
    });

    it('sets teacher_id to NULL on classes when a teacher user is deleted', async () => {
        const { teacherIds } = await seedDev(db, { includeDemoData: true });
        const teacherId = teacherIds[0]!;
        await db.runAsync('DELETE FROM users WHERE id = ?', [teacherId]);
        const rows = await db.getAllAsync<{ teacher_id: string | null }>(
            'SELECT teacher_id FROM classes WHERE teacher_id = ?',
            [teacherId],
        );
        expect(rows.length).toBe(0);
    });

    it('enforces UNIQUE(session_id, student_id) on attendance_records', async () => {
        const { studentIds, teacherIds, classIds } = await seedDev(db, { includeDemoData: true });
        const sessionId = 'sess-1';
        await db.runAsync(
            `INSERT INTO sessions
        (id, class_id, teacher_id, started_at, status,
         created_at, updated_at, version, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
            [sessionId, classIds[0]!, teacherIds[0]!, 0, 'open', 0, 0, 1, 'pending'],
        );
        const insertRecord = (id: string) =>
            db.runAsync(
                `INSERT INTO attendance_records
          (id, session_id, student_id, status, marked_at, marked_by, method,
           created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    sessionId,
                    studentIds[0]!,
                    'present',
                    0,
                    teacherIds[0]!,
                    'face',
                    0,
                    0,
                    1,
                    'pending',
                ],
            );
        await insertRecord('rec-1');
        await expect(insertRecord('rec-2')).rejects.toThrow(/UNIQUE/);
    });

    it('rejects invalid attendance status via CHECK constraint', async () => {
        const { studentIds, teacherIds, classIds } = await seedDev(db, { includeDemoData: true });
        await db.runAsync(
            `INSERT INTO sessions
        (id, class_id, teacher_id, started_at, status,
         created_at, updated_at, version, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
            ['sess-x', classIds[0]!, teacherIds[0]!, 0, 'open', 0, 0, 1, 'pending'],
        );
        await expect(
            db.runAsync(
                `INSERT INTO attendance_records
          (id, session_id, student_id, status, marked_at, marked_by, method,
           created_at, updated_at, version, sync_status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    'bad-status',
                    'sess-x',
                    studentIds[0]!,
                    'maybe',
                    0,
                    teacherIds[0]!,
                    'face',
                    0,
                    0,
                    1,
                    'pending',
                ],
            ),
        ).rejects.toThrow(/CHECK/);
    });
});
