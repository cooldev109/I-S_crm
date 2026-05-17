# Studio Ops Platform

Custom operations platform for an architecture / interior design studio.
WhatsApp is the studio's only interface; a custom backend handles clients,
budgets, documents, and billing behind it.

See [`docs/`](docs/) for scope, roadmap, design system, and the build prompt.

## Monorepo layout

```
/shared   TypeScript types shared by api and web
/api      NestJS backend — REST API, Prisma, integrations
/web      React admin panel (Vite + Tailwind)
/docs     Project documentation
```

## Status

**Phase 0 — Setup & Foundation: complete.** Monorepo, tooling, Prisma schema,
base NestJS app with auth + health check, React scaffold with login + auth guard,
CI pipeline. Next: Phase 1 Week 1 — data model + WhatsApp intake (see
[`docs/development-roadmap.md`](docs/development-roadmap.md)).

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or hosted)
- Redis (needed from Phase 1 Week 2 for BullMQ; not required to boot Phase 0)

## Setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure environment
cp api/.env.example api/.env
cp web/.env.example web/.env
#    edit api/.env — set DATABASE_URL, JWT_SECRET, REDIS_URL

# 3. Build shared types (api and web import from it)
npm run build --workspace shared

# 4. Set up the database
npm run prisma:generate --workspace api
npm run prisma:migrate  --workspace api -- --name init
npm run db:seed         --workspace api   # creates admin@studio.local / admin1234

# 5. Run
npm run dev:api    # http://localhost:1109/api
npm run dev:web    # http://localhost:1995
```

Log in with the seeded admin account and **change the password immediately**.

## Useful commands

| Command | What it does |
|---------|--------------|
| `npm run lint` | ESLint across all workspaces |
| `npm run typecheck` | TypeScript checks, no emit |
| `npm test` | API unit tests (Jest) |
| `npm run build` | Build shared → api → web |
| `npm run prisma:studio --workspace api` | Browse the database |

## Verifying Phase 0

1. `npm run dev:api` — boots, logs `Database connected` and the listen URL.
2. `GET http://localhost:1109/api/health` → `{ "status": "ok", "db": "ok" }`.
3. `npm run dev:web` — open `http://localhost:1995`, redirected to `/login`.
4. Log in with the seeded account → lands on the Dashboard, which shows API + DB status green.

## Secrets management

- Never commit `.env` files (git-ignored).
- `.env.example` files are the source of truth for required variables — keep them current.
- In production, inject secrets via the host's secret store (Render/Railway env vars,
  or a `.env` outside the repo). `JWT_SECRET` must be a long random string.
- Integration credentials (WhatsApp, OpenAI) are not required to boot — the app
  starts without them and only the relevant module fails when exercised.
