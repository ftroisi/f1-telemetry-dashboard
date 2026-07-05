# ---- Build Stage ----
FROM node:26-alpine3.23 AS builder

RUN npm install -g pnpm@11

WORKDIR /app

COPY frontend/package.json ./
COPY frontend/pnpm-lock.yaml ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/postcss.config.js ./
COPY frontend/index.html ./
COPY frontend/pnpm-workspace.yaml ./
RUN pnpm install

COPY frontend/src/ ./src/
COPY frontend/assets ./assets

RUN pnpm run build

# ---- Production Stage (Nginx) ----
FROM nginx:alpine3.23 AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
