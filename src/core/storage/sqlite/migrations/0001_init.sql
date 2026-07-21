-- Migration 0001 — Initial schema
-- All entities carry: audit columns (created_at, updated_at, version),
-- sync columns (sync_status, remote_id, last_synced_at), and — where the
-- planning doc calls for it — soft deletes (deleted_at).

PRAGMA foreign_keys = ON;

-- ─── Meta ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS _meta (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

-- ─── Tenants ───────────────────────────────────────────────────────────

CREATE TABLE tenants (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL,
    code       TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    version    INTEGER NOT NULL DEFAULT 1
);

-- ─── Users (Principal / Teacher) ───────────────────────────────────────

CREATE TABLE users (
    id                  TEXT PRIMARY KEY NOT NULL,
    tenant_id           TEXT NOT NULL,
    role                TEXT NOT NULL CHECK (role IN ('principal','teacher')),
    full_name           TEXT NOT NULL,
    email               TEXT,
    pin_hash            TEXT,
    biometric_enrolled  INTEGER NOT NULL DEFAULT 0 CHECK (biometric_enrolled IN (0,1)),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
    created_at          INTEGER NOT NULL,
    updated_at          INTEGER NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    deleted_at          INTEGER,
    sync_status         TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','conflict')),
    remote_id           TEXT,
    last_synced_at      INTEGER,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ux_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;

-- ─── Classes ───────────────────────────────────────────────────────────

CREATE TABLE classes (
    id             TEXT PRIMARY KEY NOT NULL,
    tenant_id      TEXT NOT NULL,
    name           TEXT NOT NULL,
    grade          TEXT,
    section        TEXT,
    teacher_id     TEXT,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    deleted_at     INTEGER,
    sync_status    TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','conflict')),
    remote_id      TEXT,
    last_synced_at INTEGER,
    FOREIGN KEY (tenant_id)  REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE SET NULL
);

-- ─── Students ──────────────────────────────────────────────────────────

CREATE TABLE students (
    id             TEXT PRIMARY KEY NOT NULL,
    tenant_id      TEXT NOT NULL,
    class_id       TEXT NOT NULL,
    roll_no        TEXT NOT NULL,
    full_name      TEXT NOT NULL,
    photo_uri      TEXT,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    deleted_at     INTEGER,
    sync_status    TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','conflict')),
    remote_id      TEXT,
    last_synced_at INTEGER,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, class_id, roll_no)
);

-- ─── Face embeddings ───────────────────────────────────────────────────

CREATE TABLE face_embeddings (
    id            TEXT PRIMARY KEY NOT NULL,
    student_id    TEXT NOT NULL,
    vector        BLOB NOT NULL,
    dim           INTEGER NOT NULL,
    model_version TEXT NOT NULL,
    quality       REAL NOT NULL DEFAULT 0,
    captured_at   INTEGER NOT NULL,
    created_at    INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─── Sessions ──────────────────────────────────────────────────────────

CREATE TABLE sessions (
    id             TEXT PRIMARY KEY NOT NULL,
    class_id       TEXT NOT NULL,
    teacher_id     TEXT NOT NULL,
    period_label   TEXT,
    started_at     INTEGER NOT NULL,
    ended_at       INTEGER,
    status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    deleted_at     INTEGER,
    sync_status    TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','conflict')),
    remote_id      TEXT,
    last_synced_at INTEGER,
    FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE RESTRICT
);

-- ─── Attendance records ────────────────────────────────────────────────

CREATE TABLE attendance_records (
    id             TEXT PRIMARY KEY NOT NULL,
    session_id     TEXT NOT NULL,
    student_id     TEXT NOT NULL,
    status         TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
    marked_at      INTEGER NOT NULL,
    marked_by      TEXT NOT NULL,
    method         TEXT NOT NULL CHECK (method IN ('face','manual','override')),
    confidence     REAL,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    version        INTEGER NOT NULL DEFAULT 1,
    deleted_at     INTEGER,
    sync_status    TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','conflict')),
    remote_id      TEXT,
    last_synced_at INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by)  REFERENCES users(id)    ON DELETE RESTRICT,
    UNIQUE (session_id, student_id)
);

-- ─── Sync queue ────────────────────────────────────────────────────────

CREATE TABLE sync_queue (
    id           TEXT PRIMARY KEY NOT NULL,
    entity_type  TEXT NOT NULL,
    entity_id    TEXT NOT NULL,
    op           TEXT NOT NULL CHECK (op IN ('create','update','delete')),
    payload      TEXT NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    next_try_at  INTEGER NOT NULL,
    last_error   TEXT,
    created_at   INTEGER NOT NULL
);

-- ─── Audit log ─────────────────────────────────────────────────────────

CREATE TABLE audit_log (
    id           TEXT PRIMARY KEY NOT NULL,
    tenant_id    TEXT NOT NULL,
    actor_id     TEXT,
    action       TEXT NOT NULL,
    entity_type  TEXT NOT NULL,
    entity_id    TEXT NOT NULL,
    diff         TEXT,
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id)  REFERENCES users(id)   ON DELETE SET NULL
);
