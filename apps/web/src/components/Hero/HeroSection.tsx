import { useState } from "react";
import { Box, Container } from "@mui/material";
import { HeroIntro } from "./HeroIntro";
import { HeroRight } from "./HeroRight";
import { useVisibilityAnalytics } from "../../hooks/useTracking/useVisibilityAnalytics";
import { Card } from "@build-me/ui";
import { Typography } from "@mui/material";

export function HeroSection() {
  const [heroElement, setHeroElement] = useState<HTMLElement | null>(null);

  useVisibilityAnalytics(heroElement, {
    eventName: "page.viewed",
    enabled: true,
  });

  useVisibilityAnalytics(heroElement, {
    eventName: "hero.viewed",
    enabled: true,
  });

  return (
    <Box
      ref={setHeroElement}
      component="section"
      id="hero"
      aria-labelledby="hero-title"
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        py: { xs: 6, sm: 8, md: 10 },
        backgroundColor: "background.default",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 6, md: 8 },
        }}
      >
        {/* 1. Hero-Top: Above Left and Right */}
        <Box sx={{ width: "100%" }}>
          <Card.Header style={{ padding: 0 }}>
            <Typography
              component="p"
              variant="overline"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.5,
                py: 0.5,
                borderRadius: "999px",
                backgroundColor: "var(--color-black)",
                color: "var(--color-light-yellow)",
                fontWeight: 800,
                letterSpacing: "0.04em",
                lineHeight: 1.5,
              }}
            >
              TECHNOLOGY OWNERSHIP
            </Typography>
          </Card.Header>
        </Box>

        {/* 2. Hero-Left and Hero-Right on the same line */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            },
            alignItems: "center",
            columnGap: { xs: 4, md: 6, lg: 8 },
            rowGap: { xs: 6, md: 0 },
          }}
        >
          {/* Hero-Left */}
          <Box
            sx={{ width: "100%", minWidth: 0, position: "relative", zIndex: 1 }}
          >
            <HeroIntro />
          </Box>

          {/* Hero-Right */}
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <HeroRight />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
