FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

# Accept NEXT_PUBLIC_* as build args — these get baked into the Next.js bundle
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json eslint.config.mjs .prettierrc .lintstagedrc.cjs ./
COPY apps/web ./apps/web
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm run build:packages
RUN pnpm --filter @aaska/web build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
