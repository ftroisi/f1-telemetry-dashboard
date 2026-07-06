import {
  Button,
  Box,
  Typography
} from "@mui/material";
import { Plus, ChevronLeft, Calendar } from "lucide-react";

import { useDashboardContext } from "./DashboardContext";

interface EventInfoBarUIProps {
  setShowAddWidgetModal: (show: boolean) => void;
}

const EventInfoBarUI = ({ setShowAddWidgetModal }: EventInfoBarUIProps) => {
  const { eventInfo, onBackToHome } = useDashboardContext();

  if (!eventInfo) {
    return null;
  }

  return (<Box className="flex items-center justify-between border-b border-gray-800 bg-[#1a1a2e] px-6 py-3">
        <Box className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-[#161b22] px-3 py-1.5 text-sm text-gray-300 transition-all hover:border-gray-600 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Change Event
          </button>
          <Box className="h-6 w-px bg-gray-700" />
          <Box>
            <Typography className="!text-base !font-semibold !text-white">
              {eventInfo.meetingName}
            </Typography>
            <Box className="flex items-center gap-3 text-xs text-gray-400">
              {eventInfo.sessionDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(eventInfo.sessionDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              )}
              {eventInfo.sessionName && (
                <>
                  <span className="text-gray-600">|</span>
                  <span>{eventInfo.sessionName}</span>
                </>
              )}
            </Box>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => setShowAddWidgetModal(true)}
          className="!flex !items-center !gap-2 !rounded-lg !bg-racing-red-600 !px-4 !py-2 !text-sm !font-medium !text-white !transition-all hover:!bg-racing-red-500"
        >
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </Box>);
}

export default EventInfoBarUI;
