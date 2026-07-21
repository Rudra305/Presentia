/**
 * Session policy constants — kept in one place so idle/hard-cap changes are
 * a single-file diff. Values follow the security plan in docs/11.
 */

export const AUTH_STORAGE_KEY = 'auth:v1';

/** Slide-back-to-lock timeout after the user goes idle. */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/** Absolute session cap — never extends. */
export const HARD_CAP_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Consecutive wrong PINs before we lock the user out. */
export const PIN_MAX_ATTEMPTS = 5;

/** Duration of the initial lockout. Doubles with each subsequent lockout run. */
export const PIN_LOCKOUT_BASE_MS = 60 * 1000; // 60 s

export const PIN_LENGTH = 6;
