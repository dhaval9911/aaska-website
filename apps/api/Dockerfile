FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.json eslint.config.mjs .prettierrc .lintstagedrc.cjs ./
COPY prisma ./prisma
COPY apps/api ./apps/api
COPY packages ./packages

RUN pnpm install --no-frozen-lockfile
RUN pnpm run build:packages
RUN pnpm prisma generate --schema prisma/schema.prisma
RUN pnpm --filter @aaska/api build

FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy --schema prisma/schema.prisma && node apps/api/dist/main.js"]
