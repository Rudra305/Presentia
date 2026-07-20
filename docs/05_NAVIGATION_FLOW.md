# 05 — Navigation Flow (Expo Router)

## 1. Route Tree

```
/
├─ index                     → boot / role redirect
├─ (auth)/
│   ├─ biometric             → Face ID / Fingerprint prompt
│   └─ pin                   → PIN fallback
│
├─ (principal)/              → guarded: role=principal
│   ├─ dashboard
│   ├─ teachers/
│   │   ├─ index             → list
│   │   ├─ new
│   │   └─ [id]              → detail/edit
│   ├─ classes/
│   │   ├─ index
│   │   └─ [id]
│   ├─ reports/
│   │   ├─ index
│   │   └─ [classId]
│   └─ settings
│
├─ (teacher)/                → guarded: role=teacher
│   ├─ classes/
│   │   ├─ index             → my classes
│   │   └─ [id]/
│   │       ├─ roster        → student list
│   │       └─ students/
│   │           ├─ new       → enrollment (name + 3 face samples)
│   │           └─ [studentId]
│   ├─ sessions/
│   │   ├─ new               → pick class + period
│   │   └─ [id]/
│   │       ├─ capture       → live camera + recognition
│   │       └─ review        → edit/override statuses
│   └─ settings
│
└─ +not-found
```

## 2. Role-Based Routing Guard

```
_layout.tsx (root)
  └── AuthGate
        ├── if !authenticated → /(auth)/biometric
        ├── if role=principal → /(principal)/dashboard
        └── if role=teacher   → /(teacher)/classes
```

- `AuthGate` reads from Zustand `useAuthStore` and Secure Store.
- Deep links are validated: an unauthorized deep link redirects through the gate.

## 3. Flow Diagrams

### 3.1 Boot Flow
```
Splash → check session ─┬─► valid & fresh → role home
                         └─► expired/none → (auth)/biometric
                                             ├─ success → role home
                                             └─ fail (3x) → (auth)/pin
                                                            ├─ success → role home
                                                            └─ fail (5x) → lockout screen (60s)
```

### 3.2 Teacher — Take Attendance
```
Classes → [class] → Roster → "Start Session"
   → Sessions/new (pick period) → Sessions/[id]/capture
      → live face recognition (auto-mark)
      → tap "Finish" → Sessions/[id]/review
      → tap "Close" → back to class dashboard
```

### 3.3 Principal — Manage Teachers
```
Dashboard → Teachers → [+ New]
   → form (RHF+Zod) → save → back to list
   → tap teacher → edit / disable / assign class
```

## 4. Transitions & UX

- Stack transitions: default iOS slide, Android fade-through.
- Modals: `presentation: 'modal'` for `sessions/new` and `students/new`.
- Bottom tab bar only inside `(teacher)` and `(principal)` groups.
- Back gesture disabled during `capture` to avoid accidental exit.

## 5. Deep Links

| Scheme | Route | Notes |
|--------|-------|-------|
| `attendance://sessions/:id/capture` | teacher capture | requires teacher role |
| `attendance://reports/:classId` | principal report | requires principal role |

Deep links pass through `AuthGate`; unauthorized ones show a friendly "Access denied" screen with a "Go home" CTA.

## 6. Analytics Screen Events (Phase 2 hook)

- `screen_view` with `route`, `role`, `duration_ms`.
- No PII in event payloads.
