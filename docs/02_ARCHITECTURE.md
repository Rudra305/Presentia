# 02 — Architecture

## 1. Guiding Patterns

- **Clean Architecture** — Domain in the center, frameworks at the edges.
- **SOLID** — enforced via ESLint boundaries + code review.
- **Feature-first** — code grouped by business capability, not by tech type.
- **Atomic Design** — UI primitives → molecules → organisms → templates → screens.
- **Repository Pattern** — data source abstraction (SQLite / MMKV / REST).
- **CQRS-lite** — commands mutate via use-cases, queries via React Query selectors.

## 2. Layered View

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  (Expo Router screens, RN components, NativeWind, RHF+Zod)      │
│  - Zustand UI stores (ephemeral state)                          │
│  - React Query hooks (server/cache state)                       │
└───────────────▲─────────────────────────────────────────────────┘
                │ calls use-cases (pure fns)
┌───────────────┴─────────────────────────────────────────────────┐
│                       Application Layer                         │
│  - Use-cases (CaptureAttendance, EnrollStudent, StartSession …) │
│  - DTOs & Zod schemas                                           │
│  - Ports (interfaces to repositories / services)                │
└───────────────▲─────────────────────────────────────────────────┘
                │ depends only on Domain
┌───────────────┴─────────────────────────────────────────────────┐
│                         Domain Layer                            │
│  - Entities (Student, Teacher, Session, AttendanceRecord …)     │
│  - Value Objects (FaceEmbedding, RollNumber, TimeWindow)        │
│  - Domain Services (SimilarityScorer, LivenessValidator)        │
│  - Errors (DomainError hierarchy)                               │
│  - **Zero framework imports**                                   │
└───────────────▲─────────────────────────────────────────────────┘
                │ implemented by
┌───────────────┴─────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  - SQLite repositories (expo-sqlite)                            │
│  - MMKV cache adapter                                           │
│  - SecureStore key vault                                        │
│  - Camera / TFLite adapter                                      │
│  - REST client (Phase 2)                                        │
│  - Logger, Crash reporter, Analytics                            │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** arrows point inward only. Domain has no imports from RN, Expo, or SQLite.

## 3. Module Diagram (Feature Slices)

```
app/
├─ features/
│  ├─ auth/              (biometric + PIN)
│  ├─ users/             (principal/teacher CRUD)
│  ├─ classes/           (class + roster)
│  ├─ students/          (enrollment + embeddings)
│  ├─ sessions/          (period lifecycle)
│  ├─ attendance/        (capture + review)
│  ├─ reports/           (aggregations + exports)
│  └─ sync/              (Phase 2)
├─ core/                 (cross-cutting)
│  ├─ domain/            (shared entities/VOs)
│  ├─ ui/                (atoms, molecules, tokens)
│  ├─ storage/           (sqlite, mmkv, securestore)
│  ├─ ml/                (face detect + embed adapter)
│  ├─ navigation/        (expo router helpers)
│  └─ utils/
└─ shared/               (types, constants, i18n)
```

## 4. Runtime Composition

```
                ┌─────────────────┐
                │  Expo Router    │
                │  (file-based)   │
                └────────┬────────┘
                         │ renders
                ┌────────▼────────┐
                │  Screens        │◄──── Zustand (UI state)
                │  (feature/ui)   │◄──── React Query (server cache)
                └────────┬────────┘
                         │ dispatch
                ┌────────▼────────┐
                │  Use-cases      │
                └────────┬────────┘
                  ports  │  ports
              ┌──────────┼──────────────┐
              ▼          ▼              ▼
         Repositories  Services      Adapters
         (SQLite)      (ML, Bio)     (Camera, Net)
```

## 5. SOLID Mapping

| Principle | Where enforced |
|-----------|----------------|
| **S**RP | One use-case = one intent (`captureAttendance`, not `captureAndEmail`). |
| **O**CP | New face-model backend added by implementing `FaceEmbedder` port; no core edits. |
| **L**SP | All repositories honor the same `Repository<T>` contract. |
| **I**SP | Ports split by concern (`AttendanceReader` vs `AttendanceWriter`). |
| **D**IP | Use-cases depend on ports; infra provides concretions via a lightweight DI container (`tsyringe` or manual factory). |

## 6. State Management Strategy

| State Kind | Tool | Example |
|-----------|------|---------|
| Server / cache | **React Query** | `useSessionsQuery`, `useAttendanceMutation` |
| Global UI | **Zustand** | current session id, camera mode |
| Ephemeral form | **React Hook Form + Zod** | student enrollment form |
| Fast key-value | **MMKV** | feature flags, last-sync-ts |
| Secure key-value | **Expo Secure Store** | JWT, PIN hash, DB encryption key |
| Structured relational | **Expo SQLite** | all entities |

## 7. Error Handling

- Domain errors extend `DomainError` with `code`, `message`, `cause`.
- Infra errors are wrapped at the boundary — never leak SQLite/Camera errors into UI.
- UI shows friendly copy via a central `useErrorToast` hook.
- All errors flow through a `Logger` port (console in dev, Sentry-ready in prod).

## 8. Testing Strategy

| Layer | Tool | Target |
|-------|------|--------|
| Domain | Jest (pure) | ≥ 90 % |
| Application | Jest + fake ports | ≥ 85 % |
| Infra | Jest + in-memory sqlite | ≥ 70 % |
| UI | React Native Testing Library | critical paths |
| E2E | Maestro (Phase 2) | happy-path per role |

## 9. Dependency Injection

- Manual composition root in `app/_layout.tsx` (kept explicit — no reflection).
- Ports are TypeScript interfaces; concretions live in `core/*/impl`.
- Test doubles swap concretions via a `TestProvider`.
