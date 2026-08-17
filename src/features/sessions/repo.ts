import type { SqlValue } from '@/core/storage/sqlite';
import { BaseRepository, getDb, nowEpochMs, uuid } from '@/core/storage/sqlite';
import type {
    AttendanceRecordEntity,
    CreateSessionPayload,
    MarkAttendancePayload,
    SessionEntity,
    SessionWithDetails,
    StudentAttendanceItem,
} from './types';

export class SessionRepo extends BaseRepository<SessionEntity> {
    protected get tableName(): string {
        return 'sessions';
    }

    protected toRow(e: SessionEntity): Record<string, SqlValue> {
        return {
            id: e.id,
            class_id: e.classId,
            teacher_id: e.teacherId,
            period_label: e.periodLabel,
            started_at: e.startedAt,
            ended_at: e.endedAt,
            status: e.status,
            created_at: e.createdAt,
            updated_at: e.updatedAt,
            version: e.version,
            deleted_at: e.deletedAt,
            sync_status: e.syncStatus,
            remote_id: e.remoteId,
            last_synced_at: e.lastSyncedAt,
        };
    }

    protected fromRow(row: Record<string, SqlValue>): SessionEntity {
        return {
            id: row.id as string,
            classId: row.class_id as string,
            teacherId: row.teacher_id as string,
            periodLabel: (row.period_label ?? null) as string | null,
            startedAt: row.started_at as number,
            endedAt: (row.ended_at ?? null) as number | null,
            status: row.status as SessionEntity['status'],
            createdAt: row.created_at as number,
            updatedAt: row.updated_at as number,
            version: row.version as number,
            deletedAt: (row.deleted_at ?? null) as number | null,
            syncStatus: row.sync_status as SessionEntity['syncStatus'],
            remoteId: (row.remote_id ?? null) as string | null,
            lastSyncedAt: (row.last_synced_at ?? null) as number | null,
        };
    }

    /**
     * Start a new attendance session for a class.
     */
    async createSession(payload: CreateSessionPayload): Promise<SessionEntity> {
        const id = uuid();
        const now = nowEpochMs();

        let effectiveTeacherId = payload.teacherId;
        if (effectiveTeacherId) {
            const exists = await this.db.getFirstAsync<{ id: string }>(
                'SELECT id FROM users WHERE id = ?',
                [effectiveTeacherId],
            );
            if (!exists) effectiveTeacherId = '';
        }

        if (!effectiveTeacherId) {
            // Find class teacher or fallback to any active user
            const cls = await this.db.getFirstAsync<{ teacher_id: string }>(
                'SELECT teacher_id FROM classes WHERE id = ?',
                [payload.classId],
            );
            if (cls?.teacher_id) {
                effectiveTeacherId = cls.teacher_id;
            } else {
                const user = await this.db.getFirstAsync<{ id: string }>(
                    "SELECT id FROM users WHERE role IN ('teacher', 'principal') LIMIT 1",
                );
                if (user) effectiveTeacherId = user.id;
            }
        }

        if (!effectiveTeacherId) {
            throw new Error('No valid teacher account found to associate with this session.');
        }

        const entity: SessionEntity = {
            id,
            classId: payload.classId,
            teacherId: effectiveTeacherId,
            periodLabel: payload.periodLabel?.trim() || null,
            startedAt: now,
            endedAt: null,
            status: 'open',
            createdAt: now,
            updatedAt: now,
            version: 1,
            deletedAt: null,
            syncStatus: 'pending',
            remoteId: null,
            lastSyncedAt: null,
        };

        return this.insert(entity);
    }

    /**
     * Check if there's an ongoing open session for a teacher/class.
     */
    async getActiveSession(
        teacherId: string,
        classId?: string,
    ): Promise<SessionWithDetails | null> {
        const params: SqlValue[] = [];
        let teacherClause = '';
        if (teacherId) {
            teacherClause = 's.teacher_id = ? AND ';
            params.push(teacherId);
        }
        let classClause = '';
        if (classId) {
            classClause = 'AND s.class_id = ?';
            params.push(classId);
        }

        const sql = `
      SELECT 
        s.*,
        c.name as class_name,
        c.grade as class_grade,
        c.section as class_section,
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = s.class_id AND st.deleted_at IS NULL) as total_students,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present' AND ar.deleted_at IS NULL) as present_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'absent' AND ar.deleted_at IS NULL) as absent_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'late' AND ar.deleted_at IS NULL) as late_count
      FROM sessions s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE ${teacherClause}s.status = 'open' AND s.deleted_at IS NULL ${classClause}
      ORDER BY s.started_at DESC
      LIMIT 1;
    `;

        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(sql, params);
        if (!row) return null;

        return {
            ...this.fromRow(row),
            className: (row.class_name ?? null) as string | null,
            classGrade: (row.class_grade ?? null) as string | null,
            classSection: (row.class_section ?? null) as string | null,
            teacherName: (row.teacher_name ?? null) as string | null,
            totalStudents: Number(row.total_students ?? 0),
            presentCount: Number(row.present_count ?? 0),
            absentCount: Number(row.absent_count ?? 0),
            lateCount: Number(row.late_count ?? 0),
        };
    }

    /**
     * Fetch single session details by ID.
     */
    async getSessionWithDetails(sessionId: string): Promise<SessionWithDetails | null> {
        const sql = `
      SELECT 
        s.*,
        c.name as class_name,
        c.grade as class_grade,
        c.section as class_section,
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = s.class_id AND st.deleted_at IS NULL) as total_students,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present' AND ar.deleted_at IS NULL) as present_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'absent' AND ar.deleted_at IS NULL) as absent_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'late' AND ar.deleted_at IS NULL) as late_count
      FROM sessions s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.id = ? AND s.deleted_at IS NULL;
    `;

        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(sql, [sessionId]);
        if (!row) return null;

        return {
            ...this.fromRow(row),
            className: (row.class_name ?? null) as string | null,
            classGrade: (row.class_grade ?? null) as string | null,
            classSection: (row.class_section ?? null) as string | null,
            teacherName: (row.teacher_name ?? null) as string | null,
            totalStudents: Number(row.total_students ?? 0),
            presentCount: Number(row.present_count ?? 0),
            absentCount: Number(row.absent_count ?? 0),
            lateCount: Number(row.late_count ?? 0),
        };
    }

    /**
     * Upsert attendance record idempotently for a student in a session.
     */
    async markAttendance(payload: MarkAttendancePayload): Promise<AttendanceRecordEntity> {
        const now = nowEpochMs();

        let effectiveMarkedBy = payload.markedBy;
        if (effectiveMarkedBy) {
            const exists = await this.db.getFirstAsync<{ id: string }>(
                'SELECT id FROM users WHERE id = ?',
                [effectiveMarkedBy],
            );
            if (!exists) effectiveMarkedBy = '';
        }

        if (!effectiveMarkedBy) {
            const session = await this.db.getFirstAsync<{ teacher_id: string }>(
                'SELECT teacher_id FROM sessions WHERE id = ?',
                [payload.sessionId],
            );
            if (session?.teacher_id) {
                effectiveMarkedBy = session.teacher_id;
            } else {
                const user = await this.db.getFirstAsync<{ id: string }>(
                    "SELECT id FROM users WHERE role IN ('teacher', 'principal') LIMIT 1",
                );
                if (user) effectiveMarkedBy = user.id;
            }
        }

        // Check existing record
        const findSql = `SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ? AND deleted_at IS NULL`;
        const existing = await this.db.getFirstAsync<Record<string, SqlValue>>(findSql, [
            payload.sessionId,
            payload.studentId,
        ]);

        let recId = existing ? (existing.id as string) : uuid();
        let version = existing ? Number(existing.version ?? 1) + 1 : 1;

        const sql = `
      INSERT INTO attendance_records 
      (id, session_id, student_id, status, marked_at, marked_by, method, confidence, created_at, updated_at, version, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = excluded.status,
        marked_at = excluded.marked_at,
        marked_by = excluded.marked_by,
        method = excluded.method,
        confidence = excluded.confidence,
        updated_at = excluded.updated_at,
        version = attendance_records.version + 1,
        sync_status = 'pending';
    `;

        await this.db.runAsync(sql, [
            recId,
            payload.sessionId,
            payload.studentId,
            payload.status,
            now,
            effectiveMarkedBy,
            payload.method,
            payload.confidence ?? null,
            now,
            now,
            version,
        ]);

        await this.enqueueSync(recId, existing ? 'update' : 'create', {
            id: recId,
            sessionId: payload.sessionId,
            studentId: payload.studentId,
            status: payload.status,
            markedBy: payload.markedBy,
            method: payload.method,
            confidence: payload.confidence ?? null,
        });

        return {
            id: recId,
            sessionId: payload.sessionId,
            studentId: payload.studentId,
            status: payload.status,
            markedAt: now,
            markedBy: payload.markedBy,
            method: payload.method,
            confidence: payload.confidence ?? null,
            createdAt: now,
            updatedAt: now,
            version,
            deletedAt: null,
            syncStatus: 'pending',
            remoteId: null,
            lastSyncedAt: null,
        };
    }

    /**
     * Fetch all class students for a session along with their live attendance status.
     */
    async listClassAttendance(sessionId: string): Promise<StudentAttendanceItem[]> {
        const session = await this.findById(sessionId);
        if (!session) return [];

        const sql = `
      SELECT 
        st.id as student_id,
        st.roll_no,
        st.full_name,
        st.photo_uri,
        ar.id as attendance_id,
        COALESCE(ar.status, 'absent') as status,
        ar.method,
        ar.confidence,
        ar.marked_at,
        (SELECT COUNT(*) FROM face_embeddings fe WHERE fe.student_id = st.id) as sample_count
      FROM students st
      LEFT JOIN attendance_records ar ON ar.student_id = st.id AND ar.session_id = ? AND ar.deleted_at IS NULL
      WHERE st.class_id = ? AND st.deleted_at IS NULL
      ORDER BY CAST(st.roll_no AS INTEGER) ASC, st.roll_no ASC, st.full_name ASC;
    `;

        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [
            sessionId,
            session.classId,
        ]);

        return rows.map((r) => ({
            studentId: r.student_id as string,
            rollNo: r.roll_no as string,
            fullName: r.full_name as string,
            photoUri: (r.photo_uri ?? null) as string | null,
            attendanceId: (r.attendance_id ?? null) as string | null,
            status: r.status as StudentAttendanceItem['status'],
            method: (r.method ?? null) as StudentAttendanceItem['method'],
            confidence: (r.confidence ?? null) as number | null,
            markedAt: (r.marked_at ?? null) as number | null,
            hasEmbedding: Number(r.sample_count ?? 0) >= 3,
        }));
    }

    /**
     * Close a session and mark any un-scanned students as 'absent'.
     */
    async closeSession(sessionId: string, teacherId: string): Promise<void> {
        const now = nowEpochMs();
        const session = await this.findById(sessionId);
        if (!session) throw new Error('Session not found');

        let effectiveTeacherId = teacherId;
        if (effectiveTeacherId) {
            const exists = await this.db.getFirstAsync<{ id: string }>(
                'SELECT id FROM users WHERE id = ?',
                [effectiveTeacherId],
            );
            if (!exists) effectiveTeacherId = '';
        }
        if (!effectiveTeacherId) {
            effectiveTeacherId = session.teacherId;
        }

        await this.db.withTransactionAsync(async () => {
            // 1. Mark un-scanned students as 'absent'
            const unScannedSql = `
        SELECT st.id FROM students st
        LEFT JOIN attendance_records ar ON ar.student_id = st.id AND ar.session_id = ? AND ar.deleted_at IS NULL
        WHERE st.class_id = ? AND st.deleted_at IS NULL AND ar.id IS NULL;
      `;
            const unScannedRows = await this.db.getAllAsync<{ id: string }>(unScannedSql, [
                sessionId,
                session.classId,
            ]);

            for (const st of unScannedRows) {
                const recId = uuid();
                const insertAbs = `
          INSERT INTO attendance_records 
          (id, session_id, student_id, status, marked_at, marked_by, method, confidence, created_at, updated_at, version, sync_status)
          VALUES (?, ?, ?, 'absent', ?, ?, 'manual', NULL, ?, ?, 1, 'pending');
        `;
                await this.db.runAsync(insertAbs, [
                    recId,
                    sessionId,
                    st.id,
                    now,
                    effectiveTeacherId,
                    now,
                    now,
                ]);
            }

            // 2. Update session status
            const closeSql = `
        UPDATE sessions 
        SET status = 'closed', ended_at = ?, updated_at = ?, version = version + 1, sync_status = 'pending'
        WHERE id = ?;
      `;
            await this.db.runAsync(closeSql, [now, now, sessionId]);
        });
    }

    /**
     * List recent sessions for a teacher.
     */
    async listRecentSessions(teacherId: string, limit = 20): Promise<SessionWithDetails[]> {
        const params: SqlValue[] = [];
        let teacherClause = '';
        if (teacherId) {
            const user = await this.db.getFirstAsync<{ role: string }>(
                'SELECT role FROM users WHERE id = ?',
                [teacherId],
            );
            if (user && user.role !== 'principal') {
                teacherClause = 's.teacher_id = ? AND ';
                params.push(teacherId);
            }
        }
        params.push(limit);

        const sql = `
      SELECT 
        s.*,
        c.name as class_name,
        c.grade as class_grade,
        c.section as class_section,
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = s.class_id AND st.deleted_at IS NULL) as total_students,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present' AND ar.deleted_at IS NULL) as present_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'absent' AND ar.deleted_at IS NULL) as absent_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'late' AND ar.deleted_at IS NULL) as late_count
      FROM sessions s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE ${teacherClause}s.deleted_at IS NULL
      ORDER BY s.started_at DESC
      LIMIT ?;
    `;

        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, params);
        return rows.map((row) => ({
            ...this.fromRow(row),
            className: (row.class_name ?? null) as string | null,
            classGrade: (row.class_grade ?? null) as string | null,
            classSection: (row.class_section ?? null) as string | null,
            teacherName: (row.teacher_name ?? null) as string | null,
            totalStudents: Number(row.total_students ?? 0),
            presentCount: Number(row.present_count ?? 0),
            absentCount: Number(row.absent_count ?? 0),
            lateCount: Number(row.late_count ?? 0),
        }));
    }
}

export async function getSessionRepo(): Promise<SessionRepo> {
    const db = await getDb();
    return new SessionRepo(db);
}
