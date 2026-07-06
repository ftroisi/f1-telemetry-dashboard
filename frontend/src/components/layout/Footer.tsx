import { Box, Typography } from "@mui/material";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      className="border-t border-[rgba(255,255,255,0.08)] bg-[#0f1115] px-6 py-4 text-center"
    >
      <Typography className="!text-sm !text-gray-500">
        &copy; {currentYear} F1 Telemetry Dashboard. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
