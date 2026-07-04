import { Router, Request, Response } from "express";
import { startImport, getProgress, getAllProgress } from "../services/importer";
import {
  getFormat,
  sendResponse,
  serializeImportStatus,
} from "../proto/serializer";

const router: import("express").Router = Router();

// POST /import - Trigger import for a given session
router.post("/", async (req: Request, res: Response) => {
  try {
    const { session_key, meeting_key } = req.body;

    if (!session_key || !meeting_key) {
      return res
        .status(400)
        .json({ error: "session_key and meeting_key are required" });
    }

    const importId = await startImport(
      parseInt(session_key, 10),
      parseInt(meeting_key, 10),
    );
    res.json({ import_id: importId, status: "started" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to start import", message: err.message });
  }
});

// GET /import/status - Poll import progress
router.get("/status", async (req: Request, res: Response) => {
  try {
    const sessionKey = req.query.session_key
      ? parseInt(String(req.query.session_key), 10)
      : undefined;

    let progress;
    if (sessionKey) {
      progress = getProgress(sessionKey);
    } else {
      progress = getAllProgress();
    }

    if (!progress) {
      return res.json({
        status: "idle",
        stage: "",
        progress: 0,
        message: "No import in progress",
      });
    }

    const format = getFormat(req);
    sendResponse(res, progress, format, serializeImportStatus);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to get import status", message: err.message });
  }
});

export default router;
