/**
 * Universal UUID v4 generator.
 *
 * Uses `expo-crypto` on device (hardware-backed randomness) and falls back
 * to the Node `crypto` module in Jest so the same helper works everywhere.
 */

import * as Crypto from 'expo-crypto';

export function uuid(): string {
  // expo-crypto exposes `randomUUID` on both iOS and Android SDK 51+.
  // In Node (Jest), we fall back to the built-in crypto module.
  if (typeof Crypto.randomUUID === 'function') {
    return Crypto.randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('node:crypto').randomUUID() as string;
}

export function nowEpochMs(): number {
  return Date.now();
}
