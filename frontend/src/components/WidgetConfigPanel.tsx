import React, { useState } from 'react';
import { WidgetConfig } from '../state/dashboardState';
import { Driver } from '../api/client';
import { X } from 'lucide-react';

interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  drivers: Driver[];
  onUpdate: (config: Partial<WidgetConfig>) => void;
  onClose: () => void;
}

const WIDGET_TYPES: { type: WidgetConfig['type']; label: string }[] = [
  { type: 'speed-trace', label: 'Speed / Throttle / Brake' },
  { type: 'sector-times', label: 'Sector Time Comparison' },
  { type: 'track-map', label: 'Track Position Map' },
  { type: 'pit-stops', label: 'Pit Stop Duration' },
  { type: 'race-positions', label: 'Race Position Changes' },
];

export default function WidgetConfigPanel({ widget, drivers, onUpdate, onClose }: WidgetConfigPanelProps) {
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>(widget.driverNumbers);
  const [title, setTitle] = useState(widget.title);

  const handleSave = () => {
    onUpdate({
      title,
      driverNumbers: selectedDrivers,
    });
    onClose();
  };

  const toggleDriver = (dn: number) => {
    setSelectedDrivers(prev =>
      prev.includes(dn)
        ? prev.filter(d => d !== dn)
        : [...prev, dn]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#161b22] border border-gray-800 rounded-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Configure Widget</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Widget Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-racing-red-500"
            />
          </div>
          
          {/* Widget Type (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Widget Type</label>
            <div className="bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              {WIDGET_TYPES.find(t => t.type === widget.type)?.label || widget.type}
            </div>
          </div>
          
          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Drivers</label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-[#0f1115] border border-gray-700 rounded-lg p-2">
              {drivers.map((driver) => (
                <label
                  key={driver.driver_number}
                  className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDrivers.includes(driver.driver_number)}
                    onChange={() => toggleDriver(driver.driver_number)}
                    className="rounded border-gray-600 bg-gray-800 text-racing-red-500 focus:ring-racing-red-500"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: driver.team_colour ? `#${driver.team_colour}` : '#888' }}
                  />
                  <div>
                    <span className="text-sm text-gray-200">{driver.name_acronym}</span>
                    <span className="text-xs text-gray-500 ml-2">{driver.full_name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Lap Number (for speed-trace) */}
          {widget.type === 'speed-trace' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Lap Number (optional)</label>
              <input
                type="number"
                min={1}
                value={widget.lapNumber || ''}
                onChange={(e) => onUpdate({ lapNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-racing-red-500"
                placeholder="All laps"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-racing-red-600 hover:bg-racing-red-500 rounded-lg transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
