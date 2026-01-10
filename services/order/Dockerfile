FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY services/order ./services/order
RUN npm ci --workspaces
RUN npx tsc --project ./services/order/tsconfig.json --skipLibCheck 2>&1 || true

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/order/package.json ./services/order/package.json
COPY services/order/prisma ./services/order/prisma
RUN npm ci --workspaces --production --omit=dev
COPY --from=builder /app/services/order/dist ./dist
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:3002/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["node", "dist/server.js"]
