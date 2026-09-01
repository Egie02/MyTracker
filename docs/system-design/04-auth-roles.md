# Auth & security (MYTracker — personal app)

## Goals
- Protect sensitive financial data on a **personal, single-user** device.
- No username/password login on mobile.
- Optional convenience via biometrics after PIN is set.

## Model overview

| Concept | Implementation |
|---------|----------------|
| Local user | Auto-created via `ensureDefaultAdmin()` / `ensurePersonalSession()` |
| App unlock | 4-digit PIN (`auth/pin.ts`) |
| Fast unlock | Biometrics (`auth/biometric.ts`, `expo-local-authentication`) |
| Session | `userId` + metadata in `expo-secure-store` (`auth/session.ts`) |
| Lock | Clears unlock state; user re-enters PIN or biometrics |
| Wipe | Settings → Clear all data → DB + PIN reset |

## App launch flow

1. Run DB migrations and ensure local user exists.
2. If no PIN for user → **Setup PIN** screen.
3. If PIN exists → **Unlock** screen (PIN pad + optional biometrics).
4. On success → main app (drawer + stack).

See [10-app-flow-traceability.md](10-app-flow-traceability.md) for the state diagram.

## PIN storage
- PIN is **never** stored plain text.
- Hash and metadata stored via **expo-secure-store**.
- After **5 failed attempts**, temporary lockout (see `auth/pin.ts`).

## Biometrics
- User can enable during setup or in Settings.
- Requires device biometric enrollment.
- iOS: `NSFaceIDUsageDescription` in `app.json`.

## Lock vs clear all data

| Action | Data | PIN | Next screen |
|--------|------|-----|-------------|
| **Lock app** | Kept | Kept | Unlock |
| **Clear all data** | Wiped | Removed | Setup PIN |

## Authorization (current mobile build)
- All tracking features available after unlock.
- **User management / admin panel** is out of scope for the personal mobile app; schema may still include `users` for future online admin ([09-admin-panel.md](09-admin-panel.md)).

## Threats & mitigations
- **Device compromise**: SecureStore helps; rooted/jailbroken devices remain higher risk.
- **Shoulder surfing**: PIN + short session until lock.
- **Export leakage**: XLSX contains full financial data; user warned on export.

## Files to change

| Change | Primary files |
|--------|----------------|
| PIN rules / lockout | `auth/pin.ts` |
| Biometric behavior | `auth/biometric.ts`, `UnlockScreen.tsx` |
| Auth routing | `App.tsx` |
| Change PIN UI | Settings stack / Change PIN screen |
| Reset everything | `data/db/clearData.ts` |
