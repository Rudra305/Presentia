import * as Crypto from 'expo-crypto';

export function uuid(): string {
  if (typeof Crypto.randomUUID === 'function') {
    return Crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  throw new Error('No UUID implementation available.');
}

export function nowEpochMs(): number {
  return Date.now();
}
