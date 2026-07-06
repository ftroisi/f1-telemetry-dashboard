import { useState, useEffect, Suspense } from "react";
import safeLazyImport from "./safeLazyImport";
import { LayoutProvider } from "./components/layout/LayoutContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { checkHealth } from "./api/client";
import Box from "@mui/material/Box";

// Lazy imports of global components
const Navbar = safeLazyImport(() => import("components/layout/Navbar"));
const Footer = safeLazyImport(() => import("components/layout/Footer"));
const Onboarding = safeLazyImport(() => import("pages/Onboarding/Onboarding"));
const Dashboard = safeLazyImport(() => import("pages/Dashboard/Dashboard"));

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

  const isDashboardView = !!hasData && !!sessionKey;

  return (
    <Suspense fallback={<h2>🌀 Loading...</h2>}>
      <LayoutProvider>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
        <Box className="flex min-h-screen flex-col bg-[#0f1115]">
          <Navbar showBackButton={isDashboardView} onBack={handleBackToHome} />
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
      </LayoutProvider>
    </Suspense>
  );
}

export default App;
