import { useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import { Card } from "@build-me/ui";
import { HeroIntro } from "./HeroIntro";
import { HeroRight } from "./HeroRight";
import { HeroValueStrip } from "./HeroValueStrip";
import { useVisibilityAnalytics } from "../../hooks/useTracking/useVisibilityAnalytics";
import heroBg from "../../assets/hero-background.png";

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
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 0,
          right: 0,

          bottom: "250px",
          width: { xs: "100%", sm: "72%", md: "58%" },
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          opacity: { xs: 0.45, md: 1 },
          pointerEvents: "none",
          zIndex: 0,
          maskImage: "linear-gradient(to bottom, #000 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 80%, transparent 100%)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            width: "100%",
            mb: { xs: 3, md: 4 },
            px: { xs: 2, sm: 3, md: 4 },
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <Card.Header style={{ padding: 0 }}>
            <Typography
              component="label"
              variant="overline"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 2,
                py: 0.5,
                borderRadius: "9999px",
                border: "1.5px solid var(--color-black)",
                boxShadow: "none",
                backgroundColor:
                  "color-mix(in srgb, var(--color-dark-yellow) 20%, var(--color-light-yellow))",
                color: "var(--color-black)",
                fontWeight: 800,
                letterSpacing: "0.04em",
                lineHeight: 1.5,
              }}
            >
              TECHNOLOGY OWNERSHIP
            </Typography>
          </Card.Header>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            },
            alignItems: "end",
            columnGap: { xs: 4, md: 6, lg: 8 },
            rowGap: { xs: 6, md: 0 },
            mb: { xs: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              position: "relative",
              zIndex: 1,
              alignSelf: "center", // text stays vertically centred
              pb: { md: 4 },
            }}
          >
            <HeroIntro />
          </Box>
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
        <HeroValueStrip />
      </Container>
    </Box>
  );
}
