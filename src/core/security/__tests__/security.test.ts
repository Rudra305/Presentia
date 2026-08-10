import { decryptPayload, deriveKeyHash, encryptPayload, hashPII } from '../encryption';

describe('Security Encryption Module', () => {
    it('generates consistent SHA-256 key hashes', async () => {
        const hash1 = await deriveKeyHash('secret1');
        const hash2 = await deriveKeyHash('secret1');
        const hash3 = await deriveKeyHash('secret2');

        expect(hash1).toHaveLength(64); // Hex SHA-256 length
        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
    });

    it('encrypts and decrypts PII payloads cleanly', async () => {
        const originalData = {
            studentName: 'Aarav Sharma',
            rollNo: '2026-042',
            embedding: [0.12, 0.94, -0.45],
        };

        const ciphertext = await encryptPayload(originalData);
        expect(typeof ciphertext).toBe('string');
        expect(ciphertext).not.toContain('Aarav Sharma');

        const decrypted = await decryptPayload<typeof originalData>(ciphertext);
        expect(decrypted).toEqual(originalData);
    });

    it('returns null when decrypting payload with wrong key', async () => {
        const ciphertext = await encryptPayload({ data: 123 }, 'secretA');
        const decrypted = await decryptPayload(ciphertext, 'secretB');
        expect(decrypted).toBeNull();
    });

    it('hashes PII strings deterministically with SHA-256', async () => {
        const hashA = await hashPII('roll-001');
        const hashB = await hashPII('roll-001');
        const hashC = await hashPII('roll-002');

        expect(hashA).toHaveLength(64);
        expect(hashA).toBe(hashB);
        expect(hashA).not.toBe(hashC);
    });
});
