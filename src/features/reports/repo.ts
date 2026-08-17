import type { SQLiteAdapter, SqlRow, SqlValue } from '@/core/storage/sqlite/adapter';
import { getDb } from '@/core/storage/sqlite/db';
import type {
    AttendanceOverviewStats,
    ClassAttendanceSummary,
    ReportFilter,
    StudentAttendanceSummary,
    WeeklyTrendPoint,
} from './types';

/**
 * Repository for offline attendance reports and analytics.
 * Computes on-device aggregations directly via SQLite queries over
 * `sessions`, `attendance_records`, `classes`, and `students` tables.
 */
export class ReportsRepo {
    constructor(private db: SQLiteAdapter) {}

    /**
     * Get overall school-wide attendance statistics.
     */
    async getOverviewStats(
        tenantId: string,
        filter?: ReportFilter,
    ): Promise<AttendanceOverviewStats> {
        const whereClauses = [`c.tenant_id = ?`, `s.deleted_at IS NULL`];
        const params: SqlValue[] = [tenantId];

        if (filter?.classId) {
            whereClauses.push(`s.class_id = ?`);
            params.push(filter.classId);
        }
        if (filter?.startDate) {
            const startMs = new Date(filter.startDate).getTime();
            whereClauses.push(`s.created_at >= ?`);
            params.push(startMs);
        }
        if (filter?.endDate) {
            const endMs = new Date(filter.endDate).getTime() + 86399999;
            whereClauses.push(`s.created_at <= ?`);
            params.push(endMs);
        }

        const whereSql = whereClauses.join(' AND ');

        const sql = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT c.id) as active_classes_count,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as total_late,
        COUNT(ar.id) as total_records
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.deleted_at IS NULL
      WHERE ${whereSql}
    `;

        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(sql, params);

        // Get total active students count
        const studentCountSql = filter?.classId
            ? `SELECT COUNT(*) as count FROM students WHERE tenant_id = ? AND class_id = ? AND deleted_at IS NULL`
            : `SELECT COUNT(*) as count FROM students WHERE tenant_id = ? AND deleted_at IS NULL`;
        const studentParams: SqlValue[] = filter?.classId ? [tenantId, filter.classId] : [tenantId];
        const studentRow = await this.db.getFirstAsync<Record<string, SqlValue>>(
            studentCountSql,
            studentParams,
        );

        const totalSessions = Number(row?.total_sessions ?? 0);
        const totalPresent = Number(row?.total_present ?? 0);
        const totalAbsent = Number(row?.total_absent ?? 0);
        const totalLate = Number(row?.total_late ?? 0);
        const totalRecords = Number(row?.total_records ?? 0);
        const activeClassesCount = Number(row?.active_classes_count ?? 0);
        const totalStudents = Number(studentRow?.count ?? 0);

        const overallAttendancePercentage =
            totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;

        return {
            totalSessions,
            totalStudents,
            totalPresent,
            totalAbsent,
            totalLate,
            overallAttendancePercentage,
            activeClassesCount,
        };
    }

    /**
     * Get attendance summaries per class.
     */
    async getClassSummaries(
        tenantId: string,
        filter?: ReportFilter,
    ): Promise<ClassAttendanceSummary[]> {
        const sessionConditions = [`s.deleted_at IS NULL`];
        const sessionParams: SqlValue[] = [];

        if (filter?.startDate) {
            sessionConditions.push(`s.created_at >= ?`);
            sessionParams.push(new Date(filter.startDate).getTime());
        }
        if (filter?.endDate) {
            sessionConditions.push(`s.created_at <= ?`);
            sessionParams.push(new Date(filter.endDate).getTime() + 86399999);
        }

        const sessionFilterSql = sessionConditions.join(' AND ');

        const sql = `
      SELECT
        c.id as class_id,
        c.name as class_name,
        c.grade,
        c.section,
        t.full_name as teacher_name,
        COUNT(DISTINCT s.id) as total_sessions,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = c.id AND st.deleted_at IS NULL) as total_students,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as total_late,
        COUNT(ar.id) as total_records
      FROM classes c
      LEFT JOIN users t ON c.teacher_id = t.id
      LEFT JOIN sessions s ON s.class_id = c.id AND ${sessionFilterSql}
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.deleted_at IS NULL
      WHERE c.tenant_id = ? AND c.deleted_at IS NULL
      ${filter?.classId ? 'AND c.id = ?' : ''}
      GROUP BY c.id
      ORDER BY c.grade ASC, c.section ASC
    `;

        const params: SqlValue[] = [...sessionParams, tenantId];
        if (filter?.classId) {
            params.push(filter.classId);
        }

        const rows = await this.db.getAllAsync<SqlRow>(sql, params);

        return rows.map((r) => {
            const totalRecords = Number(r.total_records ?? 0);
            const totalPresent = Number(r.total_present ?? 0);
            const totalLate = Number(r.total_late ?? 0);
            const percentage =
                totalRecords > 0
                    ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
                    : 0;

            return {
                classId: r.class_id as string,
                className: r.class_name as string,
                grade: (r.grade ?? '') as string,
                section: (r.section ?? '') as string,
                teacherName: (r.teacher_name ?? null) as string | null,
                totalSessions: Number(r.total_sessions ?? 0),
                totalStudents: Number(r.total_students ?? 0),
                totalPresent,
                totalAbsent: Number(r.total_absent ?? 0),
                totalLate,
                attendancePercentage: percentage,
            };
        });
    }

    /**
     * Get attendance summaries for students in a class or school-wide.
     */
    async getStudentSummaries(
        tenantId: string,
        classId?: string,
        filter?: ReportFilter,
    ): Promise<StudentAttendanceSummary[]> {
        const sessionConditions = [`s.deleted_at IS NULL`];
        const sessionParams: SqlValue[] = [];

        if (filter?.startDate) {
            sessionConditions.push(`s.created_at >= ?`);
            sessionParams.push(new Date(filter.startDate).getTime());
        }
        if (filter?.endDate) {
            sessionConditions.push(`s.created_at <= ?`);
            sessionParams.push(new Date(filter.endDate).getTime() + 86399999);
        }

        const whereClauses = [`st.tenant_id = ?`, `st.deleted_at IS NULL`];
        const whereParams: SqlValue[] = [tenantId];

        if (classId || filter?.classId) {
            whereClauses.push(`st.class_id = ?`);
            whereParams.push(classId || filter!.classId!);
        }

        const sessionFilterSql = sessionConditions.join(' AND ');
        const whereSql = whereClauses.join(' AND ');

        const sql = `
      SELECT
        st.id as student_id,
        st.roll_no,
        st.full_name,
        st.class_id,
        c.name as class_name,
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count,
        COUNT(ar.id) as total_records
      FROM students st
      JOIN classes c ON st.class_id = c.id
      LEFT JOIN sessions s ON s.class_id = c.id AND ${sessionFilterSql}
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.student_id = st.id AND ar.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY st.id
      ORDER BY CAST(st.roll_no AS INTEGER) ASC, st.full_name ASC
    `;

        const params: SqlValue[] = [...sessionParams, ...whereParams];
        const rows = await this.db.getAllAsync<SqlRow>(sql, params);

        return rows.map((r) => {
            const totalRecords = Number(r.total_records ?? 0);
            const presentCount = Number(r.present_count ?? 0);
            const lateCount = Number(r.late_count ?? 0);
            const percentage =
                totalRecords > 0
                    ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
                    : 0;

            return {
                studentId: r.student_id as string,
                rollNo: r.roll_no as string,
                fullName: r.full_name as string,
                classId: r.class_id as string,
                className: r.class_name as string,
                totalSessions: Number(r.total_sessions ?? 0),
                presentCount,
                absentCount: Number(r.absent_count ?? 0),
                lateCount,
                attendancePercentage: percentage,
                isLowAttendance: totalRecords > 0 && percentage < 75,
            };
        });
    }

    /**
     * Get daily trend points for weekly/monthly visual charts.
     */
    async getWeeklyTrend(
        tenantId: string,
        classId?: string,
        limitDays = 7,
    ): Promise<WeeklyTrendPoint[]> {
        const whereClauses = [`c.tenant_id = ?`, `s.deleted_at IS NULL`];
        const params: SqlValue[] = [tenantId];

        if (classId) {
            whereClauses.push(`s.class_id = ?`);
            params.push(classId);
        }

        const whereSql = whereClauses.join(' AND ');

        const sql = `
      SELECT
        DATE(s.created_at / 1000, 'unixepoch', 'localtime') as session_date,
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count,
        COUNT(ar.id) as total_records
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY session_date
      ORDER BY session_date DESC
      LIMIT ?
    `;

        params.push(limitDays);

        const rows = await this.db.getAllAsync<SqlRow>(sql, params);

        const rowMap = new Map<string, SqlRow>();
        for (const r of rows) {
            if (typeof r.session_date === 'string') {
                rowMap.set(r.session_date, r);
            }
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const points: WeeklyTrendPoint[] = [];

        const today = new Date();
        for (let i = limitDays - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const dayLabel = days[d.getDay()] || 'Day';

            const r = rowMap.get(dateStr);
            if (r) {
                const totalRecords = Number(r.total_records ?? 0);
                const presentCount = Number(r.present_count ?? 0);
                const lateCount = Number(r.late_count ?? 0);
                const percentage =
                    totalRecords > 0
                        ? Math.round(((presentCount + lateCount) / totalRecords) * 100)
                        : 0;

                points.push({
                    date: dateStr,
                    dayLabel,
                    totalSessions: Number(r.total_sessions ?? 0),
                    presentCount,
                    absentCount: Number(r.absent_count ?? 0),
                    lateCount,
                    attendancePercentage: percentage,
                });
            } else {
                points.push({
                    date: dateStr,
                    dayLabel,
                    totalSessions: 0,
                    presentCount: 0,
                    absentCount: 0,
                    lateCount: 0,
                    attendancePercentage: 0,
                });
            }
        }

        return points;
    }
}

/** Convenience factory used by hooks. */
export async function getReportsRepo(): Promise<ReportsRepo> {
    const db = await getDb();
    return new ReportsRepo(db);
}
