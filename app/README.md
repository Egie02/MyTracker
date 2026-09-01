# MYTracker (Local)

React Native + Expo app with **SQLite** (local) and **XLSX** import/export. First-time setup: local-only.

## Run

```bash
cd app
npm install   # or: npm install --legacy-peer-deps
npx expo start
```

- Press `w` for web, `a` for Android, `i` for iOS (simulator).
- Default login: **admin** / **admin123**

**Note:** If you see “No compatible apps connected, React Native DevTools can only be used with Hermes” — that’s expected until the app is running on a device/emulator with Hermes. Open the app in Expo Go (scan QR or press `a`/`i`) and reload; the message will clear once the app connects. You can ignore it if the app works.

## Features (this setup)

- **Auth**: Login with username/password; session in secure store. Default admin created on first run.
- **SQLite**: Local DB with migrations; schema matches `docs/system-design/03-data-model-sqlite.md`.
- **XLSX**: Export (Settings → Export to XLSX) and Import (Settings → Import from XLSX). Same format as in `docs/system-design/06-import-export-xlsx.md`.
- **Tabs**: Home, Transactions, Accounts, Categories, Settings (placeholders for full CRUD in follow-up).

## Project structure

- `App.tsx` – Root: init DB, session, navigation (Login vs Main tabs).
- `src/data/db` – SQLite client, migrations, bootstrap (default admin).
- `src/data/repositories` – User repository (add account/category/transaction repos as needed).
- `src/data/importExport` – XLSX export and import.
- `src/auth` – Password hash, session (secure store).
- `src/domain/models` – Entity types.
- `src/app/screens` – Login, Home, Transactions, Accounts, Categories, Settings.

## Docs

See `../docs/system-design/` for full system design (requirements, architecture, data model, auth, CRUD, XLSX, UI).
