import React, { useState, useEffect } from "react";
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
  LinearProgress,
  Chip,
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

// Dark F1 theme for MUI components
const f1Theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f70814" },
    secondary: { main: "#1ca7e3" },
    background: { default: "#0f1115", paper: "#161b22" },
    text: { primary: "#ffffff", secondary: "#9ca3af" },
    divider: "rgba(255,255,255,0.08)",
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#f70814",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.23)",
          },
        },
        notchedOutline: { borderColor: "rgba(255,255,255,0.12)" },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: "#9ca3af" } } },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: "#161b22",
          border: "1px solid rgba(255,255,255,0.08)",
        },
        option: {
          "&[aria-selected='true']": { backgroundColor: "rgba(247,8,20,0.15)" },
          "&.Mui-focused": { backgroundColor: "rgba(255,255,255,0.05)" },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { backgroundColor: "rgba(247,8,20,0.15)" },
        },
      },
    },
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

export default function Onboarding({
  onImportComplete,
  onSelectSession,
}: OnboardingProps) {
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
        const data = await getMeetings(year);
        if (!cancelled) {
          setMeetings(data || []);
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
        const data = await getSessions(selectedMeeting!.meeting_key);
        if (!cancelled) setSessions(data || []);
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
        return <Flag className="text-racing-red-500 h-4 w-4" />;
      case "qualifying":
        return <Timer className="text-mustard-500 h-4 w-4" />;
      default:
        return <Activity className="text-sky-surge-500 h-4 w-4" />;
    }
  };

  return (
    <ThemeProvider theme={f1Theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#0f1115" }}>
        {/* Header */}
        <Box
          component="header"
          sx={{ borderBottom: 1, borderColor: "divider", px: 6, py: 4 }}
        >
          <Box sx={{ mx: "auto", maxWidth: 720, display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                bgcolor: "#c60610",
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 1, fontSize: 14, fontWeight: 700,
              }}
            >
              F1
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              F1 Telemetry Dashboard
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mx: "auto", maxWidth: 720, px: 6, py: 6 }}>
          {/* Import Progress View */}
          {importing && importProgress && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Box sx={{ borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#161b22", p: 5 }}>
                <Loader2 className="text-racing-red-500 mx-auto mb-4 h-12 w-12 animate-spin" />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Importing Session Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  {importProgress.message}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={importProgress.progress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "#1f2937",
                    "& .MuiLinearProgress-bar": { bgcolor: "#f70814", borderRadius: 5 },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {importProgress.progress}%
                </Typography>

                <Box sx={{ mt: 4, textAlign: "left", maxWidth: 400, mx: "auto" }}>
                  {STAGES.map((stage) => {
                    const idx = STAGES.indexOf(stage);
                    const done = idx < currentStageIdx;
                    const active = idx === currentStageIdx;
                    return (
                      <Box key={stage} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
                        {done ? (
                          <CheckCircle className="text-green-400 h-4 w-4" />
                        ) : active ? (
                          <Loader2 className="text-racing-red-400 h-4 w-4 animate-spin" />
                        ) : (
                          <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid #374151" }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: done ? "#4ade80" : active ? "#f93943" : "#6b7280",
                            textTransform: "capitalize",
                          }}
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
              <Box sx={{ textAlign: "center", mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  Welcome to F1 Telemetry
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: "auto" }}>
                  Browse and import Formula 1 session data from the OpenF1 API to build your custom
                  telemetry dashboard.
                </Typography>
              </Box>

              {/* Year dropdown */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="year-label">Year</InputLabel>
                  <Select
                    labelId="year-label"
                    value={year}
                    label="Year"
                    onChange={(e) => setYear(e.target.value as number)}
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* GrandPrix Autocomplete */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <Autocomplete
                  size="medium"
                  sx={{ width: 500 }}
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
                      slotProps={{
                        input: {
                          ...params.slotProps?.input,
                          endAdornment: (
                            <>
                              {loadingMeetings ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.slotProps?.input?.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={key} {...rest}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.country_name || option.meeting_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <FormControl size="medium" sx={{ width: 500 }}>
                  <InputLabel id="session-label">Session</InputLabel>
                  <Select
                    labelId="session-label"
                    value={selectedSession ?? ""}
                    label="Session"
                    disabled={!selectedMeeting}
                    onChange={(e) => setSelectedSession(e.target.value as number)}
                    renderValue={(val) => {
                      const s = sessions.find((s) => s.session_key === val);
                      if (!s) return <Typography color="text.secondary">Select a session</Typography>;
                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getSessionTypeIcon(s.session_type)}
                          <Box>
                            <Typography variant="body2">{s.session_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.session_type} • {new Date(s.date_start).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                  >
                    {loadingSessions ? (
                      <MenuItem disabled>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Loading sessions...
                      </MenuItem>
                    ) : sessions.length === 0 ? (
                      <MenuItem disabled>No sessions found</MenuItem>
                    ) : (
                      sessions.map((s) => (
                        <MenuItem key={s.session_key} value={s.session_key}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getSessionTypeIcon(s.session_type)}
                            <Box>
                              <Typography variant="body2">{s.session_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
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
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 5 }}>
                <Button
                  variant="contained"
                  disabled={!selectedMeeting || !selectedSession}
                  onClick={handleImport}
                  sx={{
                    bgcolor: "#c60610",
                    "&:hover": { bgcolor: "#f70814" },
                    px: 4, py: 1.5, borderRadius: 2,
                    textTransform: "none", fontWeight: 600,
                  }}
                >
                  Import Data
                </Button>
                <Button
                  variant="outlined"
                  disabled={!selectedSession}
                  onClick={() => onSelectSession(selectedSession!)}
                  endIcon={<ChevronRight className="h-4 w-4" />}
                  sx={{
                    borderColor: "#374151", color: "#d1d5db",
                    "&:hover": { borderColor: "#6b7280", bgcolor: "rgba(255,255,255,0.05)" },
                    px: 4, py: 1.5, borderRadius: 2,
                    textTransform: "none", fontWeight: 600,
                  }}
                >
                  Browse (Already Imported)
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
