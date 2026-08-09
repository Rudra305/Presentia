export type SessionStatus = 'open' | 'closed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMethod = 'face' | 'manual' | 'override';

export interface SessionEntity {
    id: string;
    classId: string;
    teacherId: string;
    periodLabel: string | null;
    startedAt: number;
    endedAt: number | null;
    status: SessionStatus;
    createdAt: number;
    updatedAt: number;
    version: number;
    deletedAt: number | null;
    syncStatus: 'pending' | 'synced' | 'conflict';
    remoteId: string | null;
    lastSyncedAt: number | null;
}

export interface AttendanceRecordEntity {
    id: string;
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    markedAt: number;
    markedBy: string;
    method: AttendanceMethod;
    confidence: number | null;
    createdAt: number;
    updatedAt: number;
    version: number;
    deletedAt: number | null;
    syncStatus: 'pending' | 'synced' | 'conflict';
    remoteId: string | null;
    lastSyncedAt: number | null;
}

export interface CreateSessionPayload {
    classId: string;
    teacherId: string;
    periodLabel?: string;
}

export interface MarkAttendancePayload {
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    markedBy: string;
    method: AttendanceMethod;
    confidence?: number;
}

export interface SessionWithDetails extends SessionEntity {
    className: string | null;
    classGrade: string | null;
    classSection: string | null;
    teacherName: string | null;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
}

export interface StudentAttendanceItem {
    studentId: string;
    rollNo: string;
    fullName: string;
    photoUri: string | null;
    attendanceId: string | null;
    status: AttendanceStatus;
    method: AttendanceMethod | null;
    confidence: number | null;
    markedAt: number | null;
    hasEmbedding: boolean;
}
