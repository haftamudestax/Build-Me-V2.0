import { Box, Container } from "@mui/material";
import { HeroIntro } from "./HeroIntro";

export function HeroSection() {
  return (
    <Box
      component="section"
      id="hero"
      aria-labelledby="hero-title"
      sx={{
        width: "100%",
        py: {
          xs: 6,
          sm: 8,
          md: 12,
        },
        backgroundColor: "background.default",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
          }}
        >
          <HeroIntro />
        </Box>
      </Container>
    </Box>
  );
}
