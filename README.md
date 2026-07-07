# F1 Telemetry Dashboard

A fully containerized, three-tier application for visualizing Formula 1 telemetry data from the [OpenF1 API](https://openf1.org/). Built as a portfolio project with React/TypeScript, Node.js/Express, PostgreSQL, Docker, and data visualization.

## Architecture

```
┌──────────────────────┐     ┌────────────────────-──┐     ┌──────────────────────┐
│   Frontend           │     │   Backend             │     │   Database           │
│   React 19 / Vite 8  │────▶│   Node.js 26          │────▶│   PostgreSQL 18      │
│   Recharts           │     │   Express 5           │     │   (Named Volume)     │
│   Tailwind CSS v4    │     │   Protobuf (optional) │     │                      │
│   react-grid-layout  │     │   Rate-limited        │     │                      │
│   Material UI 9      │     │   OpenF1 Client       │     │                      │
│   Port 3000          │     │   Port 4000           │     │   Port 5432          │
└──────────────────────┘     └─────────────────────-─┘     └──────────────────────┘
         │                              │                              │
         │                              │                              │
         │              ┌───────────────┼───────────────┐              │
         │              │   OpenF1 API (External)       │              │
         └──────────────│   https://api.openf1.org/v1   │──────────────┘
                        └───────────────────────────────┘
```

### Data Flow

1. **Import Phase** (online only): The frontend onboarding page calls the backend, which fetches data from the OpenF1 API under rate limits (3 req/s, 30 req/min) and persists everything into PostgreSQL. Import progress is polled via `/import/status`.

2. **Dashboard Phase** (offline-capable): **The frontend queries only the backend**. The backend reads from PostgreSQL and never calls OpenF1. The system works completely offline once data is imported.

3. **Communication**: REST API with JSON by default; Protocol Buffers (`application/x-protobuf`) available for bandwidth-efficient responses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 18 (Alpine) |
| Backend | Node.js 26, TypeScript 6, Express 5 |
| Backend data access | `pg` (raw SQL with parameterized queries) |
| Frontend | React 19, TypeScript 6, Vite 8 |
| Package manager | pnpm 11 |
| Charts | Recharts 3 |
| Dashboard layout | react-grid-layout 2 |
| UI components | Material UI 9 + Tailwind CSS 4 |
| Serialization | JSON + Protocol Buffers (protobufjs) |
| Containerization | Docker + docker-compose |

---

## Project Structure

```
f1-telemetry-dashboard/
├── docker-compose.yml               # Production orchestration
├── docker-compose.dev.yml           # Development with hot reload
├── .env.example                     # Environment variable reference
├── README.md
├── db/
│   └── init/
│       └── 01-schema.sql            # PostgreSQL schema (10 tables)
├── agents/                          # Project documentation
│   ├── requirements.md              # Implementation requirements
│   ├── coding-guidelines.md         # Code style and conventions
│   └── CHANGELOG.md                 # Version history
├── backend/
│   ├── Dockerfile                   # Multi-stage production build
│   ├── Dockerfile.dev               # Development with tsx watch
│   ├── jest.config.ts               # Jest configuration
│   ├── tsconfig.json                # TypeScript config (production)
│   ├── tsconfig.jest.json           # TypeScript config (test)
│   ├── package.json
│   └── src/
│       ├── index.ts                 # Express app, middleware, /health
│       ├── db/
│       │   ├── connection.ts        # pg Pool with slow-query logging
│       │   ├── migrate.ts           # SQL migration runner
│       │   └── queries.ts           # All CRUD operations per table
│       ├── routes/
│       │   ├── meetings.ts          # GET /meetings, /sessions
│       │   ├── sessions.ts          # GET drivers, laps, car-data, positions, pit, location
│       │   └── import.ts            # POST /import, GET /import/status
│       ├── services/
│       │   ├── openf1Client.ts      # Rate-limited OpenF1 API client
│       │   └── importer.ts          # Background import engine
│       ├── proto/
│       │   └── serializer.ts        # Protobuf schema + serializers
│       └── __tests__/               # Jest unit tests
│           ├── db/queries.test.ts
│           ├── services/openf1Client.test.ts
│           └── proto/serializer.test.ts
└── frontend/
    ├── Dockerfile                   # Multi-stage build → Nginx
    ├── Dockerfile.dev               # Development with Vite HMR
    ├── nginx.conf                   # Nginx + API proxy
    ├── package.json
    └── src/
        ├── main.tsx                 # React entrypoint
        ├── App.tsx                  # Root: health → Onboarding | Dashboard
        ├── index.css                # Tailwind v4 @theme with F1 colors
        ├── api/
        │   └── client.ts            # Typed axios API client
        ├── types/
        │   └── onboardingTypes.ts   # Shared TypeScript types
        ├── state/
        │   └── dashboardState.ts    # localStorage persistence
        ├── pages/
        │   ├── Onboarding/          # Event selection + import flow
        │   └── Dashboard/           # Main dashboard with widget grid
        ├── components/
        │   ├── layout/              # Navbar, Footer, LayoutContext
        │   ├── WidgetConfigPanel.tsx # Widget configuration modal
        │   └── widgets/             # 5 widget components
        │       ├── SpeedTraceWidget.tsx
        │       ├── SectorTimesWidget.tsx
        │       ├── TrackMapWidget.tsx
        │       ├── PitStopsWidget.tsx
        │       └── RacePositionsWidget.tsx
        └── safeLazyImport.tsx       # Retry wrapper for React.lazy
```

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- ~4 GB free RAM
- Internet connection (for initial build and data import)

### 1. Clone and start

```bash
git clone <repo-url> f1-telemetry-dashboard
cd f1-telemetry-dashboard
docker compose up --build
```

This builds and starts all three services. On first launch, PostgreSQL initializes the schema from `db/init/01-schema.sql`.

### 2. Open the dashboard

Navigate to **http://localhost:3000**

### 3. Import F1 data

1. Select a year (2023–2026)
2. Choose a Grand Prix from the autocomplete list
3. Select a session (Race, Qualifying, Practice)
4. Click **Import Data**
5. Watch the progress bar as data imports (takes 2–5 minutes for a full race)
6. The dashboard appears automatically with 5 default widgets

### 4. Use the dashboard

- **Add widgets**: Click the "Add Widget" button in the dashboard header
- **Rearrange**: Drag widgets by the grip handle (⠿)
- **Resize**: Drag the bottom-right corner
- **Configure**: Click the gear icon to change title, drivers, lap number
- **Remove**: Click the ✕ button
- Your layout is saved to `localStorage` per session and persists across reloads

---

## Development Mode

For hot-reload (changes to source files reflect instantly without rebuilding Docker images):

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service | Hot Reload Mechanism |
|---|---|
| Backend | `tsx watch` restarts on `.ts` changes |
| Frontend | Vite HMR (Hot Module Replacement) |
| Database | Same as production (persistent volume) |

Source directories are mounted as Docker volumes, so local edits take effect immediately.

### Running locally without Docker

#### Database

```bash
docker run -d --name f1-db \
  -e POSTGRES_DB=f1_telemetry \
  -e POSTGRES_USER=f1user \
  -e POSTGRES_PASSWORD=f1password \
  -p 5432:5432 \
  postgres:18-alpine3.23

cat db/init/01-schema.sql | docker exec -i f1-db psql -U f1user -d f1_telemetry
```

#### Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env: set DB_HOST=localhost
pnpm install
pnpm run dev        # Starts on port 4000 with tsx watch
```

#### Frontend

```bash
cd frontend
pnpm install
pnpm run dev        # Starts on port 3000, proxies /api → localhost:4000
```

---

## Running Tests

### Backend (Jest)

```bash
cd backend
pnpm run test
```

57 unit tests covering:
- **DB queries** (26 tests): All CRUD operations with mocked `pg` connection
- **OpenF1 client** (13 tests): URL construction for all endpoints, error handling
- **Protobuf serializer** (12 tests): Serialization of all message types, content-type negotiation

### Frontend (TypeScript checks)

```bash
cd frontend
pnpm run check:tsc   # TypeScript type checking
pnpm run build       # Production build
```

---

## API Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | DB health + `{ has_data, session_count }` |

### Meetings & Sessions

| Method | Path | Description |
|---|---|---|
| GET | `/meetings?year=` | List meetings (from OpenF1, fallback to local DB) |
| GET | `/meetings/:key/sessions` | List sessions for a meeting |
| POST | `/meetings/:key/sync` | Sync meeting + sessions to local DB |

### Import

| Method | Path | Description |
|---|---|---|
| POST | `/import` | Start import `{ session_key, meeting_key }` |
| GET | `/import/status?session_key=` | Poll import progress |

### Session Data (from local DB)

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/sessions/:key/imported-events` | — | List all imported events |
| GET | `/sessions/:key/event-info` | — | Meeting/event metadata |
| GET | `/sessions/:key/exists` | — | Check if data exists |
| GET | `/sessions/:key/drivers` | — | Driver list |
| GET | `/sessions/:key/laps` | `driver_number` | Lap data |
| GET | `/sessions/:key/car-data` | `driver_number`, `min_date`, `max_date` | Car telemetry |
| GET | `/sessions/:key/positions` | `driver_number` | Position history |
| GET | `/sessions/:key/pit` | `driver_number` | Pit stop data |
| GET | `/sessions/:key/location` | `driver_number` | Track x/y/z data |
| DELETE | `/sessions/:key` | — | Delete all session data |

All endpoints support both `application/json` (default) and `application/x-protobuf` via the `Accept` header.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host (`db` in Docker) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `f1_telemetry` | Database name |
| `DB_USER` | `f1user` | Database user |
| `DB_PASSWORD` | `f1password` | Database password |
| `PORT` | `4000` | Backend server port |
| `OPENF1_BASE_URL` | `https://api.openf1.org/v1` | OpenF1 API base URL |
| `RATE_LIMIT_PER_SECOND` | `3` | Max OpenF1 requests/second |
| `RATE_LIMIT_PER_MINUTE` | `30` | Max OpenF1 requests/minute |
| `VITE_API_URL` | `http://localhost:4000` | API URL for dev mode |

Copy `.env.example` to `.env` and customize values for local development.

---

## Database Schema

10 tables mirror OpenF1 entities, with indexes on all query columns:

| Table | Primary Key | Notable Indexes | Approx. Size (Race) |
|---|---|---|---|
| `meetings` | `meeting_key` | — | 1 row |
| `sessions` | `session_key` | `meeting_key` | 1–5 rows |
| `drivers` | `(session_key, driver_number)` | `session_key` | 20 rows |
| `laps` | `(session_key, driver_number, lap_number)` | `(session_key, driver_number)` | ~1,200 rows |
| `car_data` | `id` (bigserial) | `(session_key, driver_number, date)` | **~200,000 rows** |
| `positions` | `(session_key, driver_number, date)` | `(session_key, driver_number)` | ~10,000 rows |
| `pit` | `(session_key, driver_number, lap_number)` | `(session_key, driver_number)` | ~40 rows |
| `race_control` | `id` (bigserial) | `(session_key, date, driver_number, category)` | ~50 rows |
| `location` | `id` (bigserial) | `(session_key, driver_number, date)` | ~50,000 rows |
| `import_status` | `id` (serial) | `session_key` | ~10 rows |

`car_data` is the largest table. A full race with 20 drivers generates ~200,000 telemetry data points. Batch inserts (500 rows per statement) and the composite unique index ensure efficient imports.

---

## Architectural Choices & Tradeoffs

### 1. Raw SQL over ORM

**Choice**: `pg` with hand-written parameterized queries instead of Prisma/Drizzle.

**Why**: Full control over query performance; the schema is stable and well-defined; no ORM learning curve or generated-code overhead. The project's data model is simple enough that an ORM would add complexity without benefit.

**Tradeoff**: More boilerplate for CRUD operations; manual migration handling; slightly more error-prone (no compile-time query validation). Mitigated by type-safe query functions and unit tests.

### 2. Background Import with Polling

**Choice**: The import runs as an un-awaited background Promise with progress persisted in `import_status` table. Frontend polls `GET /import/status` every second.

**Why**: Importing a full race takes 2–5 minutes due to OpenF1 rate limits. A synchronous HTTP request would time out. Background processing keeps the UI responsive and allows the user to see real-time progress.

**Tradeoff**: Polling is slightly less elegant than WebSockets or SSE. However, polling is simpler, works through all proxies, and is sufficient for this use case (imports are infrequent, one-at-a-time).

**Alternative considered**: WebSockets would provide push-based progress updates but add complexity and require a WebSocket library on both ends.

### 3. Protobuf as Optional Serialization

**Choice**: Both JSON and Protocol Buffers are supported. The format is determined by the `Accept` request header.

**Why**: Protobuf reduces payload size 3–5× for large arrays (car data, positions). This matters when loading 200,000 telemetry points for a speed trace. JSON remains the default for debugging and browser DevTools inspection.

**Tradeoff**: Adds ~200 lines of schema definition and serializer code. The protobuf schema must stay in sync with the actual data shapes. Mitigated by keeping the schema inline in `serializer.ts` (single source of truth).

### 4. localStorage for Dashboard State

**Choice**: Widget layout and configuration are persisted to `localStorage`, keyed by session key.

**Why**: Simple, instant, works offline, no backend endpoint needed. Dashboard preferences are user-specific and don't need to survive across browsers.

**Tradeoff**: Layouts are lost if the user clears browser data. A PostgreSQL-backed layout store (stretch goal) would enable cross-device persistence. Not implemented because the project targets single-user local deployment.

### 5. Context + useState over State Library

**Choice**: React Context (`OnboardingContext`, `DashboardContext`) combined with `useState`/`useEffect` hooks. No Redux, Zustand, or Jotai.

**Why**: The app has only two major views with moderate state. A state management library would add a dependency and learning curve without meaningful benefit. Context provides sufficient cross-component sharing.

**Tradeoff**: Context re-renders all consumers when any value changes. For this app's scale (tens of components), this is not a performance issue. If widget count grows significantly, a library or context splitting would be warranted.

### 6. Tailwind v4 CSS-First Configuration

**Choice**: Tailwind v4 with CSS-based `@theme` instead of v3's `tailwind.config.js`. Combined with MUI's `ThemeProvider` for component-level theming.

**Why**: Single source of truth for colors in CSS; no JS config file to maintain; v4's improved performance. MUI components use Tailwind classes via `className` (not `sx`), maintaining a consistent styling approach.

**Tradeoff**: Tailwind v4 is relatively new; some community plugins may not support it yet. MUI + Tailwind requires discipline to avoid style conflicts. Mitigated by the strict `className`-only convention.

### 7. pnpm over npm/yarn

**Choice**: pnpm as the package manager for both frontend and backend.

**Why**: Faster installs due to content-addressable storage; strict dependency resolution (no phantom dependencies); native workspace support; smaller `node_modules`.

**Tradeoff**: Docker images need an explicit `npm install -g pnpm@11` step since the base `node:26-alpine3.23` image ships without it.

### 8. Multi-Stage Docker Builds

**Choice**: Three-stage Dockerfiles: `builder` compiles TypeScript, `production` copies only the built artifacts.

**Why**: Minimal production images (no devDependencies, no TypeScript compiler). Frontend is served via Nginx (alpine, ~10 MB base image) instead of a Node.js process.

**Tradeoff**: Builds are slightly slower due to the extra stage. The size savings (~200 MB per service) outweigh this for distribution.

---

## Performance Characteristics

### Import Performance

| Metric | Value |
|---|---|
| Meeting + Sessions | < 5 seconds |
| Drivers (20) | < 3 seconds |
| Laps (~1,200) | ~20 seconds |
| Car Data (~200K points) | **~2–3 minutes** |
| Positions (~10K points) | ~30 seconds |
| Pit Stops (~40) | < 5 seconds |
| Race Control + Location | ~30 seconds |
| **Total (full race)** | **~3–5 minutes** |

The bottleneck is OpenF1's rate limit (3 req/s, 30 req/min), not PostgreSQL write performance. Batch inserts for `car_data` (500 rows/insert) keep DB overhead low.

### Query Performance

| Query | Rows | Response Time |
|---|---|---|
| Drivers list | 20 | < 10 ms |
| Laps for one driver | 60 | < 20 ms |
| Car data (single driver, single lap) | ~1,000 | < 50 ms |
| Car data (single driver, full race) | ~10,000 | < 200 ms |
| Positions (all drivers) | ~10,000 | < 100 ms |
| Pit stops (all drivers) | ~40 | < 10 ms |

All queries are indexed on `(session_key, driver_number)` or `(session_key, driver_number, date)`. The slowest operation is fetching full-race car data for the speed trace widget, which requires ~10,000 rows. Protobuf serialization reduces this payload from ~1.5 MB (JSON) to ~300 KB.

### Frontend Bundle

| Asset | Size (gzipped) |
|---|---|
| Main JS bundle | ~250 KB |
| MUI components (split) | ~150 KB |
| Recharts (split) | ~80 KB |
| Total (initial) | **~480 KB** |

Code splitting via `React.lazy` ensures MUI and chart libraries load only when the dashboard renders (not on the onboarding page). Vite's production build uses Terser minification and code splitting.

### Memory Usage (Docker)

| Service | Approx. RAM |
|---|---|
| PostgreSQL | ~100 MB |
| Backend (Node.js) | ~80 MB |
| Frontend (Nginx) | ~10 MB |
| **Total** | **~200 MB** |

---

## Distributing the Project

### Option 1: Docker Images (Recommended)

Distribute as a `docker-compose.yml` + source code:

1. Clone the repository
2. Run `docker compose up --build`
3. The system starts with an empty database; import data through the UI

### Option 2: Pre-built Images

Build once, distribute images:

```bash
# Build images
docker compose build

# Export images
docker save f1-telemetry-dashboard-backend:latest | gzip > backend.tar.gz
docker save f1-telemetry-dashboard-frontend:latest | gzip > frontend.tar.gz

# On target machine (no internet needed after import)
docker load < backend.tar.gz
docker load < frontend.tar.gz
docker compose up
```

### Option 3: Tarball with Pre-loaded Data

For fully offline demos:

1. Start the stack, import one or more sessions
2. Stop the stack
3. Distribute the source code + PostgreSQL data volume (`f1-postgres-data`)
4. The recipient copies the volume to their Docker data directory and runs `docker compose up` — the dashboard is ready immediately

---

## UI Theme

### Color Palette

The dashboard uses a custom dark F1-inspired theme with five color families, all defined as Tailwind v4 `@theme` tokens in `index.css`:

| Color | Base | Usage |
|---|---|---|
| `racing-red` | `#f70814` | Primary brand, buttons, import progress |
| `midnight-violet` | `#b94689` | Secondary accent, subtle UI elements |
| `crimson-violet` | `#dd2295` | Tertiary accent, pit stop charts |
| `mustard` | `#fbce04` | Accent yellow, throttle traces |
| `sky-surge` | `#1ca7e3` | Accent cyan, speed traces, MUI secondary |
| `site-bg-dark` | `#0f1115` | Page background |

All MUI components inherit the dark theme via `ThemeProvider` with `mode: "dark"`.

---

## Known Limitations & Future Work

### Stretch Goals (from requirements)
- Saved layouts in PostgreSQL (currently localStorage only)
- Race Control display widget (data is imported, no widget renders it)
- Dashboard state import/export

### Known Issues
- Location data import is currently disabled (OpenF1 location endpoint had reliability issues)
- Full-race car data (~200K points per driver) can be slow to render in Recharts when multiple drivers are selected simultaneously
- No frontend unit tests (only TypeScript type checking)

### Future Improvements
- WebSocket-based import progress (replace polling)
- Data sampling/decimation for large car_data datasets to improve chart performance
- Docker health checks for the backend service
- CI/CD pipeline with automated tests and Docker image publishing

---

## License

Mozilla Public License Version 2.0 — see [LICENSE](./LICENSE) for full text.
