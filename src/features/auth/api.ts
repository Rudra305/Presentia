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
    | { ok: false; reason: 'locked'; lockoutUntil: number }
    | { ok: false; reason: 'bad_pin'; remaining: number };

export async function isEnrolled(): Promise<boolean> {
    const record = await readAuth();
    return record !== null;
}

export async function enroll(input: EnrollInput): Promise<Session> {
    const existing = await readAuth();
    if (existing) {
        // If account already exists, re-auth / update credentials
        const salt = await randomHex(16);
        const hash = await hashPin(input.pin, salt);
        const now = Date.now();
        existing.role = input.role;
        existing.fullName = input.fullName;
        existing.pinSalt = salt;
        existing.pinHash = hash;
        existing.biometricEnabled = input.biometricEnabled;
        existing.sessionIssuedAt = now;
        existing.lastActiveAt = now;
        existing.signedOutAt = null;
        existing.hardExpiresAt = now + HARD_CAP_MS;
        existing.failedPinCount = 0;
        existing.lockoutUntil = null;
        await writeAuth(existing);
        return toSession(existing);
    }

    const salt = await randomHex(16);
    const hash = await hashPin(input.pin, salt);
    const now = Date.now();
    const userId = uuid();

    const record: StoredAuthRecord = {
        role: input.role,
        userId,
        fullName: input.fullName,
        pinSalt: salt,
        pinHash: hash,
        biometricEnabled: input.biometricEnabled,
        sessionToken: await randomHex(32),
        sessionIssuedAt: now,
        lastActiveAt: now,
        signedOutAt: null,
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

    // Active lockout check.
    if (record.lockoutUntil && now < record.lockoutUntil) {
        return { ok: false, reason: 'locked', lockoutUntil: record.lockoutUntil };
    }

    // Lockout expired? Reset counter.
    if (record.lockoutUntil && now >= record.lockoutUntil) {
        record.lockoutUntil = null;
        record.failedPinCount = 0;
    }

    const match = await verifyPinHash(pin, record.pinSalt, record.pinHash);
    if (!match) {
        record.failedPinCount += 1;
        if (record.failedPinCount >= PIN_MAX_ATTEMPTS) {
            record.lockoutStreak += 1;
            const durationMs = PIN_LOCKOUT_BASE_MS * record.lockoutStreak;
            record.lockoutUntil = now + durationMs;
            await writeAuth(record);
            return { ok: false, reason: 'locked', lockoutUntil: record.lockoutUntil };
        }
        await writeAuth(record);
        return {
            ok: false,
            reason: 'bad_pin',
            remaining: PIN_MAX_ATTEMPTS - record.failedPinCount,
        };
    }

    // Successful PIN entry.
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
    record.signedOutAt = null;
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
 * out, hasn't hit the hard cap, and hasn't explicitly signed out.
 */
export async function bootstrapSession(): Promise<Session | null> {
    const record = await readAuth();
    if (!record) return null;
    if (record.signedOutAt != null) return null;
    const now = Date.now();
    if (now >= record.hardExpiresAt) return null;
    if (now - record.lastActiveAt > IDLE_TIMEOUT_MS) return null;
    return toSession(record);
}

export async function refreshActivity(): Promise<void> {
    const record = await readAuth();
    if (!record || record.signedOutAt != null) return;
    const now = Date.now();
    if (now >= record.hardExpiresAt) return;
    record.lastActiveAt = now;
    await writeAuth(record);
}

/**
 * Sign out / lock session: records exact sign-out timestamp (`signedOutAt` and `lastActiveAt`)
 * while preserving enrolled account credentials (PIN & Biometric data).
 */
export async function signOut(): Promise<void> {
    const record = await readAuth();
    if (!record) return;
    const now = Date.now();
    record.lastActiveAt = now;
    record.signedOutAt = now;
    await writeAuth(record);
}

/**
 * Factory reset: completely deletes local enrolled account & credentials.
 */
export async function resetAccount(): Promise<void> {
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
