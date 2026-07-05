import { useState, useEffect } from "react";
import { getMeetings, getSessions, triggerImport, getImportStatus } from "../../api/client";
import { Box, Typography, createTheme, ThemeProvider } from "@mui/material";
import { toast } from "react-toastify";
import { ImportProgress, Meeting, Session } from "../../types/onboardingTypes";
import DataImportUI from "./DataImportUI";
import EventSelectionUI from "./EventSelectionUI";

// Dark F1 theme for MUI components (kept for component-level overrides)
const f1Theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f70814" },
    secondary: { main: "#1ca7e3" },
    background: { default: "#0f1115", paper: "#161b22" },
    text: { primary: "#ffffff", secondary: "#9ca3af" },
    divider: "rgba(255,255,255,0.08)"
  }
});

interface OnboardingProps {
  onImportComplete: (sessionKey: number) => void;
  onSelectSession: (sessionKey: number) => void;
  existingSessionKey: number | null;
}

const Onboarding = ({ onImportComplete, onSelectSession }: OnboardingProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2024);
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
          setSelectedMeeting(null);
          setSessions([]);
          setSelectedSession(null);
        }
      } catch (err: any) {
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
          onImportComplete(selectedSession);
        } else if (progress.status === "error") {
          setImporting(false);
          toast.error(progress.error || "Import failed");
        }
      } catch {
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
      toast.error(err.message || "Failed to start import");
    }
  };

  return (
    <ThemeProvider theme={f1Theme}>
      <Box className="flex h-full w-full flex-col items-center bg-[#0f1115]">
        {/* Header */}
        <Box component="header" className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4">
          <Box className="mx-auto flex max-w-180 items-center gap-3">
            <Box className="bg-racing-red-600 flex h-9 w-9 items-center justify-center rounded text-sm font-bold">
              F1
            </Box>
            <Typography className="text-lg font-bold">F1 Telemetry Dashboard</Typography>
          </Box>
        </Box>

        <Box className="mx-auto max-w-180 px-6 py-6">
          {/* Import Progress View */}
          {importing && importProgress && <DataImportUI importProgress={importProgress} />}

          {/* Selection UI */}
          {!importing && <EventSelectionUI handleImport={handleImport} />}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Onboarding;
