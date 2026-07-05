import { useState, useEffect } from "react";
import Onboarding from "./pages/Onboarding/Onboarding";
import Dashboard from "./pages/Dashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { checkHealth } from "./api/client";
import Box from "@mui/material/Box";

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

        // If there's data but no session key stored, try to get one
        if (health.has_data && !sessionKey) {
          // We'll let the onboarding handle this
        }
      } catch {
        setHasData(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleImportComplete = (sKey: number) => {
    setHasData(true);
    setSessionKey(sKey);
    sessionStorage.setItem("active-session-key", String(sKey));
  };

  const handleSelectSession = (sKey: number) => {
    setSessionKey(sKey);
    sessionStorage.setItem("active-session-key", String(sKey));
  };

  const handleBackToHome = () => {
    setSessionKey(null);
    sessionStorage.removeItem("active-session-key");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1115]">
        <div className="text-center">
          <div className="border-racing-red-500 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
      <Box className="h-full w-full bg-[#0f1115]">
        {!hasData || !sessionKey ? (
          <Onboarding
            onImportComplete={handleImportComplete}
            onSelectSession={handleSelectSession}
            existingSessionKey={sessionKey}
          />
        ) : (
          <Dashboard sessionKey={sessionKey} onBackToHome={handleBackToHome} />
        )}
      </Box>
    </>
  );
}

export default App;
