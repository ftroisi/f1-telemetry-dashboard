import { Box, Typography } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useLayoutContext } from "./LayoutContext";
import f1_logo from "assets/formula_1_logo.png";

interface NavbarProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

const Navbar = ({ showBackButton, onBack }: NavbarProps) => {
  const { rightContent } = useLayoutContext();

  return (
    <Box
      component="header"
      className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[#0f1115] px-6 py-3"
    >
      <Box className="flex items-center gap-3">
        {showBackButton && onBack && (
          <button onClick={onBack} className="text-gray-400 transition-colors hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <img src={f1_logo} alt="F1 Logo" className="h-8 w-auto" />
        <Typography className="text-lg font-bold text-white">F1 Telemetry Dashboard</Typography>
      </Box>
      {rightContent && <Box className="flex items-center gap-2">{rightContent}</Box>}
    </Box>
  );
};

export default Navbar;
