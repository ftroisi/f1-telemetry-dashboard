# ---- Build Stage ----
FROM node:26-alpine3.23 AS builder

RUN npm install -g pnpm@11

WORKDIR /app

COPY backend/package.json ./
COPY backend/pnpm-lock.yaml ./
COPY backend/pnpm-workspace.yaml ./
COPY backend/tsconfig.json ./
RUN pnpm install

COPY backend/src/ ./src/
COPY db/ ./db/

RUN pnpm run build

# ---- Production Stage ----
FROM node:26-alpine3.23 AS production

RUN npm install -g pnpm@11

WORKDIR /app

COPY backend/package.json ./
COPY backend/pnpm-lock.yaml ./
COPY backend/pnpm-workspace.yaml ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db

EXPOSE 4000

CMD ["node", "dist/index.js"]
