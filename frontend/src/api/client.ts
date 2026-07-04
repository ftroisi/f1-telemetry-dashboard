const API_BASE = '/api';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function fetchApi(path: string, options: FetchOptions = {}) {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...options.headers,
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/x-protobuf')) {
    // For protobuf, return the array buffer (will be decoded by specific functions if needed)
    return res.arrayBuffer();
  }
  
  return res.json();
}

export interface Meeting {
  meeting_key: number;
  year: number;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  meeting_name?: string;
  meeting_official_name?: string;
  location?: string;
}

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  year?: number;
}

export interface Driver {
  session_key: number;
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
  country_code?: string;
}

export interface Lap {
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
}

export interface CarDataPoint {
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
}

export interface Position {
  session_key: number;
  driver_number: number;
  date: string;
  position: number;
}

export interface PitStop {
  session_key: number;
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  stop_duration: number;
  date?: string;
}

export interface ImportProgress {
  status: 'pending' | 'running' | 'complete' | 'error' | 'idle';
  stage: string;
  progress: number;
  message: string;
  error?: string;
}

export async function checkHealth(): Promise<{ has_data: boolean; session_count: number }> {
  return fetchApi('/health');
}

export async function getMeetings(year?: number): Promise<Meeting[]> {
  const params = year ? `?year=${year}` : '';
  return fetchApi(`/meetings${params}`);
}

export async function getSessions(meetingKey: number): Promise<Session[]> {
  return fetchApi(`/meetings/${meetingKey}/sessions`);
}

export async function getDrivers(sessionKey: number): Promise<Driver[]> {
  return fetchApi(`/sessions/${sessionKey}/drivers`);
}

export async function getLaps(sessionKey: number, driverNumber?: number): Promise<Lap[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : '';
  return fetchApi(`/sessions/${sessionKey}/laps${params}`);
}

export async function getCarData(
  sessionKey: number,
  driverNumber?: number,
  minDate?: string,
  maxDate?: string
): Promise<CarDataPoint[]> {
  const params = new URLSearchParams();
  if (driverNumber !== undefined) params.set('driver_number', String(driverNumber));
  if (minDate) params.set('min_date', minDate);
  if (maxDate) params.set('max_date', maxDate);
  const qs = params.toString();
  return fetchApi(`/sessions/${sessionKey}/car-data${qs ? `?${qs}` : ''}`);
}

export async function getPositions(sessionKey: number, driverNumber?: number): Promise<Position[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : '';
  return fetchApi(`/sessions/${sessionKey}/positions${params}`);
}

export async function getPitData(sessionKey: number, driverNumber?: number): Promise<PitStop[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : '';
  return fetchApi(`/sessions/${sessionKey}/pit${params}`);
}

export async function getLocationData(sessionKey: number, driverNumber?: number): Promise<any[]> {
  const params = driverNumber !== undefined ? `?driver_number=${driverNumber}` : '';
  return fetchApi(`/sessions/${sessionKey}/location${params}`);
}

export async function triggerImport(sessionKey: number, meetingKey: number): Promise<{ import_id: number; status: string }> {
  return fetchApi('/import', {
    method: 'POST',
    body: { session_key: sessionKey, meeting_key: meetingKey },
  });
}

export async function getImportStatus(sessionKey?: number): Promise<ImportProgress> {
  const params = sessionKey ? `?session_key=${sessionKey}` : '';
  return fetchApi(`/import/status${params}`);
}
