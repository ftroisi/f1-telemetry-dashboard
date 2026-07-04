# F1 Telemetry Dashboard

A fully containerized, three-tier application for visualizing Formula 1 telemetry data. Built as a portfolio project demonstrating full-stack engineering with React/TypeScript, Node.js, PostgreSQL, Docker, and data visualization.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   Database      │
│   React/Vite    │────▶│   Node.js/Express│────▶│   PostgreSQL    │
│   Recharts      │     │   TypeScript    │     │   (Persistent)  │
│   Tailwind CSS  │     │   Protobuf      │     │                 │
│   react-grid-   │     │   Rate-limited  │     │                 │
│   layout        │     │   OpenF1 client │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                              │
         │              ┌──────────────────┐             │
         └──────────────│   OpenF1 API     │─────────────┘
                        │  (External)      │
                        │  api.openf1.org  │
                        └──────────────────┘
```

- **Frontend** (port 3000): React + TypeScript + Vite, served via Nginx. Communicates with the backend through a proxy at `/api/*`.
- **Backend** (port 4000): Node.js + Express + TypeScript. REST API with protobuf serialization support. Handles data import from OpenF1 and serves cached data from PostgreSQL.
- **Database** (port 5432): PostgreSQL 16 with persistent volume storage. Schema initialized via init scripts.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Backend | Node.js 20, TypeScript, Express |
| Backend data access | `pg` (raw SQL queries with parameterized bindings) |
| Frontend | React 18, TypeScript, Vite |
| Charts | Recharts |
| Dashboard layout | react-grid-layout |
| UI | Tailwind CSS, Lucide React icons |
| Serialization | JSON / Protocol Buffers (protobufjs) |
| Containerization | Docker, docker-compose |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- At least 4GB of free RAM for the containers
- Internet connection for initial build and data import

## Quick Start

### 1. Clone and start the stack

```bash
git clone <repo-url> f1-telemetry-dashboard
cd f1-telemetry-dashboard
docker compose up --build
```

This will:
- Build and start PostgreSQL with the schema initialized
- Build and start the Node.js backend
- Build and start the React frontend (served via Nginx)

### 2. Access the dashboard

Open your browser to **http://localhost:3000**

### 3. Import data

1. Select a year (2023-2026)
2. Choose a Grand Prix from the list
3. Select a session (Race, Qualifying, Practice)
4. Click "Import Data"
5. Wait for the import to complete (progress is shown in the UI)
6. The dashboard appears automatically with default widgets

## Project Structure

```
f1-telemetry-dashboard/
├── docker-compose.yml          # Orchestration for all 3 services
├── .env.example                # Environment variable reference
├── README.md
├── db/
│   └── init/
│       └── 01-schema.sql       # PostgreSQL schema initialization
├── backend/
│   ├── Dockerfile              # Multi-stage build
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # App entrypoint + Express setup
│       ├── db/
│       │   ├── connection.ts   # PostgreSQL connection pool
│       │   ├── migrate.ts      # Migration runner
│       │   └── queries.ts      # Data access layer
│       ├── routes/
│       │   ├── meetings.ts     # Meeting/session endpoints
│       │   ├── import.ts       # Import trigger/status endpoints
│       │   └── sessions.ts     # Session data endpoints
│       ├── services/
│       │   ├── openf1Client.ts # OpenF1 API client (rate-limited)
│       │   └── importer.ts     # Data import pipeline
│       └── proto/
│           └── serializer.ts   # Protobuf serialization
└── frontend/
    ├── Dockerfile              # Multi-stage build (Nginx)
    ├── nginx.conf              # Nginx config with API proxy
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx            # React entrypoint
        ├── App.tsx             # Root component (routing)
        ├── index.css           # Tailwind + global styles
        ├── api/
        │   └── client.ts       # Typed API client
        ├── state/
        │   └── dashboardState.ts # Dashboard layout state
        ├── pages/
        │   ├── Onboarding.tsx  # Session selection + import
        │   └── Dashboard.tsx   # Main dashboard view
        └── components/
            ├── WidgetConfigPanel.tsx
            └── widgets/
                ├── SpeedTraceWidget.tsx
                ├── SectorTimesWidget.tsx
                ├── TrackMapWidget.tsx
                ├── PitStopsWidget.tsx
                └── RacePositionsWidget.tsx
```

## API Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Check DB connection and data presence |

### Meetings & Sessions
| Method | Path | Description |
|---|---|---|
| GET | `/meetings?year=2024` | List meetings (from OpenF1) |
| GET | `/meetings/:key/sessions` | List sessions for a meeting |
| POST | `/meetings/:key/sync` | Sync meeting/sessions to local DB |

### Import
| Method | Path | Description |
|---|---|---|
| POST | `/import` | Start import for a session |
| GET | `/import/status` | Poll import progress |

### Session Data (from local DB)
| Method | Path | Description |
|---|---|---|
| GET | `/sessions/:key/drivers` | Drivers for a session |
| GET | `/sessions/:key/laps` | Lap data |
| GET | `/sessions/:key/car-data` | Car telemetry |
| GET | `/sessions/:key/positions` | Position history |
| GET | `/sessions/:key/pit` | Pit stop data |
| GET | `/sessions/:key/location` | Track location (x/y/z) |

### Query Parameters
- `driver_number` - filter by driver
- `min_date` / `max_date` - filter by time range (for car-data)
- `accept: application/x-protobuf` - request protobuf serialization

## Data Import

The import pipeline follows this sequence:
1. Meeting metadata -> 2. Sessions -> 3. Drivers -> 4. Laps -> 5. Car data -> 6. Positions -> 7. Pit stops -> 8. Race control -> 9. Location

**Rate limiting**: The backend respects OpenF1's free tier limits (3 req/s, 30 req/min). Imports are throttled automatically via an internal queue.

**Offline capability**: Once data is imported, the frontend never calls OpenF1 directly. All data is served from PostgreSQL, making the system fully offline-capable.

## Dashboard Features

### Widget Types
1. **Speed / Throttle / Brake Trace**: Line chart of car telemetry over a lap
2. **Sector Time Comparison**: Bar chart comparing sector times across drivers
3. **Track Position Map**: Scatter plot of x/y coordinates
4. **Pit Stop Duration**: Bar chart comparing average pit stop times
5. **Race Position Changes**: Multi-line chart of position changes over time

### Dashboard Management
- **Add widgets** via the "Add Widget" dropdown in the header
- **Rearrange** by dragging the gripper handle on any widget
- **Resize** using the bottom-right resize handle
- **Configure** with the settings icon (change title, select drivers, set lap number)
- **Remove** with the close button
- Layout is persisted to `localStorage` per session

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `f1_telemetry` | Database name |
| `DB_USER` | `f1user` | Database user |
| `DB_PASSWORD` | `f1password` | Database password |
| `PORT` | `4000` | Backend server port |
| `OPENF1_BASE_URL` | `https://api.openf1.org/v1` | OpenF1 API base URL |
| `RATE_LIMIT_PER_SECOND` | `3` | Max requests per second |
| `RATE_LIMIT_PER_MINUTE` | `30` | Max requests per minute |
| `VITE_API_URL` | `http://localhost:4000` | API URL for dev mode |

## Development

To run locally without Docker:

### Database
```bash
docker run -d --name f1-db -e POSTGRES_DB=f1_telemetry -e POSTGRES_USER=f1user -e POSTGRES_PASSWORD=f1password -p 5432:5432 postgres:16-alpine
cat db/init/01-schema.sql | docker exec -i f1-db psql -U f1user -d f1_telemetry
```

### Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## License

This project is open source and available under the MIT License.
