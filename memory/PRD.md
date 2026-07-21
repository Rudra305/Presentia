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
- **2026-01** — Complete planning package produced under `/app/docs/` (13 documents).
- **2026-01** — **Milestone 1 — Project Bootstrap ✅**
  - Expo SDK 57 + React 19 + React Native 0.86 + `expo-router` (typed routes)
  - TypeScript strict (`noUncheckedIndexedAccess`, `noImplicitOverride`) + absolute imports `@/*` → `src/*`
  - NativeWind v4 + Tailwind 3.4 (metro/babel/tailwind/global.css wired)
  - ESLint flat config (`eslint-config-expo`) + Prettier + `.editorconfig`
  - Environment variables via `EXPO_PUBLIC_*` prefix, typed façade at `src/config/env.ts`
  - Splash screen configured via `expo-splash-screen`
  - Minimal shell only: `src/app/_layout.tsx` + `src/app/index.tsx` (**no business logic** by design)
  - Verified: `yarn typecheck` ✅ · `yarn lint` ✅ · `yarn format:check` ✅ · `expo export` ✅ (1576 modules)
  - Git commit: `chore(bootstrap): initialize expo ts app with router, nativewind, eslint, prettier, env, splash`

## Prioritized Backlog

### P0 — Awaiting Approval
- **Authentication** — biometric + PIN + JWT session token, using the now-available SecureStore/SQLite plumbing.

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
