# Student Attendance Mobile Application

Offline-first, on-device AI-powered Student Attendance System built with **Expo (SDK 54) + React Native 0.81 + TypeScript**.

Current Status: **Milestone 11 — Hardening: Security, A11y, i18n Completed ✅**  
Full Roadmap & Architecture Specifications live in [`docs/`](./docs/00_INDEX.md).

---

## 🚀 Quick Start & Development Setup Guide

### Prerequisites

Before running the application, make sure your development environment includes:

1. **Node.js**: v18.0.0 or higher (`node -v`)
2. **Package Manager**: `npm` or `yarn`
3. **Android Development Tools**:
    - Android Studio with Android SDK (API 34/35) & Build Tools.
    - `ANDROID_HOME` set in system Environment Variables (e.g. `C:\Users\<User>\AppData\Local\Android\Sdk`).
    - ADB added to PATH (`platform-tools`).

---

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/Rudra305/student_attendance.git
cd student_attendance

# 2. Install dependencies
npm install

# 3. Copy Environment Configuration
cp .env.example .env
```

---

### 📱 Running on Physical Android Device via USB Debugging

1. **Enable USB Debugging on your Phone:**
    - Go to **Settings $\rightarrow$ About Phone $\rightarrow$ Tap "Build Number" 7 times** to unlock Developer Options.
    - Go to **Developer Options $\rightarrow$ Enable "USB Debugging"**.
2. **Connect Device via USB Cable:**
    - Connect your physical Android phone to your PC via USB cable.
    - Accept the _"Allow USB Debugging?"_ prompt on your phone screen.
3. **Verify ADB Connection:**

    ```bash
    adb devices
    ```

    _(Your device serial number e.g. `CPH2401` should appear listed as `device`)_.

4. **Launch Application:**
    ```bash
    npm run android
    # or
    yarn android
    ```
    _This automatically builds the native APK and deploys it directly to your connected physical Android phone!_

---

### 🔍 Debugging & Inspection Tools

- **Visual Element Inspector on Phone:**
  Run `adb shell input keyevent 82` (or shake phone) $\rightarrow$ Tap **"Toggle Element Inspector"** on your phone screen to inspect layout dimensions, padding, margins, and Flexbox bounds directly on-device.
- **React Native Hermes Inspector:**
  Press **`j`** in the terminal running Metro to launch dedicated Chrome Hermes DevTools for JS debugging, console logs, and performance profiling.
- **Chrome USB Remote Debugging:**
  Open `chrome://inspect` in Google Chrome on your PC to view native webviews and device logs.

---

## 🛠️ Complete Feature Progress (Milestones 1 – 11)

### Milestone 1 — Project Bootstrap

- Expo SDK 54, React Native 0.81, TypeScript (strict mode).
- NativeWind v4 + Tailwind CSS integration.
- ESLint + Prettier + Jest testing framework.

### Milestone 2 — Design System & Theme Foundations

- Atomic Design Structure (`atoms`, `molecules`, `templates`).
- Custom dynamic theme system supporting **Light**, **Dark**, and **System** modes.
- Semantic tokens for background (`bg`), text (`fg`), primary (`primary`), and borders (`border`).

### Milestone 3 — Encrypted Storage Layer

- Dual-adapter SQLite storage engine:
    - **ExpoSQLiteAdapter** (`expo-sqlite`) for production builds on Android/iOS (WAL mode + foreign key constraints enabled).
    - **BetterSqliteAdapter** (`better-sqlite3`) for fast Node Jest unit testing.
- Automated database schema migrations (`0001_init.sql`).

### Milestone 4 — Authentication & Security

- Dual offline login via **Biometric (Fingerprint/FaceID)** and **6-Digit Security PIN**.
- Lockout Policy (3 failed biometric attempts $\rightarrow$ PIN fallback; 5 failed PIN attempts $\rightarrow$ 60-second lockout).
- Role-based access guards (`principal` vs `teacher`).

### Milestone 5 — User & Class Management (Principal)

- Principal Dashboard with real-time class, teacher, and student statistics.
- Teacher CRUD (Create, Edit, Enable/Disable teacher accounts).
- Class CRUD (Create class, assign/unassign teacher, grade & section allocation).

### Milestone 6 — Student Management & Auto-Roll Numbers

- Student Roster with search and class filtering.
- **Auto-Increment Roll Numbers**: Automatically calculates next available roll number (`MAX(roll_no) + 1`) per class.
- 3-Step Student Enrollment Wizard modal.

### Milestone 7 — ML Camera & Real Face Pipeline

- Live camera viewfinder (`expo-camera`) with target circle overlay and camera flip.
- `RealFaceDetector` and `RealFaceEmbedder` ports.
- On-device face sample capture (3 samples per student required for enrollment).

### Milestone 8 — Live Session & Attendance Capture

- **Sessions Repository (`SessionRepo`)**: Idempotent attendance marking (`ON CONFLICT(session_id, student_id)`), active session lookup, and session closure.
- **Vector Matcher (`matcher.ts`)**: Real-time Cosine Similarity matcher ($\ge 0.85$ auto-marks Present; $0.72 - 0.84$ prompts candidate match).
- **Live Camera Attendance Screen**: Real-time frame recognition with visual toast notifications (`✅ Ananya Rao — Marked Present`).
- **Session Review & Manual Override Screen**: Class roster breakdown with interactive status override pills (`Present`, `Absent`, `Late`) and session summary closure.

### Milestone 9 — Offline Reports & Analytics

- **Reports Repository (`ReportsRepo`)**: On-device SQL aggregations for overall attendance %, class performance summaries, student attendance rates, and weekly trends.
- **Principal Reports Dashboard (`app/principal/reports.tsx`)**: High-level attendance rate stat cards, date range filtering (Past 7 Days, Past 30 Days, All Time), weekly trend graphs, and at-risk student warnings ($< 75\%$).
- **Teacher Class Reports (`app/teacher/reports/index.tsx`)**: Class-wise attendance rate breakdown, low attendance alerts, and student attendance roster metrics.

### Milestone 10 — Sync Engine & Conflict Resolution

- **Sync Queue Repository (`SyncQueueRepo`)**: Enqueues local mutations in SQLite `sync_queue` table with exponential backoff retries.
- **Sync Engine Coordinator (`SyncEngine`)**: Bi-directional synchronization engine (Outbound push batching + Inbound delta pulling with `since` cursor).
- **Last-Write-Wins (LWW) Conflict Resolver (`ConflictResolver`)**: Automatic collision resolution using entity `version` and `updated_at` timestamps.
- **Sync Status UI (`SyncStatusBadge` & `useSync`)**: Real-time sync status badge (`Synced`, `⚡ 3 Pending`, `Syncing...`) and Settings integration.

### Milestone 11 — Hardening: Security, A11y, i18n

- **i18n Multi-Language Support (`src/core/i18n`)**: Zero-dependency localization framework with English (`en`), Hindi (`hi`), and Spanish (`es`) dictionaries and dynamic mid-session language switching in Settings.
- **Security & PII Encryption (`src/core/security`)**: Field encryption and SHA-256 integrity hashing helpers (`encryptPayload`, `decryptPayload`, `hashPII`).
- **Accessibility (A11y) Audit**: Screen-reader attributes (`accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState`) added across core UI primitives (`Button`, `Input`, `SyncStatusBadge`).

---

## 📂 Project Architecture

```
src/
├─ app/                     # Expo Router file-based pages & role stacks
│  ├─ _layout.tsx           # Root layout & providers
│  ├─ auth/                 # Biometric & PIN authentication screens
│  ├─ principal/            # Principal stack (Dashboard, Teachers, Classes, Students, Reports)
│  ├─ teacher/              # Teacher stack (Classes, Students, Sessions, Settings)
│  │  └─ sessions/          # Sessions list, Live Capture, & Review screens
│  └─ shared/               # Shared settings & profile screens
├─ core/
│  ├─ i18n/                 # i18n provider, translate module, & en/hi/es dictionaries
│  ├─ ml/                   # ML Camera, Real/Stub Embedder & Vector Cosine Matcher
│  ├─ security/             # AES/SHA-256 field encryption & PII hashing
│  ├─ storage/sqlite/       # SQLite database singleton, migrations & BaseRepository
│  └─ ui/                   # Design system (atoms, molecules, templates, themes)
└─ features/                # Feature domains & SQLite repositories
   ├─ auth/                 # Authentication store & hashing logic
   ├─ classes/              # Class entity & repo
   ├─ reports/              # Reports repo, StatCard, & SyncStatusBadge
   ├─ sessions/             # Session & attendance repo, schemas, types
   ├─ students/             # Student entity, repo & EnrollmentWizard
   ├─ sync/                 # Sync queue repo, push/pull API, LWW resolver, engine & hook
   └─ teachers/             # Teacher entity, repo & TeacherForm
```

---

## 📜 Development Scripts & Verification

| Command             | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `npm start`         | Start Metro / Expo development server                     |
| `npm run android`   | Build & launch app on connected Android phone or emulator |
| `npm run typecheck` | Run TypeScript compiler type check (`tsc --noEmit`)       |
| `npm test`          | Execute Jest unit test suite (**84/84 tests passing**)    |
| `npm run format`    | Format code using Prettier                                |
| `npm run lint`      | Run ESLint verification                                   |

---

## 🧪 Verification Status

- [x] **TypeScript:** `npm run typecheck` returned 0 errors.
- [x] **Unit Tests:** `npm test` passed 84/84 tests across 15 test suites.
- [x] **Code Formatting:** `npm run format` executed cleanly.
