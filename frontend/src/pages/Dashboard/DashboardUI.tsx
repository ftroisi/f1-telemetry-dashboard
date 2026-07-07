import { useState, useEffect, useRef, Suspense } from "react";
import GridLayout, { verticalCompactor } from "react-grid-layout";
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress
} from "@mui/material";
import { Settings, GripVertical } from "lucide-react";
import safeLazyImport from "src/safeLazyImport";
import { useDashboardContext } from "./DashboardContext";
import { WidgetConfig } from "../../state/dashboardState";
import EventInfoBarUI from "./EventInfoBarUI";

const SpeedTraceWidget = safeLazyImport(() => import("components/widgets/SpeedTraceWidget"));
const SectorTimesWidget = safeLazyImport(() => import("components/widgets/SectorTimesWidget"));
const TrackMapWidget = safeLazyImport(() => import("components/widgets/TrackMapWidget"));
const PitStopsWidget = safeLazyImport(() => import("components/widgets/PitStopsWidget"));
const RacePositionsWidget = safeLazyImport(() => import("components/widgets/RacePositionsWidget"));
const WidgetConfigPanel = safeLazyImport(() => import("components/WidgetConfigPanel"));

const widgetOptions: { type: WidgetConfig["type"]; label: string }[] = [
  { type: "speed-trace", label: "Speed / Throttle / Brake" },
  { type: "sector-times", label: "Sector Time Comparison" },
  { type: "track-map", label: "Track Position Map" },
  { type: "pit-stops", label: "Pit Stop Duration" },
  { type: "race-positions", label: "Race Position Changes" }
];

const AddWidgetModal = ({
  open,
  onClose,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (type: WidgetConfig["type"]) => void;
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="!bg-[#161b22] !text-gray-200">Add Widget</DialogTitle>
      <DialogContent className="!bg-[#161b22] !p-0">
        <List>
          {widgetOptions.map(({ type, label }) => (
            <ListItemButton
              key={type}
              onClick={() => onSelect(type)}
              className="!text-gray-300 hover:!bg-gray-800 hover:!text-white"
            >
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions className="!border-t !border-gray-800 !bg-[#161b22]">
        <Button onClick={onClose} className="!text-gray-400">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DashboardUI = () => {
  const {
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
    setConfiguringWidget
  } = useDashboardContext();

  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);

  // Observe container width for full-width grid
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setGridWidth(entry.contentRect.width);
        }
      }
    });
    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  const renderWidget = (widget: (typeof widgets)[0]) => {
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

  const gridLayout = layouts.map((l) => ({
    ...l,
    static: false,
    isDraggable: true,
    isResizable: true
  }));

  if (loading) {
    return (
      <Box className="flex min-h-[60vh] items-center justify-center">
        <Box className="border-racing-red-500 h-12 w-12 animate-spin rounded-full border-b-2" />
      </Box>
    );
  }

  return (
    <Box className="flex w-full flex-col">
      {/* Event Info Bar */}
      <EventInfoBarUI setShowAddWidgetModal={setShowAddWidgetModal} />

      {/* Main Content - full width */}
      <Box component="main" className="p-4">
        {widgets.length === 0 ? (
          <Box className="py-24 text-center">
            <Typography className="mb-4 !text-lg !text-gray-500">No widgets yet</Typography>
            <Typography className="!text-sm !text-gray-600">
              Add widgets using the button above
            </Typography>
          </Box>
        ) : (
          <Box ref={gridRef} className="w-full">
            <GridLayout
              className="layout"
              layout={gridLayout}
              width={gridWidth}
              onLayoutChange={handleLayoutChange}
              gridConfig={{
                cols: 12,
                rowHeight: 100,
                margin: [16, 16] as [number, number],
                containerPadding: [0, 0] as [number, number]
              }}
              dragConfig={{ handle: ".drag-handle" }}
              compactor={verticalCompactor}
              autoSize
            >
              {widgets.map((widget) => (
                <Box
                  key={widget.id}
                  className="group overflow-hidden rounded-xl border border-gray-800 bg-[#161b22]"
                >
                  <Box className="flex items-center justify-between border-b border-gray-800 bg-[#1a1a2e] px-4 py-2.5">
                    <Box className="flex items-center gap-2">
                      <Box className="drag-handle cursor-grab text-gray-600 hover:text-gray-400 active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </Box>
                      <Typography className="!text-sm !font-medium !text-gray-200">
                        {widget.title}
                      </Typography>
                    </Box>
                    <Box className="flex items-center gap-1">
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
                    </Box>
                  </Box>
                  <Suspense
                    fallback={<CircularProgress className="m-auto mt-12" color="inherit" />}
                  >
                    <Box className="h-[calc(100%-44px)] p-3">{renderWidget(widget)}</Box>
                  </Suspense>
                </Box>
              ))}
            </GridLayout>
          </Box>
        )}
      </Box>

      {/* Add Widget Modal */}
      <AddWidgetModal
        open={showAddWidgetModal}
        onClose={() => setShowAddWidgetModal(false)}
        onSelect={(type) => {
          handleAddWidget(type);
          setShowAddWidgetModal(false);
        }}
      />

      {/* Config Panel Modal */}
      {configuringWidget && (
        <WidgetConfigPanel
          widget={widgets.find((w) => w.id === configuringWidget)!}
          drivers={drivers}
          onUpdate={(config) => handleUpdateWidget(configuringWidget, config)}
          onClose={() => setConfiguringWidget(null)}
        />
      )}
    </Box>
  );
};

export default DashboardUI;
