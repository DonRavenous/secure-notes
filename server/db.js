const Database = require("better-sqlite3");
const path = require("path");

//Keep DB file alongside the server code:
const dbPath = path.join(__dirname, "app.db");
// Create / open databese file
const db = new Database(dbPath);

//User table
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

//Notes table (belongs to user.id)
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
  `
).run();

module.exports = db;
