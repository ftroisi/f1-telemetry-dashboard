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
  Activity,
  Flag,
  Timer,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface OnboardingProps {
  onImportComplete: (sessionKey: number) => void;
  onSelectSession: (sessionKey: number) => void;
  existingSessionKey: number | null;
}

export default function Onboarding({
  onImportComplete,
  onSelectSession,
  existingSessionKey
}: OnboardingProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importing, setImporting] = useState(false);
  const [dataCheckDone, setDataCheckDone] = useState(false);

  const years = [2023, 2024, 2025, 2026];

  // Fetch meetings when year changes
  useEffect(() => {
    async function fetchMeetings() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMeetings(year);
        setMeetings(data || []);
        setSelectedMeeting(null);
        setSessions([]);
      } catch (err: any) {
        setError(err.message || "Failed to fetch meetings");
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, [year]);

  // Fetch sessions when a meeting is selected
  useEffect(() => {
    if (selectedMeeting === null) {
      setSessions([]);
      return;
    }
    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSessions(selectedMeeting!);
        setSessions(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions().catch(() => {});
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
          onImportComplete(selectedSession!);
        } else if (progress.status === "error") {
          setImporting(false);
          setError(progress.error || "Import failed");
        }
      } catch {}
    }, 1000);

    return () => clearInterval(interval);
  }, [importing, selectedSession, onImportComplete]);

  const handleImport = async () => {
    if (!selectedMeeting || !selectedSession) return;
    setImporting(true);
    setError(null);
    setImportProgress({
      status: "running",
      stage: "starting",
      progress: 0,
      message: "Starting import..."
    });

    try {
      await triggerImport(selectedSession, selectedMeeting);
    } catch (err: any) {
      setImporting(false);
      setError(err.message || "Failed to start import");
    }
  };

  const handleBrowseExisting = () => {
    if (!selectedSession) return;
    onSelectSession(selectedSession);
  };

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
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="bg-racing-red-600 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
            F1
          </div>
          <h1 className="text-xl font-bold">F1 Telemetry Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Import Progress View */}
        {importing && importProgress && (
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="rounded-xl border border-gray-800 bg-[#161b22] p-8 text-center">
              <Loader2 className="text-racing-red-500 mx-auto mb-4 h-12 w-12 animate-spin" />
              <h2 className="mb-2 text-2xl font-bold">Importing Session Data</h2>
              <p className="mb-6 text-gray-400">{importProgress.message}</p>

              <div className="mb-2 h-3 w-full rounded-full bg-gray-800">
                <div
                  className="bg-racing-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${importProgress.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{importProgress.progress}%</p>

              <div className="mt-6 space-y-2 text-left">
                {[
                  "fetching_meeting",
                  "fetching_sessions",
                  "fetching_drivers",
                  "fetching_laps",
                  "fetching_car_data",
                  "fetching_positions",
                  "fetching_pit",
                  "fetching_race_control",
                  "fetching_location"
                ].map((stage) => {
                  const stageIdx = [
                    "fetching_meeting",
                    "fetching_sessions",
                    "fetching_drivers",
                    "fetching_laps",
                    "fetching_car_data",
                    "fetching_positions",
                    "fetching_pit",
                    "fetching_race_control",
                    "fetching_location"
                  ].indexOf(stage);
                  const currentIdx = [
                    "fetching_meeting",
                    "fetching_sessions",
                    "fetching_drivers",
                    "fetching_laps",
                    "fetching_car_data",
                    "fetching_positions",
                    "fetching_pit",
                    "fetching_race_control",
                    "fetching_location"
                  ].indexOf(importProgress.stage);
                  const done = stageIdx < currentIdx;
                  const active = stageIdx === currentIdx;

                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 text-sm ${done ? "text-green-400" : active ? "text-racing-red-400" : "text-gray-600"}`}
                    >
                      {done ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-700" />
                      )}
                      <span>
                        {stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-auto mb-6 flex max-w-2xl items-start gap-3 rounded-lg border border-red-800 bg-red-900/30 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Selection UI */}
        {!importing && (
          <>
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-3xl font-bold">Welcome to F1 Telemetry</h2>
              <p className="mx-auto max-w-xl text-gray-400">
                Browse and import Formula 1 session data from the OpenF1 API to build your custom
                telemetry dashboard.
              </p>
            </div>

            {/* Year Selector */}
            <div className="mb-8 flex justify-center gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                    year === y
                      ? "bg-racing-red-600 text-white"
                      : "border border-gray-800 bg-[#161b22] text-gray-400 hover:text-white"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Meetings List */}
              <div className="rounded-xl border border-gray-800 bg-[#161b22] p-5">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">
                  Grand Prix
                </h3>
                {loading && meetings.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-racing-red-500 h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {meetings.map((m) => (
                      <button
                        key={m.meeting_key}
                        onClick={() => setSelectedMeeting(m.meeting_key)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                          selectedMeeting === m.meeting_key
                            ? "bg-racing-red-600/20 border-racing-red-600/50 border text-white"
                            : "border border-transparent text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        <div className="font-medium">{m.country_name || m.meeting_name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {m.circuit_short_name || m.location}
                        </div>
                      </button>
                    ))}
                    {meetings.length === 0 && !loading && (
                      <p className="py-8 text-center text-sm text-gray-500">
                        No meetings found for {year}. The API may be restricted during live
                        sessions.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sessions List */}
              <div className="rounded-xl border border-gray-800 bg-[#161b22] p-5">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">
                  Sessions
                </h3>
                {!selectedMeeting ? (
                  <p className="py-12 text-center text-sm text-gray-500">
                    Select a Grand Prix first
                  </p>
                ) : (
                  <div className="max-h-96 space-y-1 overflow-y-auto">
                    {sessions.map((s) => (
                      <button
                        key={s.session_key}
                        onClick={() => setSelectedSession(s.session_key)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                          selectedSession === s.session_key
                            ? "bg-racing-red-600/20 border-racing-red-600/50 border text-white"
                            : "border border-transparent text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getSessionTypeIcon(s.session_type)}
                          <span className="font-medium">{s.session_name}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {s.session_type} • {new Date(s.date_start).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                    {sessions.length === 0 && !loading && (
                      <p className="py-8 text-center text-sm text-gray-500">No sessions found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleImport}
                disabled={!selectedMeeting || !selectedSession}
                className="bg-racing-red-600 hover:bg-racing-red-500 flex items-center gap-2 rounded-lg px-8 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Loader2 className="h-4 w-4" />
                Import Data
              </button>
              <button
                onClick={handleBrowseExisting}
                disabled={!selectedSession}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#161b22] px-8 py-3 font-medium transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
                Browse (Already Imported)
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
