// Protobuf-based serializer for efficient API communication
import * as protobuf from "protobufjs";

// In-memory protobuf schema definition
const protoDefinition = `
syntax = "proto3";

package f1telemetry;

message Meeting {
  int32 meeting_key = 1;
  int32 year = 2;
  string country_name = 3;
  string circuit_short_name = 4;
  string date_start = 5;
  string date_end = 6;
  string meeting_name = 7;
  string meeting_official_name = 8;
  string location = 9;
}

message MeetingsResponse {
  repeated Meeting meetings = 1;
}

message Session {
  int32 session_key = 1;
  int32 meeting_key = 2;
  string session_name = 3;
  string session_type = 4;
  string date_start = 5;
  string date_end = 6;
  int32 year = 7;
}

message SessionsResponse {
  repeated Session sessions = 1;
}

message Driver {
  int32 session_key = 1;
  int32 driver_number = 2;
  string full_name = 3;
  string name_acronym = 4;
  string team_name = 5;
  string team_colour = 6;
  string headshot_url = 7;
  string country_code = 8;
}

message DriversResponse {
  repeated Driver drivers = 1;
}

message Lap {
  int32 session_key = 1;
  int32 driver_number = 2;
  int32 lap_number = 3;
  double lap_duration = 4;
  double duration_sector_1 = 5;
  double duration_sector_2 = 6;
  double duration_sector_3 = 7;
  double i1_speed = 8;
  double i2_speed = 9;
  double st_speed = 10;
  bool is_pit_out_lap = 11;
  int32 segment_1 = 12;
  int32 segment_2 = 13;
  int32 segment_3 = 14;
  string date_start = 15;
  string lap_start_time = 16;
}

message LapsResponse {
  repeated Lap laps = 1;
}

message CarDataPoint {
  int32 id = 1;
  int32 session_key = 2;
  int32 driver_number = 3;
  string date = 4;
  double speed = 5;
  double throttle = 6;
  double brake = 7;
  int32 rpm = 8;
  int32 n_gear = 9;
  int32 drs = 10;
}

message CarDataResponse {
  repeated CarDataPoint car_data = 1;
}

message Position {
  int32 session_key = 1;
  int32 driver_number = 2;
  string date = 3;
  int32 position = 4;
}

message PositionsResponse {
  repeated Position positions = 1;
}

message PitStop {
  int32 session_key = 1;
  int32 driver_number = 2;
  int32 lap_number = 3;
  double pit_duration = 4;
  double stop_duration = 5;
  string date = 6;
}

message PitResponse {
  repeated PitStop pit_stops = 1;
}

message ImportStatus {
  string status = 1;
  string stage = 2;
  int32 progress = 3;
  string message = 4;
  string error = 5;
}

message HealthResponse {
  bool has_data = 1;
  int32 session_count = 2;
}
`;

let root: protobuf.Root;
let MeetingsResponse: protobuf.Type;
let SessionsResponse: protobuf.Type;
let DriversResponse: protobuf.Type;
let LapsResponse: protobuf.Type;
let CarDataResponse: protobuf.Type;
let PositionsResponse: protobuf.Type;
let PitResponse: protobuf.Type;
let ImportStatusMsg: protobuf.Type;
let HealthResponseMsg: protobuf.Type;

export function initProto() {
  root = protobuf.parse(protoDefinition).root;
  MeetingsResponse = root.lookupType("f1telemetry.MeetingsResponse");
  SessionsResponse = root.lookupType("f1telemetry.SessionsResponse");
  DriversResponse = root.lookupType("f1telemetry.DriversResponse");
  LapsResponse = root.lookupType("f1telemetry.LapsResponse");
  CarDataResponse = root.lookupType("f1telemetry.CarDataResponse");
  PositionsResponse = root.lookupType("f1telemetry.PositionsResponse");
  PitResponse = root.lookupType("f1telemetry.PitResponse");
  ImportStatusMsg = root.lookupType("f1telemetry.ImportStatus");
  HealthResponseMsg = root.lookupType("f1telemetry.HealthResponse");
}

function wrapArray(items: any[], wrapper: any, field: string): Uint8Array {
  const obj: any = {};
  obj[field] = items;
  const message = wrapper.create(obj);
  return wrapper.encode(message).finish();
}

export function serializeMeetings(meetings: any[]): Uint8Array {
  return wrapArray(meetings, MeetingsResponse, "meetings");
}

export function serializeSessions(sessions: any[]): Uint8Array {
  return wrapArray(sessions, SessionsResponse, "sessions");
}

export function serializeDrivers(drivers: any[]): Uint8Array {
  return wrapArray(drivers, DriversResponse, "drivers");
}

export function serializeLaps(laps: any[]): Uint8Array {
  return wrapArray(laps, LapsResponse, "laps");
}

export function serializeCarData(carData: any[]): Uint8Array {
  return wrapArray(carData, CarDataResponse, "car_data");
}

export function serializePositions(positions: any[]): Uint8Array {
  return wrapArray(positions, PositionsResponse, "positions");
}

export function serializePit(pitStops: any[]): Uint8Array {
  return wrapArray(pitStops, PitResponse, "pit_stops");
}

export function serializeImportStatus(status: any): Uint8Array {
  const msg = ImportStatusMsg.create(status);
  return ImportStatusMsg.encode(msg).finish();
}

export function serializeHealth(health: {
  has_data: boolean;
  session_count: number;
}): Uint8Array {
  const msg = HealthResponseMsg.create(health);
  return HealthResponseMsg.encode(msg).finish();
}

export function serializeJson(data: any): string {
  return JSON.stringify(data);
}

// Supported serialization formats
export type SerializationFormat = "json" | "protobuf";

export function getFormat(req: any): SerializationFormat {
  const accept = req.headers?.accept || "";
  if (
    accept.includes("application/x-protobuf") ||
    accept.includes("application/protobuf")
  ) {
    return "protobuf";
  }
  return "json";
}

export function sendResponse(
  res: any,
  data: any,
  format: SerializationFormat,
  serializer: (data: any) => Uint8Array,
) {
  if (format === "protobuf") {
    const buf = serializer(data);
    res.set("Content-Type", "application/x-protobuf");
    res.send(Buffer.from(buf));
  } else {
    res.json(data);
  }
}

export function sendScalarResponse(
  res: any,
  data: any,
  format: SerializationFormat,
  serializer: (data: any) => Uint8Array,
) {
  if (format === "protobuf") {
    const buf = serializer(data);
    res.set("Content-Type", "application/x-protobuf");
    res.send(Buffer.from(buf));
  } else {
    res.json(data);
  }
}
