# Data model (SQLite, MSSQL, MySQL)

## Design principle
The same logical model is implemented on all backends: **SQLite** for **local** (mobile/offline), **MySQL** and **MSSQL** for **online** (server). Use **UUID primary keys** and **portable types** so migrations and XLSX round-trips work across all three for plug-and-play.

## Core entities
- **users**: local accounts with role (admin/user)
- **accounts**: money containers (cash/bank/e-wallet)
- **categories**: expense/income categories (optional hierarchy)
- **transactions**: income/expense/transfer
- **transaction_tags** (optional): many-to-many tags
- **attachments** (optional): receipt references (paths/metadata)

## Dialect summary (portable mapping)

| Concept | SQLite | MSSQL | MySQL |
|--------|--------|-------|--------|
| UUID PK | `TEXT` | `CHAR(36)` or `UNIQUEIDENTIFIER` | `CHAR(36)` |
| Boolean | `INTEGER 0/1` + CHECK | `BIT` or `TINYINT(1)` | `TINYINT(1)` or `BOOLEAN` |
| Decimal amount | `REAL` | `DECIMAL(19,4)` preferred | `DECIMAL(19,4)` preferred |
| Timestamp | `TEXT` ISO8601 | `DATETIME2` or `TEXT` | `DATETIME(3)` or `TEXT` |
| Optional FK | `ON DELETE SET NULL` | same | same |
| Unique index | `CREATE UNIQUE INDEX` | `CREATE UNIQUE INDEX` | same (note: COALESCE in expression) |
| Enable FK | `PRAGMA foreign_keys=ON` | default ON | `FOREIGN_KEY_CHECKS=1` |

Use **application-generated UUIDs** for all PKs so auto-increment differences (SQLite `AUTOINCREMENT`, MSSQL `IDENTITY`, MySQL `AUTO_INCREMENT`) do not affect the shared model.

## SQLite

### Pragma (recommended)
- `PRAGMA foreign_keys = ON;`
- `PRAGMA journal_mode = WAL;` (performance + reliability)

### Schema (v1)

```sql
-- users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','user')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  type        TEXT, -- e.g. cash, bank, ewallet (optional enum)
  currency    TEXT, -- optional (or enforce single currency globally)
  opening_balance REAL NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('expense','income')),
  parent_id   TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_kind_name_parent
  ON categories(kind, name, COALESCE(parent_id, ''));

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('expense','income','transfer')),
  date          TEXT NOT NULL, -- ISO or epoch
  amount        REAL NOT NULL CHECK (amount > 0),
  account_id    TEXT NOT NULL,
  category_id   TEXT,          -- required for income/expense, nullable for transfer (or use transfer legs)
  note          TEXT,
  transfer_group_id TEXT,      -- groups the two legs of a transfer
  created_by_user_id TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group ON transactions(transfer_group_id);

-- optional tags
CREATE TABLE IF NOT EXISTS tags (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id TEXT NOT NULL,
  tag_id         TEXT NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- optional attachments (receipts)
CREATE TABLE IF NOT EXISTS attachments (
  id             TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  uri            TEXT NOT NULL,  -- file://... or app-managed path
  mime_type      TEXT,
  created_at     TEXT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
```

---

## MSSQL

- Use **CHAR(36)** or **UNIQUEIDENTIFIER** for UUIDs; below uses `CHAR(36)` for portability with MySQL and XLSX.
- Prefer **DECIMAL(19,4)** for money; **DATETIME2** for timestamps (or NVARCHAR for ISO8601 if you want identical storage to SQLite).
- Foreign keys are enforced by default.

```sql
-- schema_migrations (for versioning)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'schema_migrations')
CREATE TABLE schema_migrations (version INT NOT NULL PRIMARY KEY);

-- users
CREATE TABLE users (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  username      NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(500) NOT NULL,
  role          NVARCHAR(50) NOT NULL CHECK (role IN ('admin','user')),
  is_active     TINYINT NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at    DATETIME2 NOT NULL,
  updated_at    DATETIME2 NOT NULL
);

-- accounts
CREATE TABLE accounts (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  name            NVARCHAR(255) NOT NULL UNIQUE,
  type            NVARCHAR(50) NULL,
  currency        NVARCHAR(10) NULL,
  opening_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  is_archived     TINYINT NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at      DATETIME2 NOT NULL,
  updated_at      DATETIME2 NOT NULL
);

-- categories
CREATE TABLE categories (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  kind        NVARCHAR(50) NOT NULL CHECK (kind IN ('expense','income')),
  parent_id   CHAR(36) NULL,
  is_archived TINYINT NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at  DATETIME2 NOT NULL,
  updated_at  DATETIME2 NOT NULL,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX idx_categories_unique_kind_name_parent
  ON categories(kind, name, ISNULL(parent_id, ''));

-- transactions
CREATE TABLE transactions (
  id                  CHAR(36) NOT NULL PRIMARY KEY,
  type                NVARCHAR(50) NOT NULL CHECK (type IN ('expense','income','transfer')),
  date                DATETIME2 NOT NULL,
  amount              DECIMAL(19,4) NOT NULL CHECK (amount > 0),
  account_id          CHAR(36) NOT NULL,
  category_id         CHAR(36) NULL,
  note                NVARCHAR(MAX) NULL,
  transfer_group_id   CHAR(36) NULL,
  created_by_user_id CHAR(36) NULL,
  created_at          DATETIME2 NOT NULL,
  updated_at          DATETIME2 NOT NULL,
  CONSTRAINT fk_transactions_account   FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE NO ACTION,
  CONSTRAINT fk_transactions_category  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_user      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);
CREATE INDEX idx_transactions_transfer_group ON transactions(transfer_group_id);

-- tags
CREATE TABLE tags (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  name       NVARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME2 NOT NULL
);

CREATE TABLE transaction_tags (
  transaction_id CHAR(36) NOT NULL,
  tag_id         CHAR(36) NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  CONSTRAINT fk_tt_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_tag         FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- attachments
CREATE TABLE attachments (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  transaction_id CHAR(36) NOT NULL,
  uri            NVARCHAR(2000) NOT NULL,
  mime_type      NVARCHAR(100) NULL,
  created_at     DATETIME2 NOT NULL,
  CONSTRAINT fk_attachments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
```

---

## MySQL

- Use **CHAR(36)** for UUIDs. **DECIMAL(19,4)** for money; **DATETIME(3)** for timestamps (or VARCHAR for ISO8601).
- Run `SET FOREIGN_KEY_CHECKS = 1;` in session if needed (default is usually ON).
- `IF NOT EXISTS` for tables: use separate DDL or a migration script that checks information_schema.

```sql
-- schema_migrations (for versioning)
CREATE TABLE IF NOT EXISTS schema_migrations (version INT NOT NULL PRIMARY KEY);

-- users
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  username      VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(500) NOT NULL,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('admin','user')),
  is_active     TINYINT NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at    DATETIME(3) NOT NULL,
  updated_at    DATETIME(3) NOT NULL
);

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL UNIQUE,
  type            VARCHAR(50) NULL,
  currency        VARCHAR(10) NULL,
  opening_balance DECIMAL(19,4) NOT NULL DEFAULT 0,
  is_archived     TINYINT NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at      DATETIME(3) NOT NULL,
  updated_at      DATETIME(3) NOT NULL
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  kind        VARCHAR(50) NOT NULL CHECK (kind IN ('expense','income')),
  parent_id   CHAR(36) NULL,
  is_archived TINYINT NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_at  DATETIME(3) NOT NULL,
  updated_at  DATETIME(3) NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX idx_categories_unique_kind_name_parent
  ON categories(kind, name, COALESCE(parent_id, ''));

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id                  CHAR(36) NOT NULL PRIMARY KEY,
  type                VARCHAR(50) NOT NULL CHECK (type IN ('expense','income','transfer')),
  date                DATETIME(3) NOT NULL,
  amount              DECIMAL(19,4) NOT NULL CHECK (amount > 0),
  account_id          CHAR(36) NOT NULL,
  category_id         CHAR(36) NULL,
  note                TEXT NULL,
  transfer_group_id   CHAR(36) NULL,
  created_by_user_id  CHAR(36) NULL,
  created_at          DATETIME(3) NOT NULL,
  updated_at          DATETIME(3) NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);
CREATE INDEX idx_transactions_transfer_group ON transactions(transfer_group_id);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id CHAR(36) NOT NULL,
  tag_id         CHAR(36) NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- attachments
CREATE TABLE IF NOT EXISTS attachments (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  transaction_id CHAR(36) NOT NULL,
  uri            VARCHAR(2000) NOT NULL,
  mime_type      VARCHAR(100) NULL,
  created_at     DATETIME(3) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
```

---

## Transfer modeling options
- **Option A (recommended)**: store transfers as **two transaction rows** (expense leg from source account + income leg to destination) sharing `transfer_group_id`.
  - Pros: reuses reporting logic; account balances are natural.
  - Cons: category handling must be defined (category nullable, or a reserved “Transfer” category).
- **Option B**: separate `transfers` table.
  - Pros: explicit.
  - Cons: duplicated logic for reporting/balances.

This design assumes **Option A**.

## Balance computation
- **Account balance** is computed as:
  - opening_balance
  - + sum(income for account)
  - - sum(expense for account)
  - +/- transfer legs (already represented by income/expense legs)

## Migrations
- Maintain a `schema_migrations` table with a monotonically increasing version.
- Each migration is a SQL file, applied once inside a transaction.
- **Per dialect**: keep separate migration folders (e.g. `schema/sqlite/`, `schema/mssql/`, `schema/mysql/`) or use dialect-prefixed files (`001_sqlite.sql`, `001_mssql.sql`, `001_mysql.sql`) so each engine runs the correct DDL.

