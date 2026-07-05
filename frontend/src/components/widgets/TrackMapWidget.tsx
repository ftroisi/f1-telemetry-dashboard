import { useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Box, Typography } from "@mui/material";
import { getLocationData } from "../../api/client";
import { Loader2, AlertCircle } from "lucide-react";

interface TrackMapWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  configurable?: boolean;
  onConfigure?: () => void;
}

const TrackMapWidget = ({ sessionKey, driverNumbers }: TrackMapWidgetProps) => {
  const [scatterData, setScatterData] = useState<any[]>([]);
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
      if (driverNumbers.length === 0) {
        setScatterData([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const allData = await Promise.all(
          driverNumbers.map(async (dn, idx) => {
            const locs = await getLocationData(sessionKey, dn);
            return {
              driverNumber: dn,
              color: colors[idx % colors.length],
              data: locs.map((l: any) => ({ x: l.x, y: l.y }))
            };
          })
        );

        const series = allData
          .filter((s) => s.data.length > 0)
          .map((s) => ({
            name: `Driver #${s.driverNumber}`,
            color: s.color,
            data: s.data
          }));

        setScatterData(series);
      } catch (err: any) {
        setError(err.message || "Failed to load location data");
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
          <Typography className="text-xs text-red-300">{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (scatterData.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Typography className="text-sm text-gray-500">No track position data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="x" type="number" tick={{ fill: "#999", fontSize: 10 }} stroke="#555" />
        <YAxis dataKey="y" type="number" tick={{ fill: "#999", fontSize: 10 }} stroke="#555" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px"
          }}
          labelStyle={{ color: "#fff" }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {scatterData.map((series) => (
          <Scatter
            key={series.name}
            name={series.name}
            data={series.data}
            fill={series.color}
            line={{ stroke: series.color, strokeWidth: 1.5 }}
            lineType="joint"
            shape="circle"
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default TrackMapWidget;
