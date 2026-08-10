# Presentia — Play Store Data Safety & Privacy Disclosure

This document outlines the privacy practices, data collection disclosures, and security architecture of **Presentia** for Google Play Store Data Safety section and iOS Privacy Manifest compliance.

---

## 🔒 Privacy Core Philosophy

Presentia is designed **Offline-First and On-Device Privacy First**:
1. **Zero Raw Image Storage**: Face images captured during enrollment are processed strictly in-memory into 512-dimensional facial embedding vectors. Raw camera photos are **never** stored on disk or transmitted outside the device.
2. **On-Device Face Matching**: All facial vector comparisons (Cosine Similarity) run locally on the physical device's CPU/GPU. No face data is uploaded to third-party AI cloud platforms.
3. **Local Encryption**: Student rosters and attendance logs are stored in an encrypted local SQLite database on the device.

---

## 📋 Google Play Store Data Safety Declaration

### 1. Data Collected & Processed

| Data Type | Purpose | Stored On Device? | Transmitted to Server? | Ephemeral? |
| :--- | :--- | :--- | :--- | :--- |
| **Personal Identifiers** (Name, Roll No, Email) | Account & Roster Management | Yes (Local SQLite) | Optional (School Sync Server) | No |
| **Biometric Face Vectors** (Numerical Embeddings) | Face Attendance Recognition | Yes (Encrypted SQLite) | No | No |
| **Attendance Records** (Timestamps, Status) | School Attendance Tracking | Yes (Local SQLite) | Optional (School Sync Server) | No |

### 2. Security Practices
- **Data Encrypted in Transit**: All optional sync communication with the school server uses TLS 1.3 (HTTPS).
- **Data Encrypted at Rest**: Device database utilizes SQLCipher encryption and local SecureStore credential isolation.
- **Account Deletion / Data Removal**: Users can perform full account reset and data wipe anytime from **Settings $\rightarrow$ Reset Account**.

---

## 📱 iOS Privacy Manifest (`PrivacyInfo.xcprivacy`)

- **NSPrivacyAccessedAPITypes**:
  - `NSPrivacyAccessedAPICategoryFileTimestamp`: Used strictly for SQLite database versioning.
  - `NSPrivacyAccessedAPICategoryUserDefaults`: Used for local app preferences (Theme & Language).
