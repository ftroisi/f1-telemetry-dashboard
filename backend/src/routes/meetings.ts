import { Router, Request, Response } from 'express';
import { fetchMeetings, fetchSessions } from '../services/openf1Client';
import { getMeetings, getSessionsByMeeting, upsertMeeting, upsertSession } from '../db/queries';
import { getFormat, sendResponse, serializeMeetings, serializeSessions } from '../proto/serializer';

const router = Router();

// GET /meetings - List available meetings (from OpenF1 for selection, fallback to local)
router.get('/', async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    
    // Try OpenF1 first (for the selection UI)
    let meetings: any[];
    try {
      meetings = await fetchMeetings(year);
      if (!Array.isArray(meetings)) meetings = [meetings];
    } catch {
      // Fallback to local DB if OpenF1 is unavailable (during live sessions)
      meetings = await getMeetings();
      if (year) meetings = meetings.filter((m: any) => m.year === year);
    }
    
    const format = getFormat(req);
    sendResponse(res, meetings, format, serializeMeetings);
  } catch (err: any) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings', message: err.message });
  }
});

// GET /meetings/:meetingKey/sessions
router.get('/:meetingKey/sessions', async (req: Request, res: Response) => {
  try {
    const meetingKey = parseInt(req.params.meetingKey, 10);
    
    let sessions: any[];
    try {
      sessions = await fetchSessions(meetingKey);
      if (!Array.isArray(sessions)) sessions = [sessions];
    } catch {
      sessions = await getSessionsByMeeting(meetingKey);
    }
    
    const format = getFormat(req);
    sendResponse(res, sessions, format, serializeSessions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sessions', message: err.message });
  }
});

// POST /meetings/:meetingKey/sync - Sync meeting to local DB
router.post('/:meetingKey/sync', async (req: Request, res: Response) => {
  try {
    const meetingKey = parseInt(req.params.meetingKey, 10);
    const meetings = await fetchMeetings();
    const meetingList = Array.isArray(meetings) ? meetings : [meetings];
    const meeting = meetingList.find((m: any) => m.meeting_key === meetingKey);
    if (meeting) {
      await upsertMeeting(meeting);
    }
    const sessions = await fetchSessions(meetingKey);
    const sessionList = Array.isArray(sessions) ? sessions : [sessions];
    for (const session of sessionList) {
      await upsertSession(session);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sync meeting', message: err.message });
  }
});

export default router;
