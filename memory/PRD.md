# PRD — Student Attendance System (Offline-First, React Native)

## Original Problem Statement
Build a production-grade, offline-first Student Attendance System with React Native + Expo (TypeScript), Clean Architecture / SOLID / Feature-first / Atomic Design, Repository Pattern, high scalability, reusability, and performance. Three roles: Principal, Teacher, Student. Principal/Teacher auth via device biometrics; Student attendance via camera face recognition. Deliver full planning first — no code — including SRS, architecture, folder structure, DB design, ER diagram, navigation/auth/attendance flows, roadmap, risk/performance/security/offline strategies.

## Phase
🟢 **Planning complete — awaiting user approval to start Milestone 1.** No source code exists yet by design.

## User Personas
- **Principal** — administers the institution, manages teachers/classes, reviews reports.
- **Teacher** — runs class sessions, enrolls students, captures attendance, overrides when needed.
- **Student** — passive subject of face-recognition attendance; no personal login.

## Core Requirements (Static)
- Offline-first; core flows work with no internet, indefinitely.
- Biometric auth for staff with PIN fallback.
- On-device face recognition for students.
- Clean Architecture + SOLID + Feature-first + Atomic Design.
- Every milestone must independently compile, ship a testing checklist, a Conventional Commit message, and a README update.
- No future milestone work leaks into current milestone.

## What's Been Implemented (with dates)
- **2026-01** — Complete planning package produced under `/app/docs/`:
  - `00_INDEX.md` (reading order + assumptions)
  - `01_SRS.md` (functional + non-functional requirements)
  - `02_ARCHITECTURE.md` (Clean Architecture, SOLID mapping, module diagram)
  - `03_FOLDER_STRUCTURE.md` (feature-first + atomic design tree)
  - `04_DATABASE_DESIGN.md` (SQLite schema, ER diagram, indexes, encryption)
  - `05_NAVIGATION_FLOW.md` (Expo Router tree + guards)
  - `06_AUTH_FLOW.md` (biometric + PIN + face recognition attendance)
  - `07_ATTENDANCE_FLOW.md` (end-to-end capture pipeline)
  - `08_ROADMAP.md` (12 milestones with DoD, test checklists, commit messages)
  - `09_RISK_ANALYSIS.md` (17 risks, top-5 watchlist)
  - `10_PERFORMANCE_STRATEGY.md` (budgets, FlashList, ML runtime)
  - `11_SECURITY_STRATEGY.md` (STRIDE, MASVS L1, privacy)
  - `12_OFFLINE_STRATEGY.md` (local-first, sync queue, conflict resolution)

## Prioritized Backlog

### P0 — Awaiting Approval
- **Milestone 1 — Project Bootstrap** (Expo TS + Router + NativeWind + tooling)

### P1 — Sequenced After Approval
- Milestone 2 — Design System Foundations
- Milestone 3 — Storage Layer (SQLite + MMKV + SecureStore)
- Milestone 4 — Authentication (Biometric + PIN)
- Milestone 5 — Principal: Users & Classes CRUD
- Milestone 6 — Teacher: Students + Face Enrollment (stub ML)
- Milestone 7 — Real ML (Vision Camera + TFLite)
- Milestone 8 — Session + Attendance Capture

### P2 — After Core Loop Works
- Milestone 9 — Reports & Analytics (offline)
- Milestone 10 — Sync Foundation (Phase 2 backend)
- Milestone 11 — Hardening (Security, A11y, i18n)
- Milestone 12 — Release Prep (EAS builds, store assets)

### Backlog (Post-v1)
- Parent portal, bulk CSV import, real-time notifications, multi-school SaaS admin, passive liveness/anti-spoof, web dashboard.

## Key Assumptions (documented in `/app/docs/00_INDEX.md`)
- Face recognition: on-device (TFLite / MediaPipe) primary; cloud is a Phase-2 hook.
- Backend: Node.js + Fastify + PostgreSQL introduced at Milestone 10.
- Scope: single-institution; DB carries `tenant_id` for future multi-tenancy.
- Runtime: Expo Managed with Dev Client (needed for Vision Camera frame processors).
- Targets: Android 8+ and iOS 14+.

## Next Tasks
1. **Get user approval on the planning package** and on the four assumptions above (or user's alternate choices).
2. Kick off **Milestone 1 — Project Bootstrap** on approval.
3. Do **not** implement any code until Milestone 1 is explicitly greenlit.
