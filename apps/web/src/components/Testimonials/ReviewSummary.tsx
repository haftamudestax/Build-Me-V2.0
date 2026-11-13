import { Box, LinearProgress, Rating, Typography } from "@mui/material";
import {
  type ReviewSummaryData,
  type CategoryMetric,
  DEFAULT_CATEGORIES,
} from "../../utils/testimonialsData";

interface ReviewSummaryProps {
  summary: ReviewSummaryData;
  categories?: CategoryMetric[];
}

export function ReviewSummary({
  summary,
  categories = summary.categories || DEFAULT_CATEGORIES,
}: ReviewSummaryProps) {
  const { average, displayReviewText } = summary;

  return (
    <Box
      component="section"
      aria-label="Review summary"
      data-testid="review-summary"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 3, sm: 6 },
        p: { xs: 2.5, sm: 4 },
        maxWidth: 920,
        mx: "auto",
        borderRadius: 3,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "#FAF8F5",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "divider" : "#1746B5",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          minWidth: 160,
        }}
      >
        <Typography
          component="p"
          variant="h2"
          data-testid="review-average"
          sx={{ fontWeight: 800, lineHeight: 1, mb: 0.5 }}
        >
          {average.toFixed(1)}
        </Typography>

        <Rating
          value={5}
          readOnly
          size="medium"
          getLabelText={() => "5 out of 5 stars"}
          sx={{ my: 0.5, color: "#F59E0B" }}
        />

        <Typography
          component="span"
          variant="subtitle1"
          sx={{ fontWeight: 700, mt: 0.5 }}
        >
          Overall Experience
        </Typography>

        <Typography
          component="span"
          variant="body2"
          sx={{ fontWeight: 700, mt: 0.5 }}
          data-testid="review-count"
        >
          {displayReviewText ?? "0.0 Reviews"}
        </Typography>
      </Box>

      <Box
        component="ul"
        aria-label="Review categories breakdown"
        sx={{
          listStyle: "none",
          display: "grid",
          gap: 1.5,
          width: "100%",
          maxWidth: 320,
          m: 0,
          p: 0,
        }}
      >
        {categories.map((cat) => {
          const percent = (cat.score / 5) * 100;

          return (
            <Box
              component="li"
              key={cat.key}
              sx={{
                display: "grid",
                gridTemplateColumns: "120px minmax(0, 1fr) 32px",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                {cat.label}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={percent}
                aria-label={`${cat.label}: ${cat.score.toFixed(1)} out of 5`}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(0, 0, 0, 0.06)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: "#F59E0B",
                  },
                }}
              />

              <Typography
                component="span"
                variant="body2"
                sx={{ fontWeight: 600 }}
                align="right"
              >
                {cat.score.toFixed(1)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
