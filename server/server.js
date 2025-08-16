const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

//simple health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "secure-notes-api",
    time: new Date().toISOString(),
  });
});

// tiny demo route
app.get("/api/greet", (req, res) => {
  const name = (req.query.name || "friend").toString();
  res.json({ message: `Hello,${name}!` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
