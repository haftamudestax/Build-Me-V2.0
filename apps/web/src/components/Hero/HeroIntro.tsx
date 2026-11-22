import { Card } from "@build-me/ui";
import { Box, Typography, Button } from "@mui/material";
import { openWorkWithMe } from "../WorkWithMe/openWorkWithMe";
import { openGetQuickWins } from "../GetQuickWins/openGetQuickWins";

export function HeroIntro() {
  return (
    <Card.Body style={{ padding: 0 }}>
      <Box>
        <Typography
          id="hero-title"
          component="h1"
          sx={{
            fontSize: {
              xs: "2.25rem",
              sm: "2.75rem",
              md: "2.9rem",
              lg: "3.25rem",
            },
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#111318",
            maxWidth: "none",
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
          Get more customers with ease with websites and <br />
          apps that are easy to use, look great, and work fast.
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
      </Box>
    </Card.Body>
  );
}
