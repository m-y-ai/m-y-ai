# Stage 1 — install deps
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2 — build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 — minimal runtime using Next.js standalone output
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN useradd -m nextjs

# Standalone bundle (only what's needed to run)
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
# Static assets
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
# Public assets
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER nextjs

EXPOSE 2703
ENV PORT=2703
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
