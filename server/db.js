const Database = require("better-sqlite3");
const path = require("path");

//Keep DB file alongside the server code:
const dbPath = path.join(__dirname, "app.db");
// Create / open databese file
const db = new Database("app.db");

//Run a migration to ensure users table exists
db.prepare(
  `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`
).run();

// Optional: quick sanity check
const row = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
  .get();
if (!row) {
  console.error("Users table was not created!");
}

module.exports = db;
