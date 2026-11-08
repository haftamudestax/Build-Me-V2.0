import { useState } from "react";
import { Avatar, Box, Button, Rating, Typography } from "@mui/material";
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
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "background.paper",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: 2,
          },
        }}
      >
        {rating !== undefined && (
          <Rating value={rating} readOnly size="small" />
        )}

        <Typography
          component="blockquote"
          variant="body2"
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
          }}
        >
          Read full review
        </Button>

        <Box
          component="footer"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mt: "auto",
            pt: 1.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Avatar
            aria-hidden="true"
            sx={{ width: 40, height: 40, fontSize: "0.95rem" }}
          >
            {getInitials(author)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
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
      </Box>

      <TestimonialDetails
        testimonial={testimonial}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
