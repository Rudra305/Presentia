import { uuid } from '@/core/storage/sqlite';

import { HARD_CAP_MS, IDLE_TIMEOUT_MS, PIN_LOCKOUT_BASE_MS, PIN_MAX_ATTEMPTS } from './constants';
import { hashPin, randomHex, verifyPinHash } from './hash';
import { clearAuth, readAuth, writeAuth, type StoredAuthRecord } from './storage';

/**
 * Auth use-cases.
 *
 * Consumed by the Zustand store (`store.ts`) which layers reactive state
 * on top. Direct callers should almost always go through the store; this
 * module is the pure business logic (no React).
 */

export type EnrollInput = {
  role: 'principal' | 'teacher';
  fullName: string;
  pin: string;
  biometricEnabled: boolean;
};

export type Session = {
  userId: string;
  role: 'principal' | 'teacher';
  fullName: string;
  issuedAt: number;
  expiresAt: number; // hard cap
};

export type UnlockOk = { ok: true; session: Session };
export type UnlockErr =
  | { ok: false; reason: 'no_account' }
  | { ok: false; reason: 'bad_pin'; remaining: number }
  | { ok: false; reason: 'locked'; unlockAt: number };

export async function isEnrolled(): Promise<boolean> {
  return (await readAuth()) !== null;
}

export async function getStoredRecord(): Promise<StoredAuthRecord | null> {
  return readAuth();
}

export async function enroll(input: EnrollInput): Promise<Session> {
  const now = Date.now();
  const salt = await randomHex(16);
  const pinHash = await hashPin(input.pin, salt);
  const sessionToken = await randomHex(32);

  const record: StoredAuthRecord = {
    role: input.role,
    userId: uuid(),
    fullName: input.fullName,
    pinSalt: salt,
    pinHash,
    biometricEnabled: input.biometricEnabled,
    sessionToken,
    sessionIssuedAt: now,
    lastActiveAt: now,
    hardExpiresAt: now + HARD_CAP_MS,
    failedPinCount: 0,
    lockoutUntil: null,
    lockoutStreak: 0,
  };

  await writeAuth(record);
  return toSession(record);
}

export async function unlockWithPin(pin: string): Promise<UnlockOk | UnlockErr> {
  const record = await readAuth();
  if (!record) return { ok: false, reason: 'no_account' };

  const now = Date.now();
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return { ok: false, reason: 'locked', unlockAt: record.lockoutUntil };
  }

  const ok = await verifyPinHash(pin, record.pinSalt, record.pinHash);
  if (!ok) {
    record.failedPinCount += 1;
    if (record.failedPinCount >= PIN_MAX_ATTEMPTS) {
      record.lockoutStreak += 1;
      record.lockoutUntil = now + PIN_LOCKOUT_BASE_MS * 2 ** (record.lockoutStreak - 1);
      record.failedPinCount = 0;
    }
    await writeAuth(record);
    if (record.lockoutUntil && record.lockoutUntil > now) {
      return { ok: false, reason: 'locked', unlockAt: record.lockoutUntil };
    }
    return { ok: false, reason: 'bad_pin', remaining: PIN_MAX_ATTEMPTS - record.failedPinCount };
  }

  return { ok: true, session: await refreshOnActivity(record, now) };
}

/**
 * Called after a successful biometric prompt. Requires an existing account.
 */
export async function acceptBiometricUnlock(): Promise<UnlockOk | UnlockErr> {
  const record = await readAuth();
  if (!record) return { ok: false, reason: 'no_account' };
  return { ok: true, session: await refreshOnActivity(record, Date.now()) };
}

async function refreshOnActivity(record: StoredAuthRecord, now: number): Promise<Session> {
  record.failedPinCount = 0;
  record.lockoutUntil = null;
  record.lockoutStreak = 0;
  record.lastActiveAt = now;
  // If the hard cap has expired, mint a fresh session token + cap.
  if (now >= record.hardExpiresAt) {
    record.sessionIssuedAt = now;
    record.hardExpiresAt = now + HARD_CAP_MS;
    record.sessionToken = await randomHex(32);
  }
  await writeAuth(record);
  return toSession(record);
}

/**
 * Boot-time session read: return the active session iff it hasn't idled
 * out AND hasn't hit the hard cap. Otherwise return null and the UI must
 * route the user through re-authentication.
 */
export async function bootstrapSession(): Promise<Session | null> {
  const record = await readAuth();
  if (!record) return null;
  const now = Date.now();
  if (now >= record.hardExpiresAt) return null;
  if (now - record.lastActiveAt > IDLE_TIMEOUT_MS) return null;
  return toSession(record);
}

export async function refreshActivity(): Promise<void> {
  const record = await readAuth();
  if (!record) return;
  const now = Date.now();
  if (now >= record.hardExpiresAt) return;
  record.lastActiveAt = now;
  await writeAuth(record);
}

export async function signOut(): Promise<void> {
  await clearAuth();
}

function toSession(record: StoredAuthRecord): Session {
  return {
    userId: record.userId,
    role: record.role,
    fullName: record.fullName,
    issuedAt: record.sessionIssuedAt,
    expiresAt: record.hardExpiresAt,
  };
}
