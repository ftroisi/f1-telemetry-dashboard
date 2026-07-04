import React, { useState, useEffect, useCallback } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { getDrivers, Driver } from "../api/client";
import {
  WidgetConfig,
  LayoutItem,
  loadDashboardState,
  saveDashboardState,
  getDefaultWidgets,
  getDefaultLayout
} from "../state/dashboardState";
import SpeedTraceWidget from "../components/widgets/SpeedTraceWidget";
import SectorTimesWidget from "../components/widgets/SectorTimesWidget";
import TrackMapWidget from "../components/widgets/TrackMapWidget";
import PitStopsWidget from "../components/widgets/PitStopsWidget";
import RacePositionsWidget from "../components/widgets/RacePositionsWidget";
import WidgetConfigPanel from "../components/WidgetConfigPanel";
import { Settings, ArrowLeft, Plus, GripVertical } from "lucide-react";

interface DashboardProps {
  sessionKey: number;
  onBackToHome: () => void;
}

export default function Dashboard({ sessionKey, onBackToHome }: DashboardProps) {
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

        // Load or initialize dashboard state
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

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayouts(newLayout);
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

  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      sessionKey,
      driverNumbers: widget.driverNumbers,
      lapNumber: widget.lapNumber,
      configurable: true,
      onConfigure: () => setConfiguringWidget(widget.id)
    };

    switch (widget.type) {
      case "speed-trace":
        return <SpeedTraceWidget {...commonProps} />;
      case "sector-times":
        return <SectorTimesWidget {...commonProps} />;
      case "track-map":
        return <TrackMapWidget {...commonProps} />;
      case "pit-stops":
        return <PitStopsWidget {...commonProps} />;
      case "race-positions":
        return <RacePositionsWidget {...commonProps} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1115]">
        <div className="border-racing-red-500 h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  const gridLayout = layouts.map((l) => ({
    ...l,
    static: false,
    isDraggable: true,
    isResizable: true
  }));

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="bg-racing-red-600 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
            F1
          </div>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <span className="text-sm text-gray-500">Session #{sessionKey}</span>
        </div>

        {/* Add Widget Dropdown */}
        <div className="group relative">
          <button className="bg-racing-red-600 hover:bg-racing-red-500 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all">
            <Plus className="h-4 w-4" />
            Add Widget
          </button>
          <div className="invisible absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-gray-800 bg-[#161b22] opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
            {(
              [
                { type: "speed-trace", label: "Speed / Throttle / Brake" },
                { type: "sector-times", label: "Sector Time Comparison" },
                { type: "track-map", label: "Track Position Map" },
                { type: "pit-stops", label: "Pit Stop Duration" },
                { type: "race-positions", label: "Race Position Changes" }
              ] as const
            ).map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleAddWidget(type)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 first:rounded-t-lg last:rounded-b-lg hover:bg-gray-800 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6">
        {widgets.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-4 text-lg text-gray-500">No widgets yet</p>
            <p className="text-sm text-gray-600">Add widgets using the button in the header</p>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={gridLayout}
            cols={12}
            rowHeight={100}
            width={1200}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            compactType="vertical"
            margin={[16, 16]}
            containerPadding={[0, 0]}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="group overflow-hidden rounded-xl border border-gray-800 bg-[#161b22]"
              >
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#1a1a2e] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="drag-handle cursor-grab text-gray-600 hover:text-gray-400 active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-200">{widget.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfiguringWidget(widget.id)}
                      className="rounded p-1.5 text-gray-500 transition-all hover:bg-gray-800 hover:text-white"
                      title="Configure"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="rounded p-1.5 text-gray-500 transition-all hover:bg-gray-800 hover:text-red-400"
                      title="Remove"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="h-[calc(100%-44px)] p-3">{renderWidget(widget)}</div>
              </div>
            ))}
          </GridLayout>
        )}
      </main>

      {/* Config Panel Modal */}
      {configuringWidget && (
        <WidgetConfigPanel
          widget={widgets.find((w) => w.id === configuringWidget)!}
          drivers={drivers}
          onUpdate={(config) => handleUpdateWidget(configuringWidget, config)}
          onClose={() => setConfiguringWidget(null)}
        />
      )}
    </div>
  );
}
