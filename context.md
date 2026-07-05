# F1 Telemetry Dashboard — Context

## Project Overview

Full-stack, containerized dashboard for visualizing Formula 1 telemetry data from the [OpenF1 API](https://openf1.org/). Built as a portfolio piece for a software engineering interview with an F1 team's aerodynamics department.

Three-tier architecture:
- **PostgreSQL** — data persistence
- **Node.js / Express / TypeScript backend** — REST API, rate-limited OpenF1 ingestion
- **React / TypeScript / Vite frontend** — customizable dashboard with Recharts

All three run in Docker containers orchestrated by `docker-compose`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 18 |
| Backend | Node.js 26, Express 5, TypeScript 6, `pg` (raw SQL), `protobufjs` |
| Frontend | React 19, TypeScript 6, Vite 8, pnpm 11, Tailwind CSS 4 |
| Charts | Recharts |
| Dashboard layout | `react-grid-layout` |
| UI components | Material UI (`@mui/material` 9, `@mui/icons-material` 9) |
| Icons | lucide-react, MUI icons |
| Containerization | Docker, docker-compose |
| External data | [OpenF1 API](https://openf1.org/) (`https://api.openf1.org/v1/`) |

---

## Architecture

### Database Schema (PostgreSQL)

Tables mirror OpenF1 entities:

- `meetings` — meeting_key (PK), year, country_name, circuit_short_name, date_start, date_end, meeting_name, meeting_official_name, location
- `sessions` — session_key (PK), meeting_key (FK), session_name, session_type, date_start, date_end, year
- `drivers` — session_key + driver_number (composite PK), full_name, name_acronym, team_name, team_colour, headshot_url, country_code
- `laps` — session_key + driver_number + lap_number (composite PK), lap_duration, sector times, speeds, is_pit_out_lap, segments, date_start, lap_start_time
- `car_data` — id (PK), session_key, driver_number, date (unique index on session_key+driver_number+date), speed, throttle, brake, rpm, n_gear, drs
- `positions` — session_key + driver_number + date (composite PK), position
- `pit` — session_key + driver_number + lap_number (composite PK), pit_duration, stop_duration, date
- `race_control` — id (PK), session_key, category, flag, message, date, driver_number, lap_number
- `location` — id (PK), session_key, driver_number, date, x, y, z
- `import_status` — id (PK), session_key, status, stage, progress, error_message, created_at, updated_at

### Backend Structure (`backend/src/`)

```
backend/src/
  index.ts                 — Express server startup, /health endpoint, middleware
  db/
    connection.ts           — pg Pool configuration and query helper
    migrate.ts              — Runs SQL migration files from db/init/
    queries.ts              — All CRUD operations (get, upsert, batch insert) per table
  routes/
    meetings.ts             — GET /meetings, GET /meetings/:key/sessions, POST /meetings/:key/sync
    sessions.ts             — GET /sessions/:key/drivers, /laps, /car-data, /positions, /pit, /location
    import.ts               — POST /import, GET /import/status
  services/
    openf1Client.ts         — Rate-limited fetch (3 req/s, 30 req/min), auto-retry with exponential backoff, all OpenF1 API functions
    importer.ts             — Background import engine: fetches all data types per driver, batch inserts with progress tracking
  proto/
    serializer.ts           — Protobuf serialization for bandwidth-efficient responses
```

### Frontend Structure (`frontend/src/`)

```
frontend/src/
  App.tsx                   — Root: health check, routing between Onboarding ↔ Dashboard
  main.tsx                  — React DOM entry point
  index.css                 — Tailwind CSS with custom F1 theme colors (racing-red, midnight-violet, etc.)
  vite-env.d.ts             — Vite type declarations
  api/
    client.ts               — Typed API client (axios) with all endpoint functions and TypeScript types
  pages/
    Onboarding/
      DataImportUI.tsx       - UI for showing data import progess from OpenF1
      EventSelectionUI.tsx   - UI for selecting the even
      Onboarding.tsx         — Year → meeting → session selection, import trigger. Business logic only
    Dashboard.tsx            — react-grid-layout dashboard with draggable/resizable widgets
  components/
    WidgetConfigPanel.tsx    — Modal for configuring widget title, drivers, lap number
    widgets/
      SpeedTraceWidget.tsx   — Line chart: speed, throttle, brake over time
      SectorTimesWidget.tsx  — Bar chart: best sector times per driver
      TrackMapWidget.tsx     — Scatter chart: x/y track position data
      PitStopsWidget.tsx     — Horizontal bar chart: average pit stop duration
      RacePositionsWidget.tsx — Multi-line chart: position changes over race distance
  state/
    dashboardState.ts        — localStorage persistence for widget config and grid layout
```

### Custom Tailwind Colors

Defined in `index.css` via Tailwind v4's `@theme` directive:

- `racing-red` (50–950) — Primary brand color (#f70814 base)
- `midnight-violet` (50–950) — Secondary accent
- `crimson-violet` (50–950) — Tertiary accent
- `mustard` (50–950) — Accent yellow (#fbce04 base)
- `sky-surge` (50–950) — Accent cyan (#1ca7e3 base)

---

## Styling Convention

- **All MUI components are styled with `className="..."` (Tailwind classes), never `sx={}`**
- MUI `ThemeProvider` is used for dark mode palette defaults
- HTML elements (`<div>`, `<h1>`, `<p>`, `<button>`, `<input>`) are also styled with Tailwind classes
- Recharts tooltips/charts use inline `style` objects for chart-specific theming (that's a Recharts API requirement, not MUI)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | DB health check, returns `{ has_data, session_count }` |
| GET | `/meetings?year=` | List meetings (from OpenF1 or local DB fallback) |
| GET | `/meetings/:key/sessions` | List sessions for a meeting |
| POST | `/meetings/:key/sync` | Sync meeting + sessions to local DB |
| GET | `/sessions/:key/drivers` | Drivers for a session |
| GET | `/sessions/:key/laps?driver_number=` | Laps data |
| GET | `/sessions/:key/car-data?driver_number=&min_date=&max_date=` | Telemetry car data |
| GET | `/sessions/:key/positions?driver_number=` | Position history |
| GET | `/sessions/:key/pit?driver_number=` | Pit stop data |
| GET | `/sessions/:key/location?driver_number=` | Track x/y/z location data |
| POST | `/import` | Start import: `{ session_key, meeting_key }` |
| GET | `/import/status?session_key=` | Poll import progress |

All endpoints support both JSON and Protobuf (`Accept: application/x-protobuf`) response formats.

---

## Running the Project

### Production mode (built images)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000 (served via Nginx)
- Backend: http://localhost:4000
- Database: localhost:5432

### Development mode (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Source directories are mounted as volumes. Changes to frontend files trigger Vite HMR instantly. Changes to backend `.ts` files trigger `tsx watch` auto-restart.

---

## Environment Variables

See `.env.example`:

```
DB_HOST=localhost          # 'db' in Docker
DB_PORT=5432
DB_NAME=f1_telemetry
DB_USER=f1user
DB_PASSWORD=f1password
PORT=4000                  # Backend server port
OPENF1_BASE_URL=https://api.openf1.org/v1
RATE_LIMIT_PER_SECOND=3    # OpenF1 free tier limit
RATE_LIMIT_PER_MINUTE=30   # OpenF1 free tier limit
VITE_API_URL=http://localhost:4000
```

---

## Import Flow

1. User selects year, Grand Prix (meeting), and session on the onboarding page
2. Clicking "Import Data" calls `POST /import` with the session and meeting keys
3. Backend starts a **background job** that:
   - Respects OpenF1 rate limits (3 req/s, 30 req/min) with automatic retry + exponential backoff
   - Fetches and persists: meeting → sessions → drivers → laps → car_data → positions → pit → race_control → location
   - Batches large datasets (car_data, location, race_control) for efficient inserts
4. Frontend polls `GET /import/status` every second, showing a progress bar and stage list
5. On completion, the user is taken to the dashboard

---

## Dashboard State Persistence

- Widget layout and configuration is saved to `localStorage`, keyed by `f1-dashboard-layout-{sessionKey}`
- Default layout includes all 5 widget types in a 12-column grid
- Users can add, remove, drag, resize, and configure widgets

---

## Current State (July 2026)

### Implemented
- Full backend with all REST endpoints
- Production and dev Docker Compose setups
- Onboarding flow with import progress
- Dashboard with 5 widget types, all functional
- localStorage persistence for dashboard state
- Dark F1-themed UI with Tailwind + MUI
- Protobuf serialization support

### Not Yet Implemented
- Saved layouts in PostgreSQL (stretch goal)
- Unit / integration tests
- Race Control display widget
- Dashboard state import/export

### Build Status
- TypeScript compiles cleanly (`pnpm run check:tsc` passes)
- Production Vite build succeeds (`pnpm run build` passes)
