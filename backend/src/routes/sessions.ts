import { Router, Request, Response } from "express";
import {
  getDrivers,
  getLaps,
  getCarData,
  getPositions,
  getPitData,
  getLocationData,
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

const router = Router();

// GET /sessions/:sessionKey/drivers
router.get("/:sessionKey/drivers", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const drivers = await getDrivers(sessionKey);
    const format = getFormat(req);
    sendResponse(res, drivers, format, serializeDrivers);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch drivers", message: err.message });
  }
});

// GET /sessions/:sessionKey/laps
router.get("/:sessionKey/laps", async (req: Request, res: Response) => {
  try {
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const driverNumber = req.query.driver_number
      ? parseInt(req.query.driver_number as string, 10)
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
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const driverNumber = req.query.driver_number
      ? parseInt(req.query.driver_number as string, 10)
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
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const driverNumber = req.query.driver_number
      ? parseInt(req.query.driver_number as string, 10)
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
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const driverNumber = req.query.driver_number
      ? parseInt(req.query.driver_number as string, 10)
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
    const sessionKey = parseInt(req.params.sessionKey, 10);
    const driverNumber = req.query.driver_number
      ? parseInt(req.query.driver_number as string, 10)
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

export default router;
