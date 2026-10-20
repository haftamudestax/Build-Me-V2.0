import { Box } from "@mui/material";
import heroImage from "../../assets/hero-person.png";
import { ImpactCard } from "./ImpactCard";

export function HeroRight() {
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
        <Box
          component="img"
          src={heroImage}
          alt="Haftamu Desta"
          sx={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: { md: 570 },
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </Box>

      {/* Floating impact card — large desktop only */}
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

      {/* Compact impact card — mobile and iPad */}
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
