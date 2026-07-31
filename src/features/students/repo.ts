import type { SqlValue } from '@/core/storage/sqlite';
import { BaseRepository, getDb, nowEpochMs, uuid } from '@/core/storage/sqlite';
import type {
    CreateStudentPayload,
    FaceEmbeddingEntity,
    StudentEntity,
    StudentWithDetails,
} from './types';

export function float32ArrayToUint8Array(floatArray: Float32Array): Uint8Array {
    return new Uint8Array(floatArray.buffer, floatArray.byteOffset, floatArray.byteLength);
}

export function uint8ArrayToFloat32Array(bytes: Uint8Array): Float32Array {
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return new Float32Array(arrayBuffer);
}

export class StudentRepo extends BaseRepository<StudentEntity> {
    protected get tableName(): string {
        return 'students';
    }

    protected toRow(e: StudentEntity): Record<string, SqlValue> {
        return {
            id: e.id,
            tenant_id: e.tenantId,
            class_id: e.classId,
            roll_no: e.rollNo,
            full_name: e.fullName,
            photo_uri: e.photoUri,
            created_at: e.createdAt,
            updated_at: e.updatedAt,
            version: e.version,
            deleted_at: e.deletedAt,
            sync_status: e.syncStatus,
            remote_id: e.remoteId,
            last_synced_at: e.lastSyncedAt,
        };
    }

    protected fromRow(row: Record<string, SqlValue>): StudentEntity {
        return {
            id: row.id as string,
            tenantId: row.tenant_id as string,
            classId: row.class_id as string,
            rollNo: row.roll_no as string,
            fullName: row.full_name as string,
            photoUri: (row.photo_uri ?? null) as string | null,
            createdAt: row.created_at as number,
            updatedAt: row.updated_at as number,
            version: row.version as number,
            deletedAt: (row.deleted_at ?? null) as number | null,
            syncStatus: row.sync_status as StudentEntity['syncStatus'],
            remoteId: (row.remote_id ?? null) as string | null,
            lastSyncedAt: (row.last_synced_at ?? null) as number | null,
        };
    }

    /**
     * List all active students for a tenant with class info and face sample counts.
     */
    async listWithDetails(tenantId: string, classId?: string): Promise<StudentWithDetails[]> {
        const params: SqlValue[] = [tenantId];
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
        COUNT(fe.id) as sample_count
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN face_embeddings fe ON fe.student_id = s.id
      WHERE s.tenant_id = ? AND s.deleted_at IS NULL ${classClause}
      GROUP BY s.id
      ORDER BY CAST(s.roll_no AS INTEGER) ASC, s.roll_no ASC, s.full_name ASC;
    `;

        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, params);
        return rows.map((r) => {
            const sampleCount = Number(r.sample_count ?? 0);
            return {
                ...this.fromRow(r),
                className: (r.class_name ?? null) as string | null,
                classGrade: (r.class_grade ?? null) as string | null,
                classSection: (r.class_section ?? null) as string | null,
                sampleCount,
                isEnrolled: sampleCount >= 3,
            };
        });
    }

    /**
     * Filter/search active students by roll number or name.
     */
    async search(tenantId: string, query: string, classId?: string): Promise<StudentWithDetails[]> {
        const q = `%${query.trim().toLowerCase()}%`;
        const params: SqlValue[] = [tenantId, q, q];
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
        COUNT(fe.id) as sample_count
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN face_embeddings fe ON fe.student_id = s.id
      WHERE s.tenant_id = ? AND s.deleted_at IS NULL
        AND (LOWER(s.full_name) LIKE ? OR LOWER(s.roll_no) LIKE ?)
        ${classClause}
      GROUP BY s.id
      ORDER BY CAST(s.roll_no AS INTEGER) ASC, s.roll_no ASC;
    `;

        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, params);
        return rows.map((r) => {
            const sampleCount = Number(r.sample_count ?? 0);
            return {
                ...this.fromRow(r),
                className: (r.class_name ?? null) as string | null,
                classGrade: (r.class_grade ?? null) as string | null,
                classSection: (r.class_section ?? null) as string | null,
                sampleCount,
                isEnrolled: sampleCount >= 3,
            };
        });
    }

    /**
     * Check if a roll number is unique within a tenant + class.
     */
    async checkRollNoUnique(
        tenantId: string,
        classId: string,
        rollNo: string,
        excludeStudentId?: string,
    ): Promise<boolean> {
        const params: SqlValue[] = [tenantId, classId, rollNo.trim().toLowerCase()];
        let excludeClause = '';
        if (excludeStudentId) {
            excludeClause = 'AND id != ?';
            params.push(excludeStudentId);
        }

        const sql = `
      SELECT COUNT(*) as c FROM students 
      WHERE tenant_id = ? AND class_id = ? AND LOWER(roll_no) = ? AND deleted_at IS NULL ${excludeClause}
    `;
        const row = await this.db.getFirstAsync<{ c: number }>(sql, params);
        return (row?.c ?? 0) === 0;
    }

    /**
     * Computes next auto-incremented sequential roll number for a class (e.g. 1, 2, 3...).
     */
    async getNextRollNo(tenantId: string, classId: string): Promise<string> {
        if (!classId) return '1';
        const sql = `
      SELECT roll_no FROM students 
      WHERE tenant_id = ? AND class_id = ? AND deleted_at IS NULL
    `;
        const rows = await this.db.getAllAsync<{ roll_no: string }>(sql, [tenantId, classId]);

        let maxNumeric = 0;
        for (const r of rows) {
            const num = parseInt(r.roll_no, 10);
            if (!isNaN(num) && num > maxNumeric) {
                maxNumeric = num;
            }
        }
        return String(maxNumeric + 1);
    }

    /**
     * Transactionally enroll a student and insert their face embedding vectors.
     */
    async createWithEmbeddings(payload: CreateStudentPayload): Promise<StudentWithDetails> {
        const isUnique = await this.checkRollNoUnique(
            payload.tenantId,
            payload.classId,
            payload.rollNo,
        );
        if (!isUnique) {
            throw new Error(`Roll number "${payload.rollNo}" already exists in this class.`);
        }

        const studentId = uuid();
        const now = nowEpochMs();

        let createdStudent!: StudentEntity;

        await this.db.withTransactionAsync(async () => {
            // 1. Insert Student
            createdStudent = await this.insert({
                id: studentId,
                tenantId: payload.tenantId,
                classId: payload.classId,
                rollNo: payload.rollNo.trim(),
                fullName: payload.fullName.trim(),
                photoUri: payload.photoUri ?? null,
            });

            // 2. Insert Face Embeddings
            for (const emb of payload.embeddings) {
                const embId = uuid();
                const vectorBytes = float32ArrayToUint8Array(emb.vector);
                const capturedAt = emb.capturedAt ?? now;

                const sql = `
          INSERT INTO face_embeddings 
          (id, student_id, vector, dim, model_version, quality, captured_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
                await this.db.runAsync(sql, [
                    embId,
                    studentId,
                    vectorBytes,
                    emb.dim,
                    emb.modelVersion,
                    emb.quality,
                    capturedAt,
                    now,
                ]);
            }
        });

        const result = (await this.getWithDetails(studentId)) ?? {
            ...createdStudent,
            className: null,
            classGrade: null,
            classSection: null,
            sampleCount: payload.embeddings.length,
            isEnrolled: payload.embeddings.length >= 3,
        };

        return result;
    }

    /**
     * Get single student by ID with class info & sample count.
     */
    async getWithDetails(id: string): Promise<StudentWithDetails | null> {
        const sql = `
      SELECT 
        s.*,
        c.name as class_name,
        c.grade as class_grade,
        c.section as class_section,
        COUNT(fe.id) as sample_count
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN face_embeddings fe ON fe.student_id = s.id
      WHERE s.id = ? AND s.deleted_at IS NULL
      GROUP BY s.id;
    `;
        const row = await this.db.getFirstAsync<Record<string, SqlValue>>(sql, [id]);
        if (!row) return null;

        const sampleCount = Number(row.sample_count ?? 0);
        return {
            ...this.fromRow(row),
            className: (row.class_name ?? null) as string | null,
            classGrade: (row.class_grade ?? null) as string | null,
            classSection: (row.class_section ?? null) as string | null,
            sampleCount,
            isEnrolled: sampleCount >= 3,
        };
    }

    /**
     * Get all stored face embedding vectors for a student.
     */
    async getEmbeddingsForStudent(studentId: string): Promise<FaceEmbeddingEntity[]> {
        const sql = `SELECT * FROM face_embeddings WHERE student_id = ? ORDER BY captured_at ASC`;
        const rows = await this.db.getAllAsync<Record<string, SqlValue>>(sql, [studentId]);

        return rows.map((r) => {
            const rawVector = r.vector as Uint8Array;
            return {
                id: r.id as string,
                studentId: r.student_id as string,
                vector: uint8ArrayToFloat32Array(rawVector),
                dim: r.dim as number,
                modelVersion: r.model_version as string,
                quality: r.quality as number,
                capturedAt: r.captured_at as number,
                createdAt: r.created_at as number,
            };
        });
    }
}

/** Singleton instance getter for StudentRepo. */
export async function getStudentRepo(): Promise<StudentRepo> {
    const db = await getDb();
    return new StudentRepo(db);
}
