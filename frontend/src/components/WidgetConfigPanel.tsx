import { useState } from "react";
import { WidgetConfig } from "../state/dashboardState";
import { Driver } from "../api/client";
import {
  Button,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
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

const WidgetConfigPanel = ({ widget, drivers, onUpdate, onClose }: WidgetConfigPanelProps) => {
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>(
    drivers.filter((d) => widget.driverNumbers.includes(d.driver_number))
  );
  const [title, setTitle] = useState(widget.title);
  const [lapNumber, setLapNumber] = useState<number | undefined>(widget.lapNumber);

  const handleSave = () => {
    onUpdate({
      title,
      driverNumbers: selectedDrivers.map((d) => d.driver_number),
      lapNumber: widget.type === "speed-trace" ? lapNumber : undefined
    });
    onClose();
  };

  return (
    <Box
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <Box
        className="mx-4 w-full max-w-md rounded-xl border border-gray-800 bg-[#161b22]"
        onClick={(e) => e.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <Typography className="!text-lg !font-semibold">Configure Widget</Typography>
          <button onClick={onClose} className="text-gray-500 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </Box>

        <Box className="space-y-5 p-5">
          {/* Title */}
          <Box>
            <Typography className="mb-1.5 block !text-sm !font-medium !text-gray-400">
              Widget Title
            </Typography>
            <TextField
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              placeholder="Widget title"
              size="small"
            />
          </Box>

          {/* Widget Type (read-only) */}
          <Box>
            <Typography className="mb-1.5 block !text-sm !font-medium !text-gray-400">
              Widget Type
            </Typography>
            <Box className="rounded-lg border border-gray-700 bg-[#0f1115] px-3 py-2 text-sm text-gray-300">
              {WIDGET_TYPES.find((t) => t.type === widget.type)?.label || widget.type}
            </Box>
          </Box>

          {/* Driver Selection - Autocomplete with Chips */}
          <Box>
            <Typography className="mb-1.5 block !text-sm !font-medium !text-gray-400">
              Drivers
            </Typography>
            <Autocomplete
              multiple
              size="small"
              value={selectedDrivers}
              onChange={(_, newVal) => setSelectedDrivers(newVal)}
              options={drivers}
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
                      sx={{
                        backgroundColor: option.team_colour
                          ? `#${option.team_colour}33`
                          : undefined,
                        color: option.team_colour ? `#${option.team_colour}` : undefined,
                        border: option.team_colour ? `1px solid #${option.team_colour}` : undefined
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Drivers" placeholder="Search drivers..." />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={option.driver_number} {...rest}>
                    <Box
                      className="mr-2 h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: option.team_colour ? `#${option.team_colour}` : "#888"
                      }}
                    />
                    <Box>
                      <Typography className="!text-sm">{option.name_acronym}</Typography>
                      <Typography className="!text-xs !text-gray-500">
                        {option.full_name}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
          </Box>

          {/* Lap Number (for speed-trace) */}
          {widget.type === "speed-trace" && (
            <Box>
              <Typography className="mb-1.5 block !text-sm !font-medium !text-gray-400">
                Lap Number
              </Typography>
              <FormControl size="small" className="w-full">
                <InputLabel>Lap</InputLabel>
                <Select
                  value={lapNumber ?? ""}
                  label="Lap"
                  onChange={(e) =>
                    setLapNumber(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <MenuItem value="">All laps</MenuItem>
                  <MenuItem value={1}>Lap 1</MenuItem>
                  <MenuItem value={2}>Lap 2</MenuItem>
                  <MenuItem value={3}>Lap 3</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Box className="flex justify-end gap-3 border-t border-gray-800 px-5 py-4">
          <Button
            onClick={onClose}
            variant="contained"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 transition-all hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className="bg-racing-red-600 hover:bg-racing-red-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WidgetConfigPanel;
