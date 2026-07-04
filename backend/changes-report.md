# Changes Report — F1 Telemetry Dashboard

> All changes required to fix the `error.md` Docker build failure and to bring the codebase in line with **Node 26**, **pnpm v11**, **React 19**, **Tailwind v4**, Vite 8, and the requirement to use **axios** as the frontend API client.

---

## 1. 🐳 Docker Build Fix (Primary `error.md` Issue)

### Root Cause
The `node:26-alpine3.23` image ships **without** `corepack` or `pnpm`. Running `RUN pnpm install` inside the Dockerfile fails with `pnpm: not found`.

### Fix
Added `RUN npm install -g pnpm@11` in the builder stage of both Dockerfiles to install pnpm via npm (which IS bundled with the image):

- **`backend/Dockerfile`** — added `npm install -g pnpm@11` in builder + production stages
- **`frontend/Dockerfile`** — added `npm install -g pnpm@11` in builder stage (production stage uses Nginx, no pnpm needed)

### Secondary Docker issue: missing `pnpm-workspace.yaml`
The `package.json` declares `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` to skip age-check for `protobufjs@8.6.6`. Without copying this file into the build context, `pnpm install` → `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`.

**Fix:** Added `COPY .../pnpm-workspace.yaml ./` in both Dockerfiles builder stages.

---

## 2. 🐘 PostgreSQL 18 Data Directory Change

### Issue
`postgres:18-alpine3.23` changed its data storage convention. It expects the mount point to be `/var/lib/postgresql` (the parent directory) so it can create a version-specific subdirectory (e.g. `/var/lib/postgresql/18/data`). The old mount at `/var/lib/postgresql/data` collides with this.

Additionally, the old named volume likely contains data from a previous PostgreSQL version, which PG18 refuses to use without an explicit upgrade.

### Fix
- **`docker-compose.yml`** — Changed volume mount from `f1-postgres-data:/var/lib/postgresql/data` to `f1-postgres-data:/var/lib/postgresql`.

### User action required
Run `docker compose down -v` to remove the stale volume, then `docker compose up --build` for a clean start.

---

## 3. ⬆️ Package Manager & Workspace Alignment

### Backend (`backend/`)
- `pnpm-workspace.yaml` was already correctly configured — left as-is.

### Frontend (`frontend/`)
- `pnpm-workspace.yaml` had `set this to true or false` as literal placeholder values in `allowBuilds`. Fixed:
  ```yaml
  allowBuilds:
    esbuild: true
    protobufjs: true
  ```

---

## 4. 🔧 Frontend: API Client → `axios`

### Changed file
- **`frontend/src/api/client.ts`** — Replaced the custom `fetchApi()` wrapper with `axios`.

### Details
- Created an `axios` instance with `baseURL: "/api"` and default JSON headers.
- Typed generic helpers `apiGet<T>()` and `apiPost<T>()` for all endpoints.
- Added `axios@^1.9.0` as a dependency in `frontend/package.json`.

---

## 5. 🎨 Frontend: Tailwind v3 → v4 Migration

### Why
`frontend/package.json` specifies `tailwindcss@^4.3.2` but the project used a v3-style `tailwind.config.js` and `@tailwind` CSS directives.

### Changed files

| File | Change |
|------|--------|
| `frontend/tailwind.config.js` | **Deleted** — Tailwind v4 doesn't use JS config. |
| `frontend/src/index.css` | `@tailwind` → `@import "tailwindcss"` + `@theme` block with all custom colors. |
| `frontend/postcss.config.js` | Plugin changed from `tailwindcss` to `@tailwindcss/postcss`. |
| `frontend/Dockerfile` | Removed `COPY tailwind.config.js`, added `COPY postcss.config.js`. |
| `frontend/package.json` | Added `@tailwindcss/postcss@^4.3.2` dependency. |

---

## 6. 🏗️ Build & TypeScript Fixes

### Backend (TypeScript 6 with Express 5)

| File | Issue | Fix |
|------|-------|-----|
| `src/db/connection.ts` | `TS2883` — return types need explicit annotation | Added `Promise<QueryResult>` / `Promise<PoolClient>` |
| `src/routes/meetings.ts` | `TS2345` — Express 5 params are `string \| string[]` | `parseInt(String(req.params.x), 10)` |
| `src/routes/sessions.ts` | Same for all `req.params` / `req.query` | Same pattern |
| `src/routes/import.ts` | Same for `req.query` | Same pattern |
| All route files | `TS2883` on `const router = Router()` | `const router: import("express").Router = Router()` |

### Frontend (TypeScript 6, Recharts v3, react-grid-layout v2)

| File | Issue | Fix |
|------|-------|-----|
| All 3 widget files | `formatter` param `name: string` incompatible with Recharts `NameType \| undefined` | Changed to `name: any` |
| `src/pages/Dashboard.tsx` | `onLayoutChange` expects `readonly Layout[]` (RGL v2) | `setLayouts([...newLayout])` spread |
| `src/pages/Dashboard.tsx` | RGL v2 deprecated `cols/rowHeight/margin/containerPadding/draggableHandle/compactType` as direct props | Consolidated into `gridConfig={{...}}` and `dragConfig={{...}}` |
| `src/pages/Dashboard.tsx` | `react-resizable/css/styles.css` doesn't exist as separate pkg in RGL v2 | Removed import |
| `src/main.tsx` | `TS2882` — no type decl for `.css` side-effect imports | Created `src/vite-env.d.ts` with CSS module declarations |

---

## 7. ✅ Build Verification

```
$ docker compose build
✓ Image f1-telemetry-dashboard-backend  Built
✓ Image f1-telemetry-dashboard-frontend Built
```

| Component | Local Build | Docker Build |
|-----------|-----------|--------------|
| Backend   | `pnpm run build` ✅ | Docker build ✅ |
| Frontend  | `pnpm run build` ✅ | Docker build ✅ |

---

## 8. 🔬 Changed Files (Git Summary)

```
M  docker-compose.yml                              # PG18 mount path fix
M  backend/Dockerfile                              # npm install -g pnpm, pnpm-workspace.yaml copy
M  backend/src/db/connection.ts                    # explicit return types
M  backend/src/routes/import.ts                    # Express 5 type-safe parseInt
M  backend/src/routes/meetings.ts                  # Express 5 type-safe + Router type
M  backend/src/routes/sessions.ts                  # Express 5 type-safe + Router type
M  frontend/Dockerfile                             # npm install -g pnpm, pnpm-workspace.yaml copy
M  frontend/package.json                           # added axios, @tailwindcss/postcss
M  frontend/pnpm-workspace.yaml                    # fixed placeholder values
M  frontend/src/api/client.ts                      # fetch → axios rewrite
M  frontend/src/index.css                          # Tailwind v3 → v4
M  frontend/postcss.config.js                      # tailwindcss → @tailwindcss/postcss
M  frontend/src/pages/Dashboard.tsx                # RGL v2 API + Layout type fixes
M  frontend/src/components/widgets/SpeedTraceWidget.tsx   # formatter type fix
M  frontend/src/components/widgets/PitStopsWidget.tsx     # formatter type fix
M  frontend/src/components/widgets/RacePositionsWidget.tsx # formatter type fix
D  frontend/tailwind.config.js                     # removed (v4 CSS-first)
A  frontend/src/vite-env.d.ts                      # CSS module declarations
```
