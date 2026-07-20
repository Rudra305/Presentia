# 04 — Database Design (SQLite)

## 1. Design Principles

- **Normalized to 3NF** with strategic denormalization only for read-heavy report tables.
- **UUID v4 primary keys** (client-generated) — safe for offline creation & sync.
- **Soft deletes** via `deleted_at` for sync reconciliation.
- **Audit columns** on every table: `created_at`, `updated_at`, `updated_by`, `version` (monotonic int for optimistic concurrency).
- **`tenant_id`** included from day one for future multi-tenancy.
- **Sync columns**: `sync_status` (`pending|synced|conflict`), `remote_id`, `last_synced_at`.

## 2. ER Diagram

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  tenants     │        │   users      │        │   classes    │
│──────────────│        │──────────────│        │──────────────│
│ id (PK)      │◄──1:N──│ tenant_id FK │        │ tenant_id FK │──►
│ name         │        │ id (PK)      │        │ id (PK)      │
│ code UNIQUE  │        │ role ENUM    │        │ name         │
└──────────────┘        │ full_name    │        │ grade        │
                        │ biometric_id │        │ section      │
                        │ pin_hash     │        │ teacher_id FK├──┐
                        │ ...          │        └──────────────┘  │
                        └──────┬───────┘                          │
                               │                                  │
                               │ 1:N (teacher_id)                 │
                               │                                  │
                               ▼                                  │
                        ┌──────────────┐                          │
                        │  sessions    │                          │
                        │──────────────│                          │
                        │ id (PK)      │                          │
                        │ class_id FK  │◄─────────────────────────┘
                        │ teacher_id FK│
                        │ started_at   │
                        │ ended_at     │
                        │ status ENUM  │
                        └──────┬───────┘
                               │
                               │ 1:N
                               ▼
                        ┌───────────────────┐        ┌──────────────────┐
                        │ attendance_records│        │    students      │
                        │───────────────────│        │──────────────────│
                        │ id (PK)           │        │ tenant_id FK     │
                        │ session_id FK     │◄──1:1──│ id (PK)          │
                        │ student_id FK     │───N:1─►│ class_id FK      │
                        │ status ENUM       │        │ roll_no          │
                        │ marked_at         │        │ full_name        │
                        │ marked_by FK(user)│        │ photo_uri (enc)  │
                        │ method ENUM       │        │ deleted_at       │
                        │ confidence REAL   │        └────────┬─────────┘
                        └───────────────────┘                 │
                                                              │ 1:N
                                                              ▼
                                                     ┌──────────────────┐
                                                     │ face_embeddings  │
                                                     │──────────────────│
                                                     │ id (PK)          │
                                                     │ student_id FK    │
                                                     │ vector BLOB (enc)│
                                                     │ model_version    │
                                                     │ quality REAL     │
                                                     │ captured_at      │
                                                     └──────────────────┘

                        ┌──────────────┐        ┌──────────────┐
                        │ sync_queue   │        │ audit_log    │
                        │──────────────│        │──────────────│
                        │ id (PK)      │        │ id (PK)      │
                        │ entity_type  │        │ actor_id     │
                        │ entity_id    │        │ action       │
                        │ op ENUM      │        │ entity_type  │
                        │ payload JSON │        │ entity_id    │
                        │ attempts     │        │ diff JSON    │
                        │ next_try_at  │        │ created_at   │
                        └──────────────┘        └──────────────┘
```

## 3. Table Definitions (DDL sketch — for reference only, no code yet)

### `tenants`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | uuid |
| name | TEXT NOT NULL |
| code | TEXT UNIQUE |
| created_at | INTEGER (epoch ms) |

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK |
| tenant_id | TEXT FK → tenants |
| role | TEXT CHECK IN ('principal','teacher') |
| full_name | TEXT |
| email | TEXT UNIQUE NULL |
| pin_hash | TEXT (Argon2id) |
| biometric_enrolled | INTEGER (0/1) |
| status | TEXT ('active','disabled') |
| created_at / updated_at / version | audit |

### `classes`
| Column | Type |
|--------|------|
| id | TEXT PK |
| tenant_id | FK |
| name | TEXT |
| grade | TEXT |
| section | TEXT |
| teacher_id | FK → users |
| deleted_at | INTEGER NULL |

### `students`
| Column | Type |
|--------|------|
| id | TEXT PK |
| tenant_id | FK |
| class_id | FK |
| roll_no | TEXT |
| full_name | TEXT |
| photo_uri | TEXT (points to encrypted file in app sandbox) |
| deleted_at | INTEGER NULL |
| UNIQUE(tenant_id, class_id, roll_no) |

### `face_embeddings`
| Column | Type |
|--------|------|
| id | TEXT PK |
| student_id | FK |
| vector | BLOB (encrypted with per-record IV) |
| dim | INTEGER (e.g., 128 or 512) |
| model_version | TEXT |
| quality | REAL (0-1) |
| captured_at | INTEGER |

### `sessions`
| Column | Type |
|--------|------|
| id | TEXT PK |
| class_id | FK |
| teacher_id | FK |
| period_label | TEXT ('P1','P2', …) |
| started_at | INTEGER |
| ended_at | INTEGER NULL |
| status | TEXT ('open','closed','cancelled') |

### `attendance_records`
| Column | Type |
|--------|------|
| id | TEXT PK |
| session_id | FK |
| student_id | FK |
| status | TEXT ('present','absent','late','excused') |
| marked_at | INTEGER |
| marked_by | FK → users |
| method | TEXT ('face','manual','override') |
| confidence | REAL NULL |
| UNIQUE(session_id, student_id) |

### `sync_queue`
| Column | Type |
|--------|------|
| id | TEXT PK |
| entity_type | TEXT |
| entity_id | TEXT |
| op | TEXT ('create','update','delete') |
| payload | TEXT (JSON) |
| attempts | INTEGER |
| next_try_at | INTEGER |
| last_error | TEXT NULL |

### `audit_log`
Immutable append-only; retained 90 days on device.

## 4. Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| attendance_records | (session_id) | roster load |
| attendance_records | (student_id, marked_at DESC) | student history |
| students | (class_id, deleted_at) | roster query |
| face_embeddings | (student_id) | recognition lookup |
| sync_queue | (next_try_at) | scheduler |
| sessions | (teacher_id, started_at DESC) | teacher dashboard |

## 5. Migrations

- Directory: `src/core/storage/sqlite/migrations/NNNN_description.sql`.
- Runner: sequential, idempotent, transactional; version stored in `_meta` table.
- Down migrations only in dev; forward-only in production.

## 6. Encryption

- DB file itself: SQLCipher pragma when the community expo plugin is added (Milestone 3); until then, sensitive columns (`vector`, `pin_hash`, `photo_uri`) are encrypted at column level with AES-GCM using a key stored in Secure Store.
- Rotation: key wrap pattern (data key encrypted by master key).

## 7. Data Retention

| Data | Retention |
|------|-----------|
| Attendance records | 3 academic years on device, forever on server |
| Face embeddings | Until student deleted or opt-out |
| Photos | Optional; can be purged after embedding generated |
| Audit log | 90 days local, forever server |
