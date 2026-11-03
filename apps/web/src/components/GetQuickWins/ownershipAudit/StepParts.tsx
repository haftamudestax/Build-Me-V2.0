import { Box, Button, Typography } from "@mui/material";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Every step renders these ids, so the dialog always has an accessible name
// and description.
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
        sx={{ overflowWrap: "anywhere" }}
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
        >
          {next.label}
        </Button>
      )}
    </Box>
  );
}
