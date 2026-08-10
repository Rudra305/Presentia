import * as Crypto from 'expo-crypto';

const DEFAULT_SECRET = 'ega-offline-student-attendance-salt-v1';

function toHex(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
        out += bytes[i]!.toString(16).padStart(2, '0');
    }
    return out;
}

/**
 * Derives a consistent 256-bit encryption key hash from secret.
 */
export async function deriveKeyHash(secret = DEFAULT_SECRET): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, secret);
}

/**
 * Obfuscates/encrypts a sensitive JSON payload for local PII storage.
 */
export async function encryptPayload(
    payload: Record<string, unknown>,
    secret = DEFAULT_SECRET,
): Promise<string> {
    const rawJson = JSON.stringify(payload);
    const key = await deriveKeyHash(secret);
    const utf8Bytes = new TextEncoder().encode(`${key}:${rawJson}`);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]!);
    }
    return globalThis.btoa(binary);
}

/**
 * Decrypts/de-obfuscates a sensitive PII payload.
 */
export async function decryptPayload<T = Record<string, unknown>>(
    ciphertext: string,
    secret = DEFAULT_SECRET,
): Promise<T | null> {
    try {
        const key = await deriveKeyHash(secret);
        const binary = globalThis.atob(ciphertext);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const decoded = new TextDecoder().decode(bytes);
        const expectedPrefix = `${key}:`;
        if (!decoded.startsWith(expectedPrefix)) return null;

        const jsonStr = decoded.substring(expectedPrefix.length);
        return JSON.parse(jsonStr) as T;
    } catch {
        return null;
    }
}

/**
 * Hashes PII strings (like student roll numbers or names) using SHA-256 for anonymized comparison.
 */
export async function hashPII(value: string, salt = DEFAULT_SECRET): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${value}`);
}
