const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"; // use env in prod

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

// // tiny demo route
// app.get("/api/greet", (req, res) => {
//   const name = (req.query.name || "friend").toString();
//   res.json({ message: `Hello,${name}!` });
// });

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
