-- Migration 0002 — Hot-path indexes
-- Only add indexes that cover queries we know we'll run (per docs/04).

-- Attendance
CREATE INDEX ix_attendance_session          ON attendance_records(session_id);
CREATE INDEX ix_attendance_student_marked   ON attendance_records(student_id, marked_at DESC);
CREATE INDEX ix_attendance_sync_status      ON attendance_records(sync_status);

-- Students
CREATE INDEX ix_students_class_active       ON students(class_id, deleted_at);
CREATE INDEX ix_students_tenant_active      ON students(tenant_id, deleted_at);

-- Face embeddings
CREATE INDEX ix_embeddings_student          ON face_embeddings(student_id);

-- Sessions
CREATE INDEX ix_sessions_teacher_started    ON sessions(teacher_id, started_at DESC);
CREATE INDEX ix_sessions_class_started      ON sessions(class_id, started_at DESC);

-- Classes
CREATE INDEX ix_classes_tenant_active       ON classes(tenant_id, deleted_at);
CREATE INDEX ix_classes_teacher             ON classes(teacher_id) WHERE teacher_id IS NOT NULL;

-- Users
CREATE INDEX ix_users_tenant_role           ON users(tenant_id, role, deleted_at);

-- Sync queue scheduler
CREATE INDEX ix_sync_queue_next_try         ON sync_queue(next_try_at);

-- Audit log lookups
CREATE INDEX ix_audit_entity                ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX ix_audit_tenant_created        ON audit_log(tenant_id, created_at DESC);
