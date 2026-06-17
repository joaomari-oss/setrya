FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# strict-ssl off: TLS-inspection setups (e.g. Avast) inject a root CA the
# alpine image doesn't trust, which otherwise breaks npm's registry fetch.
RUN npm config set strict-ssl false && npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Bake the backend proxy URL into the Next.js build (used by next.config.ts rewrites)
ARG NEXT_PUBLIC_API_URL=http://backend:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Build-time only: next/font/google fetches Inter from Google Fonts during build,
# which fails under TLS-inspection (Avast) with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
