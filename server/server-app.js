const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const path = require("path");

require("dotenv").config();

const app = express();
//logging (redact sensitive bits)
app.use(
  pinoHttp({
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'res.headers["set-cookie"]',
      ],
      remove: true,
    },
    customProps: () => ({ service: " secure-notes-api" }),
  })
);
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: ORIGIN, credentials: true }));
//security header
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
//safer JSON parsing (limit body size)
app.use(express.json({ limit: "50kb" }));
// 60 req/min per IP across /api
const baseLimiter = rateLimit({
  windowsMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", baseLimiter);

//stricter on auth (10/min)
const authLimiter = rateLimit({
  windowsMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"; // use env in prod

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: " Missing or invalid Authorization header",
    });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid or expired token" });
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

const {
  validate,
  registerSchema,
  loginSchema,
  createNoteSchema,
  noteIdParam,
  updateNoteSchema,
} = require("./validate");

//Register
app.post("/api/auth/register", validate(registerSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const hash = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(
      email,
      hash
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res
        .status(400)
        .json({ error: "EmailExists", message: "EMAIL already registered" });
    }
    req.log.error({ err }, "register_failed");
    res.status(500).json({ error: "ServerError" });
  }
});

// Login
app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
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
  const rows = db
    .prepare(
      "SELECT id, content, created_at FROM notes WHERE user_id = ? ORDER BY id DESC"
    )
    .all(req.user.id);
  res.json({ notes: rows });
});

//POST /api/notes - create a note
app.post(
  "/api/notes",
  authMiddleware,
  validate(createNoteSchema),
  (req, res) => {
    const { content } = req.body;

    // if (typeof content !== "string") {
    //   return res.status(400).json({
    //     error: "ValidationError",
    //     details: [
    //       { path: "body.content", message: "content must be a string" },
    //     ],
    //   });
    // }

    // if (content.trim().length > 2000) {
    //   return res.status(413).json({
    //     error: "Payload to large",
    //     details: [{ path: "body.content", message: "content must be <= 2000" }],
    //   });
    // }
    // //debuging
    // req.log.info({ len: content.length }, "note_create_length");

    const info = db
      .prepare("INSERT INTO notes (user_id, content) VALUES (?,?)")
      .run(req.user.id, content.trim());
    const row = db
      .prepare("SELECT id, content, created_at FROM notes WHERE id = ?")
      .get(info.lastInsertRowid);
    res.status(201).json({ note: row });
  }
);

//UPDATE note (only if it belongs to the user)
app.put(
  "/api/notes/:id",
  authMiddleware,
  validate(updateNoteSchema),
  (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const stmt = db.prepare(
      "UPDATE notes SET content = ? WHERE id = ? AND user_id = ?"
    );
    const result = stmt.run(content.trim(), id, req.user.id);

    if (result.changes === 0) {
      //not found or not owned by this user
      return res.status(404).json({ error: "NotFound" });
    }

    const row = db
      .prepare(
        "SELECT id, content, created_at FROM notes WHERE id = ? AND user_id = ?"
      )
      .get(id, req.user.id);

    res.json({ note: row });
  }
);

//DELETE note (only if it belongs to the user)
app.delete(
  "/api/notes/:id",
  authMiddleware,
  validate(noteIdParam),
  (req, res) => {
    const { id } = req.params;

    const result = db
      .prepare("DELETE FROM notes WHERE id = ? AND user_id = ?")
      .run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "NotFound" });
    }

    res.status(204).send(); //No Content
  }
);

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

//Serve React build in production
const clientBuildPath = path.join(__dirname, "../client/dist");
console.log("[STATIC] Serving from", clientBuildPath);

app.use(express.static(clientBuildPath));

//For any route not starting with /api server index.html
app.get(/^(?!\/api).*/, (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(this.path.join(clientBuildPath, "index.html"));
  }
});

//404
app.use((req, res) => {
  res.status(404).json({ error: "NotFound", path: req.path });
});

//Central error handler
//(Use next(err) anywhere to hit this)
app.use((err, req, res, _next) => {
  req.log?.error({ err }, "unhandled_error");
  res.status(500).json({ error: "ServerError" });
});

//Later add PUT /api/notes/:id and DELETE /api/notes/:id

// // tiny demo route
// app.get("/api/greet", (req, res) => {
//   const name = (req.query.name || "friend").toString();
//   res.json({ message: `Hello,${name}!` });
// });

module.exports = app;
