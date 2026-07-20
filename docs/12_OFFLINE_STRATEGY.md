# 12 — Offline Strategy

**Guiding principle:** The app is designed **offline-first**. Connectivity is treated as an *enhancement*, never a *requirement* for the core loop (enroll → capture → review → report).

## 1. What Must Work Offline

| Flow | Offline? |
|------|----------|
| Principal / Teacher login (biometric + PIN) | ✅ |
| Teacher / Class / Student CRUD | ✅ |
| Face enrollment (3 samples) | ✅ |
| Session lifecycle | ✅ |
| Attendance capture + recognition | ✅ |
| Manual override & review | ✅ |
| Reports & charts | ✅ |
| Sync (push/pull) | ❌ (queued) |
| Photo upload to cloud | ❌ (deferred) |

## 2. Local-First Data Layer

- **Source of truth = local SQLite.**
- Every write:
  1. Writes to SQLite in a transaction.
  2. Emits an entry in `sync_queue` with the delta.
  3. Fires optimistic UI update via React Query cache.
- Every read comes from SQLite. React Query is a memoization + revalidation layer over it.

## 3. IDs & Idempotency

- All primary keys are **client-generated UUID v4** — no reliance on server sequences.
- Every mutation has a client-generated `op_id` (UUID) — server dedupes by it.
- `UNIQUE` constraints prevent local double-writes (e.g., `(session_id, student_id)`).

## 4. Sync Queue (Milestone 10)

```
sync_queue rows: { entity_type, entity_id, op, payload, attempts, next_try_at }

Scheduler (foreground):
  while online && queue not empty:
      batch = take N rows where next_try_at ≤ now
      POST /sync/push {batch}
      on 2xx: mark rows done, delete
      on 409 (conflict): pull latest for entity, run resolver, requeue
      on 5xx / network: attempts++, next_try_at = now + backoff(attempts)

Backoff: 2^attempts seconds, jittered, capped at 15 min.
```

- Runs on **app foreground** + **network regained** event.
- Background sync (Phase 3) via `expo-background-fetch` — best effort.

## 5. Pull Sync

- Cursor-based: `GET /sync/pull?since=<ts>&limit=200`.
- Applies changes in a single transaction; on failure, rolls back and retries.
- Deleted entities marked `deleted_at`; UI hides them.

## 6. Conflict Resolution

- **Last-Writer-Wins per field**, using `updated_at` (UTC epoch) as the tiebreaker.
- Ties broken by lexicographic `device_id`.
- Every resolution writes an `audit_log` entry so principals can review.
- Special cases:
  - `attendance_records.status`: if server has `present` and local has `absent`, **present wins** (fail-open for student).
  - Soft-deletes: `deleted_at` set once, never unset.

## 7. Network Awareness

- `@react-native-community/netinfo` listener drives a `useNetwork()` hook.
- UI shows a subtle **"Offline" pill** in the header when disconnected.
- Sync attempts suspended when offline; auto-resume on reconnect.

## 8. Photo Handling

- Photos live on the app sandbox filesystem (`FileSystem.documentDirectory/photos/<uuid>.jpg`).
- Only a URI is stored in SQLite; the file is deleted on soft-delete purge.
- Cloud upload (Phase 2) uses **tus / resumable multipart** so a 30 MB batch survives 5 network flaps.

## 9. Time & Clock Skew

- All timestamps stored as epoch UTC ms.
- Session times captured with monotonic device clock; server later normalizes.
- On sync, server may return `server_ts_offset` — stored in MMKV for display corrections.

## 10. Local Backups

- Principal-triggered "Export encrypted backup" writes an AES-encrypted `.attsys` file to Files/Downloads.
- Restore flow validates HMAC and merges into empty DB (bootstrap only).

## 11. Chaos Testing (Milestone 10 acceptance)

- Airplane mode toggling every 10 s during a 30-min session must not lose a single record.
- Two devices editing same student simultaneously must converge to the same state after next sync round.
- 10 000 queued rows must drain in ≤ 5 min on Wi-Fi.

## 12. Failure Modes & UX

| Situation | UX |
|-----------|-----|
| Never been online | App fully usable; "Sync not configured" banner in settings only. |
| Was online, now offline | Silent; features unaffected. |
| Sync failing repeatedly | Settings shows last error + "Retry now" button. |
| DB corruption | Boot detects via `integrity_check`; offers restore-from-backup. |
