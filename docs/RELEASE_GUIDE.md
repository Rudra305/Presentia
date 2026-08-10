# Presentia — Production Release & Versioning Guide

Comprehensive guide for building, versioning, and deploying **Presentia** to production environments and mobile app stores.

---

## 📌 Semantic Versioning & Release Policy

Presentia strictly adheres to **Semantic Versioning (`MAJOR.MINOR.PATCH`)**:
- **MAJOR**: Breaking changes or major architectural upgrades (e.g. `2.0.0`).
- **MINOR**: New feature additions (e.g. `1.1.0` - Bulk CSV import, Push Notifications).
- **PATCH**: Bug fixes, performance tweaks, and security patches (e.g. `1.0.1`).

### Native Version Codes & Build Numbers
- **`app.json` `version`**: The user-facing SemVer string (e.g. `"1.0.0"`).
- **Android `versionCode`**: Auto-incrementing integer (e.g. `1`, `2`, `3`). Must increase for every Play Store submission.
- **iOS `buildNumber`**: Auto-incrementing build string (e.g. `"1"`, `"2"`).
- **`runtimeVersion`**: Configured as `{ "policy": "appVersion" }` so Over-The-Air (OTA) updates match compatible native binaries cleanly.

---

## 🚀 Building Production Artifacts

### 1. Local Android Release APK (Direct Device Installation)

```powershell
# Build standalone release APK directly on local machine
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"; npx expo run:android --variant release
```

### 2. Standalone Testing APK via EAS Build

```bash
# Triggers cloud build producing downloadable .apk for physical device smoke testing
npx eas build --platform android --profile preview
```

### 3. Google Play Store App Bundle (`.aab`)

```bash
# Triggers production build producing signed Android App Bundle (.aab)
npx eas build --platform android --profile production
```

---

## 📲 Publishing Over-The-Air (OTA) Feature Updates

For JS/Asset feature updates that do not modify native Java/Kotlin code or native permissions:

```bash
# Publish OTA JS bundle to Production update channel
npx eas update --channel production --message "Feature: Added bulk CSV export"
```
