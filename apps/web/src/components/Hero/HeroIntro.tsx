import { Card } from "@build-me/ui";
import { Box, Typography } from "@mui/material";
import { WorkWithMeModal } from "../WorkWithMe/WorkWithMeModal";

export function HeroIntro() {
  return (
    <main>
      <Card.Header>
        <Typography
          component="p"
          variant="overline"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.5,
            py: 0.5,
            borderRadius: "999px",
            backgroundColor: "#DCE8FF",
            color: "#1746A2",
            fontWeight: 800,
            letterSpacing: "0.04em",
            lineHeight: 1.5,
          }}
        >
          TECHNOLOGY OWNERSHIP
        </Typography>
      </Card.Header>

      <Card.Body>
        <Box>
          <Typography
            id="hero-title"
            component="h1"
            sx={{
              fontSize: { xs: "2.5rem", sm: "3rem", md: "4rem" },
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
                color: "#1746B5",
              }}
            >
              Digital Experiences
            </Box>
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.05rem", md: "1.25rem" },
              fontWeight: 750,
              lineHeight: 1.5,
              color: "#111318",
              maxWidth: "38ch",
              mb: 2.5,
            }}
          >
            Simple, fast, and beautiful platforms that win and get real results
          </Typography>
          <Typography
            component="p"
            sx={{
              maxWidth: "38ch",
              color: "#30343B",
              fontSize: { xs: "1rem", md: "1.0625rem" },
              lineHeight: 1.65,
            }}
          >
            Websites and apps that are easy to use,
            <br />
            look great, and work fast.
            <br />
            Get more customers with ease.
            <br />
            No stress, no confusion — just simple,
            <br />
            reliable solutions that help you grow.
          </Typography>
          <WorkWithMeModal />
        </Box>
      </Card.Body>
    </main>
  );
}
