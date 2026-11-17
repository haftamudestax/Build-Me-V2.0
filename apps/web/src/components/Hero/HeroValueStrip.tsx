import { Box, Typography } from "@mui/material";
import { CheckSquare2 } from "lucide-react";

const heroKeyFacts = [
  "No Stress",
  "No Confusion",
  "No Jargons",
  "Just Simple",
] as const;

export function HeroValueStrip() {
  return (
    <Box
      component="section"
      aria-label="Key value propositions"
      sx={{
        width: "100%",
        pt: { xs: 3, md: 3.5 },
        borderTop: "3px solid var(--color-light-yellow)",
        textAlign: "center",
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.35rem", md: "1.5rem" },
          fontWeight: 800,
          color: "var(--color-dark-yellow)",
          letterSpacing: "-0.015em",
          textAlign: "center",
          mb: 2.5,
        }}
      >
        Reliable solutions that help you grow.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          justifyContent: "center",
          alignItems: "center",
          gap: { xs: 1.25, md: 2 },
        }}
      >
        {heroKeyFacts.map((fact) => (
          <Box
            key={fact}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              px: { xs: 1.75, md: 2.25 },
              py: 1.1,
              whiteSpace: "nowrap",
              borderRadius: 0,
              boxShadow: "none",
              bgcolor:
                "color-mix(in srgb, var(--color-light-yellow) 18%, var(--color-white))",
              border: "1.5px solid var(--color-black)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "var(--color-light-yellow)",
                "& .value-tick-icon": {
                  color: "var(--color-black)",
                },
              },
            }}
          >
            <Box
              component="span"
              className="value-tick-icon"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-light-yellow)",
                flexShrink: 0,
                transition: "color 0.2s ease-in-out",
              }}
            >
              <CheckSquare2 size={18} strokeWidth={2.5} aria-hidden="true" />
            </Box>
            <Typography
              component="span"
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--color-black)",
                lineHeight: 1.3,
              }}
            >
              {fact}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
