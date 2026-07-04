const BASE_URL = process.env.OPENF1_BASE_URL || "https://api.openf1.org/v1";

interface QueueItem {
  resolve: (data: any) => void;
  reject: (err: any) => void;
  url: string;
  retries: number;
}

const state = {
  tokensSecond: 3,
  tokensMinute: 30,
  lastSecondReset: Date.now(),
  lastMinuteReset: Date.now(),
  queue: [] as QueueItem[],
  processing: false,
};

const MAX_PER_SECOND = parseInt(process.env.RATE_LIMIT_PER_SECOND || "3", 10);
const MAX_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "30", 10);
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MIN_WAIT_MS = 50;

/** Refill token buckets and return true if a token is available. */
function canTakeToken(): boolean {
  const now = Date.now();
  if (now - state.lastSecondReset >= 1000) {
    state.tokensSecond = MAX_PER_SECOND;
    state.lastSecondReset = now;
  }
  if (now - state.lastMinuteReset >= 60000) {
    state.tokensMinute = MAX_PER_MINUTE;
    state.lastMinuteReset = now;
  }
  return state.tokensSecond > 0 && state.tokensMinute > 0;
}

function takeToken(): void {
  state.tokensSecond--;
  state.tokensMinute--;
}

function msUntilToken(): number {
  if (canTakeToken()) return 0;
  const now = Date.now();
  const toSecond = 1000 - (now - state.lastSecondReset) + 20;
  const toMinute = 60000 - (now - state.lastMinuteReset) + 20;
  return Math.max(Math.min(toSecond, toMinute), MIN_WAIT_MS);
}

async function processQueue(): Promise<void> {
  if (state.processing) return;
  state.processing = true;

  while (state.queue.length > 0) {
    const wait = msUntilToken();
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    const item = state.queue.shift()!;
    takeToken();

    try {
      const response = await fetch(item.url);
      if (response.ok) {
        item.resolve(await response.json());
      } else if (response.status === 429 && item.retries < MAX_RETRIES) {
        const retryAfter = response.headers.get("retry-after");
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, item.retries);
        console.warn(
          `429 on ${item.url}, retry ${item.retries + 1}/${MAX_RETRIES} in ${delay}ms`,
        );
        // Give back the token since the request didn't actually go through
        state.tokensSecond = Math.min(state.tokensSecond + 1, MAX_PER_SECOND);
        state.tokensMinute = Math.min(state.tokensMinute + 1, MAX_PER_MINUTE);
        await new Promise((r) => setTimeout(r, delay));
        state.queue.push({ ...item, retries: item.retries + 1 });
      } else {
        item.reject(new Error(`OpenF1 API error ${response.status}: ${await response.text()}`));
      }
    } catch (err: any) {
      if (item.retries < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, item.retries);
        console.warn(`Network error on ${item.url}, retry ${item.retries + 1}/${MAX_RETRIES} in ${delay}ms`);
        state.tokensSecond = Math.min(state.tokensSecond + 1, MAX_PER_SECOND);
        state.tokensMinute = Math.min(state.tokensMinute + 1, MAX_PER_MINUTE);
        await new Promise((r) => setTimeout(r, delay));
        state.queue.push({ ...item, retries: item.retries + 1 });
      } else {
        item.reject(err);
      }
    }
  }

  state.processing = false;
}

async function rateLimitedFetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    state.queue.push({ resolve, reject, url, retries: 0 });
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

export async function fetchPositions(sessionKey: number, driverNumber?: number) {
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
  progress: number;
  message: string;
  error?: string;
}
