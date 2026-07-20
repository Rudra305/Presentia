# 03 — Folder Structure

Feature-first on the outside, Atomic Design inside UI, Clean Architecture inside each feature.

```
attendance-app/
├─ app/                              # Expo Router routes (thin, no logic)
│  ├─ _layout.tsx                    # Root providers + DI composition
│  ├─ index.tsx                      # Splash / redirect
│  ├─ (auth)/
│  │  ├─ _layout.tsx
│  │  ├─ biometric.tsx
│  │  └─ pin.tsx
│  ├─ (principal)/
│  │  ├─ _layout.tsx
│  │  ├─ dashboard.tsx
│  │  ├─ teachers/index.tsx
│  │  ├─ classes/index.tsx
│  │  └─ reports/index.tsx
│  ├─ (teacher)/
│  │  ├─ _layout.tsx
│  │  ├─ classes/index.tsx
│  │  ├─ classes/[id]/roster.tsx
│  │  ├─ sessions/new.tsx
│  │  ├─ sessions/[id]/capture.tsx
│  │  └─ sessions/[id]/review.tsx
│  └─ +not-found.tsx
│
├─ src/
│  ├─ features/                      # Feature slices
│  │  ├─ auth/
│  │  │  ├─ domain/                  # entities, VOs, errors
│  │  │  ├─ application/             # use-cases, ports
│  │  │  ├─ infrastructure/          # biometric adapter, pin repo
│  │  │  └─ ui/                      # feature-specific components
│  │  ├─ users/
│  │  ├─ classes/
│  │  ├─ students/
│  │  │  ├─ domain/
│  │  │  │  ├─ Student.ts
│  │  │  │  └─ FaceEmbedding.ts      # value object
│  │  │  ├─ application/
│  │  │  │  ├─ ports/StudentRepo.ts
│  │  │  │  └─ usecases/enrollStudent.ts
│  │  │  ├─ infrastructure/
│  │  │  │  └─ SqliteStudentRepo.ts
│  │  │  └─ ui/
│  │  ├─ sessions/
│  │  ├─ attendance/
│  │  ├─ reports/
│  │  └─ sync/                       # Phase 2
│  │
│  ├─ core/                          # cross-cutting
│  │  ├─ domain/                     # shared VOs, base classes
│  │  ├─ ui/                         # Atomic Design tokens + primitives
│  │  │  ├─ tokens/                  # colors, spacing, typography
│  │  │  ├─ atoms/                   # Text, Button, Icon, Input, Badge
│  │  │  ├─ molecules/               # FormField, ListItem, EmptyState
│  │  │  ├─ organisms/               # Header, SessionCard, RosterList
│  │  │  ├─ templates/               # ScreenShell, TabShell
│  │  │  └─ theme/                   # NativeWind config + dark mode
│  │  ├─ storage/
│  │  │  ├─ sqlite/                  # db.ts, migrations/, query helpers
│  │  │  ├─ mmkv/
│  │  │  └─ securestore/
│  │  ├─ ml/
│  │  │  ├─ FaceDetector.ts          # port
│  │  │  ├─ FaceEmbedder.ts          # port
│  │  │  └─ impl/                    # tflite / mediapipe adapters
│  │  ├─ navigation/
│  │  ├─ network/                    # Phase 2 (fetch client, retry)
│  │  ├─ logger/
│  │  └─ utils/
│  │
│  ├─ shared/
│  │  ├─ types/
│  │  ├─ constants/
│  │  ├─ i18n/
│  │  └─ testing/                    # test doubles, factories
│  │
│  └─ providers/                     # React providers wiring DI + stores
│     ├─ QueryProvider.tsx
│     ├─ ThemeProvider.tsx
│     └─ DbProvider.tsx
│
├─ assets/                           # fonts, images, tflite models
│  ├─ fonts/
│  ├─ images/
│  └─ ml/facenet.tflite              # bundled model (Phase 3)
│
├─ scripts/                          # migrations, codegen, release
├─ .env.example
├─ app.json / app.config.ts
├─ babel.config.js
├─ tailwind.config.js
├─ tsconfig.json
├─ package.json
├─ README.md
└─ docs/                             # this planning package
```

## Naming Conventions

- Files & folders: `kebab-case` for routes, `PascalCase` for components, `camelCase` for functions.
- Ports (interfaces): `Something.ts` in `application/ports/`.
- Concretions: `<Adapter><Port>.ts` e.g., `SqliteStudentRepo.ts`.
- Use-cases: verb-first, one export per file: `enrollStudent.ts` exports `enrollStudent()`.
- Tests colocated: `enrollStudent.test.ts` beside implementation.

## Import Boundaries (enforced by ESLint `import/no-restricted-paths`)

- `features/*/domain` **may not** import from anything except `core/domain` and `shared/types`.
- `features/*/application` **may not** import from `infrastructure` or `ui`.
- `app/**` **may not** contain business logic — only wire up hooks/use-cases.
