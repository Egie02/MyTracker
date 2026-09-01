# Requirements (MYTracker mobile)

## Functional requirements

### Authentication & security (personal app)
- **No username/password.** Single local user is created automatically on first run.
- **4-digit PIN** required to protect the app; stored as hash in SecureStore.
- Optional **biometric unlock** (Face ID / fingerprint) after PIN is set.
- **Lock app** from drawer or Settings (returns to unlock screen; data kept).
- **Clear all data** wipes SQLite + PIN + biometric prefs → user sets up PIN again.
- Failed PIN attempts: rate limit / lockout after repeated failures.

### Expense & money tracking (core)
- CRUD for **Transactions**:
  - Types: **Expense**, **Income**, **Transfer**.
  - Fields: date/time, amount, category, account, note; transfer uses paired legs.
- CRUD for **Accounts** (Cash, Bank, etc.) with starting balance.
- CRUD for **Categories** (expense/income), archivable.
- **Dashboard** (current calendar month):
  - Income, expense, net.
  - Transaction count, total balance across accounts, savings rate (% of income).
  - Top expense categories, per-account balances.
- **Transactions** screen: month-scoped list, add/edit/delete.
- **History** screen: month-scoped read-only review with period summary.
- **Calculator** with optional history; can pass amount to add transaction.

### Data portability
- **Export** to XLSX; **Import** with preview and validation.

### Offline-first
- Full functionality without network.

## Non-functional requirements
- **Performance**: smooth lists with pagination/limits; indexed date queries.
- **Reliability**: atomic imports where possible.
- **Security**: PIN hash in SecureStore; no plain-text secrets.
- **Maintainability**: Screen → Use-case → Repository → DB; shared `utils/periods.ts` for date ranges.
- **Traceability**: behavior and metrics documented in `10-app-flow-traceability.md`.

## Constraints / decisions
- **Single-user personal app** on device (admin/user roles retained in schema for future online admin only).
- **SQLite** only on mobile in current build.
- XLSX format versioned for round-trip.

## Assumptions
- Single-device usage (no sync in v1).
- Single currency (amounts as numbers).

## Out of scope (v1)
- Cloud sync, multi-device.
- Username/password login on mobile.
- Budget alerts, OCR receipts.
