import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import heroImage from "../../assets/hero-haftamu-hero.webp";
import { ImpactCard } from "./ImpactCard";

// Add more cutouts here to bring the crossfade back.
const images = [heroImage];

export function HeroRight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      component="div"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-end", // he stands on the bottom line, like the mockup
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        pt: { xs: 2, md: 0 },
        pb: { xs: 4, md: 0 },
        pr: { xs: 0, sm: 2, lg: 4 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: { xs: 380, sm: 460, md: 600 },
        }}
      >
        {images.map((img, index) => (
          <Box
            key={img}
            component="img"
            src={img}
            alt="Haftamu Desta"
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              position: index === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              opacity: currentImageIndex === index ? 1 : 0,
              transition: "opacity 1s ease-in-out",
            }}
          />
        ))}
      </Box>

      {/* Desktop Impact Card: overlaps the laptop, like the mockup */}
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          top: { lg: 56 },
          right: { lg: -82 },
          display: { xs: "none", lg: "block" },
          width: 270,
        }}
      >
        <ImpactCard />
      </Box>

      {/* Mobile/Tablet Impact Card */}
      <Box
        sx={{
          display: { xs: "block", lg: "none" },
          position: "absolute",
          right: { xs: 0, sm: 8, md: 16 },
          bottom: 0,
          transform: "translateY(15%)",
          zIndex: 2,
          width: { xs: 250, sm: 270 },
          maxWidth: "100%",
        }}
      >
        <ImpactCard />
      </Box>
    </Box>
  );
}
