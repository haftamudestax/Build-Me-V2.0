import { Box, Typography } from "@mui/material";
import { BookOpen, Star, MessageCircle } from "lucide-react";

const items = [
  {
    label: "Project Stories",
    icon: BookOpen,
  },
  {
    label: "Client Reviews",
    icon: Star,
  },
  {
    label: "Client Feedback",
    icon: MessageCircle,
  },
];

export const TestimonialsNavigation = () => {
  return (
    <Box
      role="group"
      aria-label="Customer experience categories"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.25,
        width: "100%",
        mb: 3,
      }}
    >
      {items.map(({ label, icon: Icon }) => (
        <Box
          key={label}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 2,
            py: 1,
            minHeight: 42,
            backgroundColor: "#FFF2D2",
            color: "#171717",
          }}
        >
          <Icon size={20} strokeWidth={1.8} />

          <Typography
            component="span"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
