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
  ImportProgress,
  ImportStage,
} from "./openf1Client";
import {
  upsertMeeting,
  upsertSession,
  upsertDriver,
  upsertLap,
  insertCarDataBatch,
  upsertPosition,
  upsertPit,
  insertRaceControlBatch,
  insertLocationBatch,
  createImportStatus,
  updateImportStatus,
  getMeetingByKey,
  getSessionByKey,
} from "../db/queries";

const importJobs = new Map<number, ImportProgress>();

function updateProgress(sessionKey: number, progress: ImportProgress) {
  importJobs.set(sessionKey, progress);
}

export function getProgress(sessionKey: number): ImportProgress | null {
  return importJobs.get(sessionKey) || null;
}

export function getAllProgress(): ImportProgress | null {
  const entries = Array.from(importJobs.entries());
  if (entries.length === 0) return null;
  return entries[entries.length - 1][1];
}

async function fetchWithProgress<T>(
  sessionKey: number,
  stage: ImportStage,
  progressValue: number,
  fetchFn: () => Promise<T>,
  importId?: number,
): Promise<T> {
  updateProgress(sessionKey, {
    status: "running",
    stage,
    progress: progressValue,
    message: `Importing ${stage.replace(/_/g, " ")}...`,
  });
  if (importId) {
    await updateImportStatus(importId, "running", stage, progressValue);
  }
  return fetchFn();
}

export async function startImport(sessionKey: number, meetingKey: number) {
  // Check if already running
  if (
    importJobs.has(sessionKey) &&
    importJobs.get(sessionKey)!.status === "running"
  ) {
    throw new Error("Import already in progress for this session");
  }

  const importId = await createImportStatus(sessionKey);

  // Don't await — run in background
  runImport(sessionKey, meetingKey, importId).catch(async (err) => {
    console.error("Import failed:", err);
    updateProgress(sessionKey, {
      status: "error",
      stage: "error",
      progress: 0,
      message: "Import failed",
      error: err.message,
    });
    await updateImportStatus(importId, "error", "error", 0, err.message);
  });

  return importId;
}

async function runImport(
  sessionKey: number,
  meetingKey: number,
  importId: number,
) {
  console.log(`Starting import for session ${sessionKey}...`);

  // Step 1: Fetch and store meeting
  const meetings = await fetchWithProgress(
    sessionKey,
    "fetching_meeting",
    5,
    () => fetchMeetings(),
    importId,
  );
  const meeting = Array.isArray(meetings)
    ? meetings.find((m: any) => m.meeting_key === meetingKey)
    : meetings;
  if (meeting) {
    await upsertMeeting(meeting);
  }

  // Step 2: Fetch and store sessions
  const sessions = await fetchWithProgress(
    sessionKey,
    "fetching_sessions",
    10,
    () => fetchSessions(meetingKey),
    importId,
  );
  for (const session of Array.isArray(sessions) ? sessions : [sessions]) {
    await upsertSession(session);
  }

  // Step 3: Fetch and store drivers
  const drivers = await fetchWithProgress(
    sessionKey,
    "fetching_drivers",
    15,
    () => fetchDrivers(sessionKey),
    importId,
  );
  const driverList = Array.isArray(drivers) ? drivers : [drivers];
  for (const driver of driverList) {
    await upsertDriver(driver);
  }
  const driverNumbers = driverList.map((d: any) => d.driver_number);

  // Step 4: Fetch and store laps
  let totalLaps = 0;
  for (let i = 0; i < driverNumbers.length; i++) {
    const dn = driverNumbers[i];
    const driverProgress = 15 + ((i + 1) / driverNumbers.length) * 10;
    const laps = await fetchWithProgress(
      sessionKey,
      "fetching_laps",
      Math.round(driverProgress),
      () => fetchLaps(sessionKey, dn),
      importId,
    );
    const lapList = Array.isArray(laps) ? laps : [laps];
    for (const lap of lapList) {
      await upsertLap(lap);
    }
    totalLaps += lapList.length;
  }

  // Step 5: Fetch and store car_data (batch inserts for performance)
  for (let i = 0; i < driverNumbers.length; i++) {
    const dn = driverNumbers[i];
    const driverProgress = 25 + ((i + 1) / driverNumbers.length) * 30;
    const carData = await fetchWithProgress(
      sessionKey,
      "fetching_car_data",
      Math.round(driverProgress),
      () => fetchCarData(sessionKey, dn),
      importId,
    );
    const carDataList = Array.isArray(carData) ? carData : [carData];
    // Batch insert in chunks of 500
    for (let j = 0; j < carDataList.length; j += 500) {
      const batch = carDataList.slice(j, j + 500);
      await insertCarDataBatch(batch);
    }
  }

  // Step 6: Fetch and store positions
  for (let i = 0; i < driverNumbers.length; i++) {
    const dn = driverNumbers[i];
    const driverProgress = 55 + ((i + 1) / driverNumbers.length) * 15;
    const positions = await fetchWithProgress(
      sessionKey,
      "fetching_positions",
      Math.round(driverProgress),
      () => fetchPositions(sessionKey, dn),
      importId,
    );
    const posList = Array.isArray(positions) ? positions : [positions];
    for (const pos of posList) {
      await upsertPosition(pos);
    }
  }

  // Step 7: Fetch and store pit data
  for (let i = 0; i < driverNumbers.length; i++) {
    const dn = driverNumbers[i];
    const driverProgress = 70 + ((i + 1) / driverNumbers.length) * 10;
    const pitData = await fetchWithProgress(
      sessionKey,
      "fetching_pit",
      Math.round(driverProgress),
      () => fetchPit(sessionKey, dn),
      importId,
    );
    const pitList = Array.isArray(pitData) ? pitData : [pitData];
    for (const pit of pitList) {
      await upsertPit(pit);
    }
  }

  // Step 8: Fetch and store race control
  const raceControl = await fetchWithProgress(
    sessionKey,
    "fetching_race_control",
    85,
    () => fetchRaceControl(sessionKey),
    importId,
  );
  const rcList = Array.isArray(raceControl) ? raceControl : [raceControl];
  await insertRaceControlBatch(rcList);

  // Step 9: Fetch and store location data
  // TODO : Currently not working
  // for (let i = 0; i < driverNumbers.length; i++) {
  //   const dn = driverNumbers[i];
  //   const driverProgress = 88 + ((i + 1) / driverNumbers.length) * 10;
  //   const locData = await fetchWithProgress(
  //     sessionKey,
  //     "fetching_location",
  //     Math.round(driverProgress),
  //     () => fetchLocation(sessionKey, dn),
  //     importId,
  //   );
  //   const locList = Array.isArray(locData) ? locData : [locData];
  //   await insertLocationBatch(locList);
  // }

  // Complete
  updateProgress(sessionKey, {
    status: "complete",
    stage: "complete",
    progress: 100,
    message: "Import complete!",
  });
  await updateImportStatus(importId, "complete", "complete", 100);
  console.log(`Import for session ${sessionKey} complete.`);
}
