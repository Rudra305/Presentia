# 06 — Authentication Flow

## 1. Actors & Methods

| Actor | Primary | Fallback |
|-------|---------|----------|
| Principal | Device biometric (Face ID / Fingerprint) | 6-digit PIN |
| Teacher | Device biometric | 6-digit PIN |
| Student | **Camera face recognition** (no personal login) | Teacher manual override |

## 2. Enrollment (First Launch)

```
Install → Splash → Choose role (Principal seed / invite code for Teacher)
   → Local Auth availability check
        ├─ available    → prompt biometric enroll → success flag stored
        └─ unavailable  → force PIN setup
   → PIN setup (mandatory in both cases, as fallback)
        - 6 digits, no trivial sequences, Argon2id hash → SQLite users.pin_hash
   → Save user row in SQLite, keys in Secure Store, jump to role home
```

## 3. Login (Cold Start / Session Expiry)

```
Launch → Read session token (Secure Store)
  ├─ valid & not expired  → role home
  └─ else                 → Auth screen
        [Biometric] tap → expo-local-authentication.authenticateAsync()
             ├─ success  → issue local JWT (self-signed, 15 min) → role home
             ├─ cancel   → stay
             └─ 3 fails  → force PIN screen
        [PIN] tap → verify Argon2id
             ├─ success  → issue token → role home
             ├─ 5 fails  → lock 60 s (doubles each retry)
```

- **Local JWT** (HS256, key in Secure Store) carries `{sub, role, tenant_id, iat, exp}`.
- Refresh on activity; sliding expiration up to 24 h max, hard cap 8 h idle.

## 4. Re-Auth Triggers

- App resume after > 15 min background.
- Sensitive actions: creating a teacher, closing a session, exporting reports.
- Explicit "Lock" button in settings.

## 5. Student Face Recognition Flow

This is **not** an identity login — it is an **attendance signal**.

```
Teacher starts Session → opens Capture screen
  → Camera preview (front cam by default)
  → Vision-Camera frame processor runs Face Detector
        ├─ 0 faces      → hint "Align face"
        ├─ >1 faces     → hint "One student at a time"
        └─ 1 face + quality > threshold
              → crop + normalize → FaceEmbedder → 128/512-d vector
              → in-memory KNN over class roster embeddings
              → cosine sim ≥ 0.72 (tunable) → candidate student
                    ├─ confidence ≥ 0.85 → auto-mark Present (haptic + sound)
                    └─ 0.72–0.85         → show suggestion card → teacher confirms
              → sim < 0.72 → hint "Unknown, please retry / add manually"
  → Rate-limit: same student cannot be re-marked in same session (idempotency by unique(session, student))
```

### Anti-Spoof (Phase 2 hook)
- Passive liveness: blink detection over 10 frames, or micro-motion parallax.
- Optional depth check on iOS TrueDepth.

## 6. Security Considerations

- Biometric API only returns success/fail — the app never sees biometric templates.
- Face embeddings are **not** identity credentials — they cannot log a user in.
- PIN attempts and biometric lockouts are tracked in `audit_log`.
- All tokens signed with a key that only exists in Secure Store (Keystore/Keychain).

## 7. Session State Machine

```
IDLE ──login──► ACTIVE ──idle 15m──► BACKGROUND ──resume──► LOCKED ──auth──► ACTIVE
                    │                                        │
                    └────explicit lock───────────────────────┘
```

## 8. Error UX

| Case | Message |
|------|---------|
| Biometric hardware disabled | "Enable Face ID/Fingerprint in device settings — or use your PIN." |
| Biometric permanently locked | Auto-fallback to PIN, notify user. |
| PIN forgotten | Principal can reset a teacher's PIN from the Teachers screen; Principal reset requires re-enrollment. |
