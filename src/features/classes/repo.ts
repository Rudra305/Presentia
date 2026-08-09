import type { BaseEntity, SqlValue } from '@/core/storage/sqlite';
import { BaseRepository, getDb } from '@/core/storage/sqlite';

/** Domain entity for a Class record. */
export interface ClassEntity extends BaseEntity {
    tenantId: string;
    name: string;
    grade: string | null;
    section: string | null;
    teacherId: string | null;
}

/** Enriched Class entity with assigned teacher info & student count. */
export interface ClassWithDetails extends ClassEntity {
    teacherName: string | null;
    teacherEmail: string | null;
    studentCount: number;
}

export class ClassRepo extends BaseRepository<ClassEntity> {
    protected get tableName(): string {
        return 'classes';
    }

    protected toRow(e: ClassEntity): Record<string, SqlValue> {
        return {
            id: e.id,
            tenant_id: e.tenantId,
            name: e.name,
            grade: e.grade,
            section: e.section,
            teacher_id: e.teacherId,
            created_at: e.createdAt,
            updated_at: e.updatedAt,
            version: e.version,
            deleted_at: e.deletedAt,
            sync_status: e.syncStatus,
            remote_id: e.remoteId,
            last_synced_at: e.lastSyncedAt,
        };
    }

    protected fromRow(row: Record<string, SqlValue>): ClassEntity {
        return {
            id: row.id as string,
            tenantId: row.tenant_id as string,
            name: row.name as string,
            grade: (row.grade ?? null) as string | null,
            section: (row.section ?? null) as string | null,
            teacherId: (row.teacher_id ?? null) as string | null,
            createdAt: row.created_at as number,
            updatedAt: row.updated_at as number,
            version: row.version as number,
            deletedAt: (row.deleted_at ?? null) as number | null,
            syncStatus: row.sync_status as ClassEntity['syncStatus'],
            remoteId: (row.remote_id ?? null) as string | null,
            lastSyncedAt: (row.last_synced_at ?? null) as number | null,
        };
    }

    /** All active classes for a tenant, joined with teacher name and student count. */
    async listWithDetails(tenantId: string): Promise<ClassWithDetails[]> {
        const sql = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        u.email as teacher_email,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.deleted_at IS NULL
      LEFT JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
      WHERE c.tenant_id = ? AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE ASC;
    `;
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [tenantId]);
        return rows.map((r) => ({
            ...this.fromRow(r),
            teacherName: (r.teacher_name ?? null) as string | null,
            teacherEmail: (r.teacher_email ?? null) as string | null,
            studentCount: Number(r.student_count ?? 0),
        }));
    }

    /** Case-insensitive search by name, grade, or section. */
    async search(tenantId: string, query: string): Promise<ClassWithDetails[]> {
        const q = `%${query.trim().toLowerCase()}%`;
        const sql = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        u.email as teacher_email,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.deleted_at IS NULL
      LEFT JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
      WHERE c.tenant_id = ? AND c.deleted_at IS NULL
        AND (LOWER(c.name) LIKE ? OR LOWER(IFNULL(c.grade,'')) LIKE ? OR LOWER(IFNULL(c.section,'')) LIKE ?)
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE ASC
      LIMIT 100;
    `;
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [tenantId, q, q, q]);
        return rows.map((r) => ({
            ...this.fromRow(r),
            teacherName: (r.teacher_name ?? null) as string | null,
            teacherEmail: (r.teacher_email ?? null) as string | null,
            studentCount: Number(r.student_count ?? 0),
        }));
    }

    /** Find class by ID with teacher details and student count. */
    async findByIdWithDetails(id: string): Promise<ClassWithDetails | null> {
        const sql = `
      SELECT 
        c.*,
        u.full_name as teacher_name,
        u.email as teacher_email,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.deleted_at IS NULL
      LEFT JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
      WHERE c.id = ? AND c.deleted_at IS NULL
      GROUP BY c.id;
    `;
        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(sql, [id]);
        if (!row) return null;
        return {
            ...this.fromRow(row),
            teacherName: (row.teacher_name ?? null) as string | null,
            teacherEmail: (row.teacher_email ?? null) as string | null,
            studentCount: Number(row.student_count ?? 0),
        };
    }

    /** Assign or unassign teacher for a class. */
    async assignTeacher(classId: string, teacherId: string | null): Promise<void> {
        await this.update(classId, { teacherId });
    }

    /** Find all classes assigned to a specific teacher. */
    async listByTeacher(teacherId: string): Promise<ClassEntity[]> {
        const sql = `SELECT * FROM classes WHERE teacher_id = ? AND deleted_at IS NULL ORDER BY name ASC;`;
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [teacherId]);
        return rows.map((r) => this.fromRow(r));
    }
}

/** Convenience factory for ClassRepo. */
export async function getClassRepo(): Promise<ClassRepo> {
    const db = await getDb();
    return new ClassRepo(db);
}
