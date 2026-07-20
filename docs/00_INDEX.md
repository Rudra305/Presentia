# Student Attendance System — Planning Package

> **Status:** Planning Phase (No code yet)
> **Owner:** Lead Architect / Senior RN Engineer
> **Last Updated:** Jan 2026

This directory contains the complete pre-implementation blueprint for a production-grade,
offline-first Student Attendance System built with React Native + Expo (TypeScript).

## Reading Order

| # | Document | Purpose |
|---|----------|---------|
| 01 | [SRS.md](./01_SRS.md) | Software Requirements Specification (functional + non-functional) |
| 02 | [ARCHITECTURE.md](./02_ARCHITECTURE.md) | Clean Architecture layers, SOLID mapping, module diagram |
| 03 | [FOLDER_STRUCTURE.md](./03_FOLDER_STRUCTURE.md) | Feature-first + Atomic Design folder tree |
| 04 | [DATABASE_DESIGN.md](./04_DATABASE_DESIGN.md) | SQLite schema, indexes, migrations, ER diagram |
| 05 | [NAVIGATION_FLOW.md](./05_NAVIGATION_FLOW.md) | Expo Router tree, role-based routing, deep links |
| 06 | [AUTH_FLOW.md](./06_AUTH_FLOW.md) | Biometric auth (Principal/Teacher) + Face recognition (Student) |
| 07 | [ATTENDANCE_FLOW.md](./07_ATTENDANCE_FLOW.md) | End-to-end capture → recognize → persist → sync |
| 08 | [ROADMAP.md](./08_ROADMAP.md) | 12 milestones with acceptance criteria & Git messages |
| 09 | [RISK_ANALYSIS.md](./09_RISK_ANALYSIS.md) | Risk register + mitigation |
| 10 | [PERFORMANCE_STRATEGY.md](./10_PERFORMANCE_STRATEGY.md) | FlashList, MMKV, memoization, cold-start budget |
| 11 | [SECURITY_STRATEGY.md](./11_SECURITY_STRATEGY.md) | Threat model, encryption, PII handling, OWASP MASVS |
| 12 | [OFFLINE_STRATEGY.md](./12_OFFLINE_STRATEGY.md) | Local-first CRDT-lite sync, conflict resolution, queue |

## Guiding Principles

1. **Offline is the default** — the app must be 100% usable with airplane mode.
2. **One milestone at a time** — no future work leaks into current milestone.
3. **Every milestone ships compilable code** — even if UI is stubbed.
4. **Test-first mindset** — testing checklist accompanies every milestone.
5. **Zero technical debt tolerance** — refactor early, refactor small.

## Assumptions (Ratified During Planning)

- **Face recognition**: On-device (TensorFlow Lite via `react-native-fast-tflite` or MediaPipe FaceMesh via `react-native-vision-camera` frame processors). Cloud fallback is a **Phase 2** hook, not a hard dependency.
- **Backend for sync**: Node.js + Fastify + PostgreSQL with a REST + JWT contract. Introduced in **Milestone 10**. Until then, the app is fully local.
- **Scope**: Single institution per install; DB schema includes `tenant_id` for future multi-tenant SaaS.
- **Target platforms**: Android 8+ (API 26) and iOS 14+.
- **Managed vs Bare**: Expo **Managed with Dev Client** (custom native modules required for TFLite + Vision Camera frame processors).

## How to Use This Package

- Do **not** start coding until the user approves Milestone 1's plan (see `08_ROADMAP.md`).
- Each milestone in the roadmap has its own **"Definition of Done"**, **testing checklist**, and **commit message template**.
- README at repo root will be regenerated at the end of each milestone.
