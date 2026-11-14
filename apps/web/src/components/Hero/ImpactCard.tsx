import { Box, Card, CardContent, Typography } from "@mui/material";
import { Award, CircleDollarSign, Rocket, Shield } from "lucide-react";

const impactItems = [
  {
    icon: Shield,
    value: "99.9%",
    label: "System Reliability",
    color: "#1746B5",
    background: "#dbeafe",
  },
  {
    icon: Rocket,
    value: "Faster",
    label: "Time to Market",
    color: "#1746B5",
    background: "#e0e7ff",
  },
  {
    icon: CircleDollarSign,
    value: "Lower",
    label: "Operational Costs",
    color: "#1746B5",
    background: "#cffafe",
  },
  {
    icon: Award,
    value: "Stronger",
    label: "Security & Trust",
    color: "#1746B5",
    background: "#ccfbf1",
  },
];

export function ImpactCard() {
  return (
    <Box sx={{ width: { xs: 260, sm: 280 }, maxWidth: "100%" }}>
      {/* Header Container with Handwritten Text and Arrow Aligned to the Top-Right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          mb: 1,
          pr: 1,
        }}
      >
        <span
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
          className="text-xl font-semibold text-light-yellow transform -rotate-2 select-none"
        >
          My Impact in Action
        </span>

        <svg
          className="w-9 h-9 text-light-yellow overflow-visible shrink-0"
          viewBox="0 0 50 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 8 C 25 8, 35 15, 42 32"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M33 27 L44 34 L40 21"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

      <Card
        elevation={0}
        sx={{
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)",
        }}
      >
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {impactItems.map((item) => {
              const Icon = item.icon;

              return (
                <Box
                  key={item.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2.5,
                      backgroundColor: item.background,
                      color: item.color,
                    }}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      component="p"
                      sx={{
                        fontSize: "0.95rem",
                        lineHeight: 1.3,
                        fontWeight: 800,
                        font: "bold",
                        color: "var(--color-light-yellow)",
                      }}
                    >
                      {item.value}
                    </Typography>

                    <Typography
                      component="p"
                      sx={{
                        mt: 0.25,
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                        fontWeight: 500,
                        color: "#64748b",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
