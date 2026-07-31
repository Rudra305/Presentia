/**
 * Core ML interfaces and types for Face Detection and Face Embedding.
 */

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FaceDetectionResult {
    boundingBox: BoundingBox;
    confidence: number;
    qualityScore: number; // 0.0 - 1.0
    isLive: boolean;
}

export interface FaceEmbedding {
    vector: Float32Array;
    dim: number;
    modelVersion: string;
    quality: number;
    capturedAt: number;
}

export interface FaceDetector {
    detectFaces(imageUriOrFrame: string): Promise<FaceDetectionResult[]>;
}

export interface FaceEmbedder {
    generateEmbedding(imageUriOrFrame: string, seedHint?: string): Promise<FaceEmbedding>;
}
