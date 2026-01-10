FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --production --omit=dev
EXPOSE 3002
CMD ["node", "dist/server.js"]
