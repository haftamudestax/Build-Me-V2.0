import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Rating,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  formatTestimonialDate,
  getInitials,
  type Testimonial,
} from "../../utils/testimonialsData";

interface TestimonialDetailsProps {
  testimonial: Testimonial;
  open: boolean;
  onClose: () => void;
}

export function TestimonialDetails({
  testimonial,
  open,
  onClose,
}: TestimonialDetailsProps) {
  const { author, role, quote, rating, date } = testimonial;
  const formattedDate = formatTestimonialDate(date);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="testimonial-dialog-title"
      scroll="paper"
    >
      <DialogTitle
        id="testimonial-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pr: 2,
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
          Full testimonial
        </Typography>

        <IconButton
          aria-label="Close testimonial"
          onClick={onClose}
          edge="end"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {rating !== undefined && (
            <Rating value={rating} readOnly precision={0.5} />
          )}

          <Typography
            component="blockquote"
            variant="body1"
            sx={{
              m: 0,
              lineHeight: 1.8,
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
            }}
          >
            &ldquo;{quote}&rdquo;
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Avatar aria-hidden="true">{getInitials(author)}</Avatar>

            <Box>
              <Typography sx={{ fontWeight: 700 }}>{author}</Typography>

              <Typography variant="body2" color="text.secondary">
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
      </DialogContent>
    </Dialog>
  );
}
