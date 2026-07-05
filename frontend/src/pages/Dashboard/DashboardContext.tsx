import { createContext, useContext } from "react";
import { Driver } from "../../api/client";
import { WidgetConfig, LayoutItem } from "../../state/dashboardState";

export interface DashboardContextValue {
  sessionKey: number;
  drivers: Driver[];
  widgets: WidgetConfig[];
  layouts: LayoutItem[];
  configuringWidget: string | null;
  loading: boolean;
  handleLayoutChange: (newLayout: import("react-grid-layout").Layout) => void;
  handleUpdateWidget: (widgetId: string, config: Partial<WidgetConfig>) => void;
  handleRemoveWidget: (widgetId: string) => void;
  handleAddWidget: (type: WidgetConfig["type"]) => void;
  setConfiguringWidget: (id: string | null) => void;
  onBackToHome: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return ctx;
}
