import { useState, useEffect, Suspense, useCallback } from "react";
import safeLazyImport from "./safeLazyImport";
import { LayoutProvider } from "./components/layout/LayoutContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { checkHealth } from "./api/client";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "node_modules/@mui/material/styles/index.mjs";

// Lazy imports of global components
const Navbar = safeLazyImport(() => import("components/layout/Navbar"));
const Footer = safeLazyImport(() => import("components/layout/Footer"));
const Onboarding = safeLazyImport(() => import("pages/Onboarding/Onboarding"));
const Dashboard = safeLazyImport(() => import("pages/Dashboard/Dashboard"));

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

function App() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(() => {
    const stored = sessionStorage.getItem("active-session-key");
    return stored ? parseInt(stored, 10) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth();
        setHasData(health.has_data);
      } catch {
        setHasData(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleImportComplete = useCallback((sKey: number) => {
    setHasData(true);
    setSessionKey(sKey);
    sessionStorage.setItem("active-session-key", String(sKey));
  }, []);

  const handleSelectSession = useCallback(
    (sKey: number, meetingName?: string, sessionName?: string, date?: string) => {
      setSessionKey(sKey);
      sessionStorage.setItem("active-session-key", String(sKey));
      if (meetingName) sessionStorage.setItem("active-meeting-name", meetingName);
      if (sessionName) sessionStorage.setItem("active-session-name", sessionName);
      if (date) sessionStorage.setItem("active-session-date", date);
    },
    []
  );

  const handleBackToHome = useCallback(() => {
    setSessionKey(null);
    sessionStorage.removeItem("active-session-key");
    sessionStorage.removeItem("active-meeting-name");
    sessionStorage.removeItem("active-session-name");
    sessionStorage.removeItem("active-session-date");
  }, []);

  if (loading) {
    return (
      <div className="bg-site-bg-dark flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-racing-red-500 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-midnight-violet-200">Connecting to server...</p>
        </div>
      </div>
    );
  }

  const isDashboardView = !!hasData && !!sessionKey;

  return (
    <Suspense fallback={<h2>🌀 Loading...</h2>}>
      <LayoutProvider>
        <ThemeProvider theme={f1Theme}>
          <ToastContainer
            position="top-right"
            autoClose={false}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="dark"
          />
          <Box className="bg-site-bg-dark flex min-h-screen flex-col">
            <Navbar />
            <Box className="flex-1">
              {!isDashboardView ? (
                <Onboarding
                  onImportComplete={handleImportComplete}
                  onSelectSession={handleSelectSession}
                  existingSessionKey={sessionKey}
                />
              ) : (
                <Dashboard sessionKey={sessionKey} onBackToHome={handleBackToHome} />
              )}
            </Box>
            <Footer />
          </Box>
        </ThemeProvider>
      </LayoutProvider>
    </Suspense>
  );
}

export default App;
