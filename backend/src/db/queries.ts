import { query } from "./connection";

// --- Meetings ---
export async function getMeetings() {
  const res = await query("SELECT * FROM meetings ORDER BY date_start DESC");
  return res.rows;
}

export async function getMeetingByKey(meetingKey: number) {
  const res = await query("SELECT * FROM meetings WHERE meeting_key = $1", [
    meetingKey,
  ]);
  return res.rows[0] || null;
}

export async function upsertMeeting(meeting: any) {
  const sql = `
    INSERT INTO meetings (meeting_key, year, country_name, circuit_short_name, date_start, date_end, meeting_name, meeting_official_name, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (meeting_key) DO UPDATE SET
      year = EXCLUDED.year,
      country_name = EXCLUDED.country_name,
      circuit_short_name = EXCLUDED.circuit_short_name,
      date_start = EXCLUDED.date_start,
      date_end = EXCLUDED.date_end,
      meeting_name = EXCLUDED.meeting_name,
      meeting_official_name = EXCLUDED.meeting_official_name,
      location = EXCLUDED.location
  `;
  await query(sql, [
    meeting.meeting_key,
    meeting.year,
    meeting.country_name,
    meeting.circuit_short_name,
    meeting.date_start,
    meeting.date_end,
    meeting.meeting_name,
    meeting.meeting_official_name,
    meeting.location,
  ]);
}

// --- Sessions ---
export async function getSessionsByMeeting(meetingKey: number) {
  const res = await query(
    "SELECT * FROM sessions WHERE meeting_key = $1 ORDER BY date_start",
    [meetingKey],
  );
  return res.rows;
}

export async function getSessionByKey(sessionKey: number) {
  const res = await query("SELECT * FROM sessions WHERE session_key = $1", [
    sessionKey,
  ]);
  return res.rows[0] || null;
}

export async function upsertSession(session: any) {
  const sql = `
    INSERT INTO sessions (session_key, meeting_key, session_name, session_type, date_start, date_end, year)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (session_key) DO UPDATE SET
      meeting_key = EXCLUDED.meeting_key,
      session_name = EXCLUDED.session_name,
      session_type = EXCLUDED.session_type,
      date_start = EXCLUDED.date_start,
      date_end = EXCLUDED.date_end,
      year = EXCLUDED.year
  `;
  await query(sql, [
    session.session_key,
    session.meeting_key,
    session.session_name,
    session.session_type,
    session.date_start,
    session.date_end,
    session.year,
  ]);
}

export async function getSessionCount() {
  const res = await query("SELECT COUNT(*) as count FROM sessions");
  return parseInt(res.rows[0].count, 10);
}

export async function getSessionDataExists(sessionKey: number): Promise<boolean> {
  const res = await query(
    "SELECT EXISTS(SELECT 1 FROM drivers WHERE session_key = $1) AS exists",
    [sessionKey],
  );
  return res.rows[0]?.exists ?? false;
}

// --- Drivers ---
export async function getDrivers(sessionKey: number) {
  const res = await query(
    "SELECT * FROM drivers WHERE session_key = $1 ORDER BY driver_number",
    [sessionKey],
  );
  return res.rows;
}

export async function upsertDriver(driver: any) {
  const sql = `
    INSERT INTO drivers (session_key, driver_number, full_name, name_acronym, team_name, team_colour, headshot_url, country_code)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (session_key, driver_number) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      name_acronym = EXCLUDED.name_acronym,
      team_name = EXCLUDED.team_name,
      team_colour = EXCLUDED.team_colour,
      headshot_url = EXCLUDED.headshot_url,
      country_code = EXCLUDED.country_code
  `;
  await query(sql, [
    driver.session_key,
    driver.driver_number,
    driver.full_name,
    driver.name_acronym,
    driver.team_name,
    driver.team_colour,
    driver.headshot_url,
    driver.country_code,
  ]);
}

// --- Laps ---
export async function getLaps(sessionKey: number, driverNumber?: number) {
  let sql = "SELECT * FROM laps WHERE session_key = $1";
  const params: any[] = [sessionKey];
  if (driverNumber !== undefined) {
    sql += " AND driver_number = $2";
    params.push(driverNumber);
  }
  sql += " ORDER BY driver_number, lap_number";
  const res = await query(sql, params);
  return res.rows;
}

export async function upsertLap(lap: any) {
  const sql = `
    INSERT INTO laps (session_key, driver_number, lap_number, lap_duration, duration_sector_1, duration_sector_2, duration_sector_3, i1_speed, i2_speed, st_speed, is_pit_out_lap, segment_1, segment_2, segment_3, date_start, lap_start_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (session_key, driver_number, lap_number) DO UPDATE SET
      lap_duration = EXCLUDED.lap_duration,
      duration_sector_1 = EXCLUDED.duration_sector_1,
      duration_sector_2 = EXCLUDED.duration_sector_2,
      duration_sector_3 = EXCLUDED.duration_sector_3,
      i1_speed = EXCLUDED.i1_speed,
      i2_speed = EXCLUDED.i2_speed,
      st_speed = EXCLUDED.st_speed,
      is_pit_out_lap = EXCLUDED.is_pit_out_lap,
      segment_1 = EXCLUDED.segment_1,
      segment_2 = EXCLUDED.segment_2,
      segment_3 = EXCLUDED.segment_3,
      date_start = EXCLUDED.date_start
  `;
  await query(sql, [
    lap.session_key,
    lap.driver_number,
    lap.lap_number,
    lap.lap_duration,
    lap.duration_sector_1,
    lap.duration_sector_2,
    lap.duration_sector_3,
    lap.i1_speed,
    lap.i2_speed,
    lap.st_speed,
    lap.is_pit_out_lap || false,
    lap.segment_1,
    lap.segment_2,
    lap.segment_3,
    lap.date_start,
    lap.lap_start_time,
  ]);
}

// --- Car Data ---
export async function getCarData(
  sessionKey: number,
  driverNumber?: number,
  minDate?: string,
  maxDate?: string,
) {
  let sql = "SELECT * FROM car_data WHERE session_key = $1";
  const params: any[] = [sessionKey];
  let idx = 2;
  if (driverNumber !== undefined) {
    sql += ` AND driver_number = $${idx++}`;
    params.push(driverNumber);
  }
  if (minDate) {
    sql += ` AND date >= $${idx++}`;
    params.push(minDate);
  }
  if (maxDate) {
    sql += ` AND date <= $${idx++}`;
    params.push(maxDate);
  }
  sql += " ORDER BY date";
  const res = await query(sql, params);
  return res.rows;
}

export async function insertCarDataBatch(rows: any[]) {
  if (rows.length === 0) return;
  const values: string[] = [];
  const params: any[] = [];
  let idx = 1;
  for (const row of rows) {
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    params.push(
      row.session_key,
      row.driver_number,
      row.date,
      row.speed,
      row.throttle,
      row.brake,
      row.rpm,
      row.n_gear,
      row.drs,
    );
  }
  const sql = `INSERT INTO car_data (session_key, driver_number, date, speed, throttle, brake, rpm, n_gear, drs) VALUES ${values.join(", ")} ON CONFLICT DO NOTHING`;
  await query(sql, params);
}

// --- Positions ---
export async function getPositions(sessionKey: number, driverNumber?: number) {
  let sql = "SELECT * FROM positions WHERE session_key = $1";
  const params: any[] = [sessionKey];
  if (driverNumber !== undefined) {
    sql += " AND driver_number = $2";
    params.push(driverNumber);
  }
  sql += " ORDER BY date";
  const res = await query(sql, params);
  return res.rows;
}

export async function upsertPosition(pos: any) {
  const sql = `
    INSERT INTO positions (session_key, driver_number, date, position)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (session_key, driver_number, date) DO UPDATE SET position = EXCLUDED.position
  `;
  await query(sql, [
    pos.session_key,
    pos.driver_number,
    pos.date,
    pos.position,
  ]);
}

// --- Pit ---
export async function getPitData(sessionKey: number, driverNumber?: number) {
  let sql = "SELECT * FROM pit WHERE session_key = $1";
  const params: any[] = [sessionKey];
  if (driverNumber !== undefined) {
    sql += " AND driver_number = $2";
    params.push(driverNumber);
  }
  sql += " ORDER BY driver_number, lap_number";
  const res = await query(sql, params);
  return res.rows;
}

export async function upsertPit(pit: any) {
  const sql = `
    INSERT INTO pit (session_key, driver_number, lap_number, pit_duration, stop_duration, date)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (session_key, driver_number, lap_number) DO UPDATE SET
      pit_duration = EXCLUDED.pit_duration,
      stop_duration = EXCLUDED.stop_duration,
      date = EXCLUDED.date
  `;
  await query(sql, [
    pit.session_key,
    pit.driver_number,
    pit.lap_number,
    pit.pit_duration,
    pit.stop_duration,
    pit.date,
  ]);
}

// --- Race Control ---
export async function getRaceControl(sessionKey: number) {
  const res = await query(
    "SELECT * FROM race_control WHERE session_key = $1 ORDER BY date",
    [sessionKey],
  );
  return res.rows;
}

export async function insertRaceControlBatch(rows: any[]) {
  if (rows.length === 0) return;
  const values: string[] = [];
  const params: any[] = [];
  let idx = 1;
  for (const row of rows) {
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    params.push(
      row.session_key,
      row.category,
      row.flag,
      row.message,
      row.date,
      row.driver_number,
      row.lap_number,
    );
  }
  const sql = `INSERT INTO race_control (session_key, category, flag, message, date, driver_number, lap_number) VALUES ${values.join(", ")} ON CONFLICT DO NOTHING`;
  await query(sql, params);
}

// --- Location ---
export async function getLocationData(
  sessionKey: number,
  driverNumber?: number,
) {
  let sql = "SELECT * FROM location WHERE session_key = $1";
  const params: any[] = [sessionKey];
  if (driverNumber !== undefined) {
    sql += " AND driver_number = $2";
    params.push(driverNumber);
  }
  sql += " ORDER BY date";
  const res = await query(sql, params);
  return res.rows;
}

export async function insertLocationBatch(rows: any[]) {
  if (rows.length === 0) return;
  const values: string[] = [];
  const params: any[] = [];
  let idx = 1;
  for (const row of rows) {
    values.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    params.push(
      row.session_key,
      row.driver_number,
      row.date,
      row.x,
      row.y,
      row.z,
    );
  }
  const sql = `INSERT INTO location (session_key, driver_number, date, x, y, z) VALUES ${values.join(", ")} ON CONFLICT DO NOTHING`;
  await query(sql, params);
}

// --- Import Status ---
export async function createImportStatus(sessionKey: number) {
  const res = await query(
    "INSERT INTO import_status (session_key, status) VALUES ($1, $2) RETURNING id",
    [sessionKey, "pending"],
  );
  return res.rows[0].id;
}

export async function updateImportStatus(
  id: number,
  status: string,
  stage?: string,
  progress?: number,
  errorMessage?: string,
) {
  const sql = `
    UPDATE import_status SET status = $1, stage = $2, progress = $3, error_message = $4, updated_at = NOW()
    WHERE id = $5
  `;
  await query(sql, [
    status,
    stage || null,
    progress ?? null,
    errorMessage || null,
    id,
  ]);
}

export async function getImportStatus(sessionKey: number) {
  const res = await query(
    "SELECT * FROM import_status WHERE session_key = $1 ORDER BY created_at DESC LIMIT 1",
    [sessionKey],
  );
  return res.rows[0] || null;
}

export async function getLatestImportStatus() {
  const res = await query(
    "SELECT * FROM import_status ORDER BY created_at DESC LIMIT 1",
  );
  return res.rows[0] || null;
}
