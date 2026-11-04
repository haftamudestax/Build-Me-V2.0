import { Box, Card, CardContent, Typography } from "@mui/material";
import { Award, CircleDollarSign, Rocket, Shield } from "lucide-react";

const impactItems = [
  {
    icon: Shield,
    value: "99.9%",
    label: "System Reliability",
    color: "#2563eb",
    background: "#dbeafe",
  },
  {
    icon: Rocket,
    value: "Faster",
    label: "Time to Market",
    color: "#4f46e5",
    background: "#e0e7ff",
  },
  {
    icon: CircleDollarSign,
    value: "Lower",
    label: "Operational Costs",
    color: "#0891b2",
    background: "#cffafe",
  },
  {
    icon: Award,
    value: "Stronger",
    label: "Security & Trust",
    color: "#0d9488",
    background: "#ccfbf1",
  },
];

export function ImpactCard() {
  return (
    <Box sx={{ width: { xs: 250, sm: 270 }, maxWidth: "100%" }}>
      <Typography
        component="p"
        sx={{
          mb: 1.5,
          pr: 1,
          textAlign: "right",
          fontFamily: "Georgia, serif",
          fontSize: "1.05rem",
          fontStyle: "italic",
          fontWeight: 700,
          color: "#059669",
        }}
      >
        My Impact in Action ↘
      </Typography>

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
                        color: "#0f172a",
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
