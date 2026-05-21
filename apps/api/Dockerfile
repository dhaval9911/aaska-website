FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY apps/api ./apps/api
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm run build:packages
RUN pnpm prisma generate --schema prisma/schema.prisma
RUN pnpm --filter @aaska/api build

# Create the standalone deployment directory with flat node_modules
RUN pnpm --filter @aaska/api deploy --prod --legacy /app/api-deploy

# Generate Prisma client inside the deploy dir (pnpm blocks @prisma/client postinstall)
RUN cp -r /app/prisma /app/api-deploy/prisma && \
    cd /app/api-deploy && \
    node ./node_modules/prisma/build/index.js generate --schema ./prisma/schema.prisma

FROM node:20-alpine AS runner
WORKDIR /app

# Flat node_modules with generated Prisma client from deploy
COPY --from=builder /app/api-deploy/node_modules ./node_modules

# Compiled API
COPY --from=builder /app/apps/api/dist ./dist

# Schema for runtime migrations
COPY prisma ./prisma

EXPOSE 4000

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma && node dist/main.js"]
