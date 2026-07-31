import type { FaceDetectionResult, FaceDetector, FaceEmbedder, FaceEmbedding } from './types';

/**
 * Computes Cosine Similarity between two 1D Float32Array vectors.
 * Returns a score between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized face vectors).
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
        throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        const valA = a[i] ?? 0;
        const valB = b[i] ?? 0;
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

/**
 * Simple string hash to generate a seed number.
 */
function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}

/**
 * Pseudo-random number generator given a seed.
 */
function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

/**
 * Stub implementation of FaceDetector for development and unit testing.
 */
export class StubFaceDetector implements FaceDetector {
    async detectFaces(imageUriOrFrame: string): Promise<FaceDetectionResult[]> {
        if (!imageUriOrFrame) return [];

        const seed = hashString(imageUriOrFrame);
        const rng = seededRandom(seed);

        const qualityScore = 0.85 + rng() * 0.12; // 0.85 - 0.97
        const confidence = 0.9 + rng() * 0.09; // 0.90 - 0.99

        return [
            {
                boundingBox: { x: 100, y: 120, width: 240, height: 240 },
                confidence: Number(confidence.toFixed(3)),
                qualityScore: Number(qualityScore.toFixed(3)),
                isLive: true,
            },
        ];
    }
}

/**
 * Stub implementation of FaceEmbedder for development and unit testing.
 * Generates unit-normalized 128-dimensional Float32Array vectors deterministically based on seed string.
 */
export class StubFaceEmbedder implements FaceEmbedder {
    private readonly dim: number;
    private readonly modelVersion: string;

    constructor(dim = 128, modelVersion = 'stub-v1') {
        this.dim = dim;
        this.modelVersion = modelVersion;
    }

    async generateEmbedding(imageUriOrFrame: string, seedHint?: string): Promise<FaceEmbedding> {
        const seedString = seedHint || imageUriOrFrame || 'default_seed';
        const seed = hashString(seedString);
        const rng = seededRandom(seed);

        const rawVector = new Float32Array(this.dim);
        let sumSq = 0;

        for (let i = 0; i < this.dim; i++) {
            const val = (rng() - 0.5) * 2;
            rawVector[i] = val;
            sumSq += val * val;
        }

        // L2 Normalize vector
        const norm = Math.sqrt(sumSq);
        const normalizedVector = new Float32Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            normalizedVector[i] = (rawVector[i] ?? 0) / norm;
        }

        const quality = Number((0.88 + (seed % 10) * 0.01).toFixed(3));

        return {
            vector: normalizedVector,
            dim: this.dim,
            modelVersion: this.modelVersion,
            quality,
            capturedAt: Date.now(),
        };
    }
}
