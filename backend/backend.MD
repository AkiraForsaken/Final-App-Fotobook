# Fotobook Backend Overview

Express + TypeScript REST API for Fotobook, a Facebook-inspired photo-sharing app. Backs the [Vite + React frontend](../frontend/README.md) with JWT-based auth, photo/album management, feeds, follows, and admin moderation.

> ⚠️ **Draft** — the Environment Variables and Scripts sections below are placeholders. They need to be filled in from `src/schemas/env.js` and `package.json` before this is accurate. See the TODO markers.

## Tech stack

- **Runtime:** Node.js + TypeScript, ESM (`"type": "module"`), run via `tsx` in dev
- **Framework:** Express 5
- **Database:** PostgreSQL, via Prisma 7 with the `@prisma/adapter-pg` driver adapter
- **Auth:** `jsonwebtoken` + `bcryptjs` — access tokens + rotating refresh tokens (httpOnly cookie).
- **Validation:** Zod
- **Uploads:** Multer, storage backend switchable via `STORAGE_PROVIDER` -`local` (disk, served from `/uploads`) or `cloudinary`.
- **Email:** Nodemailer/Ethereal for local dev, Resend for production, switchable via `EMAIL_PROVIDER`
- **Logging:** Pino (structured) + Morgan (HTTP access log)
- **Security middleware:** Helmet, CORS, express-rate-limit
- **Testing:** Vitest + Supertest, against a dedicated `.env.test`
- **Process management (prod):** PM2 _(per requirements doc — not reflected in `package.json` scripts; add an ecosystem file / `pm2 start` note once you wire this up)_

## Features

- Email/password signup with mandatory email verification before sign-in
- Login with JWT access tokens + httpOnly refresh-token cookie, with rotation and replay detection
- Forgot / reset password via single-use, expiring tokens
- Photo & Album CRUD with `public` / `private` sharing modes
- Attaching new or existing standalone photos to an album, with per-photo position tracking
- Likes on photos and albums
- Follow / unfollow, with follower/following listings
- Feed (posts from followed users) and Discovery (all public posts) — both cursor-paginated
- Public and owner profile views
- Admin: list/deactivate/reactivate/delete users, edit any user, moderate any photo/album, reset a user's password
- Centralized Zod validation and centralized error handling
- Tiered rate limiting on auth-sensitive and general API traffic

**Not yet implemented:** notifications (schema is stubbed out but commented in `schema.prisma` — see [Roadmap](#roadmap)), social login (Google/Facebook/Twitter — routes are placeholders on the frontend only), search.

## Project structure

```
backend/
├── prisma/
│   └── schema.prisma        # Users, Photos, Albums, Follows, Likes, tokens
├── src/
│   ├── controllers/         # Request/response handling per resource
│   ├── services/            # Business logic, called by controllers
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # requireAuth, optionalAuth, requireAdmin
│   │   ├── validate.ts            # Zod validation middleware factory
│   │   ├── upload.ts              # Multer configs (uploadPhotoImage, uploadAvatarImage)
│   │   ├── rate-limit.ts          # authRateLimit, strictRateLimit, apiRateLimit
│   │   └── error-handler.ts       # Centralized error normalization
│   ├── routes/
│   │   ├── api.routes.ts          # Mounts all sub-routers under /api
│   │   ├── auth.routes.ts
│   │   ├── photos.routes.ts
│   │   ├── albums.routes.ts
│   │   ├── feed.routes.ts         # feedRouter + discoveryRouter
│   │   ├── users.routes.ts
│   │   └── admin.routes.ts
│   ├── schemas/              # Zod request schemas + env schema
│   ├── prisma/client.ts      # Prisma client singleton
│   ├── app.ts                 # Express app: middleware, routes, error handler
│   └── index.ts                # Entrypoint: starts server, graceful shutdown
├── docker-compose.yml         # Local PostgreSQL only
└── .env.example
```

## Getting started

### Prerequisites

- Node.js (LTS)
- Docker (for local PostgreSQL) — or a PostgreSQL instance you manage yourself
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts a single `postgres:16` container (`fotobook-postgres`) on port `5432`, with credentials `fotobook` / `fotobook` and database `fotobook`, backed by a named volume so data survives restarts.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Validated at startup by `src/schemas/env.js` (Zod) — the process refuses to boot if this is wrong, including a dedicated check that blocks default/placeholder JWT secrets in production.

**Core**

| Variable          | Required | Default       | Description                                                                                                                    |
| ----------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`        | No       | `development` | `development` / `test` / `production` — gates the production safety checks below and Morgan's log format (`dev` vs `combined`) |
| `PORT`            | No       | `4000`        | Port the API listens on                                                                                                        |
| `DATABASE_URL`    | **Yes**  | —             | Postgres connection string used by Prisma                                                                                      |
| `FRONTEND_URL`    | **Yes**  | —             | Must be a valid URL. Used for CORS origin; in production this must not be a `localhost`/`127.0.0.1` URL                        |
| `PUBLIC_BASE_URL` | No       | `''`          | Base URL used when building absolute links (e.g. emailed verification/reset links) — _confirm exact usage_                     |
| `LOG_LEVEL`       | No       | —             | Passed through to Pino                                                                                                         |

**Auth**

| Variable                     | Required | Default | Description                                           |
| ---------------------------- | -------- | ------- | ----------------------------------------------------- |
| `ACCESS_TOKEN_SECRET`        | **Yes**  | —       | Min 32 chars. Signs JWT access tokens                 |
| `REFRESH_TOKEN_SECRET`       | **Yes**  | —       | Min 32 chars. Signs refresh tokens                    |
| `REQUIRE_EMAIL_VERIFICATION` | No       | —       | Boolean for optional email verification before log in |

> In production, startup fails if `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` equals `changeme`, `secret`, or `dev-secret` — don't reuse the dev placeholder values below in `.env.production`.

**Storage** — switch via `STORAGE_PROVIDER`

| Variable                | Required    | Default     | Description                                                   |
| ----------------------- | ----------- | ----------- | ------------------------------------------------------------- |
| `STORAGE_PROVIDER`      | No          | `local`     | `local` or `cloudinary`                                       |
| `UPLOAD_DIR`            | No          | `./uploads` | Local disk path — only relevant when `STORAGE_PROVIDER=local` |
| `CLOUDINARY_CLOUD_NAME` | Conditional | —           | Required if `STORAGE_PROVIDER=cloudinary`                     |
| `CLOUDINARY_API_KEY`    | Conditional | —           | Required if `STORAGE_PROVIDER=cloudinary`                     |
| `CLOUDINARY_API_SECRET` | Conditional | —           | Required if `STORAGE_PROVIDER=cloudinary`                     |
| `CLOUDINARY_FOLDER`     | No          | `fotobook`  | Cloudinary folder prefix                                      |

**Email** — switch via `EMAIL_PROVIDER`

| Variable                          | Required    | Default                            | Description                                                                                   |
| --------------------------------- | ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `EMAIL_PROVIDER`                  | No          | `ethereal`                         | `ethereal` (dev/test SMTP sandbox) or `resend` (production)                                   |
| `EMAIL_FROM`                      | No          | `Fotobook <onboarding@resend.dev>` | From address on outgoing mail                                                                 |
| `RESEND_API_KEY`                  | Conditional | —                                  | Required if `EMAIL_PROVIDER=resend`                                                           |
| `ETHEREAL_USER` / `ETHEREAL_PASS` | No          | —                                  | Ethereal test-account credentials — generate one with `npm run email:create-ethereal-account` |

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
npm run dev
```

### Available scripts

| Script                                  | Description                                                        |
| --------------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                           | Start the API with hot-reload (`tsx watch`)                        |
| `npm run build`                         | Type-check and compile to `dist/` (`tsc`)                          |
| `npm start`                             | Run the compiled server (`node dist/index.js`) — production        |
| `npm test`                              | Run the Vitest suite once, loading `.env.test`                     |
| `npm run test:watch`                    | Run Vitest in watch mode, loading `.env.test`                      |
| `npm run prisma:generate`               | Regenerate the Prisma client                                       |
| `npm run prisma:migrate`                | Create/apply a dev migration                                       |
| `npm run prisma:studio`                 | Open Prisma Studio                                                 |
| `npm run format`                        | Format `src/**` with Prettier (incl. `prettier-plugin-prisma`)     |
| `npm run email:create-ethereal-account` | Generate a throwaway Ethereal SMTP account for local email testing |

The API will be available at `http://localhost:4000` (or your configured `PORT`), with health checks at:

- `GET /health` — liveness (always `200` if the process is up)
- `GET /ready` — readiness (runs `SELECT 1` against Postgres, `503` if the DB is unreachable)

## API overview

All routes are mounted under `/api`.

| Resource  | Base path        | Notes                                                                                          |
| --------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Auth      | `/api/auth`      | signup, login, logout, refresh, verify-email, forgot/reset password                            |
| Photos    | `/api/photos`    | create, get, update, delete, like/unlike                                                       |
| Albums    | `/api/albums`    | create, get, update, delete, like/unlike, add/remove photos                                    |
| Feed      | `/api/feed`      | photos/albums from followed users (auth required)                                              |
| Discovery | `/api/discovery` | all public photos/albums (guests allowed)                                                      |
| Users     | `/api/users`     | current-user profile, public profiles, follow/unfollow, photos/albums/followers/following tabs |
| Admin     | `/api/admin`     | user & content moderation (admin role required)                                                |

Every collection endpoint is paginated — cursor-based (`cursor`/`take`) for feed, discovery, and a user's own photos/albums; offset-based (`offset`/`take`) for followers/following lists and the admin panel.

## Authentication model

- Access tokens are short-lived JWTs sent as `Authorization: Bearer <token>`.
- Refresh tokens live in an `httpOnly` cookie, are rotated on every use, and rotation replay is detected via the `replacedById`/`rotatedFrom` self-relation on `RefreshToken`.
- `requireAuth` rejects unauthenticated requests; `optionalAuth` attaches the user if present but doesn't block guests (used by Feed's guest-readable siblings like Discovery, and by public profile/photo/album reads); `requireAdmin` additionally checks `role === 'admin'`.
- Inactive users (`isActive: false`) cannot obtain a valid access token, per the requirements doc.
- ⚠️ Email verification and password-reset delivery: `backend.MD` says these links are still logged to the console with no mail provider wired up, but `EMAIL_PROVIDER`/`RESEND_API_KEY`/`ETHEREAL_*` are fully present as validated env vars with `nodemailer` and `resend` as real dependencies. This looks like `backend.MD` is stale rather than the email integration being unfinished — worth confirming which is true before this README treats it either way.

## Rate limiting

| Limiter           | Window | Limit | Applied to                          |
| ----------------- | ------ | ----- | ----------------------------------- |
| `apiRateLimit`    | 1 min  | 100   | All of `/api` (blanket)             |
| `authRateLimit`   | 15 min | 20    | `signup`, `login`, `verify-email`   |
| `strictRateLimit` | 1 hour | 5     | `forgot-password`, `reset-password` |

## Testing

Tests run with **Vitest** + **Supertest** against a separate `.env.test` (loaded via `dotenv-cli`), so test runs don't touch your dev database or dev secrets.

```bash
cp .env .env.test   # then point DATABASE_URL at a disposable test DB
npm test
npm run test:watch
```

> Per the requirements doc, coverage should include business logic, validation, authentication/authorization, and REST endpoints — worth confirming current coverage against that list as part of this doc pass.

## Data model highlights

- A `Photo` can be **standalone** (`isStandalone: true`) or live inside one or more albums via the `AlbumPhoto` join table, which also tracks per-album `position`.
- Deleting an `Album` cascades its `AlbumPhoto` links; orphaned, non-standalone photos are cleaned up in the service layer (not by a DB cascade), per `schema.prisma`'s comments.
- `SharingMode` (`public` / `private`) applies independently to both `Photo` and `Album`.
- Likes are modeled as composite-key join tables (`PhotoLike`, `AlbumLike`) rather than a counter column, so `likesCount` is derived.

## Roadmap

- **Notifications** — schema is drafted but commented out in `schema.prisma` (`Notification` model, `NotificationType` enum, `recipient`/`actor` relations on `User`). Planned triggers: photo/album likes, new followers, account deactivation/deletion. Needs: an uncommented migration, a notifications controller/service, and a delivery mechanism (in-app only, vs. email).
- Social login (Google/Facebook/Twitter) — not yet wired up server-side (and depends on resolving the Passport question above).
- Search (photo/album search box per the requirements doc's advanced requirements).
- Real email delivery for verification/reset links — status unclear, see the ⚠️ note under Authentication model above.
