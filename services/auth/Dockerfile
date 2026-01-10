FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/auth ./services/auth
RUN npm ci --workspaces
RUN npx tsc --project ./services/auth/tsconfig.json --skipLibCheck --outDir ./services/auth/dist 2>&1 || true

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/auth/package.json ./services/auth/package.json
COPY services/auth/prisma ./services/auth/prisma
RUN npm ci --workspaces --production --omit=dev
COPY --from=builder /app/services/auth/dist ./dist
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["node", "dist/server.js"]
