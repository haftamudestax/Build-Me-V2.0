import { useEffect, useRef, useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

type ShareChannel = "x" | "facebook" | "linkedin" | "whatsapp" | "telegram";

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
      await navigator.clipboard.writeText(url);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        aria-describedby="share-modal-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="share-modal-title"
              className="text-xl font-bold text-blue-950"
            >
              Share this page
            </h2>
            <p
              id="share-modal-description"
              className="mt-1 text-sm text-gray-600"
            >
              Share this page with your network.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        {typeof navigator !== "undefined" &&
          typeof navigator.share === "function" && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" />
              </svg>
              More sharing options
            </button>
          )}

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">
            Share through
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {shareChannels.map((channel) => (
              <a
                key={channel.id}
                href={channel.getUrl(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={channel.description}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${channel.className}`}
                  aria-hidden="true"
                >
                  {channel.label === "WhatsApp"
                    ? "W"
                    : channel.label === "Telegram"
                      ? "T"
                      : channel.label === "LinkedIn"
                        ? "in"
                        : channel.label === "Facebook"
                          ? "f"
                          : "𝕏"}
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {channel.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-5">
          <label
            htmlFor="share-page-url"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Or copy page link
          </label>

          <div className="flex gap-2">
            <input
              id="share-page-url"
              type="text"
              readOnly
              value={url}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {copied && (
            <p role="status" className="mt-2 text-sm text-green-700">
              Link copied to clipboard.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
