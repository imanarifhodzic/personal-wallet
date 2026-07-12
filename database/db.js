import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// In production we point at a hosted libSQL/Turso database via env vars.
// With no env vars set (local dev / tests) we fall back to a local SQLite file,
// so the app runs exactly like before without any cloud account.
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });

// libSQL returns array-indexed Row objects. Build plain objects keyed by column
// name so JSON.stringify / res.json behave exactly like better-sqlite3 rows.
function rowsToObjects(rs) {
  return rs.rows.map((row) => {
    const obj = {};
    for (let i = 0; i < rs.columns.length; i++) {
      obj[rs.columns[i]] = row[i];
    }
    return obj;
  });
}

// Thin async shim with the same shape better-sqlite3 exposed:
//   db.prepare(sql).get(...args)  -> single row (or undefined)
//   db.prepare(sql).all(...args)  -> array of rows
//   db.prepare(sql).run(...args)  -> { changes, lastInsertRowid }
// The only change callers need is to `await` these calls.
const db = {
  prepare(sql) {
    return {
      async get(...args) {
        const rs = await client.execute({ sql, args });
        return rowsToObjects(rs)[0];
      },
      async all(...args) {
        const rs = await client.execute({ sql, args });
        return rowsToObjects(rs);
      },
      async run(...args) {
        const rs = await client.execute({ sql, args });
        // libSQL returns lastInsertRowid as a BigInt, which breaks res.json and
        // jwt.sign. Coerce to a plain Number to match better-sqlite3.
        return {
          changes: Number(rs.rowsAffected),
          lastInsertRowid:
            rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : undefined,
        };
      },
    };
  },
};

// Creates the schema and applies additive column migrations. Must be awaited
// once at startup (see server.js) before any request is served.
export async function initDb() {
  await client.executeMultiple(`
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

  // Add newer columns safely on databases created by earlier versions.
  const info = await client.execute("PRAGMA table_info(users)");
  const columns = rowsToObjects(info).map((c) => c.name);

  if (!columns.includes("role"))
    await client.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'parent'");
  if (!columns.includes("parent_id"))
    await client.execute("ALTER TABLE users ADD COLUMN parent_id INTEGER");
  if (!columns.includes("age"))
    await client.execute("ALTER TABLE users ADD COLUMN age INTEGER");
  if (!columns.includes("verified"))
    await client.execute("ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0");
  if (!columns.includes("verify_token"))
    await client.execute("ALTER TABLE users ADD COLUMN verify_token TEXT");
}

export default db;
