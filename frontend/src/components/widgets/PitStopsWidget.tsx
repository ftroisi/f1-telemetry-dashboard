import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Box, Typography } from "@mui/material";
import { getPitData, getDrivers, PitStop, Driver } from "../../api/client";
import { Loader2, AlertCircle } from "lucide-react";

interface PitStopsWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  configurable?: boolean;
  onConfigure?: () => void;
}

const PitStopsWidget = ({ sessionKey, driverNumbers }: PitStopsWidgetProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const drivers: Driver[] = await getDrivers(sessionKey);
        const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

        const nums = driverNumbers.length > 0 ? driverNumbers : drivers.map((d) => d.driver_number);
        const allPitData: PitStop[] = [];

        for (const dn of nums) {
          const pitData = await getPitData(sessionKey, dn);
          allPitData.push(...pitData);
        }

        const pitByDriver = new Map<number, PitStop[]>();
        allPitData.forEach((p) => {
          if (!pitByDriver.has(p.driver_number)) pitByDriver.set(p.driver_number, []);
          pitByDriver.get(p.driver_number)!.push(p);
        });

        const chartData = Array.from(pitByDriver.entries())
          .map(([dn, stops]) => {
            const validStops = stops.filter((s) => s.pit_duration && s.pit_duration > 0);
            const avgDuration =
              validStops.length > 0
                ? validStops.reduce((sum, s) => sum + s.pit_duration, 0) / validStops.length
                : 0;
            const totalDuration = stops.reduce((sum, s) => sum + (s.pit_duration || 0), 0);

            const driver = driverMap.get(dn);
            const acronym = driver?.name_acronym || `#${dn}`;
            const color = driver?.team_colour ? `#${driver.team_colour}` : "#888";

            return {
              name: acronym,
              avgDuration: parseFloat(avgDuration.toFixed(2)),
              totalDuration: parseFloat(totalDuration.toFixed(2)),
              stops: validStops.length,
              fill: color
            };
          })
          .sort((a, b) => b.avgDuration - a.avgDuration);

        setData(chartData);
      } catch (err: any) {
        setError(err.message || "Failed to load pit stop data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionKey, driverNumbers]);

  if (loading) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Loader2 className="text-racing-red-500 h-6 w-6 animate-spin" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Box className="text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
          <Typography className="!text-xs !text-red-300">{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Typography className="!text-sm !text-gray-500">No pit stop data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          type="number"
          tick={{ fill: "#999", fontSize: 10 }}
          stroke="#555"
          label={{
            value: "Duration (s)",
            position: "insideBottom",
            fill: "#999",
            fontSize: 10,
            offset: -5
          }}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#999", fontSize: 11 }}
          stroke="#555"
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px"
          }}
          labelStyle={{ color: "#fff" }}
          formatter={(value: any, name: any) => {
            if (name === "avgDuration") return [`${value}s`, "Avg Pit Duration"];
            if (name === "stops") return [value, "Stops"];
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar
          dataKey="avgDuration"
          name="Avg Pit Duration (s)"
          fill="#dd2295"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PitStopsWidget;
