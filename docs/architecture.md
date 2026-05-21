# Aaska Architecture

## Overview

- `apps/web`: Next.js App Router storefront and admin surface foundation
- `apps/api`: NestJS API with Prisma-backed modules
- `packages/ui`: shared UI primitives
- `packages/types`: shared types and lightweight contracts
- `packages/config`: shared business constants and app metadata
- `prisma`: database schema and migrations
- `docker`: reverse proxy and database bootstrap assets
- `scripts`: local helper scripts for common workflows

## Deployment shape

- Nginx terminates HTTP and later SSL via Certbot
- Next.js runs as the frontend app container
- NestJS runs as the backend API container
- PostgreSQL runs as the database container
- Local file uploads are stored on a Docker volume through a storage abstraction layer
