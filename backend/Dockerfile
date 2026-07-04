# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
COPY backend/tsconfig.json ./
RUN npm ci

COPY backend/src/ ./src/
COPY db/ ./db/

RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db

EXPOSE 4000

CMD ["node", "dist/index.js"]
