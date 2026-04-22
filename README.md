# baard

**One inbox, every platform.**  
Unified messaging for power users. Messages are relayed live — never stored.

🌐 [baard.cc](https://baard.cc)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (schema auto-created on boot) |
| Auth | Google OAuth 2.0 + Email/Password (JWT httpOnly cookies) |
| Deploy | Render (web service + managed PostgreSQL) |

---

## Project structure

```
baard/
├── server/
│   ├── index.js              Express app — serves API + built React
│   ├── db/
│   │   ├── pool.js           PostgreSQL connection pool
│   │   └── schema.sql        Database schema (auto-migrates on boot)
│   ├── routes/
│   │   ├── auth.js           POST /api/auth/{register,login,logout} + Google OAuth
│   │   ├── user.js           GET|PUT /api/user/{profile,settings,password}
│   │   └── platforms.js      GET|POST|DELETE /api/platforms
│   └── middleware/
│       └── requireAuth.js    JWT cookie verification
├── client/
│   ├── src/
│   │   ├── lib/api.js        Typed fetch client — all API calls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  Auth state, platform connections
│   │   │   └── ThemeContext.jsx Light/dark mode
│   │   ├── components/       Logo, Nav, ThemeToggle, PlatformBadge, PrivacyBanner, ProtectedRoute
│   │   └── pages/            Landing, Login, Pricing, Connect, Inbox, Settings
│   ├── vite.config.js        Proxies /api to Express in dev
│   └── package.json
├── render.yaml               One-file Render deployment (web + DB)
├── .env.example              All environment variables documented
└── package.json              Root scripts: dev, build, start
```

---

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/baard.git
cd baard
npm install
```

### 2. Create the database

```bash
createdb baard
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — the only required field to get started is `DATABASE_URL`.  
The schema is created automatically when the server first boots.

### 4. Start development servers

```bash
npm run dev
```

This starts:
- Express API on **http://localhost:3001**
- Vite dev server on **http://localhost:5173** (proxies /api to Express)

Open **http://localhost:5173** — email/password auth works immediately.  
Google OAuth requires the credentials below.

---

## Google OAuth setup

### Step 1 — Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add authorised redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (development)
   - `https://baard.cc/api/auth/google/callback` (production — your domain)
5. Copy the **Client ID** and **Client Secret**

### Step 2 — Add to .env

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
APP_URL=http://localhost:3001
```

Restart the dev server — Google sign-in is now live.

---

## Deploy to Render

Render reads `render.yaml` and provisions everything automatically:
- A **Node.js web service** (builds the React app, starts Express)
- A **PostgreSQL database** (connection string injected automatically)

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Step 2 — Connect to Render

1. [render.com](https://render.com) → **New → Blueprint Instance**
2. Connect your GitHub repo
3. Render detects `render.yaml` and shows a preview of what will be created
4. Click **Apply**

### Step 3 — Set environment variables

After the first deploy, go to your web service in Render Dashboard → **Environment** and set:

| Variable | Value |
|---|---|
| `APP_URL` | `https://your-app.onrender.com` (or your custom domain) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

`JWT_SECRET` and `DATABASE_URL` are set automatically by Render.

### Step 4 — Update Google OAuth redirect URI

Back in [Google Cloud Console](https://console.cloud.google.com), add your production redirect URI:
```
https://your-app.onrender.com/api/auth/google/callback
```

### Step 5 — Custom domain (optional)

Render Dashboard → your web service → **Custom Domain** → add `baard.cc`.  
Update `APP_URL` to `https://baard.cc` and add `https://baard.cc/api/auth/google/callback` to Google.

---

## API reference

### Auth (no auth required)
```
POST /api/auth/register    { email, password, name }  → { user }
POST /api/auth/login       { email, password }         → { user }
POST /api/auth/logout                                  → { ok }
GET  /api/auth/google                                  → redirect to Google
GET  /api/auth/google/callback                         → redirect to /inbox
GET  /api/auth/me                                      → { user, settings }
```

### User (JWT cookie required)
```
GET    /api/user/profile          → { id, email, name, avatar_url, plan }
PUT    /api/user/profile          { name?, email? }
GET    /api/user/settings         → { ...all settings }
PUT    /api/user/settings         { ...partial settings }
PUT    /api/user/password         { currentPassword, newPassword }
DELETE /api/user/account
```

### Platforms (JWT cookie required)
```
GET    /api/platforms             → [{ platform_id, connected_at }]
POST   /api/platforms/:id/connect → { platform_id, connected_at }
DELETE /api/platforms/:id         → { ok }
```

---

## Database schema

| Table | Purpose |
|---|---|
| `users` | Account records — email, password_hash (bcrypt), google_id, name, plan |
| `user_settings` | One row per user — all preferences, history date, notification config |
| `platform_connections` | Which platforms each user has connected |

OAuth tokens are **never** stored in the database. They live encrypted in the user's browser IndexedDB.

---

## Privacy model

| Data | Where it lives |
|---|---|
| Messages | Never stored anywhere — relayed live from platform to browser |
| OAuth tokens | Browser IndexedDB only — never sent to the server |
| Account info | PostgreSQL — email, name, plan, settings |
| Platform connections | PostgreSQL — platform IDs only, no tokens |

---

## License

MIT
