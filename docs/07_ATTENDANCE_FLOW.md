# 07 — Attendance Flow

## 1. End-to-End Sequence

```
┌────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐   ┌──────────┐
│Teacher │   │ Session  │   │  Camera  │   │ ML Adapter │   │  SQLite  │
└───┬────┘   └────┬─────┘   └────┬─────┘   └─────┬──────┘   └────┬─────┘
    │ start()     │              │               │               │
    │────────────►│ create row   │               │               │
    │             │───────────────────────────────────────────► │
    │             │              │               │               │
    │ openCapture()              │               │               │
    │─────────────────────────► │ open preview   │               │
    │             │              │  frame ─────► │ detect + embed│
    │             │              │               │ ─────► KNN    │
    │             │              │               │  match/miss   │
    │             │  markPresent(studentId, confidence)          │
    │             │◄─────────────────────────────│               │
    │             │  upsert attendance_records ─────────────────►│
    │             │                                              │
    │ finish()    │  end session                                 │
    │────────────►│──────────────────────────────────────────── │
```

## 2. Use-Case: `captureAttendance`

**Inputs:** `sessionId`, `frame` (bitmap ref)
**Steps:**
1. Detect faces; select highest-quality face; abort if quality < 0.6.
2. Compute embedding.
3. Query in-memory KNN (built at session start from `face_embeddings` for that class).
4. Take top-1; if `score ≥ AUTO_THRESHOLD` → mark present.
5. If `SUGGEST_THRESHOLD ≤ score < AUTO_THRESHOLD` → emit suggestion event.
6. Enforce idempotency: `UNIQUE(session_id, student_id)`.
7. Enqueue delta in `sync_queue` (Phase 2).

**Thresholds (tunable, stored in MMKV):**
- `AUTO_THRESHOLD = 0.85`
- `SUGGEST_THRESHOLD = 0.72`
- `MIN_QUALITY = 0.60`

## 3. Session Lifecycle

```
new  ──open──►  active  ──finish──►  closed
                  │
                  └── auto-timeout (15 min idle) ──► closed
```
- Only one **open** session per teacher at a time (constraint + UI guard).
- Closing a session locks its `attendance_records` from face capture; manual overrides still allowed for 24 h.

## 4. Manual Override Flow

```
Review screen → tap student row → status picker (Present / Absent / Late / Excused)
   → confirm → attendance_records.update (method='override', marked_by=teacher)
   → audit_log entry
```

## 5. Roster Preload

At session start:
- Load class roster (students + one representative embedding per student) into memory.
- Build KNN structure (brute-force cosine for ≤ 200 students; VP-tree for larger).
- Keep object graph small: use typed arrays for vectors.

## 6. Camera & Frame Pipeline

- **Expo Camera** for permissions & basic preview.
- **react-native-vision-camera** with a **frame processor** for low-latency ML.
- Downscale frames to 224×224 before inference.
- Throttle inference to **max 5 fps** to preserve battery.
- Skip frames when GPU busy (`isReady` flag).

## 7. Feedback UX

| Event | Visual | Haptic | Sound |
|-------|--------|--------|-------|
| Present marked | Green pulse + name toast | Success | Soft chime |
| Suggestion | Yellow card with "Confirm" | Warning | — |
| Unknown | Gray hint | — | — |
| Duplicate | Blue "Already marked" | — | — |

## 8. Edge Cases

| Case | Handling |
|------|----------|
| Low light | Auto-boost exposure; if still poor, show "Improve lighting" hint. |
| Two faces | Ignore frame; overlay warns. |
| Twins / high sim | Force teacher confirmation if top-2 delta < 0.05. |
| Student not enrolled | Show "Not recognized" with quick "Enroll now" CTA. |
| App killed mid-session | On next launch, resume open session (idempotent). |
| Clock skew | Store both `device_ts` and `server_ts` (Phase 2). |

## 9. Reporting Aggregations

Read-model views (SQL views or materialized tables refreshed on write):

- `v_student_attendance_pct(class_id, student_id, term_start, term_end)`
- `v_class_daily_attendance(class_id, date, present, absent, late, excused)`
- `v_teacher_activity(teacher_id, week, sessions_run, students_marked)`
