# F1 Telemetry Dashboard — Implementation Spec

## Context

This project is built as a portfolio piece ahead of a software engineering interview with a Formula 1 team's aerodynamics department. The role requires a full-stack developer skilled in React/TypeScript, Node.js backends, PostgreSQL, Docker, REST APIs, and data visualization, deployed in on-premises/limited-connectivity environments. High-quality CFD data is not publicly available, so this project uses the free [OpenF1 API](https://openf1.org/) — a real, high-fidelity Formula 1 telemetry dataset — as a realistic stand-in to demonstrate the same architecture patterns: local data ingestion, offline-capable backend/frontend separation, and a customizable data visualization dashboard.

## Goals

- Build a fully containerized, three-tier application (PostgreSQL, Node.js backend, React frontend) that runs entirely locally after an initial data import.
- On first launch, the database is empty. The user imports historical F1 session data from OpenF1 through the UI.
- After import, the frontend never talks to OpenF1 directly — all data access goes through the Node.js backend, which reads from PostgreSQL.
- The frontend provides a customizable dashboard for visualizing the imported telemetry data using Recharts.

---

## Requirements

### Functional requirements

1. **Onboarding / import flow**
   - When the database has no data, the frontend shows a homepage allowing the user to browse and select a season, meeting (Grand Prix), and session (e.g. Race, Qualifying, Practice).
   - Triggering an import calls the backend, which fetches the relevant data from OpenF1 and persists it in PostgreSQL.
   - The frontend displays import progress (e.g. "Fetching laps... Fetching car telemetry...").
   - Once data exists in the database, the user is taken to the dashboard.

2. **Dashboard**
   - A grid-based, customizable layout where users can add, remove, and rearrange visualization "widgets."
   - Each widget is configurable (e.g. select driver(s), lap, session, metric) and renders a Recharts chart.
   - Required widget types:
     - Speed/throttle/brake trace over a single lap (line chart)
     - Sector time comparison across drivers (bar chart)
     - Track position map from x/y coordinates (scatter/line plot)
     - Pit stop duration comparison across drivers (bar chart)
     - Race position changes over race distance (multi-line chart)
   - Dashboard layout state should persist across page reloads (localStorage is sufficient; a saved-layouts table in Postgres is a stretch goal).

3. **Data access**
   - After import, the frontend must never call the OpenF1 API directly. All reads go through the Node.js backend.
   - The backend must respect OpenF1's rate limits: 3 requests/second and 30 requests/minute on the free tier. Imports must be throttled/queued accordingly.

### Non-functional requirements

- Each of the three components (PostgreSQL, backend, frontend) must run in its own Docker container, orchestrated via `docker-compose`.
- The system must be able to run fully offline once data has been imported (no dependency on OpenF1 or any external network call outside of the import step).
- Code should be organized for maintainability: clear separation of routes, services, and data-access layers in the backend; clear component structure in the frontend.
- Include basic error handling (e.g. failed import, empty result sets, network errors) with user-visible feedback in the UI.
- Include a README explaining architecture, setup, and how to run the project via `docker-compose up`.

---

## Tech Stack

Organize this project as a monorepo, with three differente microservices (DB, BE, FE), each being a docker container.

| Layer | Technology |
|---|---|
| Database | PostgreSQL |
| Backend | Node.js, TypeScript, Express or Fastify |
| Backend data access | `pg` or an ORM/query builder (Prisma or Drizzle) |
| Frontend | React, TypeScript, Vite (for building), pnpm (as package manager), Tailwind CSS |
| Charts | Recharts |
| Dashboard layout | `react-grid-layout` (or equivalent draggable/resizable grid library) |
| UI components | Material UI or shadcn/ui |
| Containerization | Docker, docker-compose |
| External data source | [OpenF1 API](https://openf1.org/) (`https://api.openf1.org/v1/*`) |

---

## Implementation Instructions

### 1. Database schema (PostgreSQL)

Design tables to mirror OpenF1's core entities. Suggested schema:

- `meetings`: `meeting_key` (PK), `year`, `country_name`, `circuit_short_name`, `date_start`, `date_end`
- `sessions`: `session_key` (PK), `meeting_key` (FK), `session_name`, `session_type`, `date_start`, `date_end`
- `drivers`: `session_key` (FK), `driver_number`, `full_name`, `team_name`, `team_colour`, `headshot_url` — composite key on (`session_key`, `driver_number`)
- `laps`: `session_key` (FK), `driver_number`, `lap_number`, `lap_duration`, `duration_sector_1`, `duration_sector_2`, `duration_sector_3`, `i1_speed`, `i2_speed`, `st_speed`, `is_pit_out_lap`
- `car_data`: `session_key` (FK), `driver_number`, `date`, `speed`, `throttle`, `brake`, `rpm`, `n_gear`, `drs`
- `positions`: `session_key` (FK), `driver_number`, `date`, `position`
- `pit`: `session_key` (FK), `driver_number`, `lap_number`, `pit_duration`, `stop_duration`
- `race_control`: `session_key` (FK), `category`, `flag`, `message`, `date`, `driver_number`

Guidelines:
- Add indexes on `session_key` and `driver_number` for all tables, since nearly every query filters on these.
- `car_data` will be the largest table by far (high-frequency sampling); ensure it is indexed on `(session_key, driver_number, date)` and consider batch inserts (e.g. `COPY` or multi-row `INSERT`) during import for performance.
- Use `session_key` and `meeting_key` as the natural join keys throughout, matching OpenF1's own identifiers.

The database should persist its data across different executions, mimicing what would happen on a ture on-prem deployment.

### 2. Backend implementation (Node.js + TypeScript)

Structure:
```
src/
  routes/         # REST endpoint definitions
  services/
    openf1Client.ts   # wraps OpenF1 API calls
    importer.ts        # orchestrates the import pipeline
  db/              # database connection and queries
  index.ts         # app entrypoint
```

Steps:
1. Set up an Express or Fastify app with a TypeScript build pipeline.
2. Implement `openf1Client.ts`:
   - Wrap calls to `https://api.openf1.org/v1/meetings`, `/sessions`, `/drivers`, `/laps`, `/car_data`, `/position`, `/pit`, `/race_control`.
   - Support OpenF1's query-parameter filtering syntax (e.g. `session_key=...`, `speed>=315`).
   - Implement request throttling to stay within 3 requests/second and 30 requests/minute.
   - The data fetched from OpenF1 will have a JSON format.
3. Implement `importer.ts`:
   - Orchestrate the import sequence: meeting → sessions → drivers → laps → car_data → positions → pit → race_control.
   - Batch and stream inserts into PostgreSQL to handle large volumes (especially `car_data`).
   - Track and expose import progress (e.g. an in-memory or DB-backed status object with stage and percentage) via a `/import/status` polling endpoint.
4. Implement REST routes:
   - `GET /meetings` — list available meetings (from OpenF1, for the selection UI, not from local DB)
   - `GET /meetings/:meetingKey/sessions` — list sessions for a meeting
   - `POST /import` — trigger import for a given session
   - `GET /import/status` — poll import progress
   - `GET /sessions/:sessionKey/drivers`
   - `GET /sessions/:sessionKey/laps`
   - `GET /sessions/:sessionKey/car-data` — with query params for driver number and lap/time range
   - `GET /sessions/:sessionKey/positions`
   - `GET /sessions/:sessionKey/pit`
5. Add basic input validation and error handling middleware, returning consistent error response shapes.
6. Add a database migration mechanism (e.g. `node-pg-migrate`, Prisma migrations, or plain SQL migration files) so schema setup is reproducible.

Once the DB is set up, implement REST APIs to interact with the FE app. Since everything will happen locally, use Protocol Buffers (https://www.npmjs.com/package/protobufjs) for efficient communication (rather than JSON).
The end points can be called in the same way as the OpenAPI ones.

### 3. Frontend implementation (React + TypeScript)

Structure:
```
src/
  pages/
    Onboarding.tsx      # session selection + import trigger
    Dashboard.tsx        # main dashboard view
  components/
    widgets/             # one component per chart type
    DashboardGrid.tsx    # grid layout wrapper
    WidgetConfigPanel.tsx
  api/
    client.ts            # typed API client for the Node backend
  state/                 # dashboard layout/config state (context or a lightweight store)
```

Steps:
1. Scaffold the app (Vite recommended) with TypeScript and the chosen component library (Material UI or shadcn/ui).
2. Build the API client (`api/client.ts`) with typed functions for every backend endpoint.
3. Implement the onboarding flow:
   - On load, check whether any sessions exist in the local DB (via a backend endpoint).
   - If empty, show a selector for year → meeting → session, sourced from `GET /meetings` and `GET /meetings/:meetingKey/sessions`.
   - On submit, call `POST /import` and poll `GET /import/status` to show progress (e.g. a progress bar or step list).
   - On completion, navigate to the dashboard.
4. Implement the dashboard grid:
   - Use `react-grid-layout` (or similar) to allow adding, resizing, and rearranging widgets.
   - Persist layout configuration to `localStorage`, keyed by session.
5. Implement each required widget as a self-contained component that:
   - Accepts configuration props (driver(s), lap, metric, session).
   - Fetches its own data from the backend via the API client.
   - Renders the appropriate Recharts chart type:
     - Speed/throttle/brake trace: `LineChart` over `car_data`, filtered by driver and lap time range.
     - Sector time comparison: `BarChart` over `laps`, grouped by driver.
     - Track position map: `ScatterChart` or custom `LineChart` using x/y coordinates (note: OpenF1's `location` endpoint provides x/y/z; include this table if using it).
     - Pit stop duration comparison: `BarChart` over `pit`.
     - Race position over time: multi-series `LineChart` over `positions`, one series per driver.
6. Implement a widget configuration panel allowing the user to change each widget's parameters (driver selection, lap number, metric) without leaving the dashboard.
7. Add loading and error states for all data-fetching components.

Use the following color palette:
--color-racing-red-50: #fee6e7;
--color-racing-red-100: #fdced0;
--color-racing-red-200: #fc9ca1;
--color-racing-red-300: #fa6b72;
--color-racing-red-400: #f93943;
--color-racing-red-500: #f70814;
--color-racing-red-600: #c60610;
--color-racing-red-700: #94050c;
--color-racing-red-800: #630308;
--color-racing-red-900: #310204;
--color-racing-red-950: #230103;

--color-midnight-violet-50: #f8edf3;
--color-midnight-violet-100: #f1dae7;
--color-midnight-violet-200: #e3b5d0;
--color-midnight-violet-300: #d590b8;
--color-midnight-violet-400: #c76ba1;
--color-midnight-violet-500: #b94689;
--color-midnight-violet-600: #94386e;
--color-midnight-violet-700: #6f2a52;
--color-midnight-violet-800: #4a1c37;
--color-midnight-violet-900: #250e1b;
--color-midnight-violet-950: #1a0a13;

--color-crimson-violet-50: #fce9f4;
--color-crimson-violet-100: #f8d3ea;
--color-crimson-violet-200: #f1a7d5;
--color-crimson-violet-300: #ea7bc0;
--color-crimson-violet-400: #e34faa;
--color-crimson-violet-500: #dd2295;
--color-crimson-violet-600: #b01c77;
--color-crimson-violet-700: #84155a;
--color-crimson-violet-800: #580e3c;
--color-crimson-violet-900: #2c071e;
--color-crimson-violet-950: #1f0515;

--color-mustard-50: #fffae6;
--color-mustard-100: #fef5cd;
--color-mustard-200: #fdeb9b;
--color-mustard-300: #fde168;
--color-mustard-400: #fcd836;
--color-mustard-500: #fbce04;
--color-mustard-600: #c9a503;
--color-mustard-700: #977b02;
--color-mustard-800: #645202;
--color-mustard-900: #322901;
--color-mustard-950: #231d01;

--color-sky-surge-50: #e8f6fc;
--color-sky-surge-100: #d2edf9;
--color-sky-surge-200: #a4dcf4;
--color-sky-surge-300: #77caee;
--color-sky-surge-400: #49b9e9;
--color-sky-surge-500: #1ca7e3;
--color-sky-surge-600: #1686b6;
--color-sky-surge-700: #116488;
--color-sky-surge-800: #0b435b;
--color-sky-surge-900: #06212d;
--color-sky-surge-950: #041720;

### 4. Dockerization

1. Write a `Dockerfile` for the backend (Node.js, multi-stage build: install deps → build TypeScript → run compiled JS).
2. Write a `Dockerfile` for the frontend (multi-stage build: install deps → Vite build → serve static output via Nginx or a lightweight Node static server).
3. Use the official `postgres` image for the database service, with a named volume for data persistence and an init script (or migration step) to create the schema on first startup.
4. Write a `docker-compose.yml` defining all three services with:
   - Environment variables for database connection string, OpenF1 base URL, and rate-limit configuration.
   - Proper `depends_on` ordering (backend waits for DB, frontend waits for backend).
   - Exposed ports for local access (e.g. frontend on 3000, backend on 4000, Postgres on 5432).
5. Ensure the entire stack can be started with a single `docker-compose up` command, starting from an empty database.
6. Write a README documenting architecture, environment variables, and setup/run instructions.
