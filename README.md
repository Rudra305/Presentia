# Attendance App

Offline-first Student Attendance System built with **Expo (SDK 57) + React Native + TypeScript**.

Current status: **Milestone 2 — Design System Foundations ✅**
Full planning package lives in [`docs/`](./docs/00_INDEX.md).

---

## Design System (Milestone 2)

Reusable primitives live under `src/core/ui/`.

```
src/core/ui/
├─ tokens/
│  ├─ colors.ts       # palette + light/dark semantic maps (TS mirror of CSS vars)
│  ├─ spacing.ts      # 4-pt scale
│  ├─ typography.ts   # Plus Jakarta Sans + sizes/line-heights/weights
│  ├─ radius.ts       # xs → 2xl + full
│  ├─ elevation.ts    # platform-aware shadows
│  └─ motion.ts       # durations + easing curves
├─ theme/
│  ├─ ThemeProvider.tsx   # wraps NativeWind colorScheme (system/light/dark)
│  └─ useTheme            # { mode, theme, colors, setMode, toggle }
├─ atoms/
│  ├─ Text.tsx    # 9 variants × 7 tones
│  ├─ Button.tsx  # 4 variants × 3 sizes, loading, icons, a11y
│  ├─ Input.tsx   # label + helper/error + focus/error state
│  ├─ Icon.tsx    # Feather wrapper, semantic tone
│  └─ Loader.tsx  # inline or fullscreen
└─ molecules/
   ├─ Card.tsx    # bordered surface × padding × elevation, optional pressable
   └─ Modal.tsx   # backdrop + centered card, 4 sizes, hardware-back
```

Import everything from a single barrel:

```ts
import { Button, Card, Input, Loader, Modal, Text, useTheme } from '@/core/ui';
```

Colors are semantic and driven by CSS custom properties in `src/global.css`.
Toggling the theme (`useTheme().toggle()`) swaps the `:root.dark` scope which
in turn re-resolves every NativeWind class using `bg-*`, `text-*`, or
`border-*` tokens — no component-level dark logic required.

---

## Stack (wired in Milestone 1)

| Concern          | Choice                                          |
| ---------------- | ----------------------------------------------- |
| Framework        | Expo SDK 57, React 19, React Native 0.86        |
| Router           | `expo-router` (file-based, typed routes)        |
| Language         | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling          | NativeWind v4 (Tailwind v3.4)                   |
| Absolute imports | `@/*` → `src/*`, `@/assets/*` → `assets/*`      |
| Env vars         | `EXPO_PUBLIC_*` via `src/config/env.ts`         |
| Splash           | `expo-splash-screen` (dark brand)               |
| Lint / Format    | ESLint (flat, `eslint-config-expo`) + Prettier  |
| Editor           | `.editorconfig`                                 |

> Business logic, features, and the design system land in later milestones — see [`docs/08_ROADMAP.md`](./docs/08_ROADMAP.md).

---

## Prerequisites

- Node 20+
- Yarn 1.x (or npm 10+)
- iOS: Xcode 15+ (macOS)
- Android: Android Studio + SDK 34
- Expo Go on device _or_ a Dev Client build (Dev Client becomes mandatory in Milestone 7 when native ML modules are added).

## Quick Start

```bash
# 1. Install
yarn install

# 2. Copy env template
cp .env.example .env

# 3. Start Metro
yarn start           # then press i / a / w
# or
yarn ios
yarn android
```

## Scripts

| Command                     | What it does                  |
| --------------------------- | ----------------------------- |
| `yarn start`                | Start Metro / Expo dev server |
| `yarn ios` / `yarn android` | Open on simulator/emulator    |
| `yarn lint`                 | Run ESLint (flat config)      |
| `yarn format`               | Prettier write all sources    |
| `yarn format:check`         | Prettier check (CI-friendly)  |
| `yarn typecheck`            | `tsc --noEmit`                |

## Environment Variables

Only `EXPO_PUBLIC_*` variables are exposed to the mobile bundle. Access them
through the typed façade — never `process.env` directly:

```ts
import { env, isDev } from '@/config/env';

console.log(env.apiBaseUrl, env.appEnv, isDev);
```

Add new vars to both `.env.example` and `src/config/env.ts`.

## Project Layout (Milestone 1)

```
attendance-app/
├─ app.json                # Expo config
├─ babel.config.js         # babel-preset-expo + nativewind/babel
├─ metro.config.js         # withNativeWind wrapper
├─ tailwind.config.js
├─ eslint.config.js        # flat config
├─ tsconfig.json
├─ .prettierrc.json  .editorconfig  .env.example
├─ assets/                 # icons, splash, images
├─ src/
│  ├─ app/                 # Expo Router routes
│  │  ├─ _layout.tsx       # Root providers + splash gate
│  │  └─ index.tsx         # Bootstrap shell (NativeWind smoke test)
│  ├─ config/
│  │  └─ env.ts            # Typed env façade
│  └─ global.css           # Tailwind directives
└─ docs/                   # Planning package (SRS, architecture, roadmap, …)
```

The full target layout (features/, core/, shared/) is in
[`docs/03_FOLDER_STRUCTURE.md`](./docs/03_FOLDER_STRUCTURE.md) and will be
grown milestone-by-milestone — no upfront empty folders.

## Testing Checklist — Milestone 1

- [ ] `yarn install` succeeds cleanly.
- [ ] `yarn typecheck` passes.
- [ ] `yarn lint` passes.
- [ ] `yarn format:check` passes.
- [ ] `yarn start` boots Metro; the bootstrap screen renders with NativeWind classes applied (title + subtitle).
- [ ] Dark mode automatically flips background/text (toggle simulator appearance).
- [ ] Splash screen is visible on cold start and hides after mount.
- [ ] Deep link `attendanceapp://` opens the app (once installed via Dev Client).

## Commit

```
chore(bootstrap): initialize expo ts app with router, nativewind, eslint, prettier, env, splash
```

## Next Milestone

**Milestone 3 — Storage Layer** (SQLite migrations + MMKV + Secure Store adapters).
Do **not** start it until Milestone 2 is reviewed and approved.
