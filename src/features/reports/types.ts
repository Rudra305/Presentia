/**
 * Reports and Analytics domain types.
 */

export interface ReportFilter {
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    classId?: string;
}

export interface AttendanceOverviewStats {
    totalSessions: number;
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    overallAttendancePercentage: number;
    activeClassesCount: number;
}

export interface ClassAttendanceSummary {
    classId: string;
    className: string;
    grade: string;
    section: string;
    teacherName: string | null;
    totalSessions: number;
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
}

export interface StudentAttendanceSummary {
    studentId: string;
    rollNo: string;
    fullName: string;
    classId: string;
    className: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
    isLowAttendance: boolean; // < 75%
}

export interface WeeklyTrendPoint {
    date: string; // YYYY-MM-DD
    dayLabel: string; // e.g., "Mon", "Tue"
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
}
