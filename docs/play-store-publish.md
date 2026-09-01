# Publish MYTracker to Google Play

Step-by-step guide for **Expo EAS Build** + **Google Play Console**.

**App ID (package):** `com.moneytracker.app`  
**EAS account:** `mpcdev` (already logged in on this machine)

---

## Prerequisites

1. **Google Play Developer account** — [play.google.com/console](https://play.google.com/console) ($25 one-time fee).
2. **Expo account** — you are signed in as `mpcdev`.
3. **Privacy policy URL** — required (financial / biometric app). Host `docs/privacy-policy.md` on GitHub Pages or paste into a public gist/page and use that URL in Play Console.

---

## Phase 1 — Link project to EAS (once)

From the `app` folder:

```bash
cd app
npx eas-cli init
```

Accept creating/linking the Expo project when prompted.

---

## Phase 2 — Build the release (AAB)

Google Play requires an **Android App Bundle** (`.aab`), not APK.

```bash
cd app
npm run build:android
```

Or:

```bash
npx eas build --platform android --profile production
```

- First build: EAS will offer to **generate an Android keystore** — choose **Yes** (recommended). EAS stores credentials securely.
- Wait for the build on [expo.dev](https://expo.dev) → your project → Builds.
- Download the `.aab` when finished (or submit directly in Phase 3).

**Test before release (optional):**

```bash
npm run build:android:preview
```

Install the APK on a physical device and verify PIN, biometrics, export/import, and calculator.

---

## Phase 3 — Upload to Play Console

### Option A — Manual upload (simplest first time)

1. Open [Google Play Console](https://play.google.com/console) → **Create app**.
2. App name: **MYTracker**
3. **Release** → **Testing** → **Internal testing** (recommended first) → **Create new release**.
4. Upload the `.aab` from EAS.
5. Add release notes → **Save** → **Review release** → **Start rollout**.

### Option B — EAS Submit (automated later)

1. In Play Console: **Setup** → **API access** → link Google Cloud project → **Create service account** with release manager rights.
2. Download JSON key → save as `app/google-service-account.json` (never commit — already in `.gitignore`).
3. Run:

```bash
cd app
npm run submit:android
```

---

## Phase 4 — Store listing (required before production)

In Play Console → **Main store listing**:

| Field | Suggestion |
|-------|------------|
| App name | MYTracker |
| Short description | Personal offline money tracker with PIN lock |
| Full description | Track income, expenses, and transfers. Dashboard, history, calculator, XLSX export. Data stays on your device. |
| App icon | 512×512 PNG (export from `app/assets/icon.png`) |
| Feature graphic | 1024×500 PNG |
| Phone screenshots | At least 2 (capture from emulator or device) |
| Privacy policy URL | Your hosted `privacy-policy` page |

---

## Phase 5 — Policy forms

Complete in Play Console:

1. **App content** → Privacy policy URL
2. **Data safety** — declare:
   - Financial info: stored locally, not shared
   - App activity: not collected (unless you add analytics later)
   - Security: encrypted on device (PIN / secure store)
3. **Content rating** — questionnaire (likely Everyone / low maturity)
4. **Target audience** — adults / not for children
5. **News apps / COVID / etc.** — decline if not applicable

---

## Version updates (after first release)

1. Bump in `app.json`:
   - `"version": "1.0.1"` (user-visible)
   - `"android.versionCode": 2` (must increase every upload)
2. Build again: `npm run build:android`
3. Upload new AAB to Play Console → new release

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Package name taken | Change `android.package` in `app.json` (only before first publish) |
| Build fails on EAS | Check build logs at expo.dev; run `npx expo-doctor` locally |
| Biometrics rejected in review | Ensure permission strings match actual use (already in `app.json` plugins) |
| Privacy policy missing | Add public URL before submitting for review |

---

## Quick command reference

```bash
cd app
npx eas-cli whoami              # verify Expo login
npx eas-cli init                # link project (once)
npm run build:android           # production AAB
npm run submit:android          # upload (needs service account JSON)
```
