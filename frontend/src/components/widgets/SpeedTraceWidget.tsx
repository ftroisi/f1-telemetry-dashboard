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
import { getCarData, getLaps, CarDataPoint, Lap } from "../../api/client";
import { Loader2, AlertCircle } from "lucide-react";

interface SpeedTraceWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  lapNumber?: number;
  configurable?: boolean;
  onConfigure?: () => void;
}

export default function SpeedTraceWidget({
  sessionKey,
  driverNumbers,
  lapNumber,
  configurable,
  onConfigure
}: SpeedTraceWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (driverNumbers.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const driverNum = driverNumbers[0];

        // Fetch car data for this driver
        const carData: CarDataPoint[] = await getCarData(sessionKey, driverNum);

        // If we have a lap number, filter to that lap's time range using lap data
        if (lapNumber) {
          const laps: Lap[] = await getLaps(sessionKey, driverNum);
          const targetLap = laps.find((l) => l.lap_number === lapNumber);
          if (targetLap && targetLap.date_start) {
            const lapStart = new Date(targetLap.date_start).getTime();
            const lapDuration = (targetLap.lap_duration || 90) * 1000;
            const lapEnd = lapStart + lapDuration;

            const filtered = carData.filter((cd) => {
              const t = new Date(cd.date).getTime();
              return t >= lapStart && t <= lapEnd;
            });

            setData(filtered.length > 0 ? filtered : carData.slice(0, 500));
          } else {
            setData(carData.slice(0, 500));
          }
        } else {
          setData(carData.slice(0, 500));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load car data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionKey, driverNumbers, lapNumber]);

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
        <p className="text-sm text-gray-500">No car data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#999", fontSize: 10 }}
          tickFormatter={(val) => {
            const d = new Date(val);
            return `${d.getSeconds()}.${String(d.getMilliseconds()).slice(0, 2)}s`;
          }}
          stroke="#555"
        />
        <YAxis yAxisId="speed" tick={{ fill: "#999", fontSize: 10 }} stroke="#1ca7e3" />
        <YAxis
          yAxisId="pedals"
          orientation="right"
          tick={{ fill: "#999", fontSize: 10 }}
          stroke="#fbce04"
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px"
          }}
          labelStyle={{ color: "#fff" }}
          formatter={(value: any, name: string) => [value, name]}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line
          yAxisId="speed"
          type="monotone"
          dataKey="speed"
          stroke="#1ca7e3"
          dot={false}
          strokeWidth={2}
          name="Speed (km/h)"
        />
        <Line
          yAxisId="pedals"
          type="monotone"
          dataKey="throttle"
          stroke="#27c93f"
          dot={false}
          strokeWidth={1.5}
          name="Throttle (%)"
        />
        <Line
          yAxisId="pedals"
          type="monotone"
          dataKey="brake"
          stroke="#f70814"
          dot={false}
          strokeWidth={1.5}
          name="Brake (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
