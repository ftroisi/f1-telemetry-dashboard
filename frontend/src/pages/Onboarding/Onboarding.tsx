import { useState, useEffect } from "react";
import { getMeetings, getSessions, triggerImport, getImportStatus, checkSessionDataExists } from "../../api/client";
import { toast } from "react-toastify";
import { ImportProgress, Meeting, Session } from "../../types/onboardingTypes";
import { OnboardingContext } from "./OnboardingContext";
import DataImportUI from "./DataImportUI";
import EventSelectionUI from "./EventSelectionUI";
import Box from "node_modules/@mui/material/Box/index.mjs";

interface OnboardingProps {
  onImportComplete: (sessionKey: number) => void;
  onSelectSession: (sessionKey: number, meetingName?: string, sessionName?: string, date?: string) => void;
  existingSessionKey: number | null;
}

const Onboarding = ({ onImportComplete, onSelectSession }: OnboardingProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [hidePreSeason, setHidePreSeason] = useState(true);
  const [hideFutureEvents, setHideFutureEvents] = useState(true);
  const [sessionDataExists, setSessionDataExists] = useState<boolean | null>(null);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch meetings when year changes
  useEffect(() => {
    let cancelled = false;
    async function fetchMeetings() {
      setLoadingMeetings(true);
      try {
        const meetingsData = await getMeetings(year);
        if (!cancelled) {
          setMeetings(meetingsData || []);
          setFilteredMeetings(meetingsData || []);
          setSelectedMeeting(null);
          setSessions([]);
          setSelectedSession(null);
        }
      } catch (err: any) {
        console.error("Error fetching meetings:", err);
        if (!cancelled) toast.error(err.message || "Failed to fetch meetings");
      } finally {
        if (!cancelled) setLoadingMeetings(false);
      }
    }
    fetchMeetings();
    return () => {
      cancelled = true;
    };
  }, [year]);

  // Apply filters whenever meetings, hidePreSeason, or hideFutureEvents change
  useEffect(() => {
    let filtered = [...meetings];
    const now = new Date();

    if (hidePreSeason) {
      filtered = filtered.filter((m) => {
        const name = (m.meeting_name || "").toLowerCase();
        return !name.includes("pre-season") && !name.includes("pre season");
      });
    }

    if (hideFutureEvents) {
      filtered = filtered.filter((m) => {
        if (!m.date_end) return false;
        return new Date(m.date_end) <= now;
      });
    }

    setFilteredMeetings(filtered);
  }, [meetings, hidePreSeason, hideFutureEvents]);

  // Fetch sessions when a meeting is selected
  useEffect(() => {
    if (!selectedMeeting) {
      setSessions([]);
      setSelectedSession(null);
      return;
    }
    let cancelled = false;
    async function fetchSessions() {
      setLoadingSessions(true);
      try {
        const sessionsData = await getSessions(selectedMeeting!.meeting_key);
        if (!cancelled) setSessions(sessionsData || []);
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to fetch sessions");
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    }
    fetchSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedMeeting]);

  // Check if session data exists when a session is selected
  useEffect(() => {
    if (!selectedSession) {
      setSessionDataExists(null);
      return;
    }
    let cancelled = false;
    async function checkData() {
      try {
        const result = await checkSessionDataExists(selectedSession!);
        if (!cancelled) setSessionDataExists(result.exists);
      } catch {
        if (!cancelled) setSessionDataExists(null);
      }
    }
    checkData();
    return () => { cancelled = true; };
  }, [selectedSession]);

  // Poll import progress
  useEffect(() => {
    if (!importing || !selectedSession) return;
    const interval = setInterval(async () => {
      try {
        const progress = await getImportStatus(selectedSession);
        setImportProgress(progress);
       if (progress.status === "complete") {
         setImporting(false);
         toast.success("Import complete!");
          // Store event info
          const s = sessions.find((s) => s.session_key === selectedSession);
          const m = selectedMeeting;
          if (m) {
            const meetingName = `${m.meeting_name || m.country_name} — ${m.circuit_short_name || m.location || ""}`;
            sessionStorage.setItem("active-meeting-name", meetingName);
          }
          if (s) {
            sessionStorage.setItem("active-session-name", s.session_name);
            sessionStorage.setItem("active-session-date", s.date_start);
          }
          onImportComplete(selectedSession!);
        } else if (progress.status === "error") {
          setImporting(false);
          console.error("Import error:", progress.error);
          toast.error(progress.error || "Import failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
        // ignore polling errors
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [importing, selectedSession, onImportComplete]);

  const handleImport = async () => {
    if (!selectedMeeting || !selectedSession) return;
    setImporting(true);
    setImportProgress({
      status: "running",
      stage: "fetching_meeting",
      progress: 0,
      message: "Starting import..."
    });
    try {
      await triggerImport(selectedSession, selectedMeeting!.meeting_key);
    } catch (err: any) {
      setImporting(false);
      console.error("Error starting import:", err);
      toast.error(err.message || "Failed to start import");
    }
  };

  const contextValue = {
    meetings,
    filteredMeetings,
    sessions,
    selectedMeeting,
    selectedSession,
    year,
    hidePreSeason,
    hideFutureEvents,
    sessionDataExists,
    loadingMeetings,
    loadingSessions,
    importProgress,
    importing,
    setSelectedMeeting,
    setSelectedSession,
    setYear,
    setHidePreSeason,
    setHideFutureEvents,
    handleImport,
    onSelectSession
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      <Box className="flex h-full w-full flex-col items-center justify-center mt-4">
        {importing && importProgress ? <DataImportUI /> : <EventSelectionUI />}
      </Box>
    </OnboardingContext.Provider>
  );
};

export default Onboarding;
