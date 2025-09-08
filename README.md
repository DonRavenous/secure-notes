# Secure Notes Project

![Build & Deploy](https://github.com/DonRavenous/secure-notes/actions/workflows/azure-deploy.yml/badge.svg)

A full-stack demo app built as part of my cybersecurity & web dev learning roadmap.  
Features secure authentication (JWT, bcrypt) and a React frontend connected to a Node/Express backend with SQLite.

---

## Tech Stack

- **Frontend:** React (Vite, TypeScript), Context API
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Auth:** bcrypt password hashing + JWT tokens
- **Dev Tools:** REST Client (VS Code), GitHub
- **Testing:** Vitest, Supertest
- **Deployment:** Azure App Service (Linux, Node 18)

---

## Features

- User registration and login with password hashing
- JWT-based authentication
- Protected API routes
- React frontend with login/register forms
- Token persistence with localStorage
- Notes CRUD (create, view, update, delete)
- Secure headers & rate limiting
- Ready for deployment to Azure / cloud platforms

---

## 🧭 How It Works (at a glance)

### Auth flow

[React] --(POST /api/auth/login {email,pass})--> [Express]
<- { token } (JWT) ----------------------------
store token (Context + localStorage)

[React] --(GET /api/secret, Authorization: Bearer <token>)--> [Express]
<- { message, user } --------------------------------------

- Passwords are **hashed** with bcrypt.
- JWT is **signed** with `JWT_SECRET` and verified on each protected request.

### Notes flow (user-scoped)

GET /api/notes -> returns current user's notes (JWT required)
POST /api/notes {content} -> creates a note owned by the current user (JWT required)

The server derives the user from the **verified JWT**, not from the client body.

---

## 🚀 Deployment (Azure + GitHub Actions)

### CI/CD Workflow

- On push to `main`, GitHub Actions:
  1. Installs client & server dependencies
  2. Builds React app (`client/dist`)
  3. Bundles app (excluding node_modules)
  4. Deploys a ZIP to Azure App Service

Workflow file: `.github/workflows/azure-deploy.yml`

### Azure App Settings

In **Azure Portal → App Service → Configuration → Application settings**:

| Key                              | Value                                 |
| -------------------------------- | ------------------------------------- |
| `PORT`                           | `8080`                                |
| `NODE_ENV`                       | `production`                          |
| `JWT_SECRET`                     | strong random secret string           |
| `FRONTEND_ORIGIN`                | `https://<yourapp>.azurewebsites.net` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (since CI builds client)      |
| `WEBSITE_NODE_DEFAULT_VERSION`   | `~18`                                 |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/DonRavenous/secure-notes.git
cd secure-notes
```

### 2.Setting up backend

```bash
cd server
npm install
echo "PORT=5000\nJWT_SECRET=supersecret" > .env
npm run dev
```

### 3.Setting up frontend

```bash
cd client
npm install
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev
```

Frontend runs on: http://localhost:5173

Backend runs on: http://localhost:5000

### API – Quick Reference

POST /api/auth/register
Body: { "email": "a@b.com", "password": "secret" }
→ { "success": true } (or error)

POST /api/auth/login
Body: { "email": "a@b.com", "password": "secret" }
→ { "token": "eyJ..." }

GET /api/secret (protected)
Headers: Authorization: Bearer <token>
→ { "message": "Hello, a@b.com!", "user": { "id": ..., "email": ... } }

### Notes (protected)

GET /api/notes
→ { "notes": [ { "id": 1, "content": "Hi", "created_at": "..." }, ... ] }

POST /api/notes
Body: { "content": "My first secure note!" }
→ { "note": { "id": ..., "content": "...", "created_at": "..." } }

All protected routes require Authorization: Bearer <token>.

### Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
content TEXT NOT NULL,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

Use parameterized queries (?) in SQL to avoid injection.

During dev, if schema changes, stop server and delete server/app.db to recreate.

### Security Notes (so far)

Passwords hashed with bcrypt (never store raw passwords).

JWT with expiry (1h) used for protected endpoints.

CORS locked to http://localhost:5173 during dev.

.env for secrets; .env files are git-ignored.

Basic input checks (e.g., note length); deeper validation to come in.

### Environment Variables

### server/.env

PORT=5000
JWT_SECRET=replace_me_with_a_strong_secret

### client/.env

VITE_API_URL=http://localhost:5000

Vite only exposes vars prefixed with VITE\_.

### client/.env.production

VITE_API_URL=/api

### REST Client (VS Code)

Create server/requests.http:

### @env=dev

# @name login

POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
"email": "test@example.com",
"password": "mypassword"
}

### Use token from the login response

GET http://localhost:5000/api/secret
Authorization: Bearer {{login.response.body.token}}

GET http://localhost:5000/api/notes
Authorization: Bearer {{login.response.body.token}}

POST http://localhost:5000/api/notes
Content-Type: application/json
Authorization: Bearer {{login.response.body.token}}

{
"content": "My first secure note!"
}

Run Login first so {{login.response.body.token}} is available.

### Scripts

Server
npm run dev – start API with nodemon

npm start – start API with node
Client
npm run dev – start Vite dev server

npm run build – production build

### Troubleshooting

CORS / Network errors → Ensure server CORS allows frontend origin; client .env must point to backend.

JWT 401 → Check Authorization: Bearer <token> header; ensure JWT_SECRET is set and stable.

SQLite schema didn’t change → Delete server/app.db and restart, or use SQLite CLI to drop/create tables.

TypeScript mismatches → Make sure Note type matches DB schema (id, content, created_at).

Deployment fails → Check GitHub Action logs, ensure client/dist exists before deploy.

Screenshots (TODO)

Add screenshot of login/register page

Add screenshot showing protected API response

Author

Built by DonRavenous as part of my cybersecurity & web dev studies.
