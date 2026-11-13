import { Box, Button, Typography } from "@mui/material";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const TITLE_ID = "get-quick-wins-title";
export const DESCRIPTION_ID = "get-quick-wins-description";

interface StepHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <Box component="header" sx={{ flexShrink: 0 }}>
      {eyebrow && (
        <Typography variant="overline" color="text.secondary">
          {eyebrow}
        </Typography>
      )}

      <Typography
        id={TITLE_ID}
        variant="h5"
        component="h2"
        gutterBottom
        sx={{
          overflowWrap: "anywhere",
          color: "var(--color-dark-yellow)",
          fontWeight: 700,
          font: "bold",
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography id={DESCRIPTION_ID} variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
}

interface FooterAction {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

interface StepFooterProps {
  previous?: FooterAction;
  next?: FooterAction;
}

export function StepFooter({ previous, next }: StepFooterProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column-reverse", sm: "row" },
        justifyContent: previous ? "space-between" : "flex-end",
        alignItems: { xs: "stretch", sm: "center" },
        gap: 1.5,
        pt: 1,
      }}
    >
      {previous && (
        <Button
          type="button"
          variant="outlined"
          startIcon={<ArrowLeft size={16} aria-hidden="true" />}
          onClick={previous.onClick}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "var(--color-dark-yellow)",
            color: "var(--color-black)",
            bgcolor: "var(--color-dark-yellow)",
            py: 1.25,
            px: 3,
            borderRadius: "8px",
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "none",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "var(--color-light-yellow)",
              bgcolor: "var(--color-light-yellow)",
              boxShadow: "0 4px 12px rgba(247, 183, 51, 0.25)",
              transform: "translateY(-1px)",
            },
          }}
        >
          {previous.label}
        </Button>
      )}

      {next && (
        <Button
          type={next.type ?? "button"}
          variant="contained"
          endIcon={<ArrowRight size={16} aria-hidden="true" />}
          onClick={next.onClick}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "var(--color-light-yellow)",
            color: "var(--color-black)",
            bgcolor: "var(--color-light-yellow)",
            py: 1.25,
            px: 3,
            borderRadius: "8px",
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "none",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "var(--color-dark-yellow)",
              bgcolor: "var(--color-dark-yellow)",
              boxShadow: "0 4px 12px rgba(247, 183, 51, 0.25)",
              transform: "translateY(-1px)",
            },
          }}
        >
          {next.label}
        </Button>
      )}
    </Box>
  );
}
