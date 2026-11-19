import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import heroImage from "../../assets/hero-haftamu-nodesk.webp";
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
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        pt: { xs: 2, md: 0 },
        pb: { xs: 2, md: 0 },
        pr: { xs: 0, sm: 2, lg: 4 },
      }}
    >
      {/* No card: no background, border radius, clipping or shadow, so the
          cutout sits straight on the map. */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: { xs: 420, md: 560 },
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
              // The first image sets the size; others sit on top of it.
              position: index === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              opacity: currentImageIndex === index ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              // A soft shadow that follows the cutout, not a box.
              filter: "drop-shadow(0 18px 28px rgba(15, 23, 42, 0.18))",
            }}
          />
        ))}
      </Box>

      {/* Desktop Impact Card Overlay */}
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          top: { lg: 24 },
          right: { lg: -170 },
          display: { xs: "none", lg: "block" },
          width: 270,
        }}
      >
        <ImpactCard />
      </Box>

      {/* Mobile/Tablet Impact Card Overlay */}
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
