import { Box, LinearProgress, Rating, Typography } from "@mui/material";
import {
  formatReviewCount,
  type ReviewSummaryData,
} from "../../utils/testimonialsData";

export interface CategoryMetric {
  key: string;
  label: string;
  score: number;
}

interface ReviewSummaryProps {
  summary: ReviewSummaryData;
  categories?: CategoryMetric[];
}

const DEFAULT_CATEGORIES: CategoryMetric[] = [
  { key: "projectDelivery", label: "Project Delivery", score: 4.9 },
  { key: "cleanCode", label: "Clean Code", score: 4.9 },
  { key: "value", label: "Value", score: 4.9 },
  { key: "communication", label: "Communication", score: 4.9 },
];

export function ReviewSummary({
  summary,
  categories = DEFAULT_CATEGORIES,
}: ReviewSummaryProps) {
  const { average, count, ratedCount } = summary;

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
        gap: { xs: 2.5, sm: 4 },
        p: { xs: 2.5, sm: 3 },
        maxWidth: 580,
        mx: "auto",
        borderRadius: 3,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "#FAF8F5",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "divider" : "#EFECE6",
      }}
    >
      {/* Left Column: Overall Stats */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          minWidth: 150,
        }}
      >
        {ratedCount > 0 ? (
          <>
            <Typography
              component="p"
              variant="h3"
              data-testid="review-average"
              sx={{ fontWeight: 800, lineHeight: 1 }}
            >
              {average.toFixed(1)}
            </Typography>

            <Rating
              value={average}
              precision={0.1}
              readOnly
              size="small"
              getLabelText={(value) => `${value} out of 5 stars`}
              sx={{ my: 0.5 }}
            />
          </>
        ) : (
          <Typography
            component="p"
            variant="body2"
            data-testid="review-average"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            No ratings yet
          </Typography>
        )}

        <Typography
          component="span"
          variant="subtitle2"
          sx={{ fontWeight: 700 }}
        >
          Overall Experience
        </Typography>

        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          data-testid="review-count"
        >
          {formatReviewCount(count)} Reviews
        </Typography>

        {ratedCount !== count && (
          <Typography component="span" variant="caption" color="text.secondary">
            {formatReviewCount(ratedCount)} with a rating
          </Typography>
        )}
      </Box>

      {/* Right Column: Category Breakdown Bars */}
      <Box
        component="ul"
        aria-label="Review categories breakdown"
        sx={{
          listStyle: "none",
          display: "grid",
          gap: 1,
          width: "100%",
          maxWidth: 300,
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
                gridTemplateColumns: "110px minmax(0, 1fr) 28px",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                component="span"
                variant="caption"
                sx={{ fontWeight: 500 }}
              >
                {cat.label}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={percent}
                aria-label={`${cat.label}: ${cat.score.toFixed(1)} out of 5`}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "rgba(0, 0, 0, 0.06)", // Subtle track color matching cream background
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor: "#F59E0B", // Crisp amber/gold for progress fill
                  },
                }}
              />

              <Typography
                component="span"
                variant="caption"
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
