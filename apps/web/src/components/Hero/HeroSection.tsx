import { useState } from "react";
import { Box, Container } from "@mui/material";
import { HeroIntro } from "./HeroIntro";
import { HeroRight } from "./HeroRight";
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
        position: "relative",
        width: "100%",
        overflow: "hidden",
        py: { xs: 6, sm: 8, md: 12 },
        backgroundColor: "background.default",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          },
          alignItems: "center",
          columnGap: { xs: 4, md: 6, lg: 8 },
          rowGap: { xs: 8, md: 0 },
        }}
      >
        {/* Left: hero introduction and calls to action */}
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          <HeroIntro />
        </Box>

        {/* Right: profile image and floating impact card */}
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
      </Container>
    </Box>
  );
}
