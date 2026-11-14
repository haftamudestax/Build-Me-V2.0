import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import heroImage from "../../assets/hero-haftamu.png";
import heroImage1 from "../../assets/hero-haftamu1.png";
import { ImpactCard } from "./ImpactCard";

export function HeroRight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [heroImage, heroImage1];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

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
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          overflow: "hidden",
          borderRadius: { xs: 4, md: 5 },
          boxShadow: "0 25px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        {images.map((img, index) => (
          <Box
            key={index}
            component="img"
            src={img}
            alt="Haftamu Desta"
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: { md: 570 },
              objectFit: "cover",
              objectPosition: "center",
              // Positions images on top of each other and handles smooth crossfade
              position: index === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              opacity: currentImageIndex === index ? 1 : 0,
              transition: "opacity 1s ease-in-out",
            }}
          />
        ))}
      </Box>

      {/* Desktop Impact Card Overlay */}
      <Box
        sx={{
          position: "absolute",
          zIndex: 2,
          top: { lg: 48 },
          right: { lg: -150 },
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
