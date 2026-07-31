import { StubFaceDetector, StubFaceEmbedder, cosineSimilarity } from '../stub';

describe('ML Stub Infrastructure', () => {
    describe('StubFaceDetector', () => {
        it('returns face detection results for valid image URI', async () => {
            const detector = new StubFaceDetector();
            const results = await detector.detectFaces('file:///sample.jpg');

            expect(results).toHaveLength(1);
            const face = results[0]!;
            expect(face.confidence).toBeGreaterThan(0.8);
            expect(face.qualityScore).toBeGreaterThan(0.8);
            expect(face.isLive).toBe(true);
            expect(face.boundingBox).toBeDefined();
        });

        it('returns empty array when no image URI is provided', async () => {
            const detector = new StubFaceDetector();
            const results = await detector.detectFaces('');
            expect(results).toEqual([]);
        });
    });

    describe('StubFaceEmbedder', () => {
        it('generates a 128-dimensional unit normalized vector', async () => {
            const embedder = new StubFaceEmbedder(128, 'stub-v1');
            const embedding = await embedder.generateEmbedding('file:///student1.jpg', 'roll-101');

            expect(embedding.dim).toBe(128);
            expect(embedding.modelVersion).toBe('stub-v1');
            expect(embedding.vector).toBeInstanceOf(Float32Array);
            expect(embedding.vector.length).toBe(128);

            // Verify L2 norm is ~ 1.0
            let sumSq = 0;
            for (let i = 0; i < embedding.vector.length; i++) {
                const val = embedding.vector[i]!;
                sumSq += val * val;
            }
            expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 5);
        });

        it('produces identical vectors for identical seed hints', async () => {
            const embedder = new StubFaceEmbedder();
            const emb1 = await embedder.generateEmbedding('img1.jpg', 'student-alice');
            const emb2 = await embedder.generateEmbedding('img2.jpg', 'student-alice');

            const sim = cosineSimilarity(emb1.vector, emb2.vector);
            expect(sim).toBeCloseTo(1.0, 5);
        });

        it('produces distinct vectors for different seed hints with cosine similarity < 0.5', async () => {
            const embedder = new StubFaceEmbedder();
            const emb1 = await embedder.generateEmbedding('img1.jpg', 'student-alice');
            const emb2 = await embedder.generateEmbedding('img2.jpg', 'student-bob');

            const sim = cosineSimilarity(emb1.vector, emb2.vector);
            expect(sim).toBeLessThan(0.5);
        });
    });

    describe('cosineSimilarity', () => {
        it('throws error when vector lengths mismatch', () => {
            const a = new Float32Array([1, 0, 0]);
            const b = new Float32Array([1, 0]);
            expect(() => cosineSimilarity(a, b)).toThrow('Vector length mismatch');
        });

        it('computes 1.0 for parallel vectors', () => {
            const a = new Float32Array([0.6, 0.8]);
            const b = new Float32Array([0.6, 0.8]);
            expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
        });

        it('computes 0.0 for orthogonal vectors', () => {
            const a = new Float32Array([1, 0]);
            const b = new Float32Array([0, 1]);
            expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
        });
    });
});
