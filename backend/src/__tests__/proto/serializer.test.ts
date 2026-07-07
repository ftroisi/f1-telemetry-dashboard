import { initProto, serializeMeetings, serializeSessions, serializeDrivers, serializeLaps, serializeCarData, serializePositions, serializePit, serializeImportStatus, serializeHealth, getFormat, serializeJson } from "../../proto/serializer";

beforeAll(() => {
  initProto();
});

describe("Protobuf serializer", () => {
  test("serializeMeetings produces a non-empty buffer for valid data", () => {
    const meetings = [
      {
        meeting_key: 1, year: 2024, country_name: "Italy",
        circuit_short_name: "Monza", date_start: "2024-09-01",
        date_end: "2024-09-03", meeting_name: "Italian GP",
        meeting_official_name: "Gran Premio d'Italia", location: "Monza",
      },
    ];
    const buf = serializeMeetings(meetings);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("serializeSessions produces a non-empty buffer", () => {
    const sessions = [
      {
        session_key: 100, meeting_key: 1, session_name: "Race",
        session_type: "Race", date_start: "2024-09-01",
        date_end: "2024-09-01", year: 2024,
      },
    ];
    const buf = serializeSessions(sessions);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("serializeDrivers produces a non-empty buffer", () => {
    const drivers = [
      {
        session_key: 100, driver_number: 1, full_name: "Max Verstappen",
        name_acronym: "VER", team_name: "Red Bull Racing",
        team_colour: "3671C6", headshot_url: "", country_code: "NED",
      },
    ];
    const buf = serializeDrivers(drivers);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("serializeLaps produces a non-empty buffer", () => {
    const laps = [
      {
        session_key: 100, driver_number: 1, lap_number: 1,
        lap_duration: 90.5, duration_sector_1: 25.0,
        duration_sector_2: 35.0, duration_sector_3: 30.5,
        i1_speed: 300, i2_speed: 310, st_speed: 320,
        is_pit_out_lap: false,
        segment_1: 0, segment_2: 0, segment_3: 0,
        date_start: "2024-09-01T14:00:00Z",
        lap_start_time: "2024-09-01T14:00:00Z",
      },
    ];
    const buf = serializeLaps(laps);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("serializeCarData returns a Uint8Array", () => {
    const carData = [
      {
        id: 1, session_key: 100, driver_number: 1,
        date: "2024-09-01T14:00:00Z", speed: 300,
        throttle: 80, brake: 0, rpm: 12000, n_gear: 7, drs: 0,
      },
    ];
    const buf = serializeCarData(carData);
    expect(buf).toBeInstanceOf(Uint8Array);
  });

  test("serializePositions produces a non-empty buffer", () => {
    const positions = [
      { session_key: 100, driver_number: 1, date: "2024-09-01T14:00:00Z", position: 1 },
    ];
    const buf = serializePositions(positions);
    expect(buf).toBeInstanceOf(Uint8Array);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("serializePit returns a Uint8Array", () => {
    const pitStops = [
      {
        session_key: 100, driver_number: 1, lap_number: 15,
        pit_duration: 25.3, stop_duration: 2.5,
        date: "2024-09-01T14:30:00Z",
      },
    ];
    const buf = serializePit(pitStops);
    expect(buf).toBeInstanceOf(Uint8Array);
  });

  test("serializeImportStatus returns a Uint8Array", () => {
    const status = {
      status: "running", stage: "fetching_laps",
      progress: 45, message: "Importing laps...", error: "",
    };
    const buf = serializeImportStatus(status);
    expect(buf).toBeInstanceOf(Uint8Array);
  });

  test("serializeHealth returns a Uint8Array", () => {
    const buf = serializeHealth({ has_data: true, session_count: 3 });
    expect(buf).toBeInstanceOf(Uint8Array);
  });

  test("serializeJson returns a JSON string", () => {
    const result = serializeJson({ foo: "bar" });
    expect(result).toBe('{"foo":"bar"}');
  });
});

describe("getFormat", () => {
  test("returns protobuf when Accept header is application/x-protobuf", () => {
    expect(getFormat({ headers: { accept: "application/x-protobuf" } })).toBe("protobuf");
  });

  test("returns protobuf when Accept header is application/protobuf", () => {
    expect(getFormat({ headers: { accept: "application/protobuf" } })).toBe("protobuf");
  });

  test("returns json when no Accept header", () => {
    expect(getFormat({ headers: {} })).toBe("json");
  });

  test("returns json when Accept is application/json", () => {
    expect(getFormat({ headers: { accept: "application/json" } })).toBe("json");
  });
});
