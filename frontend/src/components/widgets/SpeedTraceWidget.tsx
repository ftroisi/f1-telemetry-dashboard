import { useState, useEffect } from "react";
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
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  TextField
} from "@mui/material";
import { getCarData, getLaps, CarDataPoint, Lap, getDrivers, Driver } from "../../api/client";
import { Loader2, AlertCircle } from "lucide-react";

interface SpeedTraceWidgetProps {
  sessionKey: number;
  driverNumbers: number[];
  lapNumber?: number;
  configurable?: boolean;
  onConfigure?: () => void;
}

const SpeedTraceWidget = ({ sessionKey, driverNumbers, lapNumber }: SpeedTraceWidgetProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedDriverNumbers, setSelectedDriverNumbers] = useState<number[]>(driverNumbers);
  const [selectedLapNumber, setSelectedLapNumber] = useState<number | undefined>(lapNumber);

  // Load drivers and laps
  useEffect(() => {
    async function loadMeta() {
      try {
        const d = await getDrivers(sessionKey);
        setAllDrivers(d || []);
      } catch {}
    }
    loadMeta();
  }, [sessionKey]);

  // Load laps for the first selected driver
  useEffect(() => {
    async function loadLaps() {
      if (selectedDriverNumbers.length === 0) { setLaps([]); return; }
      try {
        const l = await getLaps(sessionKey, selectedDriverNumbers[0]);
        setLaps(l || []);
      } catch {}
    }
    loadLaps();
  }, [sessionKey, selectedDriverNumbers]);

  // Sync external driverNumbers changes
  useEffect(() => {
    setSelectedDriverNumbers(driverNumbers);
  }, [driverNumbers]);

  useEffect(() => {
    setSelectedLapNumber(lapNumber);
  }, [lapNumber]);

  useEffect(() => {
    async function fetchData() {
      if (selectedDriverNumbers.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch data for all selected drivers
        const allCarData = await Promise.all(
          selectedDriverNumbers.map(async (dn) => {
            const cd: CarDataPoint[] = await getCarData(sessionKey, dn);
            return { driverNumber: dn, carData: cd };
          })
        );

        // Filter by lap number for each driver independently
        const filteredByDriver = await Promise.all(
          allCarData.map(async ({ driverNumber, carData }) => {
            if (selectedLapNumber) {
              const lps: Lap[] = await getLaps(sessionKey, driverNumber);
              const targetLap = lps.find((l) => l.lap_number === selectedLapNumber);
              if (targetLap && targetLap.date_start) {
                const lapStart = new Date(targetLap.date_start).getTime();
                const lapDuration = (targetLap.lap_duration || 90) * 1000;
                const lapEnd = lapStart + lapDuration;
                return carData.filter((cd) => {
                  const t = new Date(cd.date).getTime();
                  return t >= lapStart && t <= lapEnd;
                });
              }
            }
            return carData.slice(0, 500);
          })
        );

        if (selectedDriverNumbers.length === 1 && filteredByDriver[0]) {
          setData(filteredByDriver[0]);
        } else {
          setData(filteredByDriver[0] || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load car data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionKey, selectedDriverNumbers, selectedLapNumber]);

  const getDriverName = (dn: number) => {
    const d = allDrivers.find((dr) => dr.driver_number === dn);
    return d ? `${d.name_acronym} (${d.full_name})` : `Driver #${dn}`;
  };

  const uniqueLapNumbers = [...new Set(laps.map((l) => l.lap_number))].sort((a, b) => a - b);

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
        <Typography className="!text-sm !text-gray-500">No car data available</Typography>
      </Box>
    );
  }

  return (
    <Box className="flex h-full flex-col">
      {/* Controls row */}
      <Box className="w-full mb-2 flex flex-row items-center gap-2">
        {/* Driver selector - Autocomplete with Chips */}
        <Autocomplete
          multiple
          size="small"
          className="min-w-45 w-1/2"
          value={allDrivers.filter((d) => selectedDriverNumbers.includes(d.driver_number))}
          onChange={(_, newVal) => setSelectedDriverNumbers(newVal.map((d) => d.driver_number))}
          options={allDrivers}
          getOptionLabel={(d) => `${d.name_acronym} — ${d.full_name}`}
          isOptionEqualToValue={(a, b) => a.driver_number === b.driver_number}
          renderValue={(value, getItemProps) =>
            (value as Driver[]).map((option, index) => {
              const itemProps = getItemProps({ index });
              return (
                <Chip
                  label={option.name_acronym}
                  size="small"
                  {...itemProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Drivers" placeholder="Select drivers" />
          )}
        />

        {/* Lap selector */}
        <FormControl size="small" className="min-w-30 w-1/2">
          <InputLabel>Lap</InputLabel>
          <Select
            value={selectedLapNumber ?? ""}
            label="Lap"
            onChange={(e) =>
              setSelectedLapNumber(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <MenuItem value="">All laps</MenuItem>
            {uniqueLapNumbers.map((ln) => (
              <MenuItem key={ln} value={ln}>
                Lap {ln}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Driver name indicator */}
      {selectedDriverNumbers.length > 0 && (
        <Typography className="!mb-1 !text-xs !text-gray-400">
          Showing: {selectedDriverNumbers.map((dn) => getDriverName(dn)).join(", ")}
          {selectedLapNumber ? ` — Lap ${selectedLapNumber}` : ""}
        </Typography>
      )}

      {/* Chart */}
      <Box className="flex-1 min-h-0">
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
              label={{ value: "Time (s)", position: "insideBottom", fill: "#999", fontSize: 10, offset: -5 }}
            />
            <YAxis
              yAxisId="speed"
              tick={{ fill: "#999", fontSize: 10 }}
              stroke="#1ca7e3"
              label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "#1ca7e3", fontSize: 10, offset: 5 }}
            />
            <YAxis
              yAxisId="pedals"
              orientation="right"
              tick={{ fill: "#999", fontSize: 10 }}
              stroke="#fbce04"
              domain={[0, 100]}
              label={{ value: "Pedal (%)", angle: 90, position: "insideRight", fill: "#fbce04", fontSize: 10, offset: 5 }}
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
            <Legend wrapperStyle={{ fontSize: "11px", marginBottom: "-10px" }} />
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
      </Box>
    </Box>
  );
};

export default SpeedTraceWidget;
