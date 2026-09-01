# CRUD flows

Create/update/delete flows are implemented in **use-cases** (e.g. `transactionUseCase`, `accountUseCase`, `categoryUseCase`, `userUseCase`) that call repositories; the UI calls use-cases only. The steps below describe the behavior that use-cases enforce.

## Entities and invariants
- **Account**
  - Name must be unique.
  - Opening balance can be negative only if allowed by product decision (default: allow).
  - Archived accounts are not selectable for new transactions.

- **Category**
  - Name uniqueness is scoped by (kind, parent).
  - Archived categories are not selectable for new transactions.

- **Transaction**
  - `amount > 0`
  - `type ∈ {expense, income, transfer}`
  - For expense/income: `category_id` required.
  - For transfers (if modeled as 2 legs): system creates 2 rows with same `transfer_group_id`.

## Create transaction
### Expense / income
1. User fills form (date, amount, account, category, note).
2. Validate in domain:
   - required fields, amount > 0, account active, category active
3. Write to SQLite in a transaction.
4. Refresh list + recompute balances (query-time).

### Transfer (two-leg)
Inputs: fromAccount, toAccount, amount, date, note
1. Validate: accounts different, amount > 0.
2. Generate `transfer_group_id`.
3. Insert:
   - Expense leg: account=fromAccount, type=expense, category=null or “Transfer Out”
   - Income leg: account=toAccount, type=income, category=null or “Transfer In”
4. Treat edits/deletes as operations on the whole transfer group.

## Update transaction
- Expense/income: update fields, re-validate, commit.
- Transfer:
  - Update both legs by `transfer_group_id`.
  - If account changes, update the corresponding leg’s account.

## Delete transaction
- Soft delete vs hard delete:
  - **v1 recommendation**: hard delete (simple) + confirm dialog.
  - Optional v2: soft delete with `deleted_at`.
- Transfers: delete both legs by `transfer_group_id`.

## Accounts CRUD
- Create/update: unique name; validate currency rules.
- Delete:
  - Prefer “archive” if account has transactions.
  - If hard-delete is allowed, must delete or reassign transactions first (better: restrict).

## Categories CRUD
- Create/update: unique (kind, name, parent).
- Delete:
  - If used by transactions: archive or require reassignment.

## Users CRUD (admin only)
- Create user:
  - unique username
  - set role + initial password
- Disable user:
  - mark `is_active = 0`
  - invalidate sessions for that user (delete session if currently logged in)
- Reset password:
  - replace hash + update timestamp

## Validation and UX notes
- All forms should show inline validation errors (field-level).
- Amount input:
  - enforce numeric formatting
  - store as REAL; consider integer cents in v2 if precision issues appear

