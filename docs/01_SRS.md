# 01 — Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
Define functional and non-functional requirements for an **offline-first Student Attendance System** that lets teachers mark attendance via student face recognition, and lets principals oversee the institution — all working reliably without internet.

### 1.2 Scope
- Mobile-only (React Native + Expo, TypeScript).
- Three roles: **Principal**, **Teacher**, **Student**.
- Face ID / Fingerprint for staff auth; **Camera-based face recognition** for student attendance.
- Local-first SQLite storage; opt-in cloud sync (Phase 2).

### 1.3 Definitions
| Term | Meaning |
|------|---------|
| PII | Personally Identifiable Information (name, face embedding, etc.) |
| Embedding | 128-d or 512-d float vector representing a face |
| Session | A single class period during which attendance is captured |
| Roster | The list of students enrolled in a class |
| Sync | Bidirectional reconciliation of local ↔ server data |

## 2. Overall Description

### 2.1 Product Perspective
Standalone RN app that can operate indefinitely offline. When connectivity returns, it syncs deltas to an optional backend.

### 2.2 User Classes
| Role | Auth | Primary Actions |
|------|------|-----------------|
| Principal | Biometric (Face/Fingerprint) | View institution-wide dashboards, manage teachers & classes, export reports |
| Teacher | Biometric | Create session, enroll students, capture attendance, view/edit their classes |
| Student | Face recognition (no explicit login) | Get marked present by camera; view own attendance history via QR-linked read-only view (Phase 2) |

### 2.3 Operating Environment
- **Android**: 8.0+ (API 26+), ARMv8, ≥ 2 GB RAM
- **iOS**: 14+, A11 Bionic+
- **Camera**: Rear + Front, autofocus, ≥ 720p

### 2.4 Constraints
- Must compile on **Expo SDK (latest)** with Dev Client.
- Face embeddings never leave device unencrypted.
- App size budget: **< 60 MB** installed (excluding ML model).

## 3. Functional Requirements

### FR-1 Authentication
- FR-1.1 Principal/Teacher can enroll biometric on first launch.
- FR-1.2 Re-auth required after 15 min of inactivity or app cold-start.
- FR-1.3 Fallback PIN (6-digit) if biometrics unavailable/locked out.

### FR-2 User & Class Management (Principal)
- FR-2.1 CRUD teachers.
- FR-2.2 CRUD classes and assign teachers.
- FR-2.3 View aggregated attendance % per class/teacher.

### FR-3 Student Management (Teacher)
- FR-3.1 Enroll student with name, roll no., photo, and **3 face samples**.
- FR-3.2 Generate face embedding on device; store encrypted.
- FR-3.3 Bulk import via CSV (Phase 2).

### FR-4 Attendance Capture (Teacher)
- FR-4.1 Start a **Session** bound to (class_id, date, period).
- FR-4.2 Live camera preview with face-detection overlay.
- FR-4.3 On successful match (cosine similarity ≥ threshold), mark student **Present**; play sound + haptic.
- FR-4.4 Anti-spoof: liveness check (blink / head-turn) — Phase 2 hook.
- FR-4.5 Manual override: teacher can toggle any student's status.
- FR-4.6 Session auto-closes after configurable timeout (default 15 min).

### FR-5 Reporting
- FR-5.1 Per-student, per-class, per-date reports.
- FR-5.2 CSV / PDF export (Phase 2).
- FR-5.3 Offline-viewable charts (attendance trend, top absentees).

### FR-6 Sync (Phase 2, Milestone 10+)
- FR-6.1 Delta-based push/pull over HTTPS with JWT.
- FR-6.2 Conflict resolution: last-writer-wins per field, with audit log.
- FR-6.3 Retry with exponential backoff; resumable uploads for photos.

## 4. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Cold start | ≤ 2.0 s on mid-range Android |
| Performance | Face match latency | ≤ 400 ms per frame |
| Performance | FlashList scroll | 60 fps for 5 000+ rows |
| Reliability | Crash-free sessions | ≥ 99.5 % |
| Availability | Offline uptime | 100 % of core flows |
| Security | Data at rest | AES-256 (SQLite via SQLCipher hook + Secure Store keys) |
| Security | Biometric fallback | PIN mandatory |
| Usability | Tap target | ≥ 44 pt |
| Accessibility | WCAG 2.1 | AA (contrast, screen-reader labels) |
| Localization | Languages | EN + one RTL-ready slot (Phase 2) |
| Scalability | Students / device | 10 000 without perf degradation |
| Maintainability | Cyclomatic complexity | ≤ 10 per fn; ≤ 300 LOC per file |
| Testability | Unit coverage | ≥ 80 % on domain + data layers |

## 5. External Interface Requirements

### 5.1 Hardware Interfaces
- Camera (Expo Camera + Vision Camera frame processors)
- Biometric sensor (Expo Local Authentication)
- Secure Enclave / Keystore (Expo Secure Store)

### 5.2 Software Interfaces (Phase 2)
- REST JSON API (Node.js + Fastify)
- Object storage for photos (S3-compatible, optional)

## 6. Out of Scope (v1)
- Parent portal
- Multi-school SaaS admin
- Real-time notifications to students
- Web dashboard
