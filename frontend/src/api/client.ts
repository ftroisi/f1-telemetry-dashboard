import axios from "axios";
import { ImportProgress, Meeting, Session } from "../types/onboardingTypes";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

async function apiGet<T>(path: string, protobuf = false): Promise<T> {
  const accepts = protobuf ? "application/x-protobuf" : "application/json";
  const res = await apiClient.get(path, {
    headers: { Accept: accepts },
    responseType: protobuf ? "arraybuffer" : "json"
  });
  return res.data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiClient.post(path, body);
  return res.data as T;
}

export type Driver = {
  session_key: number;
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
  country_code?: string;
};

export type Lap = {
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  i1_speed: number;
  i2_speed: number;
  st_speed: number;
  is_pit_out_lap: boolean;
  segment_1?: number;
  segment_2?: number;
  segment_3?: number;
  date_start?: string;
};

export type CarDataPoint = {
  id?: number;
  session_key: number;
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  rpm: number;
  n_gear: number;
  drs: number;
};

export type Position = {
  session_key: number;
  driver_number: number;
  date: string;
  position: number;
};

export type PitStop = {
  session_key: number;
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  stop_duration: number;
  date?: string;
};

export async function checkHealth(): Promise<{ has_data: boolean; session_count: number }> {
  return apiGet("/health");
}

export async function getMeetings(year?: number): Promise<Meeting[]> {
  const params = year ? `?year=${year}` : "";
  return apiGet(`/meetings${params}`);
}

export async function getSessions(meetingKey: number): Promise<Session[]> {
  return apiGet(`/meetings/${meetingKey}/sessions`);
}

export async function getDrivers(sessionKey: number): Promise<Driver[]> {
  return apiGet(`/sessions/${sessionKey}/drivers`);
}

export async function getLaps(sessionKey: number, driverNumber?: number): Promise<Lap[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : "";
  return apiGet(`/sessions/${sessionKey}/laps${params}`);
}

export async function getCarData(
  sessionKey: number,
  driverNumber?: number,
  minDate?: string,
  maxDate?: string
): Promise<CarDataPoint[]> {
  const params = new URLSearchParams();
  if (driverNumber !== undefined) params.set("driver_number", String(driverNumber));
  if (minDate) params.set("min_date", minDate);
  if (maxDate) params.set("max_date", maxDate);
  const qs = params.toString();
  return apiGet(`/sessions/${sessionKey}/car-data${qs ? `?${qs}` : ""}`);
}

export async function getPositions(sessionKey: number, driverNumber?: number): Promise<Position[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : "";
  return apiGet(`/sessions/${sessionKey}/positions${params}`);
}

export async function getPitData(sessionKey: number, driverNumber?: number): Promise<PitStop[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : "";
  return apiGet(`/sessions/${sessionKey}/pit${params}`);
}

export async function getLocationData(sessionKey: number, driverNumber?: number): Promise<any[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : "";
  return apiGet(`/sessions/${sessionKey}/location${params}`);
}

export async function checkSessionDataExists(sessionKey: number): Promise<{ exists: boolean; session_key: number }> {
  return apiGet(`/sessions/${sessionKey}/exists`);
}

export async function triggerImport(
  sessionKey: number,
  meetingKey: number
): Promise<{ import_id: number; status: string }> {
  return apiPost("/import", { session_key: sessionKey, meeting_key: meetingKey });
}

export async function getImportStatus(sessionKey?: number): Promise<ImportProgress> {
  const params = sessionKey ? `?session_key=${sessionKey}` : "";
  return apiGet(`/import/status${params}`);
}


export type ImportedEvent = {
  meeting_key: number;
  meeting_name: string;
  country_name: string;
  circuit_short_name: string;
  location: string;
  year: number;
  meeting_date_start: string;
  session_key: number;
  session_name: string;
  session_type: string;
  session_date_start: string;
};

export type EventInfo = {
  session_key: number;
  session_name: string;
  session_type: string;
  session_date_start: string;
  meeting_key: number;
  meeting_name: string;
  country_name: string;
  circuit_short_name: string;
  location: string;
  year: number;
  meeting_date_start: string;
};

export async function getImportedEvents(): Promise<ImportedEvent[]> {
  return apiGet("/sessions/imported-events");
}

export async function getEventInfoBySession(sessionKey: number): Promise<EventInfo> {
  return apiGet(`/sessions/${sessionKey}/event-info`);
}
