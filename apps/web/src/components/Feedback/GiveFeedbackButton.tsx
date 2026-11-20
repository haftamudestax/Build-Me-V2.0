import { useState } from "react";
import { Button } from "@mui/material";
import { MessageSquareText } from "lucide-react";

import { GiveFeedbackModal } from "./GiveFeedbackModal";

export function GiveFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  function handleOpen(): void {
    setIsOpen(true);
  }

  function handleClose(): void {
    setIsOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="contained"
        onClick={handleOpen}
        aria-label="Give feedback"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        sx={{
          position: "fixed",
          right: -40,
          top: "70%",
          transform: "translateY(-50%) rotate(90deg)",
          transformOrigin: "center",
          zIndex: 1300,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          minWidth: "auto",
          px: 2,
          py: 1.5,
          borderRadius: "10px 10px 0 0",
          border: "2px solid var(--color-black, #000000)",
          backgroundColor:
            "var(--color-dark-yellow, var(--color-light-yellow, #facc15))",
          color: "var(--color-black, #000000)",
          fontSize: "0.875rem",
          fontWeight: 700,
          textTransform: "none",
          whiteSpace: "nowrap",

          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",

          transition: "background-color 160ms ease, box-shadow 160ms ease",

          "&:hover": {
            backgroundColor: "var(--color-light-yellow, #facc15)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
          },

          "&:focus-visible": {
            outline: "3px solid var(--color-black, #000000)",
            outlineOffset: 3,
          },
        }}
      >
        <MessageSquareText size={18} aria-hidden="true" />
        Give Feedback
      </Button>

      <GiveFeedbackModal open={isOpen} onClose={handleClose} />
    </>
  );
}
