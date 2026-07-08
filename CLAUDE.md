# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standing rule for this session

After every response, update `_state.md` with what you did, what files changed, any decisions made, and current status/next step. End every response with: `📝 _state.md updated — [one line of what changed]`

---

## Commands

```bash
# Install
pnpm install

# Dev (builds packages first, then runs API + web in parallel)
pnpm dev

# Build all
pnpm build

# Build only shared packages (required before running apps individually)
pnpm build:packages

# Run a single app
pnpm --filter @aaska/api dev
pnpm --filter @aaska/web dev

# Lint all packages
pnpm lint

# Prisma (schema lives at prisma/schema.prisma, run from root)
pnpm prisma:generate         # regenerate client after schema changes
pnpm prisma:migrate          # run pending migrations (deploy, not dev)
npx prisma migrate dev --name "description" --schema prisma/schema.prisma  # create new migration
pnpm db:seed                 # seed from prisma/seed.ts

# Docker (full stack)
pnpm docker:up               # docker compose up -d --build
pnpm docker:down
pnpm docker:logs
```

- API runs at `http://localhost:4000`, all routes prefixed with `/api`
- Web runs at `http://localhost:3000`
- No test suite beyond `echo` stubs

---

## Architecture

### Monorepo layout

```
apps/api/          NestJS backend
apps/web/          Next.js 15 frontend (App Router)
packages/ui/       Shared React components: Button, Card, Input, PageShell
packages/types/    Shared TypeScript types
packages/config/   Shared config
services/whatsapp-service/  Standalone Node service (whatsapp-web.js)
prisma/            Single Prisma schema + migrations for the whole repo
docker/            nginx config, postgres init scripts
```

Packages are consumed via `workspace:*` and resolved directly from source (`"main": "src/index.ts"`) — no build step needed in dev, but `pnpm build:packages` is required before running apps in production or parallel dev mode.

### NestJS API (`apps/api`)

Every domain lives in `src/modules/<name>/` with the standard NestJS triple: `<name>.module.ts`, `<name>.service.ts`, `<name>.controller.ts`, and a `dto/` subfolder.

**Auth pattern** — two guards and a decorator:
- `JwtAuthGuard` — validates Bearer token, attaches `{ sub, role }` to `req.user`
- `RolesGuard` — checks `req.user.role` against `@Roles('ADMIN')`
- `OptionalJwtAuthGuard` — does not throw if no token (used for guest+user endpoints)

Admin endpoints always use `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')`.

`PrismaService` is a global module — inject it anywhere without importing `PrismaModule`.

Global settings in `main.ts`: prefix `api`, CORS open, `ValidationPipe` with `whitelist: true, transform: true, forbidNonWhitelisted: true`.

### Next.js web (`apps/web`)

Uses **Next.js 15 App Router**. All pages under `app/` are server components by default.

**API calls from server components** use `apiFetch<T>()` from `lib/api.ts`:
- On the server it hits `API_BASE_URL` (internal Docker/network URL)
- On the client it hits `NEXT_PUBLIC_API_URL` (public URL)

**Auth** uses Next-Auth v5 (`next-auth@beta`) with JWT strategy. `auth()` returns the session with `accessToken` (the NestJS JWT). The token is forwarded to the API via `apiFetch(..., { token: session.accessToken })`.

Admin layout (`app/admin/layout.tsx`) calls `auth()` server-side and redirects non-admins to `/login`. Middleware (`middleware.ts`) enforces the same at the edge for `/admin/*` and `/orders/*`.

**Admin pages** are all server components that fetch on render — no client-side TanStack Query in the admin panel. Client components in the admin panel are isolated to interactive islands (delete buttons, forms) kept in separate files alongside the page.

### Prisma

Schema at `prisma/schema.prisma`, consumed by both the API (`@prisma/client` in `apps/api`) and scripts at root. The `@prisma/client` in `apps/api/package.json` is the actual runtime client; the root `package.json` has it as a dep for scripts/seeding.

Key models: `User` (role: ADMIN | CUSTOMER), `Product` (supports variants via `hasVariants`), `Category` (self-referential for subcategories, homepage tile fields), `Order` (soft-delete via `deletedAt`, status enum `PENDING_WHATSAPP → DELIVERED`), `CartItem`.

Revenue queries must filter `status: 'DELIVERED'` and `deletedAt: null`.

### WhatsApp service

Standalone container at port 3001, accessed by the API via `WHATSAPP_SERVICE_URL`. Sends order confirmations and status updates via whatsapp-web.js. First run requires scanning a QR code; session persists in the `whatsapp_auth` Docker volume.

### Environment variables

Copy `.env.example` to `.env`. Key vars:
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — NestJS JWT signing secret
- `NEXTAUTH_SECRET` — Next-Auth session signing secret
- `API_BASE_URL` — server-side API URL (e.g. `http://aaska-api:4000/api` in Docker)
- `NEXT_PUBLIC_API_URL` — client-side API URL (public domain)
- `WHATSAPP_SERVICE_URL` — internal URL for WhatsApp service
- `UPI_ID` — shown in WhatsApp payment messages
