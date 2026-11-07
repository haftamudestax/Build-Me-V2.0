import { useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import type { CaseStudy } from "./caseStudiesData";

interface CaseStudyCardProps {
  items: CaseStudy[];
}

interface CaseStudyItemProps {
  service: CaseStudy;
}

function CaseStudyItem({ service }: CaseStudyItemProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  return (
    <>
      {/* Case Study Card */}
      <Box
        component="article"
        data-testid="case-study-card"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
          p: 3,
          minWidth: 0,
          height: "100%",
          boxSizing: "border-box",

          // Soft off-white background
          bgcolor: "#FAF8F5",

          // Border and rounded corners
          border: 1,
          borderColor: "#E2E8F0",
          borderRadius: 3,

          // Subtle elevation and smooth hover animation
          boxShadow: 1,
          transform: "translateY(0)",
          transition:
            "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",

          "&:hover": {
            transform: "translateY(-6px)",
            bgcolor: "#F8FAFC",
            borderColor: "primary.main",
            boxShadow: 4,
          },
        }}
      >
        {/* Service Icon */}
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 2,
            bgcolor: "action.selected",
            color: "primary.main",
            "& svg": {
              fontSize: 26,
            },
          }}
        >
          {service.icon}
        </Box>

        {/* Service Title */}
        <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
          {service.title}
        </Typography>

        {/* Truncated Description */}
        <Typography
          component="p"
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {service.description}
        </Typography>

        {/* Read More */}
        <Button
          variant="text"
          size="small"
          onClick={handleOpen}
          endIcon={<ArrowForwardIcon />}
          aria-label={`Read full description of ${service.title}`}
          sx={{
            alignSelf: "flex-start",
            px: 0,
            mt: "auto",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Read more
        </Button>
      </Box>

      {/* Full Description Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby={`case-study-dialog-${service.id}`}
        scroll="paper"
      >
        <DialogTitle
          id={`case-study-dialog-${service.id}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            pr: 2,
          }}
        >
          {/* Service Icon */}
          <Avatar
            variant="rounded"
            sx={{
              width: 44,
              height: 44,
              bgcolor: "action.selected",
              color: "primary.main",
              "& svg": {
                fontSize: 24,
              },
            }}
          >
            {service.icon}
          </Avatar>

          {/* Dialog Title */}
          <Typography
            component="span"
            variant="h6"
            sx={{
              fontWeight: 700,
              flex: 1,
              minWidth: 0,
            }}
          >
            {service.title}
          </Typography>

          {/* Close Button */}
          <IconButton
            aria-label="Close description"
            onClick={handleClose}
            edge="end"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {service.description}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CaseStudyCard({ items }: CaseStudyCardProps) {
  return (
    <>
      {items.map((service) => (
        <CaseStudyItem key={service.id} service={service} />
      ))}
    </>
  );
}
