import { useState, useEffect } from "react";
import {
  getMeetings,
  getSessions,
  triggerImport,
  getImportStatus,
  Meeting,
  Session,
  ImportProgress
} from "../api/client";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Button,
  CircularProgress,
  createTheme,
  ThemeProvider
} from "@mui/material";
import { toast } from "react-toastify";
import {
  Activity,
  Flag,
  Timer,
  ChevronRight,
  CheckCircle,
  Loader2
} from "lucide-react";

// Dark F1 theme for MUI components (kept for component-level overrides)
const f1Theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f70814" },
    secondary: { main: "#1ca7e3" },
    background: { default: "#0f1115", paper: "#161b22" },
    text: { primary: "#ffffff", secondary: "#9ca3af" },
    divider: "rgba(255,255,255,0.08)",
  },
});

interface OnboardingProps {
  onImportComplete: (sessionKey: number) => void;
  onSelectSession: (sessionKey: number) => void;
  existingSessionKey: number | null;
}

const STAGES = [
  "fetching_meeting",
  "fetching_sessions",
  "fetching_drivers",
  "fetching_laps",
  "fetching_car_data",
  "fetching_positions",
  "fetching_pit",
  "fetching_race_control",
  "fetching_location",
] as const;

const Onboarding = ({
  onImportComplete,
  onSelectSession,
}: OnboardingProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importing, setImporting] = useState(false);

  const years = [2023, 2024, 2025, 2026] as const;

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
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
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
      message: "Starting import...",
    });
    try {
      await triggerImport(selectedSession, selectedMeeting!.meeting_key);
    } catch (err: any) {
      setImporting(false);
      toast.error(err.message || "Failed to start import");
    }
  };

  const currentStageIdx = importProgress
    ? STAGES.indexOf(importProgress.stage as any)
    : -1;

  const getSessionTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "race":
        return <Flag className="h-4 w-4 shrink-0 text-racing-red-500" />;
      case "qualifying":
        return <Timer className="h-4 w-4 shrink-0 text-mustard-500" />;
      default:
        return <Activity className="h-4 w-4 shrink-0 text-sky-surge-500" />;
    }
  };

  return (
    <ThemeProvider theme={f1Theme}>
      <Box className="h-full w-full flex flex-col items-center justify-center bg-[#0f1115]">
        {/* Header */}
        <Box component="header" className="border-b border-[rgba(255,255,255,0.08)] px-6 py-4">
          <Box className="mx-auto flex max-w-180 items-center gap-3">
            <Box className="flex h-9 w-9 items-center justify-center rounded bg-racing-red-600 text-sm font-bold">
              F1
            </Box>
            <Typography className="text-lg font-bold">F1 Telemetry Dashboard</Typography>
          </Box>
        </Box>

        <Box className="mx-auto max-w-180 px-6 py-6">
          {/* Import Progress View */}
          {importing && importProgress && (
            <Box className="mt-4 text-center">
              <Box className="flex flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161b22] p-6">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-racing-red-500" />
                <Typography className="mb-1 text-xl font-bold">
                  Importing Session Data
                </Typography>
                <Typography className="mb-4 text-sm text-gray-400">
                  {importProgress.message}
                </Typography>

                {/* Custom progress bar */}
                <Box className="h-2.5 w-full overflow-hidden rounded-full bg-gray-700">
                  <Box
                    className="h-full rounded-full bg-racing-red-500 transition-all duration-300"
                    style={{ width: `${importProgress.progress}%` }}
                  />
                </Box>
                <Typography className="mt-1 text-xs text-gray-400">
                  {importProgress.progress}%
                </Typography>

                <Box className="mx-auto mt-4 max-w-100 text-left">
                  {STAGES.map((stage) => {
                    const idx = STAGES.indexOf(stage);
                    const done = idx < currentStageIdx;
                    const active = idx === currentStageIdx;
                    return (
                      <Box key={stage} className="flex items-center gap-1.5 py-0.5">
                        {done ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-racing-red-400" />
                        ) : (
                          <Box className="h-4 w-4 shrink-0 rounded-full border border-gray-600" />
                        )}
                        <Typography
                          className={`text-sm capitalize ${
                            done ? "text-green-400" : active ? "text-racing-red-400" : "text-gray-500"
                          }`}
                        >
                          {stage.replace(/_/g, " ")}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Selection UI */}
          {!importing && (
            <>
              <Box className="mb-6 text-center">
                <Typography className="mb-1 text-3xl font-bold">
                  Welcome to F1 Telemetry
                </Typography>
                <Typography className="mx-auto max-w-125 text-gray-400">
                  Browse and import Formula 1 session data from the OpenF1 API to build your custom
                  telemetry dashboard.
                </Typography>
              </Box>

              {/* Year dropdown */}
              <Box className="mb-4 flex justify-center">
                <FormControl className="w-40">
                  <InputLabel id="year-label">Year</InputLabel>
                  <Select
                    labelId="year-label"
                    value={year}
                    label="Year"
                    onChange={(e) => setYear(e.target.value as number)}
                    className="rounded-lg"
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* GrandPrix Autocomplete */}
              <Box className="mb-4 flex justify-center">
                <Autocomplete
                  className="w-125 max-w-full"
                  value={selectedMeeting}
                  onChange={(_, newVal) => setSelectedMeeting(newVal)}
                  options={meetings}
                  loading={loadingMeetings}
                  getOptionLabel={(m) =>
                    `${m.country_name || m.meeting_name || ""} — ${m.circuit_short_name || m.location || ""}`
                  }
                  isOptionEqualToValue={(a, b) => a.meeting_key === b.meeting_key}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Grand Prix"
                      placeholder="Search for a Grand Prix..."
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={option.meeting_key} {...rest}>
                        <Box>
                          <Typography className="text-sm font-semibold">
                            {option.country_name || option.meeting_name}
                          </Typography>
                          <Typography className="text-xs text-gray-500">
                            {option.circuit_short_name || option.location}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText="No Grands Prix found"
                />
              </Box>

              {/* Sessions dropdown */}
              <Box className="mb-4 flex justify-center">
                <FormControl className="w-125 max-w-full">
                  <InputLabel id="session-label">Session</InputLabel>
                  <Select
                    labelId="session-label"
                    value={selectedSession ?? ""}
                    label="Session"
                    disabled={!selectedMeeting}
                    onChange={(e) => setSelectedSession(e.target.value as number)}
                    renderValue={(val) => {
                      const s = sessions.find((s) => s.session_key === val);
                      if (!s) return <Typography className="text-gray-500">Select a session</Typography>;
                      return (
                        <Box className="flex items-center gap-2">
                          {getSessionTypeIcon(s.session_type)}
                          <Box>
                            <Typography className="text-sm">{s.session_name}</Typography>
                            <Typography className="text-xs text-gray-500">
                              {s.session_type} • {new Date(s.date_start).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                  >
                    {loadingSessions ? (
                      <MenuItem disabled>
                        <CircularProgress className="mr-1 h-4 w-4" />
                        Loading sessions...
                      </MenuItem>
                    ) : sessions.length === 0 ? (
                      <MenuItem disabled>No sessions found</MenuItem>
                    ) : (
                      sessions.map((s) => (
                        <MenuItem key={s.session_key} value={s.session_key}>
                          <Box className="flex items-center gap-2">
                            {getSessionTypeIcon(s.session_type)}
                            <Box>
                              <Typography className="text-sm">{s.session_name}</Typography>
                              <Typography className="text-xs text-gray-500">
                                {s.session_type} • {new Date(s.date_start).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>

              {/* Action Buttons */}
              <Box className="mt-5 flex justify-center gap-3">
                <Button
                  variant="contained"
                  disabled={!selectedMeeting || !selectedSession}
                  onClick={handleImport}
                  className="cursor-pointer rounded-lg bg-racing-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-racing-red-500 disabled:opacity-50"
                >
                  Import Data
                </Button>
                <Button
                  variant="outlined"
                  disabled={!selectedSession}
                  onClick={() => onSelectSession(selectedSession!)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-500 disabled:opacity-50"
                >
                  Browse (Already Imported) <ChevronRight className="h-4 w-4" />
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default Onboarding;
