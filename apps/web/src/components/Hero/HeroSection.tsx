import { useState } from "react";
import { Box, Container } from "@mui/material";
import { HeroIntro } from "./HeroIntro";
import { useVisibilityAnalytics } from "../../hooks/useTracking/useVisibilityAnalytics";

export function HeroSection() {
  const [heroElement, setHeroElement] = useState<HTMLElement | null>(null);

  // Track when the page containing this Hero is entered.
  useVisibilityAnalytics(heroElement, {
    eventName: "page.viewed",
    enabled: true,
  });

  // Track when the Hero section becomes visible.
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
        width: "100%",
        py: { xs: 6, sm: 8, md: 12 },
        backgroundColor: "background.default",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "900px" }}>
          <HeroIntro />
        </Box>
      </Container>
    </Box>
  );
}
