// Real Node crypto powers the fallback path in `hash.ts`. This mock
// mirrors the expo-crypto surface used by the auth code.
const nodeCrypto = require('node:crypto');

module.exports = {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    async digestStringAsync(_algo, data) {
        return nodeCrypto.createHash('sha256').update(data).digest('hex');
    },
    async getRandomBytesAsync(byteLength) {
        return new Uint8Array(nodeCrypto.randomBytes(byteLength));
    },
    randomUUID: () => nodeCrypto.randomUUID(),
};
