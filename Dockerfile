# syntax=docker/dockerfile:1
# AXXES Next.js image for Cloud Run (standalone output, glibc for sharp/Prisma).
# Build-time env (NEXT_PUBLIC_* etc.) comes from .env.production, written by
# Cloud Build from Secret Manager; it never reaches the final image.
FROM node:24-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# pnpm 9 rejects the pnpm 12-only allowBuilds placeholder file (no packages field).
# This is a single-package app; ignore that incompatible workspace file in the image.
RUN rm -f pnpm-workspace.yaml
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate && pnpm install --frozen-lockfile
RUN mkdir -p public && if [ -d prisma ]; then npx prisma generate; fi
# Matches the Vercel build (vercel.json) minus migrations, which run from migrate.yml.
RUN --mount=type=secret,id=build-env,target=/app/.env.production pnpm exec next build --webpack \
  && rm -f .next/standalone/.env .next/standalone/.env.*

FROM node:24-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8080
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN rm -f .env .env.* && mkdir -p .next/cache && chown -R node:node .next
USER node
EXPOSE 8080
# Runtime secrets: Cloud Run mounts the app's Secret Manager dotenv at /secrets/env.
CMD ["sh", "-c", "if [ -f /secrets/env ]; then exec node --env-file=/secrets/env server.js; else exec node server.js; fi"]
