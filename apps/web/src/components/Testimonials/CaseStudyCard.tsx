import { useEffect, useState, type ReactNode } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import XIcon from "@mui/icons-material/X";

import {
  openWorkWithMe,
  type WorkWithMePath,
} from "../WorkWithMe/openWorkWithMe";

import type { CaseStudy } from "./caseStudiesData";

interface CaseStudyCardProps {
  items: CaseStudy[];
}

interface CaseStudyItemProps {
  service: CaseStudy;
}

interface ShareLink {
  label: string;
  href: string;
  icon: ReactNode;
  external: boolean;
}

type CopyState = "idle" | "copied" | "failed";

const caseStudyPaths: Record<string, WorkWithMePath> = {
  "deliver-project": "delivery",
  "mentor-me": "mentor",
  "coffee-with-me": "coffee",
};

const caseStudyCtaLabels: Record<WorkWithMePath, string> = {
  delivery: "Submit Your Project",
  mentor: "Submit Mentorship request",
  coffee: "Let's Talk",
};

// Colours come from the site's own palette.
const cream =
  "color-mix(in srgb, var(--color-light-yellow) 14%, var(--color-white))";
const creamBorder =
  "color-mix(in srgb, var(--color-light-yellow) 30%, var(--color-white))";
const badgeBackground =
  "color-mix(in srgb, var(--color-light-yellow) 28%, var(--color-white))";

const primaryButtonSx = {
  bgcolor: "var(--color-light-yellow)",
  color: "#111318",
  fontWeight: 800,
  boxShadow: "none",
  borderRadius: 1,
  "&:hover": {
    bgcolor: "var(--color-dark-yellow)",
    boxShadow: "none",
  },
} as const;

const squareButtonSx = {
  width: 44,
  height: 44,
  border: 1,
  borderColor: creamBorder,
  borderRadius: 0.5,
  color: "#111318",
  "&:hover": { bgcolor: cream, borderColor: "var(--color-light-yellow)" },
} as const;

function getShareUrl(id: string): string {
  const { origin, pathname } = window.location;

  return `${origin}${pathname}#case-study-${id}`;
}

function buildShareLinks(title: string, url: string): ShareLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <XIcon fontSize="small" />,
      external: true,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon fontSize="small" />,
      external: true,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedInIcon fontSize="small" />,
      external: true,
    },
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <WhatsAppIcon fontSize="small" />,
      external: true,
    },
  ];
}

function StoryHeader({ study }: { study: CaseStudy }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={{
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 0.5,
          bgcolor: badgeBackground,
          color: "#111318",
          fontSize: "1.125rem",
          fontWeight: 800,
          "& svg": { fontSize: 28 },
        }}
      >
        {study.badge ?? study.icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="p"
          sx={{ fontWeight: 700, lineHeight: 1.3, color: "#111318" }}
        >
          {study.name}
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{ color: "#30343B", lineHeight: 1.4 }}
        >
          {study.meta}
        </Typography>
      </Box>
    </Box>
  );
}

function TagList({ tags, uppercase }: { tags: string[]; uppercase?: boolean }) {
  return (
    <Box
      component="ul"
      aria-label="Topics"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        m: 0,
        p: 0,
        listStyle: "none",
      }}
    >
      {tags.map((tag) => (
        <Box
          component="li"
          key={tag}
          sx={{
            px: 1.5,
            py: 0.75,
            bgcolor: cream,
            color: "#111318",
            fontSize: uppercase ? "0.75rem" : "0.8125rem",
            fontWeight: 700,
            letterSpacing: uppercase ? "0.04em" : 0,
            textTransform: uppercase ? "uppercase" : "none",
            lineHeight: 1.2,
          }}
        >
          {tag}
        </Box>
      ))}
    </Box>
  );
}

function CaseStudyItem({ service }: CaseStudyItemProps) {
  // A shared link (#case-study-<id>) opens that story straight away.
  const [open, setOpen] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.location.hash === `#case-study-${service.id}`,
  );
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState === "idle") return;

    const timer = setTimeout(() => setCopyState("idle"), 2000);

    return () => clearTimeout(timer);
  }, [copyState]);

  const path = caseStudyPaths[service.id];
  const titleId = `case-study-dialog-${service.id}`;
  const shareUrl = open ? getShareUrl(service.id) : "";
  const shareLinks = open ? buildShareLinks(service.title, shareUrl) : [];

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  const handleCtaClick = (): void => {
    if (!path) return;

    handleClose();
    openWorkWithMe(path);
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const copyLabel =
    copyState === "copied"
      ? "Link copied"
      : copyState === "failed"
        ? "Copy failed"
        : "Copy Link";

  const hasResults = Boolean(service.results?.length);

  return (
    <>
      <Box
        component="article"
        id={`case-study-${service.id}`}
        data-testid="case-study-card"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: { xs: 2.5, md: 3 },
          minWidth: 0,
          height: "100%",
          boxSizing: "border-box",
          bgcolor: "var(--color-white)",
          border: 1,
          borderColor: creamBorder,
          borderRadius: 1,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
          transform: "translateY(0)",
          transition:
            "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            borderColor:
              "color-mix(in srgb, var(--color-dark-yellow) 60%, transparent)",
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
          },
        }}
      >
        <StoryHeader study={service} />

        <TagList tags={service.tags} uppercase />

        <Typography
          component="h3"
          sx={{
            fontSize: "1.25rem",
            fontWeight: 800,
            lineHeight: 1.3,
            color: "#111318",
          }}
        >
          {service.title}
        </Typography>

        <Typography
          component="p"
          variant="body2"
          sx={{
            color: "#30343B",
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {service.summary}
        </Typography>

        {service.highlight && (
          <Box
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: cream,
              color: "#111318",
              textAlign: "center",
              fontSize: "0.8125rem",
              fontWeight: 800,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {service.highlight}
          </Box>
        )}

        <Button
          type="button"
          variant="contained"
          fullWidth
          onClick={handleOpen}
          aria-label={`Read full story: ${service.title}`}
          sx={{
            ...primaryButtonSx,
            mt: "auto",
            py: 1.5,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Read full story
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        aria-labelledby={titleId}
        scroll="paper"
        slotProps={{ paper: { sx: { borderRadius: 1 } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            pb: 1.5,
            fontSize: "1.375rem",
            fontWeight: 800,
            lineHeight: 1.3,
          }}
        >
          <Box component="span" id={titleId} sx={{ flex: 1, minWidth: 0 }}>
            {service.title}
          </Box>

          <IconButton
            aria-label="Close story"
            onClick={handleClose}
            edge="end"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <StoryHeader study={service} />

            <TagList tags={service.tags} />

            {service.sections.map((section) => (
              <Box key={section.heading}>
                <Typography
                  component="h3"
                  sx={{
                    fontSize: "1.0625rem",
                    fontWeight: 800,
                    color: "#111318",
                    mb: 0.5,
                  }}
                >
                  {section.heading}
                </Typography>
                <Typography
                  component="p"
                  sx={{
                    color: "#30343B",
                    lineHeight: 1.7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {section.body}
                </Typography>
              </Box>
            ))}

            {hasResults && (
              <Box>
                <Typography
                  component="h3"
                  sx={{
                    fontSize: "1.0625rem",
                    fontWeight: 800,
                    color: "#111318",
                    mb: 1.5,
                  }}
                >
                  Key Results
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(auto-fit, minmax(150px, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {service.results?.map((result) => (
                    <Box
                      key={result.label}
                      sx={{ bgcolor: cream, p: 2.5, textAlign: "center" }}
                    >
                      <Typography
                        component="p"
                        sx={{
                          color: "var(--color-dark-yellow)",
                          fontSize: "1.75rem",
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        {result.value}
                      </Typography>
                      <Typography
                        component="p"
                        variant="body2"
                        sx={{ color: "#111318" }}
                      >
                        {result.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              component="hr"
              sx={{ m: 0, border: 0, borderTop: 1, borderColor: creamBorder }}
            />

            <Box>
              <Typography
                component="h3"
                sx={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  color: "#111318",
                  mb: 1.5,
                }}
              >
                Share this story
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {shareLinks.map((link) => (
                    <IconButton
                      key={link.label}
                      component="a"
                      href={link.href}
                      aria-label={link.label}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      sx={squareButtonSx}
                    >
                      {link.icon}
                    </IconButton>
                  ))}
                </Box>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCopy}
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#111318",
                    borderColor: creamBorder,
                    borderRadius: 0.5,
                    "&:hover": {
                      bgcolor: cream,
                      borderColor: "var(--color-light-yellow)",
                    },
                  }}
                >
                  <span aria-live="polite">{copyLabel}</span>
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {path ? (
            <Button
              type="button"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleCtaClick}
              sx={{
                ...primaryButtonSx,
                px: 3,
                py: 1.25,
                textTransform: "none",
              }}
            >
              {caseStudyCtaLabels[path]}
            </Button>
          ) : (
            <Button
              component="a"
              href={service.ctaHref}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleClose}
              sx={{
                ...primaryButtonSx,
                px: 3,
                py: 1.25,
                textTransform: "none",
              }}
            >
              {service.ctaLabel}
            </Button>
          )}

          <Button
            type="button"
            variant="outlined"
            onClick={handleClose}
            sx={{
              px: 3,
              py: 1.25,
              textTransform: "none",
              fontWeight: 700,
              color: "#111318",
              borderColor: creamBorder,
              borderRadius: 1,
              "&:hover": {
                bgcolor: cream,
                borderColor: "var(--color-light-yellow)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
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
