import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import { seedDev } from '@/core/storage/sqlite/seed';
import { SessionRepo } from '@/features/sessions/repo';
import { ReportsRepo } from '../repo';

describe('ReportsRepo Unit Tests', () => {
    let db: BetterSqliteAdapter;
    let reportsRepo: ReportsRepo;
    let sessionRepo: SessionRepo;
    let tenantId: string;
    let teacherId: string;
    let classId: string;
    let studentIds: string[];

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const seed = await seedDev(db, { includeDemoData: true });
        tenantId = seed.tenantId;
        teacherId = seed.teacherIds[0]!;
        classId = seed.classIds[0]!;
        studentIds = seed.studentIds;

        reportsRepo = new ReportsRepo(db);
        sessionRepo = new SessionRepo(db);
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('returns overview stats accurately for closed sessions', async () => {
        // Initially empty stats
        const initialStats = await reportsRepo.getOverviewStats(tenantId);
        expect(initialStats.totalSessions).toBe(0);
        expect(initialStats.totalPresent).toBe(0);

        // Create and close a session
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Morning Attendance',
        });

        // Mark 1 student present explicitly
        await sessionRepo.markAttendance({
            sessionId: session.id,
            studentId: studentIds[0]!,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
        });

        // Closing session auto-marks remaining 4 un-scanned class students as absent
        await sessionRepo.closeSession(session.id, teacherId);

        const stats = await reportsRepo.getOverviewStats(tenantId);
        expect(stats.totalSessions).toBe(1);
        expect(stats.totalPresent).toBe(1);
        expect(stats.totalAbsent).toBe(4);
        expect(stats.overallAttendancePercentage).toBe(20); // 1 present out of 5 = 20%
    });

    it('calculates class summaries correctly', async () => {
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Period 1',
        });

        await sessionRepo.markAttendance({
            sessionId: session.id,
            studentId: studentIds[0]!,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
        });

        await sessionRepo.closeSession(session.id, teacherId);

        const summaries = await reportsRepo.getClassSummaries(tenantId);
        expect(summaries.length).toBeGreaterThan(0);

        const classSummary = summaries.find((s) => s.classId === classId);
        expect(classSummary).toBeDefined();
        expect(classSummary?.totalSessions).toBe(1);
        expect(classSummary?.totalPresent).toBe(1);
    });

    it('computes student summaries and flags low attendance (< 75%)', async () => {
        // Mark student 0 present in 2 sessions, student 1 absent in 2 sessions
        const s1 = await sessionRepo.createSession({ classId, teacherId, periodLabel: 'Day 1' });
        await sessionRepo.markAttendance({
            sessionId: s1.id,
            studentId: studentIds[0]!,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
        });
        await sessionRepo.closeSession(s1.id, teacherId);

        const s2 = await sessionRepo.createSession({ classId, teacherId, periodLabel: 'Day 2' });
        await sessionRepo.markAttendance({
            sessionId: s2.id,
            studentId: studentIds[0]!,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
        });
        await sessionRepo.closeSession(s2.id, teacherId);

        const studentSummaries = await reportsRepo.getStudentSummaries(tenantId, classId);

        const st1 = studentSummaries.find((s) => s.studentId === studentIds[0]!);
        const st2 = studentSummaries.find((s) => s.studentId === studentIds[1]!);

        expect(st1?.attendancePercentage).toBe(100);
        expect(st1?.isLowAttendance).toBe(false);

        expect(st2?.attendancePercentage).toBe(0);
        expect(st2?.isLowAttendance).toBe(true); // < 75%
    });

    it('fetches weekly trend points', async () => {
        const session = await sessionRepo.createSession({
            classId,
            teacherId,
            periodLabel: 'Day 1',
        });
        await sessionRepo.markAttendance({
            sessionId: session.id,
            studentId: studentIds[0]!,
            status: 'present',
            markedBy: teacherId,
            method: 'face',
        });
        await sessionRepo.closeSession(session.id, teacherId);

        const trend = await reportsRepo.getWeeklyTrend(tenantId);
        expect(trend.length).toBe(7);
        const todayPoint = trend.find((p) => p.totalSessions > 0) ?? trend[trend.length - 1]!;
        expect(todayPoint.totalSessions).toBeGreaterThan(0);
        expect(todayPoint.attendancePercentage).toBe(20);
    });
});
