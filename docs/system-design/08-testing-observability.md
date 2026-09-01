# Testing & observability

## Test levels
- **Unit tests**
  - Domain validators (amount rules, required fields)
  - Transfer creation/edit logic (two-leg invariants)
  - Import parser + validators (row-level error detection)

- **Integration tests**
  - Repository SQL operations against a test SQLite database
  - Migration runner applies all migrations cleanly from empty DB

- **E2E smoke tests (manual checklist for v1)**
  - First-run creates admin, login works
  - Create account/category/transaction
  - Export XLSX opens correctly in Excel/Google Sheets
  - Import previously exported XLSX restores data
  - Role gating: user cannot open admin screens

## Import/export reliability checks
- Export → immediate import should be a no-loss round-trip (within defined limits).
- Import is executed inside a SQLite transaction.
- Large imports should show progress and remain responsive.

## Logging
- Development: console logs for import parse errors.
- Production: minimal logging; consider a local debug log toggle for troubleshooting.

## Backup and restore guidance
- Export is the primary user-facing backup.
- Optional v2: “Backup DB file” export and “Restore DB file” import (faster than XLSX).

