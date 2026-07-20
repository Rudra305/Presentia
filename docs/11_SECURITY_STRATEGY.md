# 11 — Security Strategy

## 1. Threat Model (STRIDE Summary)

| Category | Threat | Control |
|----------|--------|---------|
| **S**poofing | Someone photographs a student's face to mark them present | Passive liveness (Phase 2), teacher confirmation band, immutable audit log with captured frame |
| **T**ampering | Attacker edits SQLite file | DB encryption (SQLCipher), row-level HMAC on attendance_records, integrity check on boot |
| **R**epudiation | Teacher denies marking a student absent | Signed audit_log with actor id + device id + timestamp |
| **I**nformation disclosure | Face embeddings or PII leak | Column-level AES-GCM; keys in Secure Store; no cloud upload without opt-in; TLS 1.2+ (Phase 2) |
| **D**enial of Service | Malformed sync payload crashes app | Zod schema validation at every boundary; try/catch adapters |
| **E**levation of privilege | Teacher accesses principal screens | Role checked at route guard AND at use-case entry |

## 2. Data Classification

| Class | Examples | Storage | Transit |
|-------|----------|---------|---------|
| **Critical** | Face embeddings, PIN hash, JWT signing key | SecureStore (keys), AES-GCM columns (data) | TLS + certificate pinning |
| **Sensitive** | Student name, roll no, photo | Encrypted DB / column-level | TLS |
| **Internal** | Class name, schedule | Plain SQLite | TLS |
| **Public** | App version, feature flags | MMKV | any |

## 3. Cryptography

- **AES-256-GCM** for at-rest column encryption; unique 96-bit IV per record.
- **Argon2id** for PIN hashing (m=64 MB, t=3, p=2). Fallback: scrypt.
- **HS256** for local JWT (single-device); RS256 (Phase 2) for server-issued.
- **Key hierarchy**: Master Key in Keystore/Keychain → wraps Data Keys → data keys encrypt columns.
- **No custom crypto** — use platform primitives via `expo-crypto` / community libs.

## 4. Authentication Controls

- Biometric via `expo-local-authentication` (never sees templates).
- Rate limiting: 3 bio fails → PIN; 5 PIN fails → 60 s lock, doubling per streak.
- Sensitive actions require re-auth (create teacher, export reports, close session).
- Session tokens: 15 min sliding, 8 h hard cap.

## 5. Authorization

- RBAC enforced in **two places**:
  1. Route guard (`AuthGate`).
  2. Use-case entry (`assertRole(user, 'principal')`).
- Server (Phase 2) re-validates on every request; never trusts client role.

## 6. Secure Coding

- Zod at every I/O boundary (form input, SQLite row → entity, network response).
- No dynamic SQL — parameterized queries only.
- No `eval`, no `dangerouslySetInnerHTML`, no `WebView` unless whitelisted URL.
- Dependencies pinned; `yarn audit` in CI.
- SCA (Snyk / Dependabot) enabled.

## 7. OWASP MASVS L1 Checklist (Milestone 11)

- [ ] MSTG-STORAGE-1: sensitive data stored securely
- [ ] MSTG-CRYPTO-1: no hard-coded keys
- [ ] MSTG-AUTH-1: server auth (Phase 2)
- [ ] MSTG-NETWORK-1: TLS + pinning (Phase 2)
- [ ] MSTG-PLATFORM-1: proper permissions
- [ ] MSTG-CODE-1: no debug symbols in release
- [ ] MSTG-RESILIENCE-1: root/jailbreak detection (optional)

## 8. Privacy & Compliance

- Face embeddings and photos are **biometric data** under GDPR Art. 9 and many state laws (BIPA, etc.).
- Default posture: **on-device only**, opt-in cloud with explicit consent + DPA.
- Right to erasure: principal-triggered "purge student" wipes embeddings, photos, and can retain aggregated attendance for grade records only if legally required.
- Data minimization: capture only what's needed; delete photo after embedding by default.
- Privacy policy shipped in-app + on-boarding disclosure.

## 9. Device Integrity (Optional, Phase 2)

- Detect emulator / rooted device — warn (not block) principals.
- SafetyNet / Play Integrity for sync (server-side).

## 10. Incident Response (Skeleton)

- Local crash logs redacted for PII.
- Emergency "wipe device" from principal → destroys DB + keys, then reinstall required.
- Version-based kill-switch via MMKV flag pulled at boot (Phase 2).
