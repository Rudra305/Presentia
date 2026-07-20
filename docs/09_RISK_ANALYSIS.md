# 09 — Risk Analysis

Rating: L=Likelihood, I=Impact (1 low → 5 high). Score = L × I.

| # | Risk | L | I | Score | Mitigation | Owner |
|---|------|---|---|-------|------------|-------|
| R1 | On-device face model accuracy insufficient (twins, glasses, low light) | 4 | 5 | 20 | Multi-sample enrollment (3+), tunable thresholds, teacher confirmation band, quality gating, later add liveness | ML lead |
| R2 | Camera frame-processor performance drops on low-end Android | 4 | 4 | 16 | Downscale frames, throttle to 5 fps, model quantization (int8), fallback to detect-only mode | RN lead |
| R3 | SQLite corruption on unexpected shutdown | 2 | 5 | 10 | WAL mode, transactions, `PRAGMA integrity_check` on boot, backup export tool | Backend |
| R4 | Biometric hardware unavailable / locked out | 3 | 3 | 9 | Mandatory PIN fallback from day one; clear UX copy | Auth lead |
| R5 | Face embeddings leak (PII risk) | 2 | 5 | 10 | Column-level AES-GCM + DB encryption, no cloud upload without opt-in, purge on student delete | Security |
| R6 | Expo SDK breaking changes | 3 | 3 | 9 | Pin exact SDK version, upgrade every quarter with regression suite | Tech lead |
| R7 | Vision-Camera + Reanimated version mismatches | 4 | 3 | 12 | Lock versions in `package.json`, patch-package if needed, CI matrix build | RN lead |
| R8 | Sync conflicts corrupt attendance data | 3 | 5 | 15 | LWW per field + audit log, server-side validation, dry-run mode in staging | Sync lead |
| R9 | App size exceeds Play Store limits (>150 MB) | 2 | 3 | 6 | Model quantization, split ABIs, dynamic feature delivery | RN lead |
| R10 | Teacher misuse (marking absent students present) | 3 | 4 | 12 | Immutable audit log, principal-visible override reports, photo capture of marked frame | Product |
| R11 | Camera permission denied | 3 | 4 | 12 | Pre-permission education screen, graceful degrade to manual mode | UX |
| R12 | Battery drain during long sessions | 3 | 3 | 9 | Throttled inference, screen-dim after N seconds idle, "pause preview" toggle | RN lead |
| R13 | Data loss on uninstall (no cloud) | 3 | 5 | 15 | Encrypted local backup export to Files app; auto-remind principal weekly | Product |
| R14 | Regulatory (GDPR / student-privacy laws) | 3 | 5 | 15 | On-device only by default; opt-in cloud with DPA; retention policy; right-to-erasure workflow | Legal |
| R15 | Teacher forgets PIN | 3 | 2 | 6 | Principal-driven reset flow with re-enrollment | Auth lead |
| R16 | Bulk enrollment slow (large schools) | 3 | 3 | 9 | Batch APIs, background jobs, progress UI | Product |
| R17 | Time-zone / DST bugs in reports | 2 | 3 | 6 | Store epoch UTC + tenant TZ; derive at query time | Backend |

## Top-5 Watchlist (score ≥ 12)

1. **R1 — Face accuracy** — quarterly benchmark; publish confusion matrix in QA reports.
2. **R2 — Perf on low-end devices** — CI perf budget; block release if p95 > 500 ms.
3. **R7 — Native module compatibility** — pin versions; smoke test after each Expo bump.
4. **R8 — Sync integrity** — chaos testing (network flap, dual edits) in Milestone 10.
5. **R13/R14 — Data loss & privacy** — backup UX + GDPR checklist before v1.
