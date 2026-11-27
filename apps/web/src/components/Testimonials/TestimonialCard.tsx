import { useState } from "react";
import { Avatar, Box, Button, Chip, Rating, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import {
  formatTestimonialDate,
  getInitials,
  type Testimonial,
} from "../../utils/testimonialsData";

import { TestimonialDetails } from "./TestimonialDetails";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const testimonialCategories = [
  "Project Client",
  "Business Owner",
  "Technology Partner",
];

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const [open, setOpen] = useState(false);

  const { author, role, quote, rating, date } = testimonial;
  const formattedDate = formatTestimonialDate(date);

  return (
    <>
      <Box
        component="article"
        aria-label={`Testimonial from ${author}`}
        data-testid="testimonial-card"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          p: 2.5,
          border: 1,
          borderColor: "var(--color-dark-yellow)",
          borderRadius: 2,
          bgcolor: "#FFFFFF",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover": {
            borderColor: "var(--color-black)",
            boxShadow: 2,
            bgcolor: "#FAF8F5",
          },
        }}
      >
        {/* Author information */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Avatar
            aria-hidden="true"
            sx={{
              width: 50,
              height: 50,
              borderRadius: 0,
              bgcolor: "var(--color-light-yellow)",
              color: "var(--color-black)",
              fontWeight: 700,
            }}
          >
            {getInitials(author)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                overflowWrap: "anywhere",
              }}
            >
              {author}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {role}
            </Typography>

            {formattedDate && (
              <Typography
                component="time"
                dateTime={date}
                variant="caption"
                color="text.secondary"
              >
                {formattedDate}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Three professional categories */}
        <Box
          role="group"
          aria-label="Professional categories"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          {testimonialCategories.map((category) => (
            <Chip
              key={category}
              label={category}
              size="small"
              sx={{
                borderRadius: 0,
                bgcolor: "#FAF3E5",
                color: "var(--color-black)",
                fontWeight: 600,
                fontSize: "0.75rem",
                "& .MuiChip-label": {
                  px: 1.25,
                },
              }}
            />
          ))}
        </Box>

        {/* Star rating */}
        <Rating
          value={rating ?? 5}
          readOnly
          size="small"
          aria-label={`${rating ?? 5} out of 5 stars`}
          sx={{
            color: "#F59E0B",
          }}
        />

        {/* Testimonial content */}
        <Typography
          component="blockquote"
          variant="body1"
          sx={{
            m: 0,
            lineHeight: 1.7,
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          &ldquo;{quote}&rdquo;
        </Typography>

        {/* Read full review */}
        <Button
          variant="text"
          size="small"
          onClick={() => setOpen(true)}
          endIcon={<ArrowForwardIcon />}
          aria-label={`Read full review from ${author}`}
          sx={{
            alignSelf: "flex-start",
            px: 0,
            textTransform: "none",
            fontWeight: 700,
            color: "var(--color-dark-yellow)",
          }}
        >
          Read full review
        </Button>
      </Box>

      <TestimonialDetails
        testimonial={testimonial}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
