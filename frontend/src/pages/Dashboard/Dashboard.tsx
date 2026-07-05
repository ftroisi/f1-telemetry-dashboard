import { useState, useEffect, useCallback } from "react";
import { getDrivers, Driver } from "../../api/client";
import {
  WidgetConfig,
  LayoutItem,
  loadDashboardState,
  saveDashboardState,
  getDefaultWidgets,
  getDefaultLayout
} from "../../state/dashboardState";
import { DashboardContext } from "./DashboardContext";
import DashboardUI from "./DashboardUI";

interface DashboardProps {
  sessionKey: number;
  onBackToHome: () => void;
}

const Dashboard = ({ sessionKey, onBackToHome }: DashboardProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<LayoutItem[]>([]);
  const [configuringWidget, setConfiguringWidget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load drivers
  useEffect(() => {
    async function loadDrivers() {
      try {
        const driverList = await getDrivers(sessionKey);
        setDrivers(driverList || []);

        const saved = loadDashboardState(sessionKey);
        if (saved && saved.widgets.length > 0) {
          setWidgets(saved.widgets);
          setLayouts(saved.layouts);
        } else {
          const defaultWidgets = getDefaultWidgets(
            sessionKey,
            (driverList || []).map((d) => d.driver_number)
          );
          setWidgets(defaultWidgets);
          const defaultLayout = getDefaultLayout(defaultWidgets);
          setLayouts(defaultLayout);
        }
      } catch (err) {
        console.error("Failed to load drivers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDrivers();
  }, [sessionKey]);

  // Persist state
  useEffect(() => {
    if (widgets.length > 0 && layouts.length > 0) {
      saveDashboardState(sessionKey, { widgets, layouts });
    }
  }, [widgets, layouts, sessionKey]);

  const handleLayoutChange = useCallback((newLayout: import("react-grid-layout").Layout) => {
    setLayouts([...newLayout]);
  }, []);

  const handleUpdateWidget = useCallback((widgetId: string, config: Partial<WidgetConfig>) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, ...config } : w)));
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setLayouts((prev) => prev.filter((l) => l.i !== widgetId));
  }, []);

  const handleAddWidget = useCallback(
    (type: WidgetConfig["type"]) => {
      const id = `widget-${type}-${Date.now()}`;
      const titles: Record<string, string> = {
        "speed-trace": "Speed / Throttle / Brake",
        "sector-times": "Sector Time Comparison",
        "track-map": "Track Position Map",
        "pit-stops": "Pit Stop Duration",
        "race-positions": "Race Position Changes"
      };
      const newWidget: WidgetConfig = {
        id,
        type,
        title: titles[type] || type,
        driverNumbers: drivers.length > 0 ? [drivers[0].driver_number] : []
      };
      setWidgets((prev) => [...prev, newWidget]);
      setLayouts((prev) => [...prev, { i: id, x: 0, y: Infinity, w: 6, h: 4, minW: 3, minH: 3 }]);
    },
    [drivers]
  );

  const contextValue = {
    sessionKey,
    drivers,
    widgets,
    layouts,
    configuringWidget,
    loading,
    handleLayoutChange,
    handleUpdateWidget,
    handleRemoveWidget,
    handleAddWidget,
    setConfiguringWidget,
    onBackToHome
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <DashboardUI />
    </DashboardContext.Provider>
  );
};

export default Dashboard;
