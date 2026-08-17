import { cosineSimilarity } from './stub';

export interface StudentEmbeddingVector {
    studentId: string;
    rollNo: string;
    fullName: string;
    vector: Float32Array;
}

export type MatchStatus = 'matched' | 'candidate' | 'unmatched';

export interface FaceMatchResult {
    status: MatchStatus;
    confidence: number;
    studentId?: string;
    fullName?: string;
    rollNo?: string;
}

/**
 * Compares a live face embedding against enrolled student face vectors.
 * - Similarity >= 0.85 -> 'matched' (High confidence auto-mark)
 * - Similarity 0.72 - 0.84 -> 'candidate' (Suggestion prompt)
 * - Similarity < 0.72 -> 'unmatched'
 */
export function matchFace(
    liveVector: Float32Array,
    enrolled: StudentEmbeddingVector[],
    highThreshold = 0.85,
    candidateThreshold = 0.72,
): FaceMatchResult {
    if (enrolled.length === 0 || liveVector.length === 0) {
        return { status: 'unmatched', confidence: 0 };
    }

    // Aggregate max score per student
    const studentScores = new Map<string, { maxScore: number; fullName: string; rollNo: string }>();

    for (const item of enrolled) {
        const score = cosineSimilarity(liveVector, item.vector);
        const prev = studentScores.get(item.studentId);
        if (!prev || score > prev.maxScore) {
            studentScores.set(item.studentId, {
                maxScore: score,
                fullName: item.fullName,
                rollNo: item.rollNo,
            });
        }
    }

    // Find top candidate
    let topStudentId: string | undefined;
    let topInfo: { maxScore: number; fullName: string; rollNo: string } | undefined;

    for (const [id, info] of studentScores.entries()) {
        if (!topInfo || info.maxScore > topInfo.maxScore) {
            topStudentId = id;
            topInfo = info;
        }
    }

    if (!topInfo || !topStudentId) {
        return { status: 'unmatched', confidence: 0 };
    }

    const confidence = Math.max(0, Math.min(1, topInfo.maxScore));

    if (confidence >= highThreshold) {
        return {
            status: 'matched',
            confidence,
            studentId: topStudentId,
            fullName: topInfo.fullName,
            rollNo: topInfo.rollNo,
        };
    }

    if (confidence >= candidateThreshold) {
        return {
            status: 'candidate',
            confidence,
            studentId: topStudentId,
            fullName: topInfo.fullName,
            rollNo: topInfo.rollNo,
        };
    }

    return {
        status: 'unmatched',
        confidence,
        studentId: topStudentId,
        fullName: topInfo.fullName,
        rollNo: topInfo.rollNo,
    };
}
