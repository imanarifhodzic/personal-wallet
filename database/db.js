import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "..", "wallet.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('income','expense')) NOT NULL,
    color TEXT DEFAULT '#534AB7',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income','expense')) NOT NULL,
    description TEXT,
    transaction_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    limit_amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  monthly_contribution REAL NOT NULL,
  saved_amount REAL DEFAULT 0,
  color TEXT DEFAULT '#534AB7',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pending_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_email TEXT NOT NULL,
  parent_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Add new columns safely
const columns = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .map((c) => c.name);
if (!columns.includes("role"))
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'parent'").run();
if (!columns.includes("parent_id"))
  db.prepare("ALTER TABLE users ADD COLUMN parent_id INTEGER").run();
if (!columns.includes("age"))
  db.prepare("ALTER TABLE users ADD COLUMN age INTEGER").run();
if (!columns.includes("verified"))
  db.prepare("ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0").run();
if (!columns.includes("verify_token"))
  db.prepare("ALTER TABLE users ADD COLUMN verify_token TEXT").run();

export default db;
