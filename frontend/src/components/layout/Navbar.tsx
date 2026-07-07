import { Box, Typography } from "@mui/material";
import { useLayoutContext } from "./LayoutContext";
import f1_logo from "assets/formula_1_logo.png";

const Navbar = () => {
  const { rightContent } = useLayoutContext();

  return (
    <Box
      component="header"
      className="bg-site-bg-dark flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-3"
    >
      <Box className="flex items-center gap-3">
        <img src={f1_logo} alt="F1 Logo" className="h-8 w-auto" />
        <Typography className="!text-lg !font-bold !text-white">F1 Telemetry Dashboard</Typography>
      </Box>
      {rightContent && <Box className="flex items-center gap-2">{rightContent}</Box>}
    </Box>
  );
};

export default Navbar;
