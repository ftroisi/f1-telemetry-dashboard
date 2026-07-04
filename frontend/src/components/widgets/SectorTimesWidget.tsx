import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLaps, Lap, getDrivers, Driver } from '../../api/client';
import { Loader2, AlertCircle } from 'lucide-react';

interface SectorTimesWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  configurable?: boolean;
  onConfigure?: () => void;
}

export default function SectorTimesWidget({ sessionKey, driverNumbers }: SectorTimesWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const drivers: Driver[] = await getDrivers(sessionKey);
        const driverMap = new Map(drivers.map(d => [d.driver_number, d]));
        
        const lapsByDriver: Map<number, Lap[]> = new Map();
        const nums = driverNumbers.length > 0 ? driverNumbers : drivers.map(d => d.driver_number);
        
        for (const dn of nums) {
          const laps: Lap[] = await getLaps(sessionKey, dn);
          lapsByDriver.set(dn, laps);
        }
        
        // Get the best sector times per driver (fastest valid lap)
        const chartData = nums.map(dn => {
          const laps = lapsByDriver.get(dn) || [];
          const validLaps = laps.filter(l => l.lap_duration && !l.is_pit_out_lap);
          const bestLap = validLaps.reduce((best, l) => 
            !best || (l.lap_duration && l.lap_duration < best.lap_duration) ? l : best
          , validLaps[0]);
          
          const driver = driverMap.get(dn);
          const acronym = driver?.name_acronym || `#${dn}`;
          const color = driver?.team_colour ? `#${driver.team_colour}` : '#888';
          
          return {
            name: acronym,
            sector1: bestLap?.duration_sector_1 || 0,
            sector2: bestLap?.duration_sector_2 || 0,
            sector3: bestLap?.duration_sector_3 || 0,
            total: bestLap?.lap_duration || 0,
            fill: color,
          };
        });
        
        setData(chartData);
      } catch (err: any) {
        setError(err.message || 'Failed to load sector times');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionKey, driverNumbers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-racing-red-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No sector time data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} stroke="#555" />
        <YAxis tick={{ fill: '#999', fontSize: 10 }} stroke="#555" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Bar dataKey="sector1" name="Sector 1" fill="#1ca7e3" radius={[2, 2, 0, 0]} />
        <Bar dataKey="sector2" name="Sector 2" fill="#fbce04" radius={[2, 2, 0, 0]} />
        <Bar dataKey="sector3" name="Sector 3" fill="#f70814" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
