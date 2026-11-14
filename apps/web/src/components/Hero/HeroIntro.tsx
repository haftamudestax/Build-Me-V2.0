import { Card } from "@build-me/ui";
import { Box, Typography, Button } from "@mui/material";
import { CheckSquare2 } from "lucide-react";
import { openWorkWithMe } from "../WorkWithMe/openWorkWithMe";
import { openGetQuickWins } from "../GetQuickWins/openGetQuickWins";

const heroKeyFacts = [
  "No Stress",
  "No Confusion",
  "No Jargons",
  "Just Simple",
] as const;

export function HeroIntro() {
  return (
    <main>
      <Card.Body style={{ padding: 0 }}>
        <Box>
          {/* Hero-Left: Heading (2 lines) */}
          <Typography
            id="hero-title"
            component="h1"
            sx={{
              fontSize: { xs: "2.5rem", sm: "3rem", md: "3.75rem" },
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#111318",
              maxWidth: "18ch",
              mb: 2,
            }}
          >
            Build Better{" "}
            <Box
              component="span"
              sx={{
                display: "block",
                color: "var(--color-dark-yellow)",
              }}
            >
              Digital Experiences
            </Box>
          </Typography>

          {/* Hero-Left: Subheading (2 lines) */}
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.05rem", md: "1.2rem" },
              fontWeight: 750,
              lineHeight: 1.5,
              color: "#111318",
              maxWidth: "38ch",
              mb: 2.5,
            }}
          >
            Simple, fast, and beautiful platforms that win and get real results
          </Typography>

          {/* Hero-Left: Paragraph (3 lines) */}
          <Typography
            component="p"
            sx={{
              maxWidth: "full",
              color: "#30343B",
              fontSize: { xs: "1rem", md: "1.0625rem" },
              lineHeight: 1.65,
              mb: 3,
            }}
          >
            Get a dedicated developer who turns your ideas into polished,
            high-speed websites and apps. Designed for simplicity and built to
            convert, so you can focus on growing your business without technical
            headaches.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Button
              type="button"
              variant="contained"
              onClick={() => openWorkWithMe()}
              aria-haspopup="dialog"
              className="rounded-lg bg-dark-yellow! px-6 py-3 font-bold normal-case text-black! hover:bg-light-yellow!"
            >
              Work with Me
            </Button>
            <Button
              type="button"
              variant="contained"
              onClick={openGetQuickWins}
              aria-haspopup="dialog"
              className="rounded-lg bg-dark-yellow! px-6 py-3 font-bold normal-case text-black! hover:bg-light-yellow!"
            >
              Get Quick Wins
            </Button>
          </Box>

          <Box
            component="section"
            aria-label="Key value propositions"
            sx={{
              mt: 4,
              pt: 3,
              borderTop: "1px solid rgba(17, 19, 24, 0.1)",
              maxWidth: "42ch",
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                fontWeight: 750,
                color: "var(--color-light-yellow)",
                letterSpacing: "-0.01em",
                mb: 1.75,
                font: "bold",
                whiteSpace: { sm: "nowrap" },
              }}
            >
              Reliable solutions that help you grow.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.25,
              }}
            >
              {heroKeyFacts.map((fact) => (
                <Box
                  key={fact}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.5,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor:
                      "color-mix(in srgb, var(--color-light-yellow) 14%, var(--color-white))",
                    border:
                      "1px solid color-mix(in srgb, var(--color-dark-yellow) 35%, transparent)",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-dark-yellow)",
                      flexShrink: 0,
                    }}
                  >
                    <CheckSquare2
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Box>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.925rem",
                      fontWeight: 700,
                      color: "#111318",
                      lineHeight: 1.3,
                    }}
                  >
                    {fact}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Card.Body>
    </main>
  );
}
