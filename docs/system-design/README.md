# MYTracker — System Design

**MYTracker** is a personal, offline-first money tracker (Expo / React Native + SQLite).

Tech stack targets:
- **Mobile**: React Native with **Expo SDK 53**; **SQLite** local.
- **Online admin panel** (future): **React** + **Vite** + **Tauri**; **MySQL** or **MSSQL** — see [09-admin-panel.md](09-admin-panel.md).
- **Auth (mobile)**: 4-digit **PIN** + optional **biometrics** (no username/password).
- **Data portability**: **Export/Import XLSX** from Settings.

## Document map
- `01-requirements.md`: Functional + non-functional requirements
- `02-architecture.md`: Layers, use-cases, foldering, runtime flows
- `03-data-model-sqlite.md`: SQLite schema and migrations
- `04-auth-roles.md`: PIN, biometrics, session, lock vs clear data
- `05-crud-flows.md`: CRUD behaviors, validations, edge cases
- `06-import-export-xlsx.md`: XLSX format and import rules
- `07-ui-screens.md`: Navigation diagram, drawer + stack, screen list
- `08-testing-observability.md`: Test strategy, logging
- `09-admin-panel.md`: Online admin panel (future / separate client)
- **`10-app-flow-traceability.md`**: **Start here for debugging** — user journeys, metric definitions, symptom → file map

## Primary goals
- **Offline-first** local SQLite on device.
- **Simple privacy gate** (PIN/biometrics) for a personal app.
- **Analyst-friendly** dashboard and history (income, expense, net, balances, categories).
- **Traceable design** — when something breaks, use doc `10` to find the right layer fast.
