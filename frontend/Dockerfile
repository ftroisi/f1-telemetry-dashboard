# ---- Build Stage ----
FROM node:26-alpine3.23 AS builder

WORKDIR /app

COPY frontend/package.json ./
COPY frontend/pnpm-lock.yaml ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/index.html ./
RUN pnpm install

COPY frontend/src/ ./src/

RUN pnpm run build

# ---- Production Stage (Nginx) ----
FROM nginx:alpine3.23 AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
