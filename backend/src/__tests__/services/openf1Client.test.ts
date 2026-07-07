// We test the exported fetch functions. The rate limiter internals are harder
// to unit test (timing-dependent), so we focus on the URL construction.

import {
  fetchMeetings,
  fetchSessions,
  fetchDrivers,
  fetchLaps,
  fetchCarData,
  fetchPositions,
  fetchPit,
  fetchRaceControl,
  fetchLocation,
} from "../../services/openf1Client";

// The module uses `fetch` internally. We mock global fetch.
const mockFetch = jest.fn();
global.fetch = mockFetch;

const BASE_URL = process.env.OPENF1_BASE_URL || "https://api.openf1.org/v1";

beforeEach(() => {
  mockFetch.mockReset();
  // Rate limiter resets
  (global as any).fetch = mockFetch;
});

describe("openf1Client fetch functions (URL construction)", () => {
  test("fetchMeetings without year appends no query params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ meeting_key: 1 }],
      status: 200,
    });
    const result = await fetchMeetings();
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/meetings`);
    expect(result).toEqual([{ meeting_key: 1 }]);
  });

  test("fetchMeetings with year appends ?year= query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ meeting_key: 2 }],
      status: 200,
    });
    const result = await fetchMeetings(2024);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/meetings?year=2024`);
    expect(result).toEqual([{ meeting_key: 2 }]);
  });

  test("fetchSessions builds correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchSessions(100);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/sessions?meeting_key=100`,
    );
  });

  test("fetchDrivers builds correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchDrivers(100);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/drivers?session_key=100`,
    );
  });

  test("fetchLaps without driverNumber", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchLaps(100);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/laps?session_key=100`,
    );
  });

  test("fetchLaps with driverNumber", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchLaps(100, 1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/laps?session_key=100&driver_number=1`,
    );
  });

  test("fetchCarData with driverNumber", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchCarData(100, 44);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/car_data?session_key=100&driver_number=44`,
    );
  });

  test("fetchPositions with driverNumber", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchPositions(100, 1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/position?session_key=100&driver_number=1`,
    );
  });

  test("fetchPit without driverNumber", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchPit(100);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/pit?session_key=100`,
    );
  });

  test("fetchRaceControl builds correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchRaceControl(100);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/race_control?session_key=100`,
    );
  });

  test("fetchLocation builds correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      status: 200,
    });
    await fetchLocation(100, 1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/location?session_key=100&driver_number=1`,
    );
  });

  test("fetch functions handle non-ok responses (throw + retry until exhausted)", async () => {
    // The rate limiter will retry up to 5 times. All fail → rejection.
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });
    }
    await expect(fetchDrivers(100)).rejects.toThrow("OpenF1 API error 500");
  });
});
