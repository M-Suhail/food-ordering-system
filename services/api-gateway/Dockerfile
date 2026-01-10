FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway
RUN npm ci --workspaces
RUN npx tsc --project ./services/api-gateway/tsconfig.json --skipLibCheck --outDir ./services/api-gateway/dist 2>&1 || true

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/api-gateway/package.json ./services/api-gateway/package.json
RUN npm ci --workspaces --production --omit=dev
COPY --from=builder /app/services/api-gateway/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["node", "dist/server.js"]
