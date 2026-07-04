import React, { useState, useEffect } from 'react';
import { getMeetings, getSessions, triggerImport, getImportStatus, Meeting, Session, ImportProgress } from '../api/client';
import { Activity, Flag, Timer, ChevronRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onImportComplete: (sessionKey: number) => void;
  onSelectSession: (sessionKey: number) => void;
  existingSessionKey: number | null;
}

export default function Onboarding({ onImportComplete, onSelectSession, existingSessionKey }: OnboardingProps) {
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
        setError(err.message || 'Failed to fetch meetings');
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
        setError(err.message || 'Failed to fetch sessions');
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
        
        if (progress.status === 'complete') {
          setImporting(false);
          onImportComplete(selectedSession!);
        } else if (progress.status === 'error') {
          setImporting(false);
          setError(progress.error || 'Import failed');
        }
      } catch {}
    }, 1000);
    
    return () => clearInterval(interval);
  }, [importing, selectedSession, onImportComplete]);

  const handleImport = async () => {
    if (!selectedMeeting || !selectedSession) return;
    setImporting(true);
    setError(null);
    setImportProgress({ status: 'running', stage: 'starting', progress: 0, message: 'Starting import...' });
    
    try {
      await triggerImport(selectedSession, selectedMeeting);
    } catch (err: any) {
      setImporting(false);
      setError(err.message || 'Failed to start import');
    }
  };

  const handleBrowseExisting = () => {
    if (!selectedSession) return;
    onSelectSession(selectedSession);
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'race': return <Flag className="w-4 h-4 text-racing-red-500" />;
      case 'qualifying': return <Timer className="w-4 h-4 text-mustard-500" />;
      default: return <Activity className="w-4 h-4 text-sky-surge-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-racing-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
            F1
          </div>
          <h1 className="text-xl font-bold">F1 Telemetry Dashboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Import Progress View */}
        {importing && importProgress && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 text-center">
              <Loader2 className="w-12 h-12 text-racing-red-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Importing Session Data</h2>
              <p className="text-gray-400 mb-6">{importProgress.message}</p>
              
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div
                  className="bg-racing-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${importProgress.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{importProgress.progress}%</p>
              
              <div className="mt-6 space-y-2 text-left">
                {[
                  'fetching_meeting', 'fetching_sessions', 'fetching_drivers',
                  'fetching_laps', 'fetching_car_data', 'fetching_positions',
                  'fetching_pit', 'fetching_race_control', 'fetching_location'
                ].map((stage) => {
                  const stageIdx = ['fetching_meeting', 'fetching_sessions', 'fetching_drivers',
                    'fetching_laps', 'fetching_car_data', 'fetching_positions',
                    'fetching_pit', 'fetching_race_control', 'fetching_location'
                  ].indexOf(stage);
                  const currentIdx = ['fetching_meeting', 'fetching_sessions', 'fetching_drivers',
                    'fetching_laps', 'fetching_car_data', 'fetching_positions',
                    'fetching_pit', 'fetching_race_control', 'fetching_location'
                  ].indexOf(importProgress.stage);
                  const done = stageIdx < currentIdx;
                  const active = stageIdx === currentIdx;
                  
                  return (
                    <div key={stage} className={`flex items-center gap-3 text-sm ${done ? 'text-green-400' : active ? 'text-racing-red-400' : 'text-gray-600'}`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-gray-700" />}
                      <span>{stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-900/30 border border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Selection UI */}
        {!importing && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Welcome to F1 Telemetry</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Browse and import Formula 1 session data from the OpenF1 API to build your custom telemetry dashboard.
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex justify-center gap-2 mb-8">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    year === y
                      ? 'bg-racing-red-600 text-white'
                      : 'bg-[#161b22] text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meetings List */}
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Grand Prix</h3>
                {loading && meetings.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-racing-red-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {meetings.map((m) => (
                      <button
                        key={m.meeting_key}
                        onClick={() => setSelectedMeeting(m.meeting_key)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                          selectedMeeting === m.meeting_key
                            ? 'bg-racing-red-600/20 border border-racing-red-600/50 text-white'
                            : 'hover:bg-gray-800 text-gray-300 border border-transparent'
                        }`}
                      >
                        <div className="font-medium">{m.country_name || m.meeting_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.circuit_short_name || m.location}</div>
                      </button>
                    ))}
                    {meetings.length === 0 && !loading && (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No meetings found for {year}. The API may be restricted during live sessions.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sessions List */}
              <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sessions</h3>
                {!selectedMeeting ? (
                  <p className="text-gray-500 text-sm text-center py-12">Select a Grand Prix first</p>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {sessions.map((s) => (
                      <button
                        key={s.session_key}
                        onClick={() => setSelectedSession(s.session_key)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                          selectedSession === s.session_key
                            ? 'bg-racing-red-600/20 border border-racing-red-600/50 text-white'
                            : 'hover:bg-gray-800 text-gray-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getSessionTypeIcon(s.session_type)}
                          <span className="font-medium">{s.session_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {s.session_type} • {new Date(s.date_start).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                    {sessions.length === 0 && !loading && (
                      <p className="text-gray-500 text-sm text-center py-8">No sessions found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={handleImport}
                disabled={!selectedMeeting || !selectedSession}
                className="px-8 py-3 bg-racing-red-600 hover:bg-racing-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                Import Data
              </button>
              <button
                onClick={handleBrowseExisting}
                disabled={!selectedSession}
                className="px-8 py-3 bg-[#161b22] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all border border-gray-700 flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Browse (Already Imported)
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
