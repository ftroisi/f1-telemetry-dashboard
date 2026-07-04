-- F1 Telemetry Dashboard - Database Schema
-- PostgreSQL initialization script

CREATE TABLE IF NOT EXISTS meetings (
    meeting_key INTEGER PRIMARY KEY,
    year INTEGER NOT NULL,
    country_name VARCHAR(100),
    circuit_short_name VARCHAR(100),
    date_start TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    meeting_name VARCHAR(200),
    meeting_official_name VARCHAR(300),
    location VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS sessions (
    session_key INTEGER PRIMARY KEY,
    meeting_key INTEGER NOT NULL REFERENCES meetings(meeting_key),
    session_name VARCHAR(200),
    session_type VARCHAR(50),
    date_start TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    year INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_meeting_key ON sessions(meeting_key);

CREATE TABLE IF NOT EXISTS drivers (
    session_key INTEGER NOT NULL REFERENCES sessions(session_key),
    driver_number INTEGER NOT NULL,
    full_name VARCHAR(200),
    name_acronym VARCHAR(10),
    team_name VARCHAR(200),
    team_colour VARCHAR(10),
    headshot_url VARCHAR(500),
    country_code VARCHAR(10),
    PRIMARY KEY (session_key, driver_number)
);
CREATE INDEX IF NOT EXISTS idx_drivers_session_key ON drivers(session_key);

CREATE TABLE IF NOT EXISTS laps (
    session_key INTEGER NOT NULL,
    driver_number INTEGER NOT NULL,
    lap_number INTEGER NOT NULL,
    lap_duration DOUBLE PRECISION,
    duration_sector_1 DOUBLE PRECISION,
    duration_sector_2 DOUBLE PRECISION,
    duration_sector_3 DOUBLE PRECISION,
    i1_speed DOUBLE PRECISION,
    i2_speed DOUBLE PRECISION,
    st_speed DOUBLE PRECISION,
    is_pit_out_lap BOOLEAN DEFAULT FALSE,
    segment_1 INTEGER,
    segment_2 INTEGER,
    segment_3 INTEGER,
    date_start TIMESTAMPTZ,
    lap_start_time TIMESTAMPTZ,
    PRIMARY KEY (session_key, driver_number, lap_number)
);
CREATE INDEX IF NOT EXISTS idx_laps_session_driver ON laps(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_laps_session ON laps(session_key);

CREATE TABLE IF NOT EXISTS car_data (
    id BIGSERIAL,
    session_key INTEGER NOT NULL,
    driver_number INTEGER NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    speed DOUBLE PRECISION,
    throttle DOUBLE PRECISION,
    brake DOUBLE PRECISION,
    rpm INTEGER,
    n_gear INTEGER,
    drs INTEGER
);
ALTER TABLE car_data ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_car_data_unique ON car_data(session_key, driver_number, date);
CREATE INDEX IF NOT EXISTS idx_car_data_session_driver_date ON car_data(session_key, driver_number, date);
CREATE INDEX IF NOT EXISTS idx_car_data_session ON car_data(session_key);

CREATE TABLE IF NOT EXISTS positions (
    session_key INTEGER NOT NULL,
    driver_number INTEGER NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    position INTEGER,
    PRIMARY KEY (session_key, driver_number, date)
);
CREATE INDEX IF NOT EXISTS idx_positions_session_driver ON positions(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_positions_session ON positions(session_key);

CREATE TABLE IF NOT EXISTS pit (
    session_key INTEGER NOT NULL,
    driver_number INTEGER NOT NULL,
    lap_number INTEGER NOT NULL,
    pit_duration DOUBLE PRECISION,
    stop_duration DOUBLE PRECISION,
    date TIMESTAMPTZ,
    PRIMARY KEY (session_key, driver_number, lap_number)
);
CREATE INDEX IF NOT EXISTS idx_pit_session_driver ON pit(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_pit_session ON pit(session_key);

CREATE TABLE IF NOT EXISTS race_control (
    id BIGSERIAL,
    session_key INTEGER NOT NULL,
    category VARCHAR(50),
    flag VARCHAR(20),
    message TEXT,
    date TIMESTAMPTZ NOT NULL,
    driver_number INTEGER,
    lap_number INTEGER
);
ALTER TABLE race_control ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_race_control_unique ON race_control(session_key, date, driver_number, category);
CREATE INDEX IF NOT EXISTS idx_race_control_session ON race_control(session_key);
CREATE INDEX IF NOT EXISTS idx_race_control_session_driver ON race_control(session_key, driver_number);

CREATE TABLE IF NOT EXISTS location (
    id BIGSERIAL,
    session_key INTEGER NOT NULL,
    driver_number INTEGER NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    z DOUBLE PRECISION
);
ALTER TABLE location ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_unique ON location(session_key, driver_number, date);
CREATE INDEX IF NOT EXISTS idx_location_session_driver_date ON location(session_key, driver_number, date);
CREATE INDEX IF NOT EXISTS idx_location_session ON location(session_key);

-- Import tracking table
CREATE TABLE IF NOT EXISTS import_status (
    id SERIAL PRIMARY KEY,
    session_key INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    stage VARCHAR(100),
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_status_session ON import_status(session_key);
