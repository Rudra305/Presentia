# 08 — Feature Roadmap (12 Milestones)

Every milestone must:
1. Compile & launch on Android + iOS.
2. Be independently testable (checklist provided).
3. Update README with what changed.
4. Ship with a Conventional Commit message.
5. **Not leak into future milestones.**

---

## Milestone 1 — Project Bootstrap
**Goal:** Empty but production-ready Expo TS app that launches on device.

**Deliverables**
- Expo SDK (latest) + TypeScript + Expo Router.
- NativeWind + Tailwind config.
- ESLint + Prettier + Husky pre-commit + lint-staged.
- Path aliases (`@/*`) + strict `tsconfig`.
- `.env.example`, `app.config.ts` (dynamic).
- Basic providers: QueryClient, Theme, ErrorBoundary.
- CI stub (`typecheck` + `lint` + `jest`).

**Definition of Done**
- `expo start` opens app on both platforms.
- `yarn typecheck && yarn lint && yarn test` all green.
- README quick-start section added.

**Testing Checklist**
- [ ] App launches on Android emulator.
- [ ] App launches on iOS simulator.
- [ ] Tailwind class renders styled text.
- [ ] Lint + typecheck pass in CI.

**Commit**
`chore(bootstrap): initialize expo ts app with router, nativewind, tooling`

---

## Milestone 2 — Design System Foundations (Atomic)
**Goal:** Tokens + atoms + molecules; Storybook-in-app screen.

**Deliverables**
- `core/ui/tokens` (color, spacing, typography, radius, elevation, motion).
- Atoms: `Text`, `Button`, `Input`, `Icon`, `Badge`, `Divider`, `Spinner`.
- Molecules: `FormField`, `ListItem`, `EmptyState`, `Header`.
- Light/dark theme via NativeWind + `useColorScheme`.
- `/app/(dev)/kitchen-sink.tsx` (dev-only) to preview.

**DoD**
- All atoms/molecules render in kitchen sink.
- Contrast ratios ≥ 4.5:1 verified.
- No hard-coded hex values in features.

**Testing Checklist**
- [ ] Snapshot tests for each atom.
- [ ] Theme toggle swaps colors instantly.
- [ ] Screen readers announce labels.

**Commit**
`feat(ui): add design tokens and atomic primitives`

---

## Milestone 3 — Storage Layer (SQLite + MMKV + SecureStore)
**Goal:** Reliable, encrypted local storage with migrations.

**Deliverables**
- `core/storage/sqlite/db.ts` singleton + migration runner.
- Migrations `0001_init.sql` … creating all tables from §04.
- MMKV wrapper with typed keys.
- SecureStore wrapper (get/set/delete).
- Repository base class + `Repository<T>` interface.
- Column-level AES-GCM helper for sensitive fields.

**DoD**
- App boots and runs migrations idempotently.
- Sample repo (e.g., `TenantRepo`) demonstrates CRUD.
- Unit tests with in-memory sqlite pass.

**Testing Checklist**
- [ ] Fresh install: migration `0001` runs.
- [ ] Re-install same version: no re-run.
- [ ] Encrypted read/write round-trip.
- [ ] MMKV set/get typed values.

**Commit**
`feat(storage): sqlite migrations, mmkv and securestore adapters`

---

## Milestone 4 — Authentication (Biometric + PIN)
**Goal:** Principal/Teacher can enroll and log in offline.

**Deliverables**
- `features/auth/domain` entities & VOs.
- Use-cases: `enrollUser`, `loginBiometric`, `loginPin`, `logout`, `resetPin`.
- Screens: `(auth)/biometric.tsx`, `(auth)/pin.tsx`, enrollment wizard.
- `AuthGate` in root layout.
- Session JWT signed & stored in Secure Store.
- Lockout policy (3 bio fails → PIN; 5 PIN fails → 60 s lock).

**DoD**
- Fresh install → enroll principal → log out → log in via biometric AND via PIN.
- Session expiry re-prompts.

**Testing Checklist**
- [ ] Biometric success → home.
- [ ] Biometric cancel → stays.
- [ ] PIN wrong 5 times → lock 60 s.
- [ ] Kill & relaunch within TTL → no prompt.
- [ ] Kill & relaunch after TTL → prompt.

**Commit**
`feat(auth): biometric + pin login with lockout policy`

---

## Milestone 5 — User & Class Management (Principal)
**Goal:** Principal can CRUD teachers and classes.

**Deliverables**
- `features/users` (Teacher CRUD).
- `features/classes` (Class CRUD + teacher assignment).
- Principal dashboard skeleton with counts (from SQLite).
- FlashList for lists.

**DoD**
- Create/edit/disable teacher.
- Create class, assign teacher, unassign, delete (soft).
- Everything works offline.

**Testing Checklist**
- [ ] Create teacher with invalid email → Zod error.
- [ ] Assign teacher to class → visible on teacher's screen.
- [ ] Delete class → soft delete, not visible in list.

**Commit**
`feat(principal): teachers and classes crud with flashlist`

---

## Milestone 6 — Student Management + Face Enrollment (Teacher)
**Goal:** Teacher enrolls students and captures 3 face samples.

**Deliverables**
- `features/students` domain + use-cases (`enrollStudent`).
- Enrollment wizard: name + roll → camera → 3 sample captures.
- `core/ml` ports (`FaceDetector`, `FaceEmbedder`) with a **stub** implementation returning random-but-stable vectors for dev.
- `face_embeddings` persistence (encrypted).

**DoD**
- Full enrollment works end-to-end with stub embedder.
- Roster shows students with photos and enrollment status.

**Testing Checklist**
- [ ] Enroll student with 3 samples.
- [ ] Quality score displayed for each capture.
- [ ] Retake sample flow.
- [ ] Duplicate roll number rejected.

**Commit**
`feat(students): enrollment wizard with face samples (stub ml)`

---

## Milestone 7 — ML Integration (Real Face Detector + Embedder)
**Goal:** Replace stubs with real on-device ML.

**Deliverables**
- Integrate `react-native-vision-camera` + frame processors.
- Real face detector (MediaPipe / MLKit).
- Real embedder (bundled TFLite model, quantized).
- Benchmark: p95 embed latency < 400 ms on mid-range Android.
- Model versioning column populated.

**DoD**
- Same student produces stable vectors across captures.
- Different students → cosine sim < 0.5.
- Battery drain < 5 %/hour idle preview.

**Testing Checklist**
- [ ] Benchmark script prints p50/p95/p99 latency.
- [ ] Bundle size increase < 15 MB.
- [ ] Works with airplane mode ON.

**Commit**
`feat(ml): on-device face detection and embedding via tflite`

---

## Milestone 8 — Session + Attendance Capture
**Goal:** Teacher starts a session and marks attendance via camera.

**Deliverables**
- `features/sessions` + `features/attendance`.
- `sessions/new`, `sessions/[id]/capture`, `sessions/[id]/review`.
- Real-time recognition + haptic/sound feedback.
- Idempotent marking, manual override, session close.

**DoD**
- Enrolled student appears in front of camera → marked present within 1 s.
- Non-enrolled student → "unknown".
- Teacher can override before session closes.

**Testing Checklist**
- [ ] Auto-mark at score ≥ 0.85.
- [ ] Suggestion card at 0.72–0.85.
- [ ] Two students in frame → ignored.
- [ ] Kill mid-session → resume on relaunch.

**Commit**
`feat(attendance): live capture with recognition and manual override`

---

## Milestone 9 — Reports & Analytics (Offline)
**Goal:** Read-only aggregations for principal and teacher.

**Deliverables**
- SQL views for aggregations.
- Screens: attendance % per student, per class, per week.
- Simple offline charts (Victory Native XL or Skia).
- Empty & error states.

**DoD**
- Data matches raw records within ±0 rows.
- Renders 5 000 rows at 60 fps.

**Testing Checklist**
- [ ] Aggregation matches hand-computed.
- [ ] Chart renders in dark mode.
- [ ] Empty state when no sessions.

**Commit**
`feat(reports): offline aggregations and charts`

---

## Milestone 10 — Sync Foundation (Phase 2 begins)
**Goal:** Wire the backend contract; deltas flow both ways.

**Deliverables**
- `features/sync` engine reading `sync_queue`.
- Push: batched, retryable, exponential backoff.
- Pull: `since` cursor, page size 200.
- Conflict resolution: LWW per field with audit.
- Backend spec (OpenAPI) delivered even if server dev is parallel.

**DoD**
- App can sync while online; queues while offline; reconciles on resume.
- Idempotent on retry (server dedupes by client-generated UUID).

**Testing Checklist**
- [ ] Toggle airplane mode mid-sync → resumes cleanly.
- [ ] Two devices edit same record → last write wins, audit logged.
- [ ] Photo upload resumable.

**Commit**
`feat(sync): delta sync engine with conflict resolution`

---

## Milestone 11 — Hardening: Security, A11y, i18n
**Goal:** Ship-ready polish.

**Deliverables**
- SQLCipher pragma / DB encryption enabled.
- OWASP MASVS L1 checklist completed.
- Accessibility audit (labels, focus order, dynamic type).
- i18n scaffolding (`i18n-js` or `@formatjs/intl`).
- Localizable strings extracted.

**DoD**
- MASVS L1 all "yes" or documented waiver.
- Axe-like RN audit passes for critical screens.

**Testing Checklist**
- [ ] TalkBack/VoiceOver walkthrough.
- [ ] Static analysis (mobsfscan) clean.
- [ ] Language switch mid-session works.

**Commit**
`chore(hardening): encryption, a11y, i18n scaffolding`

---

## Milestone 12 — Release Prep
**Goal:** Store-ready builds.

**Deliverables**
- EAS Build profiles (dev, preview, production).
- App icon, splash, adaptive icons.
- Privacy manifest (iOS), data safety form (Play).
- Release notes template.
- Crash reporting (Sentry) opt-in.

**DoD**
- Store-ready `.apk`/`.aab` and iOS archive produced.
- README updated with release process.

**Testing Checklist**
- [ ] Install signed build on 2 physical devices.
- [ ] Cold start ≤ 2 s on mid-range Android.
- [ ] Crash-free session on smoke run.

**Commit**
`chore(release): eas profiles, store assets, crash reporting`

---

## Backlog (Post-v1)

- Parent portal (web).
- Bulk CSV import.
- Real-time push notifications.
- Multi-school SaaS admin.
- Passive liveness / anti-spoof.
- Web dashboard for principals.
