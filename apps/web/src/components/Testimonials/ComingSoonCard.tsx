import { Box, Typography } from "@mui/material";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

interface ComingSoonCardProps {
  title: string;
  description: string;
}

export function ComingSoonCard({ title, description }: ComingSoonCardProps) {
  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1.5,
        minHeight: 230,
        p: 3,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "action.hover",
      }}
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          bgcolor: "action.selected",
          color: "primary.main",
        }}
      >
        <ScheduleOutlinedIcon />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 260 }}>
        {description}
      </Typography>
    </Box>
  );
}
