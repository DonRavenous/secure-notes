const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
//security header
app.use(helmet());
//safer JSON parsing (limit body size)
app.use(express.json({ limit: "50kb" }));
//basic rate limiting for notes/auth endpoints
const limiter = rateLimit({ windowsMs: 60_000, max: 60 });
app.use("/api/", limiter);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"; // use env in prod

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: " Missing or invalid Authorization header" });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

//Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "secure-notes-api",
    time: new Date().toISOString(),
  });
});

//Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    //Hash
    const hash = await bcrypt.hash(password, 10);
    //Insert
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)"
    );
    const info = stmt.run(email, hash);

    return res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "EMAIL already registered" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});

// GET / api/notes - list current user`s notes
app.get("/api/notes", authMiddleware, (req, res) => {
  const stmt = db.prepare(
    "SELECT id, content, created_at FROM notes WHERE user_id = ? ORDER BY id DESC"
  );
  const rows = stmt.all(req.user.id);
  res.json({ notes: rows });
});

//POST /api/notes - create a note
app.post("/api/notes", authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Content is required" });
  }
  // simple size guard (e.g., 2000 chars)
  if (content.length > 2000) {
    return res.status(413).json({ error: "Content too long" });
  }

  const insert = db.prepare(
    "INSERT INTO notes (user_id, content) VALUES (?, ?)"
  );
  const info = insert.run(req.user.id, content.trim());
  const row = db
    .prepare("SELECT id, content, created_at FROM notes WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json({ note: row });
});

//Protected test route
app.get("/api/secret", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ message: `Hello, ${payload.email}!`, user: payload });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

//Later add PUT /api/notes/:id and DELETE /api/notes/:id

// // tiny demo route
// app.get("/api/greet", (req, res) => {
//   const name = (req.query.name || "friend").toString();
//   res.json({ message: `Hello,${name}!` });
// });

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
