import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import { seedDev } from '@/core/storage/sqlite/seed';
import { SessionRepo } from '../repo';

describe('SessionRepo Unit Tests', () => {
    let db: BetterSqliteAdapter;
    let sessionRepo: SessionRepo;
    let teacherId: string;
    let classId: string;
    let studentId: string;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const seed = await seedDev(db);
        teacherId = seed.teacherIds[0]!;
        classId = seed.classIds[0]!;
        studentId = seed.studentIds[0]!;
        sessionRepo = new SessionRepo(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('creates and retrieves a new attendance session', async () => {
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Period 1 - Mathematics',
        });

        expect(session.id).toBeDefined();
        expect(session.status).toBe('open');
        expect(session.periodLabel).toBe('Period 1 - Mathematics');

        const active = await sessionRepo.getActiveSession(teacherId);
        expect(active).not.toBeNull();
        expect(active?.id).toBe(session.id);
    });

    it('marks attendance idempotently for a student', async () => {
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Period 2 - Science',
        });

        const rec1 = await sessionRepo.markAttendance({
            sessionId: session.id,
            studentId,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
            confidence: 0.94,
        });

        expect(rec1.status).toBe('present');
        expect(rec1.method).toBe('face');

        // Override to 'late'
        const rec2 = await sessionRepo.markAttendance({
            sessionId: session.id,
            studentId,
            status: 'late',
            markedBy: teacherId,
            method: 'override',
        });

        expect(rec2.id).toBe(rec1.id);
        expect(rec2.status).toBe('late');
        expect(rec2.method).toBe('override');
    });

    it('closes a session and updates ended_at', async () => {
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Period 3 - History',
        });

        await sessionRepo.closeSession(session.id, teacherId);

        const closed = await sessionRepo.findById(session.id);
        expect(closed?.status).toBe('closed');
        expect(closed?.endedAt).not.toBeNull();

        const active = await sessionRepo.getActiveSession(teacherId);
        expect(active?.id).not.toBe(session.id);
    });
});
