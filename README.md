# Attendance App

Offline-first Student Attendance System built with **Expo (SDK 54) + React Native + TypeScript**.

Current status: **Milestone 6 — Student Management & Face Enrollment Wizard ✅**
Full planning package lives in [`docs/`](./docs/00_INDEX.md).

---

## Student Management & Face Enrollment (Milestone 6)

Full CRUD for student records, class roster filtering, duplicate roll number validation, clean ML ports (`FaceDetector`, `FaceEmbedder`) with stub implementations, and interactive 3-step face vector sample enrollment wizard.

```
src/core/ml/
├─ types.ts              # Core ML interfaces (FaceDetector, FaceEmbedder, FaceEmbedding, FaceDetectionResult)
├─ stub.ts               # Stub implementations & cosine similarity helper
├─ index.ts              # Barrel exports
└─ __tests__/stub.test.ts# Unit tests for ML detector, embedder & vector math (5 tests)

src/features/students/
├─ repo.ts               # StudentRepo extending BaseRepository (listWithDetails, search, checkRollNoUnique, createWithEmbeddings)
├─ schemas.ts            # Zod validation schema (studentFormSchema)
├─ StudentCard.tsx       # Roster item card component with enrollment status badges
├─ EnrollmentWizard.tsx  # 3-step student enrollment wizard modal with stub face sample capture
├─ index.ts              # Barrel exports
└─ __tests__/repo.test.ts# Jest unit tests with SQLite in-memory adapter (5 tests)

src/app/teacher/students/
└─ index.tsx             # Teacher student roster screen with search, class filter pills & enrollment trigger

src/app/principal/students/
└─ index.tsx             # Shared principal access to student roster & enrollment wizard
```

Run tests:

```bash
npm test              # 60 tests in 10 test suites passing
npm run typecheck     # tsc --noEmit (strict)
npm run lint          # ESLint flat config
```

---

## Class Management (Phase 5)

Full CRUD for institution classes, teacher assignment, and dynamic student count aggregations.

```
src/features/classes/
├─ repo.ts               # ClassRepo extending BaseRepository (findWithDetails, search, assignTeacher)
├─ schemas.ts            # Zod validation schema (classFormSchema, ClassFormValues)
├─ ClassForm.tsx         # Reusable form component with teacher selector tile strip
├─ index.ts              # Barrel exports
└─ __tests__/repo.test.ts# Jest unit tests with SQLite in-memory adapter
```

---

## Storage Layer (Phase 4)

Offline-first SQLite with a common adapter surface for **the same SQL to run on device (expo-sqlite) and in tests (better-sqlite3)**.

```
src/core/storage/sqlite/
├─ adapter.ts               # SQLiteAdapter interface
├─ adapters/
│  ├─ ExpoSQLiteAdapter.ts  # Production (WAL + foreign_keys ON)
│  └─ BetterSqliteAdapter.ts# Tests (Node, better-sqlite3)
├─ db.ts                    # getDb() singleton — opens + runs migrations
├─ BaseRepository.ts        # Generic CRUD + audit + soft delete + sync
└─ migrations/
   ├─ 0001_init.sql         # 10 tables
   └─ 0002_indexes.sql      # 14 hot-path indexes
```

---

## Navigation (Phase 3)

File-based routing via Expo Router with four role-based stacks and typed guards.

```
src/app/
├─ _layout.tsx           # Root providers + ErrorBoundary + Stack
├─ index.tsx             # Boot redirect (role-aware)
├─ +not-found.tsx        # 404
├─ auth/                 # Public — Authentication stack
├─ principal/            # Protected — role === 'principal' (dashboard, teachers, classes, students, reports)
├─ teacher/              # Protected — role === 'teacher' (classes, students, sessions, settings)
└─ shared/               # Protected — any authenticated role
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env

# 3. Start Metro
npm start           # then press i / a / w
```

## Scripts

| Command                           | What it does                  |
| --------------------------------- | ----------------------------- |
| `npm start`                       | Start Metro / Expo dev server |
| `npm run android` / `npm run ios` | Open on simulator/emulator    |
| `npm run lint`                    | Run ESLint (flat config)      |
| `npm run format`                  | Prettier write all sources    |
| `npm run typecheck`               | `tsc --noEmit`                |
| `npm test`                        | Run Jest unit test suite      |

---

## Testing Checklist — Milestone 6

- [x] `FaceDetector` & `FaceEmbedder` ports defined with `StubFaceDetector` & `StubFaceEmbedder` implementations.
- [x] Cosine similarity helper verified for unit normalized Float32Array vectors.
- [x] `StudentRepo.checkRollNoUnique()` prevents duplicate roll numbers per class.
- [x] `StudentRepo.createWithEmbeddings()` transactionally saves student record and 3 face embeddings into SQLite.
- [x] `StudentCard` displays enrollment status badges (Enrolled 3/3, Incomplete, Not Enrolled).
- [x] `EnrollmentWizard` leads user through Step 1 (Info) -> Step 2 (3 Face Samples) -> Step 3 (Confirmation).
- [x] `npm test` passes 60/60 unit tests across 10 suites.
- [x] `npm run typecheck` passes with zero errors.
- [x] `npm run lint` passes cleanly.

## Recommended Next Phase

**Milestone 7 — ML Integration (Real Face Detector + Embedder)** (Replacing stubs with on-device MediaPipe/MLKit face detector & quantized TFLite embedder models via vision-camera frame processors).
