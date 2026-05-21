# Aaska

Production-ready monorepo foundation for a resin art e-commerce platform built with Next.js, NestJS, Prisma, PostgreSQL, Docker Compose, and Nginx.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shared UI package, React Hook Form, Zod, TanStack Query, Auth.js
- Backend: NestJS, TypeScript
- Database: PostgreSQL with Prisma ORM
- Infrastructure: Docker, Docker Compose, Nginx reverse proxy, Debian 12 compatible runtime
- Tooling: ESLint, Prettier, Husky, lint-staged, pnpm workspaces

## Repository structure

```text
aaska-website/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── config/
│   ├── types/
│   └── ui/
├── prisma/
├── docker/
│   ├── nginx/
│   └── postgres/
├── scripts/
└── docs/
```

## Local development setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Start PostgreSQL with Docker if you do not already have a local instance:

```bash
docker compose up -d postgres
```

4. Run Prisma migration and generate the client:

```bash
pnpm prisma generate --schema prisma/schema.prisma
pnpm prisma migrate deploy --schema prisma/schema.prisma
```

5. Start the app and API:

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/api/health`

## Docker setup

1. Prepare environment variables:

```bash
cp .env.example .env
```

2. Start the full stack:

```bash
docker compose up -d --build
```

3. View logs:

```bash
docker compose logs -f
```

4. Stop services:

```bash
docker compose down
```

## Debian VM deployment steps

Example server target provided by the project:

```bash
gcloud compute ssh --zone "us-central1-f" "instance-20260520-084427" --project "project-dd78babb-fa69-4445-a5b"
```

Do not run SSH from this repository automation. Use it manually when you are ready to deploy.

Recommended Debian 12 preparation:

```bash
apt update
apt install -y docker.io docker-compose git
systemctl enable docker
systemctl start docker
```

Deployment example:

```bash
git clone <repo>
cd aaska-website
cp .env.example .env
docker compose up -d --build
```

## PM2 fallback

If Docker is temporarily unavailable, you can run the built services manually with PM2 after provisioning PostgreSQL separately:

```bash
pnpm install
pnpm build
pm2 start apps/api/dist/main.js --name aaska-api
pm2 start "pnpm --filter @aaska/web start" --name aaska-web
```

## Helper scripts

- `./scripts/install.sh`
- `./scripts/dev.sh`
- `./scripts/build.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/docker-up.sh`
- `./scripts/docker-down.sh`
- `./scripts/docker-logs.sh`

## Current foundation scope

- Responsive marketing shell and route placeholders
- Auth scaffolding with email/password foundation
- Prisma schema and initial migration
- Core API modules: health, auth, users, products, categories
- Nginx reverse proxy and Compose stack
- Upload storage abstraction with local volume support

## Roadmap

- Add guarded admin routes and role-based authorization
- Build catalog CRUD flows and media uploads
- Add cart, checkout, orders, and payment integration
- Introduce S3-compatible object storage adapter
- Add CI, tests, and deployment automation
