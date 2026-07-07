import { Router, Request, Response } from "express";
import {
  getDrivers,
  getLaps,
  getCarData,
  getPositions,
  getPitData,
  getLocationData,
  getSessionDataExists,
  getImportedEvents,
  getEventInfoBySession,
  deleteSessionData,
} from "../db/queries";
import {
  getFormat,
  sendResponse,
  serializeDrivers,
  serializeLaps,
  serializeCarData,
  serializePositions,
  serializePit,
} from "../proto/serializer";

const router: import("express").Router = Router();


// GET /sessions/imported-events - List events that have been imported into the DB
router.get("/imported-events", async (req: Request, res: Response) => {
  try {
    const events = await getImportedEvents();
    res.json(events);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch imported events", message: err.message });
  }
});

// GET /sessions/:sessionKey/event-info - Get meeting/event info for a session
router.get("/:sessionKey/event-info", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const info = await getEventInfoBySession(sessionKey);
    if (!info) {
      return res.status(404).json({ error: "Event info not found for session" });
    }
    res.json(info);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch event info", message: err.message });
  }
});

// GET /sessions/:sessionKey/drivers
router.get("/:sessionKey/drivers", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const drivers = await getDrivers(sessionKey);
    const format = getFormat(req);
    sendResponse(res, drivers, format, serializeDrivers);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch drivers", message: err.message });
  }
});

// GET /sessions/:sessionKey/exists - Check if session data is imported
router.get("/:sessionKey/exists", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const exists = await getSessionDataExists(sessionKey);
    res.json({ exists, session_key: sessionKey });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to check session data", message: err.message });
  }
});

// GET /sessions/:sessionKey/laps
router.get("/:sessionKey/laps", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const driverNumber = req.query.driver_number
      ? parseInt(String(req.query.driver_number), 10)
      : undefined;
    const laps = await getLaps(sessionKey, driverNumber);
    const format = getFormat(req);
    sendResponse(res, laps, format, serializeLaps);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch laps", message: err.message });
  }
});

// GET /sessions/:sessionKey/car-data
router.get("/:sessionKey/car-data", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const driverNumber = req.query.driver_number
      ? parseInt(String(req.query.driver_number), 10)
      : undefined;
    const minDate = req.query.min_date as string | undefined;
    const maxDate = req.query.max_date as string | undefined;
    const carData = await getCarData(
      sessionKey,
      driverNumber,
      minDate,
      maxDate,
    );
    const format = getFormat(req);
    sendResponse(res, carData, format, serializeCarData);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch car data", message: err.message });
  }
});

// GET /sessions/:sessionKey/positions
router.get("/:sessionKey/positions", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const driverNumber = req.query.driver_number
      ? parseInt(String(req.query.driver_number), 10)
      : undefined;
    const positions = await getPositions(sessionKey, driverNumber);
    const format = getFormat(req);
    sendResponse(res, positions, format, serializePositions);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch positions", message: err.message });
  }
});

// GET /sessions/:sessionKey/pit
router.get("/:sessionKey/pit", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const driverNumber = req.query.driver_number
      ? parseInt(String(req.query.driver_number), 10)
      : undefined;
    const pit = await getPitData(sessionKey, driverNumber);
    const format = getFormat(req);
    sendResponse(res, pit, format, serializePit);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch pit data", message: err.message });
  }
});

// GET /sessions/:sessionKey/location
router.get("/:sessionKey/location", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    const driverNumber = req.query.driver_number
      ? parseInt(String(req.query.driver_number), 10)
      : undefined;
    const location = await getLocationData(sessionKey, driverNumber);
    const format = getFormat(req);
    res.json(location);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch location data", message: err.message });
  }
});


// DELETE /sessions/:sessionKey - Delete all data for a session
router.delete("/:sessionKey", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(String(req.params.sessionKey), 10);
    await deleteSessionData(sessionKey);
    res.json({ success: true, session_key: sessionKey });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to delete session", message: err.message });
  }
});


export default router;
