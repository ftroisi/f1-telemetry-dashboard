# F1 Telemetry Dashboard — Coding Guidelines

## Project Philosophy

- **Separation of concerns**: Routes define the HTTP interface, services encapsulate business logic, DB queries are pure data access.
- **Type safety**: TypeScript strict mode everywhere. No `any` unless interacting with third-party untyped APIs (then immediately narrow).
- **Configuration via environment**: All runtime settings come from env vars; defaults are documented in `.env.example`.
- **Offline-first design**: Once data is imported, the system must work without external network access.

---

## General Principles

### 1. Keep it simple
- Prefer raw SQL via `pg` over ORMs. This project has a well-defined, stable schema.
- Prefer explicit, readable code over clever abstractions.
- Don't add dependencies unless they solve a real problem.

### 2. TypeScript usage
- **Backend** (`commonjs` module): `import x = require("y")` style; explicit return types on all exported functions.
- **Frontend** (`esnext`/bundler): `import`/`export` syntax; infer types where possible, annotate function parameters.
- Never use `any` as a shortcut. Use `unknown` and narrow it.

### 3. Error handling
- **Backend**: Routes catch errors and return consistent `{ error: string, message: string }` JSON with appropriate HTTP status codes.
- **Frontend**: All API calls are wrapped in try/catch; errors surface to the user via `react-toastify` toasts.
- **Importer**: Background import jobs track progress in DB and expose status via a polling endpoint. Failures set `status: "error"` with `error_message`.

---

## Backend Conventions

### Project Structure
```
backend/src/
  index.ts               # Express app, middleware, /health endpoint, lifecycle hooks
  db/
    connection.ts          # pg Pool setup, query() helper with slow-query logging
    migrate.ts             # Applies SQL migration files in order
    queries.ts             # One function per DB operation (get, upsert, batch insert, delete)
  routes/
    meetings.ts            # Meeting/session CRUD, OpenF1 proxying
    sessions.ts            # Session data queries (drivers, laps, car_data, positions, pit, location)
    import.ts              # Import trigger and status polling
  services/
    openf1Client.ts         # Rate-limited OpenF1 API client with exponential backoff
    importer.ts             # Background import engine
  proto/
    serializer.ts           # Protobuf serializers for bandwidth-efficient responses
```

### Naming Conventions
- **Files**: `camelCase` for modules, match the primary export name (e.g., `openf1Client.ts` exports `fetchMeetings`, etc.).
- **Functions**: `camelCase` — verbs for actions (`getDrivers`, `upsertMeeting`, `deleteSessionData`).
- **SQL queries**: parameterized with numbered placeholders (`$1, $2`); never string-interpolate user input.
- **Route handlers**: inline anonymous async functions using `(req: Request, res: Response)`.

### Database
- All queries live in `db/queries.ts`. Do not inline SQL in route handlers.
- Batch inserts (car_data, location, race_control) use multi-row `INSERT ... VALUES (...), (...), ... ON CONFLICT DO NOTHING`.
- Batch size: 500 rows per insert (balances memory and round-trip cost).
- Index every column used in WHERE/JOIN clauses (`session_key`, `driver_number`, `date`).

### Express 5 Patterns
- Express 5 params/query values are `string | string[]`. Always wrap in `String()` or `parseInt(String(...), 10)`.
- Router type annotation: `const router: import("express").Router = Router();`
- Error-handling middleware signature: `(err: any, _req: Request, res: Response, _next: NextFunction)`.

### Rate Limiter (OpenF1 Client)
- Token-bucket + queue architecture. Tokens refill per-second and per-minute.
- 429 responses trigger exponential backoff (1s, 2s, 4s, 8s, 16s) with max 5 retries.
- Consumed tokens are refunded on 429/network errors.

### Protobuf Serialization
- Inline `.proto` schema in `serializer.ts`; no external `.proto` files.
- Both JSON and protobuf responses are supported. Format is determined by the `Accept` header.
- `sendResponse(res, data, format, serializer)` handles both formats.

---

## Frontend Conventions

### Project Structure
```
frontend/src/
  App.tsx                    # Root: health check → Onboarding | Dashboard routing
  main.tsx                   # React DOM entry
  index.css                  # Tailwind v4 via @import, @theme with custom colors
  api/
    client.ts                # Typed axios client — all API calls go through here
  state/
    dashboardState.ts         # localStorage persistence, default widgets/layouts
  types/
    onboardingTypes.ts        # Shared types (Meeting, Session, ImportProgress, etc.)
  pages/
    Onboarding/               # Onboarding.tsx (logic), OnboardingContext.tsx, UI components
    Dashboard/                # Dashboard.tsx (logic), DashboardContext.tsx, UI components
  components/
    layout/                   # Navbar, Footer, LayoutContext
    widgets/                  # SpeedTrace, SectorTimes, TrackMap, PitStops, RacePositions
    WidgetConfigPanel.tsx     # Widget configuration modal
  safeLazyImport.tsx          # Retry wrapper for React.lazy
```

### Component Architecture
- **Logic/UI separation**: Container components handle state and data fetching; `*UI.tsx` components are pure presentational.
- **Context for shared state**: `OnboardingContext` and `DashboardContext` for cross-component communication.
- **Lazy loading**: All page-level and widget components use `safeLazyImport()` (retries on chunk-fetch failure).

### Styling Convention
- **All MUI components are styled with `className="..."` (Tailwind classes), never `sx={}`.**
- MUI `ThemeProvider` provides the dark mode palette defaults.
- HTML elements (`<div>`, `<h1>`, `<p>`, `<button>`, `<input>`) use Tailwind classes.
- Recharts tooltips/charts use inline `style` objects (Recharts API requirement).
- Custom Tailwind v4 `@theme` block defines all F1 brand colors.

### State Management
- No external state library (Redux, Zustand, etc.). React `useState` + `useEffect` + Context is sufficient.
- Dashboard layout/configuration persists via `localStorage` keyed by `f1-dashboard-layout-{sessionKey}`.
- Session-level state (active session key, meeting name, etc.) stored in `sessionStorage`.

### Data Fetching Pattern
```typescript
// In widget components: fetch on mount + driver/lap changes
useEffect(() => {
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSomeData(sessionKey, driverNumber);
      setData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [sessionKey, driverNumber]);
```

### Widget Pattern
Every widget:
1. Accepts `{ sessionKey, driverNumbers, lapNumber?, configurable?, onConfigure? }` props.
2. Has its own internal loading/error/empty states.
3. Fetches its own data from the backend (self-contained).
4. Uses Recharts `ResponsiveContainer` to fill parent bounds.

---

## Docker Conventions

### Production Dockerfiles
- Multi-stage builds: `builder` stage installs deps + compiles TypeScript; `production` stage copies only the built artifacts.
- Backend: `node:26-alpine3.23` → install pnpm → build → copy dist + db.
- Frontend: `node:26-alpine3.23` → build → copy to `nginx:alpine3.23`.

### Development Dockerfiles
- Single stage: install deps, run `pnpm run dev` / `vite dev`.
- Source directories mounted as volumes for hot reload.

### docker-compose
- `depends_on` with `condition: service_healthy` for database readiness.
- Named volume for PostgreSQL data persistence.
- `f1-postgres-data:/var/lib/postgresql` (PG18 mounts in parent dir, not `/data`).

---

## Testing Guidelines

### Backend (Jest)
- Tests live in `backend/src/__tests__/`, mirroring the source structure.
- Unit tests cover: queries (mocked DB), route handlers (mocked queries + req/res), services (mocked openf1Client), serializer.
- Use `jest.fn()` for mocks; prefer dependency injection over module mocking where possible.
- Test both success and error paths.

### Frontend (future)
- Component tests with React Testing Library.
- API client tests with MSW.

---

## Git Workflow

- `main` branch is the single source of truth.
- Commit messages: imperative present tense, short description.
- Format with Prettier before committing: `pnpm run format`.
- Run TypeScript checks before pushing: `pnpm run check:tsc`.

---

## Performance Considerations

- **Car data**: Largest table. Batch insert in chunks of 500. Index on `(session_key, driver_number, date)`.
- **Rate limiting**: Import respects OpenF1's 3 req/s and 30 req/min limits. A full race import can take several minutes.
- **Frontend**: Lazy-load all page and widget components. Recharts renders are efficient for up to ~10,000 data points.
- **Protobuf**: Optional; reduces payload size ~3–5× vs JSON for large arrays (car data, positions).

---

## Key Architectural Decisions

1. **Raw SQL over ORM**: Full control over query performance; simpler debugging; no ORM learning curve.
2. **Protobuf as optional serialization**: Efficient for large payloads; JSON fallback for debugging and browser DevTools.
3. **Background import with polling**: Keeps the UI responsive during slow imports; status is persisted in DB for crash recovery.
4. **localStorage for dashboard state**: Simple, no backend dependency for UI preferences; sufficient for single-user local deployment.
5. **Context + useState over Redux**: The app is small enough that a state management library adds complexity without benefit.
6. **Tailwind v4 CSS-first config**: Removes the need for JS config files; all theme values in one place.
7. **pnpm over npm**: Faster installs, strict dependency resolution, workspace support for monorepo.
