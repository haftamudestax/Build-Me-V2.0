import { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import { Gift } from "lucide-react";

import { ReferralModal } from "./ReferralModal";

export function ReferralButton() {
  const [isOpen, setIsOpen] = useState(false);

  function openModal(): void {
    setIsOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        onClick={openModal}
        aria-haspopup="dialog"
        aria-label="Give Referrals. Help others grow with us."
        disableRipple
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1.25,
          width: 170,
          minWidth: 170,
          minHeight: 76,
          px: 1.5,
          py: 1.25,
          borderRadius: 1,
          color: "text.primary",
          backgroundColor: "transparent",
          textTransform: "none",
          textAlign: "left",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <Gift size={30} strokeWidth={1.8} color="#22A653" aria-hidden="true" />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.15,
            whiteSpace: "nowrap",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 700,
              lineHeight: 1.3,
              color: "#22A653",
            }}
          >
            Give Referrals
          </Typography>

          <Typography
            component="span"
            sx={{
              fontSize: "0.65rem",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "text.primary",
            }}
          >
            Help others grow with me.
          </Typography>
        </Box>
      </Button>

      <ReferralModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
