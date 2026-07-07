import {
  getMeetings,
  getMeetingByKey,
  upsertMeeting,
  getSessionsByMeeting,
  getSessionCount,
  getSessionDataExists,
  getDrivers,
  upsertDriver,
  getLaps,
  upsertLap,
  getCarData,
  insertCarDataBatch,
  getPositions,
  upsertPosition,
  getPitData,
  upsertPit,
  insertRaceControlBatch,
  insertLocationBatch,
  createImportStatus,
  updateImportStatus,
  getImportStatus,
  deleteSessionData,
  getImportedEvents,
} from "../../db/queries";

// Mock the connection module
jest.mock("../../db/connection", () => ({
  query: jest.fn(),
}));

import { query } from "../../db/connection";

const mockQuery = query as jest.MockedFunction<typeof query>;

beforeEach(() => {
  mockQuery.mockReset();
});

// Helper to safely get call params
const getCallParams = (call: number): any[] =>
  (mockQuery.mock.calls[call][1] as any[]) ?? [];

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------
describe("Meetings queries", () => {
  test("getMeetings returns rows sorted by date_start DESC", async () => {
    const rows = [
      { meeting_key: 1, country_name: "Italy", date_start: "2024-09-01" },
      { meeting_key: 2, country_name: "Monaco", date_start: "2024-05-26" },
    ];
    mockQuery.mockResolvedValueOnce({ rows } as any);

    const result = await getMeetings();
    expect(result).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM meetings ORDER BY date_start DESC",
    );
  });

  test("getMeetingByKey returns the meeting row or null", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meeting_key: 10, country_name: "Bahrain" }],
    } as any);
    const result = await getMeetingByKey(10);
    expect(result).toEqual({ meeting_key: 10, country_name: "Bahrain" });

    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const result2 = await getMeetingByKey(999);
    expect(result2).toBeNull();
  });

  test("upsertMeeting executes correct INSERT ... ON CONFLICT", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const meeting = {
      meeting_key: 1,
      year: 2024,
      country_name: "Italy",
      circuit_short_name: "Monza",
      date_start: "2024-09-01",
      date_end: "2024-09-03",
      meeting_name: "Italian GP",
      meeting_official_name: "Formula 1 Pirelli Gran Premio d'Italia 2024",
      location: "Monza",
    };
    await upsertMeeting(meeting);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("INSERT INTO meetings");
    expect(sql).toContain("ON CONFLICT (meeting_key) DO UPDATE");
    const params = getCallParams(0);
    expect(params).toEqual([
      1, 2024, "Italy", "Monza", "2024-09-01", "2024-09-03",
      "Italian GP", "Formula 1 Pirelli Gran Premio d'Italia 2024", "Monza",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
describe("Sessions queries", () => {
  test("getSessionsByMeeting returns sessions for a meeting", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ session_key: 100, meeting_key: 1, session_name: "Race" }],
    } as any);
    const result = await getSessionsByMeeting(1);
    expect(result).toHaveLength(1);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM sessions WHERE meeting_key = $1 ORDER BY date_start",
      [1],
    );
  });

  test("getSessionCount returns parsed count", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ count: "5" }],
    } as any);
    const count = await getSessionCount();
    expect(count).toBe(5);
  });

  test("getSessionDataExists returns true when drivers exist", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ exists: true }],
    } as any);
    const exists = await getSessionDataExists(100);
    expect(exists).toBe(true);
  });

  test("getSessionDataExists returns false when no drivers", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{}] } as any);
    const exists = await getSessionDataExists(100);
    expect(exists).toBe(false);
  });

  test("getImportedEvents returns events with driver data", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          meeting_key: 1,
          meeting_name: "Italian GP",
          country_name: "Italy",
          circuit_short_name: "Monza",
          location: "Monza",
          year: 2024,
          meeting_date_start: "2024-09-01",
          session_key: 100,
          session_name: "Race",
          session_type: "Race",
          session_date_start: "2024-09-01",
        },
      ],
    } as any);
    const events = await getImportedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].session_key).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------
describe("Drivers queries", () => {
  test("getDrivers returns drivers ordered by driver_number", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { session_key: 100, driver_number: 1, full_name: "Max Verstappen" },
        { session_key: 100, driver_number: 11, full_name: "Sergio Perez" },
      ],
    } as any);
    const drivers = await getDrivers(100);
    expect(drivers).toHaveLength(2);
    expect(drivers[0].driver_number).toBe(1);
  });

  test("upsertDriver inserts with correct columns", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const driver = {
      session_key: 100,
      driver_number: 1,
      full_name: "Max Verstappen",
      name_acronym: "VER",
      team_name: "Red Bull Racing",
      team_colour: "3671C6",
      headshot_url: "https://example.com/headshot.png",
      country_code: "NED",
    };
    await upsertDriver(driver);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const params = getCallParams(0);
    expect(params).toEqual([
      100, 1, "Max Verstappen", "VER", "Red Bull Racing",
      "3671C6", "https://example.com/headshot.png", "NED",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Laps
// ---------------------------------------------------------------------------
describe("Laps queries", () => {
  test("getLaps filters by session_key only when no driverNumber", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getLaps(100);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM laps WHERE session_key = $1 ORDER BY driver_number, lap_number",
      [100],
    );
  });

  test("getLaps filters by session_key and driver_number", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getLaps(100, 1);
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM laps WHERE session_key = $1 AND driver_number = $2 ORDER BY driver_number, lap_number",
      [100, 1],
    );
  });

  test("upsertLap inserts with 16 parameters", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const lap = {
      session_key: 100,
      driver_number: 1,
      lap_number: 1,
      lap_duration: 90.5,
      duration_sector_1: 25.0,
      duration_sector_2: 35.0,
      duration_sector_3: 30.5,
      i1_speed: 300,
      i2_speed: 310,
      st_speed: 320,
      is_pit_out_lap: false,
      segment_1: null,
      segment_2: null,
      segment_3: null,
      date_start: "2024-09-01T14:00:00Z",
      lap_start_time: "2024-09-01T14:00:00Z",
    };
    await upsertLap(lap);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const params = getCallParams(0);
    expect(params).toHaveLength(16);
    expect(params[0]).toBe(100);
    expect(params[2]).toBe(1);
    expect(params[3]).toBe(90.5);
  });
});

// ---------------------------------------------------------------------------
// Car Data
// ---------------------------------------------------------------------------
describe("Car Data queries", () => {
  test("getCarData builds query with optional filters", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getCarData(100, 1, "2024-09-01T14:00:00Z", "2024-09-01T15:00:00Z");
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("WHERE session_key = $1");
    expect(sql).toContain("AND driver_number = $2");
    expect(sql).toContain("AND date >= $3");
    expect(sql).toContain("AND date <= $4");
    const params = getCallParams(0);
    expect(params).toEqual([
      100, 1, "2024-09-01T14:00:00Z", "2024-09-01T15:00:00Z",
    ]);
  });

  test("getCarData builds query with only session_key", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getCarData(100);
    const sql: string = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("WHERE session_key = $1");
    expect(sql).not.toContain("AND driver_number");
    expect(sql).not.toContain("AND date");
  });

  test("insertCarDataBatch handles empty array", async () => {
    await insertCarDataBatch([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("insertCarDataBatch builds multi-row INSERT", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const rows = [
      { session_key: 100, driver_number: 1, date: "2024-09-01T14:00:00Z", speed: 300, throttle: 80, brake: 0, rpm: 12000, n_gear: 7, drs: 0 },
      { session_key: 100, driver_number: 1, date: "2024-09-01T14:00:01Z", speed: 310, throttle: 90, brake: 0, rpm: 12500, n_gear: 8, drs: 1 },
    ];
    await insertCarDataBatch(rows);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("INSERT INTO car_data");
    expect(sql).toContain("ON CONFLICT DO NOTHING");
    const params = getCallParams(0);
    // 2 rows * 9 columns = 18 params
    expect(params).toHaveLength(18);
  });
});

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------
describe("Positions queries", () => {
  test("getPositions queries with session and optional driver", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getPositions(100);
    expect((mockQuery.mock.calls[0]![0] as string)).toContain("WHERE session_key = $1");
    const params0 = getCallParams(0);
    expect(params0).toEqual([100]);

    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getPositions(100, 1);
    expect((mockQuery.mock.calls[1]![0] as string)).toContain("AND driver_number = $2");
    const params1 = getCallParams(1);
    expect(params1).toEqual([100, 1]);
  });

  test("upsertPosition executes insert with correct params", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await upsertPosition({
      session_key: 100,
      driver_number: 1,
      date: "2024-09-01T14:00:00Z",
      position: 1,
    });
    const params = getCallParams(0);
    expect(params).toEqual([
      100, 1, "2024-09-01T14:00:00Z", 1,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Pit data
// ---------------------------------------------------------------------------
describe("Pit data queries", () => {
  test("getPitData with optional driver filter", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await getPitData(100, 1);
    expect((mockQuery.mock.calls[0]![0] as string)).toContain("AND driver_number = $2");
    const params = getCallParams(0);
    expect(params).toEqual([100, 1]);
  });

  test("upsertPit inserts with 6 params", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await upsertPit({
      session_key: 100,
      driver_number: 1,
      lap_number: 15,
      pit_duration: 25.3,
      stop_duration: 2.5,
      date: "2024-09-01T14:30:00Z",
    });
    const params = getCallParams(0);
    expect(params).toEqual([
      100, 1, 15, 25.3, 2.5, "2024-09-01T14:30:00Z",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Batch inserts
// ---------------------------------------------------------------------------
describe("Batch insert queries", () => {
  test("insertRaceControlBatch handles empty array", async () => {
    await insertRaceControlBatch([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("insertRaceControlBatch builds multi-row INSERT", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const rows = [
      { session_key: 100, category: "Flag", flag: "GREEN", message: "Track clear", date: "2024-09-01T14:00:00Z", driver_number: null, lap_number: null },
    ];
    await insertRaceControlBatch(rows);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0]![0] as string;
    expect(sql).toContain("INSERT INTO race_control");
    expect(sql).toContain("ON CONFLICT DO NOTHING");
    const params = getCallParams(0);
    expect(params).toHaveLength(7);
  });

  test("insertLocationBatch handles empty array", async () => {
    await insertLocationBatch([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("insertLocationBatch builds multi-row INSERT with x,y,z", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const rows = [
      { session_key: 100, driver_number: 1, date: "2024-09-01T14:00:00Z", x: 100.5, y: 200.3, z: 0 },
    ];
    await insertLocationBatch(rows);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const params = getCallParams(0);
    expect(params).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Import status
// ---------------------------------------------------------------------------
describe("Import status queries", () => {
  test("createImportStatus returns the new id", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }] } as any);
    const id = await createImportStatus(100);
    expect(id).toBe(42);
  });

  test("updateImportStatus sends all nullable fields", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await updateImportStatus(42, "running", "fetching_laps", 45, undefined);
    const params = getCallParams(0);
    expect(params).toEqual([
      "running", "fetching_laps", 45, null, 42,
    ]);
  });

  test("updateImportStatus with error message", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    await updateImportStatus(42, "error", "fetching_laps", 30, "Network timeout");
    const params = getCallParams(0);
    expect(params).toEqual([
      "error", "fetching_laps", 30, "Network timeout", 42,
    ]);
  });

  test("getImportStatus returns most recent status for session", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, session_key: 100, status: "complete", stage: "complete", progress: 100 }],
    } as any);
    const status = await getImportStatus(100);
    expect(status).not.toBeNull();
    expect(status!.status).toBe("complete");
  });

  test("getImportStatus returns null when no status exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const status = await getImportStatus(999);
    expect(status).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Delete session data
// ---------------------------------------------------------------------------
describe("Delete session data", () => {
  test("deleteSessionData deletes from all child tables and cascades meeting", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE drivers
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE laps
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE car_data
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE positions
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE pit
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE race_control
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE location
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE import_status
    mockQuery.mockResolvedValueOnce({
      rows: [{ meeting_key: 1 }],
    } as any); // SELECT meeting_key
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE sessions
    mockQuery.mockResolvedValueOnce({
      rows: [{ count: "0" }],
    } as any); // COUNT remaining sessions
    mockQuery.mockResolvedValueOnce({ rows: [] } as any); // DELETE meeting (orphaned)

    await deleteSessionData(100);
    expect(mockQuery).toHaveBeenCalledTimes(12);
  });
});
