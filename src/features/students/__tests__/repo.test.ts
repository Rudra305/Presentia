import { BetterSqliteAdapter } from '@/core/storage/sqlite/adapters/BetterSqliteAdapter';
import { runMigrations } from '@/core/storage/sqlite/migrations/runner';
import { seedDev } from '@/core/storage/sqlite/seed';
import { StubFaceEmbedder } from '@/core/ml/stub';
import { ClassRepo } from '@/features/classes/repo';
import { StudentRepo } from '../repo';

describe('StudentRepo', () => {
    let db: BetterSqliteAdapter;
    let studentRepo: StudentRepo;
    let classRepo: ClassRepo;
    let tenantId: string;
    let sampleClassId: string;
    let embedder: StubFaceEmbedder;

    beforeEach(async () => {
        db = BetterSqliteAdapter.open();
        await runMigrations(db);
        const seed = await seedDev(db, { includeDemoData: true });
        tenantId = seed.tenantId;
        studentRepo = new StudentRepo(db);
        classRepo = new ClassRepo(db);
        embedder = new StubFaceEmbedder();

        const classes = await classRepo.listWithDetails(tenantId);
        sampleClassId = classes[0]!.id;
    });

    afterEach(async () => {
        await db.closeAsync();
    });

    it('checks roll number uniqueness within a class', async () => {
        const isUniqueBefore = await studentRepo.checkRollNoUnique(
            tenantId,
            sampleClassId,
            'ROLL-999',
        );
        expect(isUniqueBefore).toBe(true);

        const emb1 = await embedder.generateEmbedding('file:///1.jpg', 'ROLL-999');
        const emb2 = await embedder.generateEmbedding('file:///2.jpg', 'ROLL-999');
        const emb3 = await embedder.generateEmbedding('file:///3.jpg', 'ROLL-999');

        await studentRepo.createWithEmbeddings({
            tenantId,
            classId: sampleClassId,
            rollNo: 'ROLL-999',
            fullName: 'Test Student',
            embeddings: [emb1, emb2, emb3],
        });

        const isUniqueAfter = await studentRepo.checkRollNoUnique(
            tenantId,
            sampleClassId,
            'ROLL-999',
        );
        expect(isUniqueAfter).toBe(false);

        // Case-insensitive check
        const isUniqueLower = await studentRepo.checkRollNoUnique(
            tenantId,
            sampleClassId,
            'roll-999',
        );
        expect(isUniqueLower).toBe(false);
    });

    it('enrolls student with 3 face sample embeddings and retrieves vectors', async () => {
        const emb1 = await embedder.generateEmbedding('file:///1.jpg', 'ROLL-101');
        const emb2 = await embedder.generateEmbedding('file:///2.jpg', 'ROLL-101');
        const emb3 = await embedder.generateEmbedding('file:///3.jpg', 'ROLL-101');

        const enrolled = await studentRepo.createWithEmbeddings({
            tenantId,
            classId: sampleClassId,
            rollNo: 'ROLL-101',
            fullName: 'Aarav Sharma',
            photoUri: 'file:///aarav.jpg',
            embeddings: [emb1, emb2, emb3],
        });

        expect(enrolled.id).toBeDefined();
        expect(enrolled.rollNo).toBe('ROLL-101');
        expect(enrolled.fullName).toBe('Aarav Sharma');
        expect(enrolled.sampleCount).toBe(3);
        expect(enrolled.isEnrolled).toBe(true);

        // Retrieve embeddings from DB
        const savedEmbeddings = await studentRepo.getEmbeddingsForStudent(enrolled.id);
        expect(savedEmbeddings).toHaveLength(3);
        const firstEmb = savedEmbeddings[0]!;
        expect(firstEmb.dim).toBe(128);
        expect(firstEmb.vector).toBeInstanceOf(Float32Array);
        expect(firstEmb.vector.length).toBe(128);
        expect(firstEmb.vector[0]!).toBeCloseTo(emb1.vector[0]!, 4);
    });

    it('searches students by name or roll number', async () => {
        const emb1 = await embedder.generateEmbedding('file:///1.jpg', 'R-501');
        await studentRepo.createWithEmbeddings({
            tenantId,
            classId: sampleClassId,
            rollNo: 'R-501',
            fullName: 'Diya Patel',
            embeddings: [emb1],
        });

        const searchByName = await studentRepo.search(tenantId, 'diya');
        expect(searchByName.some((s) => s.fullName === 'Diya Patel')).toBe(true);

        const searchByRoll = await studentRepo.search(tenantId, '501');
        expect(searchByRoll.some((s) => s.rollNo === 'R-501')).toBe(true);
    });

    it('soft deletes student and excludes from roster', async () => {
        const emb1 = await embedder.generateEmbedding('file:///1.jpg', 'R-99');
        const created = await studentRepo.createWithEmbeddings({
            tenantId,
            classId: sampleClassId,
            rollNo: 'R-99',
            fullName: 'Temporary Student',
            embeddings: [emb1],
        });

        await studentRepo.softDelete(created.id);

        const activeList = await studentRepo.listWithDetails(tenantId, sampleClassId);
        expect(activeList.some((s) => s.id === created.id)).toBe(false);

        const foundDeleted = await studentRepo.findById(created.id, { includeDeleted: true });
        expect(foundDeleted?.deletedAt).not.toBeNull();
    });
});
