# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────
# Gestão de Frotas — imagem de produção, multi-stage
#
# Stage 1 (deps):    instala dependências (cache friendly)
# Stage 2 (builder): roda prisma generate + next build (standalone)
# Stage 3 (runner):  imagem final mínima, só com o standalone server
#
# Resultado: imagem ~150-200MB, sem build tools, rodando como user
# não-root.
# ──────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

# ── Stage 1: dependencies ──
FROM node:${NODE_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copia só os manifests pra usar cache de docker quando o lockfile não muda
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── Stage 2: build ──
FROM node:${NODE_VERSION}-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate precisa rodar antes do next build (o app importa
# `@/generated/prisma/client`, que é gerado pelo prisma-client moderno)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: runtime ──
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Roda como usuário não-root (segurança)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copia o standalone server gerado pelo `output: "standalone"` do Next.
# Inclui `node_modules` trimados pra só o que é usado em runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations + schema ficam disponíveis pra rodar `prisma migrate deploy`
# no entrypoint (em vez de baked-in no build, que ataria a versão da
# migration à tag da imagem).
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000

# Healthcheck nativo do Docker — rota `/api/health` que abrimos sem auth.
# Retry 3x em 30s antes de marcar como unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# tini = init mínimo, propaga SIGTERM/SIGINT pro node corretamente
# (importante pra graceful shutdown em rolling deploys)
ENTRYPOINT ["/sbin/tini", "--"]

# Aplica migrations pendentes ANTES de subir o server. Se o banco não
# tiver a migration mais nova, ela vai. Se já tiver, é no-op.
# Em prod com múltiplas réplicas, mover pra um job init container/k8s.
CMD sh -c "npx prisma migrate deploy && node server.js"
