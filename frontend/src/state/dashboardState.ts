export interface WidgetConfig {
  id: string;
  type: "speed-trace" | "sector-times" | "track-map" | "pit-stops" | "race-positions";
  title: string;
  driverNumbers: number[];
  lapNumber?: number;
  metric?: string;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardState {
  layouts: LayoutItem[];
  widgets: WidgetConfig[];
}

const STORAGE_KEY_PREFIX = "f1-dashboard-layout-";

export function loadDashboardState(sessionKey: number): DashboardState | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionKey}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function saveDashboardState(sessionKey: number, state: DashboardState) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionKey}`, JSON.stringify(state));
  } catch {}
}

export function getDefaultWidgets(sessionKey: number, driverNumbers: number[]): WidgetConfig[] {
  const defaultDriver = driverNumbers.length > 0 ? [driverNumbers[0]] : [];
  const allDrivers = driverNumbers;

  return [
    {
      id: "widget-speed-1",
      type: "speed-trace",
      title: "Speed / Throttle / Brake",
      driverNumbers: defaultDriver,
      lapNumber: 1
    },
    {
      id: "widget-sector-1",
      type: "sector-times",
      title: "Sector Time Comparison",
      driverNumbers: allDrivers
    },
    {
      id: "widget-track-1",
      type: "track-map",
      title: "Track Position Map",
      driverNumbers: defaultDriver
    },
    {
      id: "widget-pit-1",
      type: "pit-stops",
      title: "Pit Stop Duration",
      driverNumbers: allDrivers
    },
    {
      id: "widget-positions-1",
      type: "race-positions",
      title: "Race Position Changes",
      driverNumbers: allDrivers
    }
  ];
}

export function getDefaultLayout(widgets: WidgetConfig[]): LayoutItem[] {
  return [
    { i: "widget-speed-1", x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: "widget-sector-1", x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: "widget-track-1", x: 0, y: 4, w: 6, h: 5, minW: 3, minH: 3 },
    { i: "widget-pit-1", x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    { i: "widget-positions-1", x: 0, y: 8, w: 12, h: 5, minW: 4, minH: 3 }
  ];
}
