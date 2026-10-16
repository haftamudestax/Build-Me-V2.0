import { Box, type BoxProps } from "@mui/material";

export function Section({ children, sx, ...props }: BoxProps) {
  return (
    <Box component="section" sx={{ py: { xs: 4, md: 8 }, ...sx }} {...props}>
      {children}
    </Box>
  );
}
