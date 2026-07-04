import React, { useState } from "react";
import { WidgetConfig } from "../state/dashboardState";
import { Driver } from "../api/client";
import { X } from "lucide-react";

interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  drivers: Driver[];
  onUpdate: (config: Partial<WidgetConfig>) => void;
  onClose: () => void;
}

const WIDGET_TYPES: { type: WidgetConfig["type"]; label: string }[] = [
  { type: "speed-trace", label: "Speed / Throttle / Brake" },
  { type: "sector-times", label: "Sector Time Comparison" },
  { type: "track-map", label: "Track Position Map" },
  { type: "pit-stops", label: "Pit Stop Duration" },
  { type: "race-positions", label: "Race Position Changes" }
];

export default function WidgetConfigPanel({
  widget,
  drivers,
  onUpdate,
  onClose
}: WidgetConfigPanelProps) {
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>(widget.driverNumbers);
  const [title, setTitle] = useState(widget.title);

  const handleSave = () => {
    onUpdate({
      title,
      driverNumbers: selectedDrivers
    });
    onClose();
  };

  const toggleDriver = (dn: number) => {
    setSelectedDrivers((prev) =>
      prev.includes(dn) ? prev.filter((d) => d !== dn) : [...prev, dn]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-gray-800 bg-[#161b22]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Configure Widget</h2>
          <button onClick={onClose} className="text-gray-500 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Widget Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus:border-racing-red-500 w-full rounded-lg border border-gray-700 bg-[#0f1115] px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Widget Type (read-only) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Widget Type</label>
            <div className="rounded-lg border border-gray-700 bg-[#0f1115] px-3 py-2 text-sm text-gray-300">
              {WIDGET_TYPES.find((t) => t.type === widget.type)?.label || widget.type}
            </div>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Drivers</label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-700 bg-[#0f1115] p-2">
              {drivers.map((driver) => (
                <label
                  key={driver.driver_number}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedDrivers.includes(driver.driver_number)}
                    onChange={() => toggleDriver(driver.driver_number)}
                    className="text-racing-red-500 focus:ring-racing-red-500 rounded border-gray-600 bg-gray-800"
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: driver.team_colour ? `#${driver.team_colour}` : "#888"
                    }}
                  />
                  <div>
                    <span className="text-sm text-gray-200">{driver.name_acronym}</span>
                    <span className="ml-2 text-xs text-gray-500">{driver.full_name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Lap Number (for speed-trace) */}
          {widget.type === "speed-trace" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                Lap Number (optional)
              </label>
              <input
                type="number"
                min={1}
                value={widget.lapNumber || ""}
                onChange={(e) =>
                  onUpdate({ lapNumber: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="focus:border-racing-red-500 w-full rounded-lg border border-gray-700 bg-[#0f1115] px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="All laps"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 transition-all hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-racing-red-600 hover:bg-racing-red-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
