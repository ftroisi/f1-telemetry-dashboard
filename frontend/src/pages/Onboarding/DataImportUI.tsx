import { Box, Typography } from "@mui/material";
import { CheckCircle, Loader2 } from "lucide-react";
import { STAGES } from "../../types/onboardingTypes";
import { useOnboardingContext } from "./OnboardingContext";

const DataImportUI = () => {
  const { importProgress } = useOnboardingContext();

  if (!importProgress) return null;

  const currentStageIdx = STAGES.indexOf(importProgress.stage as any);

  return (
    <Box className="mx-auto max-w-180 px-6 py-6">
      <Box className="flex flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161b22] p-6">
        <Loader2 className="text-racing-red-500 mx-auto mb-4 h-12 w-12 animate-spin" />
        <Typography className="mb-1 text-xl font-bold">Importing Session Data</Typography>
        <Typography className="mb-4 text-sm text-gray-400">{importProgress.message}</Typography>

        {/* Custom progress bar */}
        <Box className="h-2.5 w-full overflow-hidden rounded-full bg-gray-700">
          <Box
            className="bg-racing-red-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${importProgress.progress}%` }}
          />
        </Box>
        <Typography className="mt-1 text-xs text-gray-400">{importProgress.progress}%</Typography>

        <Box className="mx-auto mt-4 max-w-100 text-left">
          {STAGES.map((stage) => {
            const idx = STAGES.indexOf(stage);
            const done = idx < currentStageIdx;
            const active = idx === currentStageIdx;
            return (
              <Box key={stage} className="flex items-center gap-1.5 py-0.5">
                {done ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                ) : active ? (
                  <Loader2 className="text-racing-red-400 h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Box className="h-4 w-4 shrink-0 rounded-full border border-gray-600" />
                )}
                <Typography
                  className={`text-sm capitalize ${
                    done ? "text-green-400" : active ? "text-racing-red-400" : "text-gray-500"
                  }`}
                >
                  {stage.replace(/_/g, " ")}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default DataImportUI;
