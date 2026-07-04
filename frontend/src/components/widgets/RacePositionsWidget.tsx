import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getPositions, getDrivers, Position, Driver } from "../../api/client";
import { Loader2, AlertCircle } from "lucide-react";

interface RacePositionsWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  configurable?: boolean;
  onConfigure?: () => void;
}

export default function RacePositionsWidget({
  sessionKey,
  driverNumbers
}: RacePositionsWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    "#1ca7e3",
    "#f70814",
    "#27c93f",
    "#fbce04",
    "#dd2295",
    "#ffffff",
    "#ff8800",
    "#aa66ff"
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const drivers: Driver[] = await getDrivers(sessionKey);
        const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

        const nums = driverNumbers.length > 0 ? driverNumbers : drivers.map((d) => d.driver_number);

        // Fetch positions for all selected drivers
        const allPositionData: Map<number, Position[]> = new Map();
        for (const dn of nums) {
          const positions = await getPositions(sessionKey, dn);
          allPositionData.set(dn, positions);
        }

        // Build a time-synced dataset using date as index
        // Find common time points or use sample by lap
        const timeMap = new Map<string, any>();

        allPositionData.forEach((positions, dn) => {
          const driver = driverMap.get(dn);
          const acronym = driver?.name_acronym || `#${dn}`;

          // Sample every ~10th position reading to avoid too many points
          const step = Math.max(1, Math.floor(positions.length / 50));

          positions.forEach((pos, idx) => {
            if (idx % step !== 0) return;
            const timeKey = pos.date;
            if (!timeMap.has(timeKey)) {
              timeMap.set(timeKey, { time: timeKey });
            }
            timeMap.get(timeKey)![acronym] = pos.position;
          });
        });

        // Sort by time and take reasonable number of points
        const sortedData = Array.from(timeMap.values())
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .slice(0, 200);

        setData(sortedData);
      } catch (err: any) {
        setError(err.message || "Failed to load position data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionKey, driverNumbers]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-racing-red-500 h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No position data available</p>
      </div>
    );
  }

  // Get all driver acronyms from the data keys (excluding 'time')
  const driverKeys = Object.keys(data[0] || {}).filter((k) => k !== "time");
  const reversedData = data.map((d) => ({
    ...d,
    ...Object.fromEntries(driverKeys.map((k) => [k, d[k] ? 20 - d[k] : undefined]))
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={reversedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#999", fontSize: 10 }}
          tickFormatter={(val) => {
            const d = new Date(val);
            return `${d.getMinutes()}:${String(d.getSeconds()).padStart(2, "0")}`;
          }}
          stroke="#555"
          label={{
            value: "Time",
            position: "insideBottom",
            fill: "#999",
            fontSize: 10,
            offset: -5
          }}
        />
        <YAxis
          tick={{ fill: "#999", fontSize: 10 }}
          stroke="#555"
          label={{
            value: "Position",
            angle: -90,
            position: "insideLeft",
            fill: "#999",
            fontSize: 10
          }}
          domain={[1, 20]}
          reversed
          ticks={[1, 5, 10, 15, 20]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px"
          }}
          labelStyle={{ color: "#fff" }}
          formatter={(value: any, name: any) => [value, name]}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {driverKeys.map((key, idx) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[idx % colors.length]}
            dot={false}
            strokeWidth={2}
            name={key}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
