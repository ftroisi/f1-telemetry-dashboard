import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { Activity, ChevronRight, Flag, Timer } from "lucide-react";
import { useOnboardingContext } from "./OnboardingContext";

const EventSelectionUI = () => {
  const {
    meetings,
    sessions,
    selectedMeeting,
    selectedSession,
    year,
    loadingMeetings,
    loadingSessions,
    setSelectedMeeting,
    setSelectedSession,
    setYear,
    handleImport,
    onSelectSession
  } = useOnboardingContext();

  const years = [2023, 2024, 2025, 2026] as const;

  const getSessionTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "race":
        return <Flag className="text-racing-red-500 h-4 w-4 shrink-0" />;
      case "qualifying":
        return <Timer className="text-mustard-500 h-4 w-4 shrink-0" />;
      default:
        return <Activity className="text-sky-surge-500 h-4 w-4 shrink-0" />;
    }
  };

  return (
    <Box className="mx-auto max-w-180 px-6 py-6">
      <Box className="mb-6 text-center">
        <Typography className="mb-1 !text-3xl !font-bold">Welcome to F1 Telemetry</Typography>
        <Typography className="mx-auto max-w-125 !text-gray-400">
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
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
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
            <TextField {...params} label="Grand Prix" placeholder="Search for a Grand Prix..." />
          )}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={option.meeting_key} {...rest}>
                <Box>
                  <Typography className="!text-sm !font-semibold">
                    {option.country_name || option.meeting_name}
                  </Typography>
                  <Typography className="!text-xs !text-gray-500">
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
              if (!s) return <Typography className="!text-gray-500">Select a session</Typography>;
              return (
                <Box className="flex items-center gap-2">
                  {getSessionTypeIcon(s.session_type)}
                  <Box>
                    <Typography className="!text-sm">{s.session_name}</Typography>
                    <Typography className="!text-xs !text-gray-500">
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
                      <Typography className="!text-sm">{s.session_name}</Typography>
                      <Typography className="!text-xs !text-gray-500">
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
          className="bg-racing-red-600 hover:bg-racing-red-500 cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
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
    </Box>
  );
};

export default EventSelectionUI;
