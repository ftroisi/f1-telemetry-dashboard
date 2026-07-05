export const STAGES = [
  "fetching_meeting",
  "fetching_sessions",
  "fetching_drivers",
  "fetching_laps",
  "fetching_car_data",
  "fetching_positions",
  "fetching_pit",
  "fetching_race_control",
  "fetching_location"
] as const;

export type ImportProgress = {
  status: "pending" | "running" | "complete" | "error" | "idle";
  stage: string;
  progress: number;
  message: string;
  error?: string;
};

export type Meeting = {
  meeting_key: number;
  year: number;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  meeting_name?: string;
  meeting_official_name?: string;
  location?: string;
};

export type Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  year?: number;
};
