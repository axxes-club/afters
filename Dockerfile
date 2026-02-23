# Production Dockerfile for Afters
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    openssl-dev \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apk add --no-cache libc6-compat openssl openssl-dev

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Build the application
RUN pnpm build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Set proper ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]