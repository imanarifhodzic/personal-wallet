# Deployment

The app deploys as a **single Node service on [Render](https://render.com)** (free tier)
backed by a **hosted [Turso](https://turso.tech) libSQL database** (free tier).

## Why this setup

The app was built for local development with `better-sqlite3` writing to a `wallet.db`
file. Every truly-free managed host now uses an *ephemeral* filesystem, so a local SQLite
file would reset on each restart. To keep the data persistent while changing as little as
possible, the database driver was swapped to `@libsql/client` pointed at Turso — a hosted,
SQLite-compatible database (libSQL is a fork of SQLite, so all SQL stayed identical). The
only code impact was making the ~65 database calls asynchronous (`await`).

In production, the Express server also serves the built React app, so the whole thing runs
on one origin (no CORS, no hardcoded API host).

## Architecture

| Piece | Local dev | Production (Render) |
|-------|-----------|---------------------|
| Frontend | Vite dev server (`:5173`), proxies `/api` → `:3000` | Built to `dist/`, served by Express |
| Backend | Express (`:3000`) | Express (Render-assigned `PORT`) |
| Database | Local `local.db` file (auto fallback) | Turso libSQL (via `TURSO_*` env vars) |

## Environment variables (set in the Render dashboard)

See `.env.example`. Required: `JWT_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
`RESEND_API_KEY`. Optional: `EMAIL_FROM`. `PORT` is provided by Render automatically.

Email is sent via [Resend](https://resend.com)'s HTTP API rather than SMTP, because
Render's free tier blocks outbound SMTP ports (25/465/587) — an SMTP send from Render
hangs until it times out, which surfaces as a "Server error" during registration.

## Deploy steps

1. **Turso:** create a database, copy its URL and an auth token.
2. **Render:** New → Blueprint (uses `render.yaml`) or a Web Service pointed at this repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add the environment variables above.
3. Render builds and deploys on every push to the connected branch.
