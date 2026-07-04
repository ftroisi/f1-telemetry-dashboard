import React, { useState, useEffect, useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { getDrivers, Driver } from '../api/client';
import {
  WidgetConfig, LayoutItem,
  loadDashboardState, saveDashboardState,
  getDefaultWidgets, getDefaultLayout
} from '../state/dashboardState';
import SpeedTraceWidget from '../components/widgets/SpeedTraceWidget';
import SectorTimesWidget from '../components/widgets/SectorTimesWidget';
import TrackMapWidget from '../components/widgets/TrackMapWidget';
import PitStopsWidget from '../components/widgets/PitStopsWidget';
import RacePositionsWidget from '../components/widgets/RacePositionsWidget';
import WidgetConfigPanel from '../components/WidgetConfigPanel';
import { Settings, ArrowLeft, Plus, GripVertical } from 'lucide-react';

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
          const defaultWidgets = getDefaultWidgets(sessionKey, (driverList || []).map(d => d.driver_number));
          setWidgets(defaultWidgets);
          const defaultLayout = getDefaultLayout(defaultWidgets);
          setLayouts(defaultLayout);
        }
      } catch (err) {
        console.error('Failed to load drivers:', err);
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
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...config } : w));
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => prev.filter(l => l.i !== widgetId));
  }, []);

  const handleAddWidget = useCallback((type: WidgetConfig['type']) => {
    const id = `widget-${type}-${Date.now()}`;
    const titles: Record<string, string> = {
      'speed-trace': 'Speed / Throttle / Brake',
      'sector-times': 'Sector Time Comparison',
      'track-map': 'Track Position Map',
      'pit-stops': 'Pit Stop Duration',
      'race-positions': 'Race Position Changes',
    };
    const newWidget: WidgetConfig = {
      id,
      type,
      title: titles[type] || type,
      driverNumbers: drivers.length > 0 ? [drivers[0].driver_number] : [],
    };
    setWidgets(prev => [...prev, newWidget]);
    setLayouts(prev => [...prev, { i: id, x: 0, y: Infinity, w: 6, h: 4, minW: 3, minH: 3 }]);
  }, [drivers]);

  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      sessionKey,
      driverNumbers: widget.driverNumbers,
      lapNumber: widget.lapNumber,
      configurable: true,
      onConfigure: () => setConfiguringWidget(widget.id),
    };

    switch (widget.type) {
      case 'speed-trace': return <SpeedTraceWidget {...commonProps} />;
      case 'sector-times': return <SectorTimesWidget {...commonProps} />;
      case 'track-map': return <TrackMapWidget {...commonProps} />;
      case 'pit-stops': return <PitStopsWidget {...commonProps} />;
      case 'race-positions': return <RacePositionsWidget {...commonProps} />;
      default: return <div>Unknown widget type</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1115]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-red-500"></div>
      </div>
    );
  }

  const gridLayout = layouts.map(l => ({
    ...l,
    static: false,
    isDraggable: true,
    isResizable: true,
  }));

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-racing-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
            F1
          </div>
          <h1 className="text-lg font-bold">Dashboard</h1>
          <span className="text-sm text-gray-500">Session #{sessionKey}</span>
        </div>

        {/* Add Widget Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-racing-red-600 hover:bg-racing-red-500 rounded-lg text-sm font-medium transition-all">
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
          <div className="absolute right-0 top-full mt-1 w-56 bg-[#161b22] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {([
              { type: 'speed-trace', label: 'Speed / Throttle / Brake' },
              { type: 'sector-times', label: 'Sector Time Comparison' },
              { type: 'track-map', label: 'Track Position Map' },
              { type: 'pit-stops', label: 'Pit Stop Duration' },
              { type: 'race-positions', label: 'Race Position Changes' },
            ] as const).map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleAddWidget(type)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-6">
        {widgets.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 text-lg mb-4">No widgets yet</p>
            <p className="text-gray-600 text-sm">Add widgets using the button in the header</p>
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
              <div key={widget.id} className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden group">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-[#1a1a2e]">
                  <div className="flex items-center gap-2">
                    <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-200">{widget.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfiguringWidget(widget.id)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-all"
                      title="Configure"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-all"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-3 h-[calc(100%-44px)]">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </GridLayout>
        )}
      </main>

      {/* Config Panel Modal */}
      {configuringWidget && (
        <WidgetConfigPanel
          widget={widgets.find(w => w.id === configuringWidget)!}
          drivers={drivers}
          onUpdate={(config) => handleUpdateWidget(configuringWidget, config)}
          onClose={() => setConfiguringWidget(null)}
        />
      )}
    </div>
  );
}
