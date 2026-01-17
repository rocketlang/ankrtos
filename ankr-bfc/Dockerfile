# =============================================================================
# ankrBFC Multi-Stage Dockerfile
#
# Builds both bfc-api and bfc-web services
# Usage:
#   docker build --target bfc-api -t bfc-api .
#   docker build --target bfc-web -t bfc-web .
# =============================================================================

# =============================================================================
# Base Stage - Node.js with pnpm
# =============================================================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# =============================================================================
# Dependencies Stage
# =============================================================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY tsconfig.base.json ./

# Copy package.json files for all workspaces
COPY apps/bfc-api/package.json ./apps/bfc-api/
COPY apps/bfc-web/package.json ./apps/bfc-web/
COPY packages/bfc-core/package.json ./packages/bfc-core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Builder Stage - Build all packages
# =============================================================================
FROM deps AS builder

# Copy source code
COPY . .

# Generate Prisma client
RUN cd prisma && npx prisma generate

# Build packages in order
RUN pnpm --filter @bfc/core build
RUN pnpm --filter @bfc/api build
RUN pnpm --filter @bfc/web build

# =============================================================================
# BFC API Production Stage
# =============================================================================
FROM node:20-alpine AS bfc-api

# Install runtime dependencies
RUN apk add --no-cache curl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy bfc-core
COPY --from=builder /app/packages/bfc-core/package.json ./packages/bfc-core/
COPY --from=builder /app/packages/bfc-core/dist ./packages/bfc-core/dist
COPY --from=builder /app/packages/bfc-core/node_modules ./packages/bfc-core/node_modules

# Copy bfc-api
COPY --from=builder /app/apps/bfc-api/package.json ./apps/bfc-api/
COPY --from=builder /app/apps/bfc-api/dist ./apps/bfc-api/dist
COPY --from=builder /app/apps/bfc-api/node_modules ./apps/bfc-api/node_modules

# Copy prisma
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S bfc -u 1001
USER bfc

# Expose port
EXPOSE 4020

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4020/health || exit 1

# Start command
CMD ["node", "apps/bfc-api/dist/main.js"]

# =============================================================================
# BFC Web Production Stage (Nginx)
# =============================================================================
FROM nginx:alpine AS bfc-web

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built web app
COPY --from=builder /app/apps/bfc-web/dist /usr/share/nginx/html

# Add runtime env substitution script
COPY docker/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
