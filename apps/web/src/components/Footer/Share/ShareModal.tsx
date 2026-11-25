import { useEffect, useRef, useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";

interface ShareModalProps {
  isOpen: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

type ShareChannel = "x" | "facebook" | "linkedin" | "whatsapp" | "telegram";
const webUrl = "https://haftamu-desta.vercel.app/";
const shareChannels: {
  id: ShareChannel;
  label: string;
  description: string;
  getUrl: (url: string, title: string) => string;
  className: string;
}[] = [
  {
    id: "x",
    label: "X",
    description: "Share on X",
    getUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    className: "bg-black text-white",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Share on Facebook",
    getUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    className: "bg-[#1877F2] text-white",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Share on LinkedIn",
    getUrl: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    className: "bg-[#0A66C2] text-white",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Share on WhatsApp",
    getUrl: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    className: "bg-[#25D366] text-white",
  },
  {
    id: "telegram",
    label: "Telegram",
    description: "Share on Telegram",
    getUrl: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    className: "bg-[#229ED9] text-white",
  },
];

export function ShareModal({ isOpen, url, title, onClose }: ShareModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("Unable to copy the link. Please copy it manually.");
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;

    try {
      await navigator.share({ title, url });
      setError("");
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") {
        setError("Unable to open the sharing menu. Try another option.");
      }
    }
  }

  return (
    <Box
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0, 0, 0, 0.5)",
        px: 2,
        py: 3,
      }}
    >
      <Box
        component="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        aria-describedby="share-modal-description"
        sx={{
          width: "100%",
          maxWidth: "28rem",
          borderRadius: "1rem",
          p: 3,
          boxShadow: 24,
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              id="share-modal-title"
              component="h2"
              sx={{ fontSize: "1.25rem", fontWeight: 700, color: "#000000" }}
            >
              Share this page
            </Typography>
          </Box>
          <IconButton
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            sx={{
              borderRadius: "9999px",
              p: 1,
              color: "var(--color-light-yellow)",
              transition: "all 150ms",
              "&:hover": {
                bgcolor: "#f3f4f6",
                color: "#111827",
              },
              "&:focus-visible": {
                outline: "none",
                boxShadow: "0 0 0 2px var(--color-dark-yellow)",
              },
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: "1.25rem", height: "1.25rem" }}
              aria-hidden="true"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </IconButton>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 1.5,
            }}
          >
            {shareChannels.map((channel) => (
              <Box
                key={channel.id}
                component="a"
                href={channel.getUrl(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={channel.description}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: "0.75rem",
                  p: 1.5,
                  textAlign: "center",
                  textDecoration: "none",
                  transition: "all 150ms",
                  border: "2px solid currentColor",
                  borderColor: "#000000",
                  bgcolor:
                    "color-mix(in srgb, var(--color-dark-yellow) 40%, transparent)",
                  "&:hover": {
                    bgcolor: "var(--color-light-yellow)",
                  },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: "0 0 0 2px #2563eb",
                  },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {channel.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {typeof navigator !== "undefined" &&
          typeof navigator.share === "function" && (
            <Button
              type="button"
              onClick={handleNativeShare}
              disableElevation
              sx={{
                mt: 3,
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                borderRadius: "0.75rem",
                bgcolor: "var(--color-dark-yellow)",
                px: 2,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                color: "#ffffff",
                transition: "all 150ms",
                borderBottom: "4px solid #000000",
                borderRight: "4px solid var(--color-light-yellow)",
                "&:hover": {
                  bgcolor: "var(--color-light-yellow)",
                },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow:
                    "0 0 0 2px #ffffff, 0 0 0 4px var(--color-light-yellow)",
                },
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: "1.25rem", height: "1.25rem" }}
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" />
              </svg>
              Share with Apps
            </Button>
          )}

        <Box sx={{ mt: 1, pt: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              type="button"
              onClick={handleCopyLink}
              disableElevation
              sx={{
                flexShrink: 0,
                borderRadius: "0.5rem",
                bgcolor: "var(--color-dark-yellow)",
                px: 2,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "none",
                color: "#ffffff",
                width: "100%",
                transition: "all 150ms",
                border: "2px solid #000000",
                "&:hover": {
                  bgcolor: "var(--color-light-yellow)",
                },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow:
                    "0 0 0 2px #ffffff, 0 0 0 4px var(--color-light-yellow)",
                },
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Box>

          {copied && (
            <Typography
              role="status"
              sx={{ mt: 1, fontSize: "0.875rem", color: "#15803d" }}
            >
              Link copied to clipboard.
            </Typography>
          )}

          {error && (
            <Typography
              role="alert"
              sx={{ mt: 1, fontSize: "0.875rem", color: "#dc2626" }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
