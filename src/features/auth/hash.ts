import * as Crypto from 'expo-crypto';

/**
 * PIN hashing helpers.
 *
 * Native argon2/bcrypt would require a custom native module which the
 * managed Expo workflow doesn't support out of the box. Per the auth
 * integration playbook, we use **salted SHA-256 with a per-user random
 * salt** — offline-only, defense-in-depth alongside SecureStore, and it
 * runs on the JS thread in well under a frame.
 */

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

export async function randomHex(byteLength = 16): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return toHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function verifyPinHash(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  return timingSafeEqual(actual, expectedHash);
}

/**
 * Constant-time string compare (best-effort in JS). Prevents naive
 * short-circuit comparison — not perfect vs. a JIT'd runtime but better
 * than `===`.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
