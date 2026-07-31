import type { BaseEntity } from '@/core/storage/sqlite';

/** Domain entity for a Student record. */
export interface StudentEntity extends BaseEntity {
    tenantId: string;
    classId: string;
    rollNo: string;
    fullName: string;
    photoUri: string | null;
}

/** Face Embedding stored record. */
export interface FaceEmbeddingEntity {
    id: string;
    studentId: string;
    vector: Float32Array;
    dim: number;
    modelVersion: string;
    quality: number;
    capturedAt: number;
    createdAt: number;
}

/** Enriched Student record with class name and face sample count. */
export interface StudentWithDetails extends StudentEntity {
    className: string | null;
    classGrade: string | null;
    classSection: string | null;
    sampleCount: number;
    isEnrolled: boolean;
}

/** Payload for enrolling a new student with face sample vectors. */
export interface CreateStudentPayload {
    tenantId: string;
    classId: string;
    rollNo: string;
    fullName: string;
    photoUri?: string | null;
    embeddings: {
        vector: Float32Array;
        dim: number;
        modelVersion: string;
        quality: number;
        capturedAt?: number;
    }[];
}
