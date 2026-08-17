# 📱 Student Attendance Mobile Application

An offline-first, on-device AI-powered Student Attendance & Analytics System built with **Expo (SDK 54) + React Native 0.81 + TypeScript**.

[![Build Status](https://img.shields.io/badge/tests-84%20passed-emerald)](https://github.com/Rudra305/student_attendance)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 💻 Tech Stack & Architecture

### Core Framework & UI
- **Framework**: [Expo SDK 54](https://docs.expo.dev/) with React Native 0.81
- **Navigation**: [Expo Router v4](https://docs.expo.dev/router/introduction/) (Type-safe file-based routing)
- **Language**: TypeScript 5 (Strict mode enabled)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS engine for React Native)
- **Icons**: `lucide-react-native` / Feather vector icons

### Data & State Management
- **Database Engine**: Dual-adapter SQLite Architecture:
  - **`expo-sqlite`**: Production engine on physical Android/iOS (WAL mode enabled, foreign key constraints active).
  - **`better-sqlite3`**: Ultra-fast Node.js SQLite adapter for Jest unit testing.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with persistent storage.
- **Migrations**: Automated versioned SQL migrations runner (`0001_init.sql`).

### AI & On-Device ML
- **Camera Viewfinder**: `expo-camera` with live frame processing and face detection overlays.
- **Face Feature Embedder**: On-device vector extractor (`RealFaceEmbedder`).
- **Vector Matching Engine**: On-device Cosine Similarity matcher ($\ge 85\%$ instant match, $70-84\%$ candidate prompt).

### Security, i18n & Hardening
- **Biometric Auth**: `expo-local-authentication` (Fingerprint / FaceID with 6-digit PIN fallback).
- **Security & PII Encryption**: Field encryption & SHA-256 integrity hashing (`encryptPayload`, `hashPII`).
- **i18n Localization**: Zero-dependency i18n engine supporting **English (`en`)**, **Hindi (`hi`)**, and **Spanish (`es`)**.

---

## ✨ Features Overview

### 1. 🔐 Role-Based Access & Authentication
- **Dual Authentication**: Biometric (Fingerprint/FaceID) and 6-Digit PIN fallback.
- **Lockout Security Policy**: 3 failed biometric attempts $\rightarrow$ PIN prompt; 5 failed PIN attempts $\rightarrow$ 60-second security lockout.
- **Role Stacks**: Distinct user experiences for **Principal** and **Teacher** roles.

### 2. 🏫 Principal Dashboard & School Management
- **School Performance Analytics**: Real-time statistics on total classes, assigned teachers, total enrolled students, and overall attendance percentage.
- **Teacher Management**: Add, edit, enable/disable teacher accounts with contact details.
- **Class Management**: Create classes, allocate grades/sections, and assign class teachers.

### 3. 🎓 Student Management & Auto-Roll Numbers
- **3-Step Student Enrollment Wizard**: Student bio-data input $\rightarrow$ Class selection $\rightarrow$ 3-sample Face Vector Capture.
- **Auto-Increment Roll Numbers**: Automatically calculates next available roll number (`MAX(roll_no) + 1`) per class.
- **Roster Search & Filtering**: Instant search by student name or roll number.

### 4. 🤖 AI-Powered Live Attendance Capture
- **Live Frame Recognition**: Real-time camera viewfinder detects face vectors during live sessions.
- **Instant Visual Feedback**: Shows green status cards and toast popups when a student is recognized (`✅ Ananya Rao — Marked Present`).
- **Session Review & Manual Override**: Review full class roster after session capture with status override pills (`Present`, `Absent`, `Late`).

### 5. 📊 Real-Time Analytics & Reports
- **Instant Attendance Population**: Reports populate live attendance data immediately as records are marked.
- **Searchable Class Dropdowns**: Reusable `Dropdown` components with modal popups and search filters for large class lists.
- **7-Day Attendance Trend Chart**: Continuous 7-day timeline with styled status indicators (`≥85% Good`, `70-84% Moderate`, `<70% At-Risk`).
- **Low Attendance Alerts**: Highlights students falling below mandatory attendance thresholds ($< 75\%$).
- **Student Attendance Roster**: Complete student attendance metrics showing present/absent/late counts and percentage badges.

### 6. 🔄 Offline Sync Engine & Conflict Resolution
- **Sync Queue**: Local SQLite `sync_queue` table queues outbound mutations with exponential backoff retries.
- **Last-Write-Wins (LWW) Resolver**: Resolves sync collisions using entity `version` and `updated_at` timestamps.
- **Real-Time Sync Status Badge**: Visual indicator (`Synced`, `⚡ 3 Pending`, `Syncing...`).

---

## 🚀 Local Development Setup Guide

### Prerequisites
Make sure your development machine has:
1. **Node.js**: `v18.0.0` or higher (`node -v`)
2. **Yarn** or **npm**
3. **Android Studio**: Android SDK (API 34/35) & Build Tools installed.
4. **Environment Variables**: `ANDROID_HOME` set to your Android SDK path (e.g. `C:\Users\<User>\AppData\Local\Android\Sdk`).

---

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/Rudra305/student_attendance.git
cd student_attendance

# 2. Install dependencies
npm install

# 3. Create Environment File
cp .env.example .env
```

---

### 📱 Running on Physical Android Device

1. **Enable USB Debugging on your phone:**
   - Go to **Settings $\rightarrow$ About Phone $\rightarrow$ Tap "Build Number" 7 times**.
   - Go to **Settings $\rightarrow$ System $\rightarrow$ Developer Options $\rightarrow$ Enable "USB Debugging"**.
2. **Connect Device via USB Cable:**
   - Connect your Android device and accept the _"Allow USB Debugging?"_ prompt on phone.
3. **Verify ADB Connection:**
   ```bash
   adb devices
   ```
   _(Your device serial should be listed as `device`)_.
4. **Launch Application:**
   ```bash
   npm run android
   # or
   yarn android
   ```

---

### 🧪 Running Tests & Verification Commands

| Command | Description |
| :--- | :--- |
| `npm test` | Run Jest unit test suite (**15/15 passing, 84/84 tests**) |
| `npm run typecheck` | Run TypeScript compiler type check (`tsc --noEmit`) |
| `npm run lint` | Run ESLint static analysis |
| `npm run format` | Format code with Prettier |

---

## 📂 Directory Structure

```
student_attendance/
├── docs/                   # Complete architectural spec & milestone documentation
├── src/
│   ├── app/                # Expo Router pages & role stacks
│   │   ├── _layout.tsx      # Global root layout & theme providers
│   │   ├── auth/            # Biometric & PIN authentication
│   │   ├── principal/       # Principal Dashboard, Teachers, Classes, Reports
│   │   ├── teacher/         # Teacher Dashboard, Take Attendance, Live Capture, Reports
│   │   └── shared/          # Settings & Profile screens
│   ├── core/
│   │   ├── i18n/            # Localization dictionaries (en, hi, es)
│   │   ├── ml/              # Real & Stub Face Embedders & Cosine Matcher
│   │   ├── security/        # Field encryption & PII hashing
│   │   ├── storage/sqlite/  # SQLite database, migrations, adapters
│   │   └── ui/              # Design System (Button, Input, Card, Modal, Dropdown)
│   └── features/            # Business Logic & Repositories
│       ├── auth/            # Auth store & hashing logic
│       ├── classes/         # Class repository & entities
│       ├── reports/         # Reports repository & TrendChart
│       ├── sessions/        # Session & attendance repository
│       ├── students/        # Student repository & enrollment
│       ├── sync/            # Sync engine, queue repo & LWW resolver
│       └── teachers/        # Teacher repository & forms
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
