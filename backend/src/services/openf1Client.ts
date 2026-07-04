const BASE_URL = process.env.OPENF1_BASE_URL || "https://api.openf1.org/v1";

interface RateLimitState {
  requestsThisSecond: number;
  requestsThisMinute: number;
  lastSecondReset: number;
  lastMinuteReset: number;
  queue: Array<{
    resolve: (data: any) => void;
    reject: (err: any) => void;
    url: string;
  }>;
  processing: boolean;
}

const state: RateLimitState = {
  requestsThisSecond: 0,
  requestsThisMinute: 0,
  lastSecondReset: Date.now(),
  lastMinuteReset: Date.now(),
  queue: [],
  processing: false,
};

const MAX_PER_SECOND = parseInt(process.env.RATE_LIMIT_PER_SECOND || "3", 10);
const MAX_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "30", 10);

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - state.lastSecondReset >= 1000) {
    state.requestsThisSecond = 0;
    state.lastSecondReset = now;
  }
  if (now - state.lastMinuteReset >= 60000) {
    state.requestsThisMinute = 0;
    state.lastMinuteReset = now;
  }
  return (
    state.requestsThisSecond < MAX_PER_SECOND &&
    state.requestsThisMinute < MAX_PER_MINUTE
  );
}

async function processQueue() {
  if (state.processing) return;
  state.processing = true;

  while (state.queue.length > 0) {
    if (!checkRateLimit()) {
      const waitMs = Math.min(
        1000 - (Date.now() - state.lastSecondReset) + 50,
        60000 - (Date.now() - state.lastMinuteReset) + 50,
      );
      await new Promise((r) => setTimeout(r, Math.max(waitMs, 50)));
      continue;
    }

    const item = state.queue.shift()!;
    state.requestsThisSecond++;
    state.requestsThisMinute++;

    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        const text = await response.text();
        item.reject(new Error(`OpenF1 API error ${response.status}: ${text}`));
      } else {
        const data = await response.json();
        item.resolve(data);
      }
    } catch (err) {
      item.reject(err);
    }
  }

  state.processing = false;
}

async function rateLimitedFetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    state.queue.push({ resolve, reject, url });
    processQueue();
  });
}

export async function fetchMeetings(year?: number) {
  const params = year ? `?year=${year}` : "";
  return rateLimitedFetch(`${BASE_URL}/meetings${params}`);
}

export async function fetchSessions(meetingKey: number) {
  return rateLimitedFetch(`${BASE_URL}/sessions?meeting_key=${meetingKey}`);
}

export async function fetchDrivers(sessionKey: number) {
  return rateLimitedFetch(`${BASE_URL}/drivers?session_key=${sessionKey}`);
}

export async function fetchLaps(sessionKey: number, driverNumber?: number) {
  let url = `${BASE_URL}/laps?session_key=${sessionKey}`;
  if (driverNumber !== undefined) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

export async function fetchCarData(sessionKey: number, driverNumber?: number) {
  let url = `${BASE_URL}/car_data?session_key=${sessionKey}`;
  if (driverNumber !== undefined) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

export async function fetchPositions(
  sessionKey: number,
  driverNumber?: number,
) {
  let url = `${BASE_URL}/position?session_key=${sessionKey}`;
  if (driverNumber !== undefined) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

export async function fetchPit(sessionKey: number, driverNumber?: number) {
  let url = `${BASE_URL}/pit?session_key=${sessionKey}`;
  if (driverNumber !== undefined) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

export async function fetchRaceControl(sessionKey: number) {
  return rateLimitedFetch(`${BASE_URL}/race_control?session_key=${sessionKey}`);
}

export async function fetchLocation(sessionKey: number, driverNumber?: number) {
  let url = `${BASE_URL}/location?session_key=${sessionKey}`;
  if (driverNumber !== undefined) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

export type ImportStage =
  | "fetching_meeting"
  | "fetching_sessions"
  | "fetching_drivers"
  | "fetching_laps"
  | "fetching_car_data"
  | "fetching_positions"
  | "fetching_pit"
  | "fetching_race_control"
  | "fetching_location"
  | "complete"
  | "error";

export interface ImportProgress {
  status: "pending" | "running" | "complete" | "error";
  stage: ImportStage;
  progress: number; // 0-100
  message: string;
  error?: string;
}
